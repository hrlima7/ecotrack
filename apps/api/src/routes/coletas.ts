/**
 * Rotas — Coletas
 * GET    /api/v1/coletas              — listar (paginado, com filtros)
 * POST   /api/v1/coletas              — criar agendamento
 * GET    /api/v1/coletas/:id          — detalhar
 * PATCH  /api/v1/coletas/:id/status   — atualizar status
 * DELETE /api/v1/coletas/:id          — cancelar
 *
 * Multi-tenancy: todas as queries filtram por `empresaId` do JWT.
 * Status flow: PENDENTE → CONFIRMADA → EM_ROTA → COLETADO → FINALIZADO | CANCELADO
 */

import type { FastifyPluginAsync } from "fastify";
import { CANCELAMENTO_PRAZO_HORAS } from "@ecotrack/shared";
import {
  criarColetaSchema,
  atualizarStatusColetaSchema,
  filtrosColetaSchema,
} from "../schemas/coleta.schema";
import { criarNotificacoes } from "../services/notificacoes";
import type { StatusColeta } from "@ecotrack/shared";

// Transições de status permitidas (máquina de estados)
const TRANSICOES_PERMITIDAS: Record<string, string[]> = {
  PENDENTE:   ["CONFIRMADA", "CANCELADO"],
  CONFIRMADA: ["EM_ROTA", "CANCELADO"],
  EM_ROTA:    ["COLETADO"],
  COLETADO:   ["FINALIZADO"],
  FINALIZADO: [],
  CANCELADO:  [],
};

export const coletasRoutes: FastifyPluginAsync = async (fastify) => {
  // Todas as rotas exigem autenticação
  fastify.addHook("onRequest", fastify.authenticate);

  // ─── GET / — listar coletas da empresa autenticada ──────────────────────────
  fastify.get(
    "/",
    {
      schema: {
        tags: ["coletas"],
        summary: "Listar coletas da empresa",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            status: { type: "string" },
            dataInicio: { type: "string" },
            dataFim: { type: "string" },
            page: { type: "number", default: 1 },
            limit: { type: "number", default: 20 },
          },
        },
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { status, dataInicio, dataFim, page, limit } = filtrosColetaSchema.parse(req.query);

      const where = {
        empresaId,
        ...(status && { status }),
        ...(dataInicio || dataFim
          ? {
              dataAgendada: {
                ...(dataInicio && { gte: new Date(dataInicio) }),
                ...(dataFim && { lte: new Date(dataFim) }),
              },
            }
          : {}),
      };

      const [coletas, total] = await Promise.all([
        fastify.prisma.coleta.findMany({
          where,
          orderBy: { dataAgendada: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            residuos: {
              include: { residuo: { select: { tipo: true, descricao: true } } },
            },
            manifesto: { select: { id: true, status: true, numeroSinir: true } },
          },
        }),
        fastify.prisma.coleta.count({ where }),
      ]);

      return reply.status(200).send({
        success: true,
        data: coletas,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  );

  // ─── POST / — criar agendamento de coleta ───────────────────────────────────
  fastify.post(
    "/",
    {
      schema: {
        tags: ["coletas"],
        summary: "Agendar nova coleta",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const input = criarColetaSchema.parse(req.body);

      // 1. Validar que os resíduos pertencem ao inventário da empresa
      const residuoIds = input.residuos.map((r) => r.residuoId);
      const inventario = await fastify.prisma.inventarioResiduo.findMany({
        where: { empresaId, residuoId: { in: residuoIds }, ativo: true },
      });

      if (inventario.length !== residuoIds.length) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "RESIDUO_NAO_ENCONTRADO",
            message: "Um ou mais resíduos não pertencem ao inventário da empresa",
          },
        });
      }

      // 2. Buscar endereço da empresa se não informado no payload
      const empresa = await fastify.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: {
          logradouro: true, numero: true, complemento: true,
          bairro: true, cidade: true, estado: true, cep: true,
          latitude: true, longitude: true,
        },
      });

      if (!empresa) {
        return reply.status(404).send({
          success: false,
          error: { code: "EMPRESA_NAO_ENCONTRADA", message: "Empresa não encontrada" },
        });
      }

      const enderecoColeta = input.endereco ?? empresa;

      // 3. Criar Coleta + ColetaResiduo[] em transação + ManifestoMTR rascunho
      const coleta = await fastify.prisma.$transaction(async (tx) => {
        const coleta = await tx.coleta.create({
          data: {
            empresaId,
            status: "PENDENTE",
            dataAgendada: new Date(input.dataAgendada),
            observacoes: input.observacoes,
            logradouro: enderecoColeta.logradouro,
            numero: enderecoColeta.numero,
            complemento: enderecoColeta.complemento ?? null,
            bairro: enderecoColeta.bairro,
            cidade: enderecoColeta.cidade,
            estado: enderecoColeta.estado,
            cep: enderecoColeta.cep,
            latitude: enderecoColeta.latitude ?? null,
            longitude: enderecoColeta.longitude ?? null,
            residuos: {
              create: input.residuos.map((r) => ({
                residuoId: r.residuoId,
                quantidadeEstimada: r.quantidadeEstimada,
                unidade: r.unidade,
              })),
            },
          },
          include: {
            residuos: {
              include: { residuo: { select: { tipo: true, descricao: true } } },
            },
          },
        });

        // Criar ManifestoMTR em rascunho
        await tx.manifestoMTR.create({
          data: { coletaId: coleta.id, status: "RASCUNHO" },
        });

        // Registrar status inicial no histórico
        await tx.coletaStatusHistorico.create({
          data: {
            coletaId: coleta.id,
            statusAntes: "PENDENTE",
            statusDepois: "PENDENTE",
            motivo: "Coleta agendada pelo gerador",
          },
        });

        return coleta;
      });

      // 4. Log de auditoria
      await fastify.prisma.auditLog.create({
        data: {
          empresaId,
          usuarioId: req.user.sub,
          acao: "CRIAR_COLETA",
          recurso: "coleta",
          recursoId: coleta.id,
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      return reply.status(201).send({ success: true, data: coleta });
    }
  );

  // ─── GET /:id — detalhar coleta ─────────────────────────────────────────────
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["coletas"],
        summary: "Obter detalhes de uma coleta",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { id } = req.params as { id: string };

      const coleta = await fastify.prisma.coleta.findFirst({
        where: { id, empresaId }, // multi-tenancy garantido
        include: {
          residuos: {
            include: { residuo: true },
          },
          manifesto: true,
          statusHistorico: { orderBy: { criadoEm: "asc" } },
          transportador: {
            select: { id: true, razaoSocial: true, nomeFantasia: true, telefone: true },
          },
        },
      });

      if (!coleta) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Coleta não encontrada" },
        });
      }

      return reply.status(200).send({ success: true, data: coleta });
    }
  );

  // ─── PATCH /:id/status — atualizar status ───────────────────────────────────
  fastify.patch(
    "/:id/status",
    {
      schema: {
        tags: ["coletas"],
        summary: "Atualizar status de uma coleta",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { id } = req.params as { id: string };
      const input = atualizarStatusColetaSchema.parse(req.body);

      const coleta = await fastify.prisma.coleta.findFirst({
        where: { id, empresaId },
      });

      if (!coleta) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Coleta não encontrada" },
        });
      }

      // Validar transição de status
      const transicoesPermitidas = TRANSICOES_PERMITIDAS[coleta.status] ?? [];
      if (!transicoesPermitidas.includes(input.status)) {
        return reply.status(422).send({
          success: false,
          error: {
            code: "TRANSICAO_INVALIDA",
            message: `Não é possível alterar status de ${coleta.status} para ${input.status}`,
          },
        });
      }

      const coletaAtualizada = await fastify.prisma.$transaction(async (tx) => {
        const atualizada = await tx.coleta.update({
          where: { id },
          data: {
            status: input.status,
            ...(input.status === "COLETADO" && {
              dataRealizada: new Date(),
              ...(input.pesoRealKg && { pesoRealKg: input.pesoRealKg }),
            }),
          },
        });

        await tx.coletaStatusHistorico.create({
          data: {
            coletaId: id,
            statusAntes: coleta.status,
            statusDepois: input.status,
            motivo: input.motivo ?? null,
          },
        });

        // Finalizar MTR quando coleta for FINALIZADO
        if (input.status === "FINALIZADO") {
          await tx.manifestoMTR.updateMany({
            where: { coletaId: id, status: "ACEITO" },
            data: { status: "FINALIZADO", finalizadoEm: new Date() },
          });
        }

        return atualizada;
      });

      return reply.status(200).send({ success: true, data: coletaAtualizada });
    }
  );

  // ─── DELETE /:id — cancelar coleta ──────────────────────────────────────────
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["coletas"],
        summary: "Cancelar uma coleta (prazo: 24h antes da data agendada)",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { id } = req.params as { id: string };

      const coleta = await fastify.prisma.coleta.findFirst({
        where: { id, empresaId },
      });

      if (!coleta) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Coleta não encontrada" },
        });
      }

      if (["COLETADO", "FINALIZADO", "CANCELADO"].includes(coleta.status)) {
        return reply.status(422).send({
          success: false,
          error: {
            code: "CANCELAMENTO_NAO_PERMITIDO",
            message: `Coleta com status ${coleta.status} não pode ser cancelada`,
          },
        });
      }

      // Verificar prazo de 24h
      const horasAteColeta =
        (coleta.dataAgendada.getTime() - Date.now()) / (1000 * 60 * 60);

      if (horasAteColeta < CANCELAMENTO_PRAZO_HORAS) {
        return reply.status(422).send({
          success: false,
          error: {
            code: "PRAZO_CANCELAMENTO_EXPIRADO",
            message: `Cancelamento permitido apenas até ${CANCELAMENTO_PRAZO_HORAS}h antes da coleta`,
          },
        });
      }

      await fastify.prisma.$transaction(async (tx) => {
        await tx.coleta.update({
          where: { id },
          data: { status: "CANCELADO" },
        });

        await tx.coletaStatusHistorico.create({
          data: {
            coletaId: id,
            statusAntes: coleta.status,
            statusDepois: "CANCELADO",
            motivo: "Cancelado pelo gerador",
          },
        });

        // Cancelar MTR rascunho vinculado
        await tx.manifestoMTR.updateMany({
          where: { coletaId: id, status: { in: ["RASCUNHO", "EMITIDO"] } },
          data: { status: "CANCELADO" },
        });
      });

      return reply.status(200).send({
        success: true,
        data: { id, status: "CANCELADO" },
      });
    }
  );
};
