/**
 * Rotas — Manifesto de Transporte de Resíduos (MTR)
 * GET  /api/v1/mtr              — listar MTRs da empresa
 * POST /api/v1/mtr              — emitir MTR para uma coleta
 * GET  /api/v1/mtr/:id          — detalhar MTR
 * POST /api/v1/mtr/:id/assinar  — assinar digitalmente
 * GET  /api/v1/mtr/:id/pdf      — dados para geração do PDF (CONAMA 275/2001)
 *
 * Fase 1: número MTR gerado localmente (sequencial).
 * Fase 2: integrar API SINIR para emissão oficial.
 */

import type { FastifyPluginAsync } from "fastify";
import { emitirMtrSchema, assinarMtrSchema, filtrosMtrSchema } from "../schemas/mtr.schema";
import { criarNotificacoes } from "../services/notificacoes";

/** Gera número MTR sequencial local (Fase 1) */
function gerarNumeroMtr(coletaId: string): string {
  const ano = new Date().getFullYear();
  const sufixo = coletaId.slice(-6).toUpperCase();
  return `MTR-${ano}-${sufixo}`;
}

export const mtrRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  // ─── GET / — listar MTRs da empresa ─────────────────────────────────────────
  fastify.get(
    "/",
    {
      schema: {
        tags: ["mtr"],
        summary: "Listar Manifestos de Transporte de Resíduos da empresa",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            status: { type: "string" },
            page: { type: "number", default: 1 },
            limit: { type: "number", default: 20 },
          },
        },
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { status, page, limit } = filtrosMtrSchema.parse(req.query);

      const where = {
        coleta: { empresaId },
        ...(status && { status }),
      };

      const [manifestos, total] = await Promise.all([
        fastify.prisma.manifestoMTR.findMany({
          where,
          orderBy: { criadoEm: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            coleta: {
              select: {
                id: true,
                status: true,
                dataAgendada: true,
                cidade: true,
                estado: true,
                residuos: {
                  include: { residuo: { select: { tipo: true, descricao: true } } },
                },
              },
            },
          },
        }),
        fastify.prisma.manifestoMTR.count({ where }),
      ]);

      return reply.status(200).send({
        success: true,
        data: manifestos,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  );

  // ─── POST / — emitir MTR para uma coleta ────────────────────────────────────
  fastify.post(
    "/",
    {
      schema: {
        tags: ["mtr"],
        summary: "Emitir Manifesto de Transporte de Resíduos para uma coleta",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId, sub: usuarioId } = req.user;
      const input = emitirMtrSchema.parse(req.body);

      // 1. Verificar se coleta pertence à empresa (multi-tenancy)
      const coleta = await fastify.prisma.coleta.findFirst({
        where: { id: input.coletaId, empresaId },
        include: {
          residuos: { include: { residuo: true } },
          manifesto: true,
          empresa: { select: { razaoSocial: true, cnpj: true, logradouro: true, cidade: true, estado: true } },
        },
      });

      if (!coleta) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Coleta não encontrada" },
        });
      }

      // 2. Verificar status da coleta
      if (!["PENDENTE", "CONFIRMADA", "EM_ROTA"].includes(coleta.status)) {
        return reply.status(422).send({
          success: false,
          error: {
            code: "STATUS_INVALIDO",
            message: `Não é possível emitir MTR para coleta com status ${coleta.status}`,
          },
        });
      }

      // 3. Verificar se já existe MTR emitido
      if (coleta.manifesto && coleta.manifesto.status !== "RASCUNHO") {
        return reply.status(409).send({
          success: false,
          error: { code: "MTR_JA_EMITIDO", message: "Esta coleta já possui um MTR emitido" },
        });
      }

      // 4. Gerar número MTR (Fase 1: local; Fase 2: SINIR)
      const numeroMtr = gerarNumeroMtr(coleta.id);

      // 5. Atualizar ou criar ManifestoMTR
      const manifesto = await fastify.prisma.manifestoMTR.upsert({
        where: { coletaId: input.coletaId },
        update: {
          status: "EMITIDO",
          numeroSinir: numeroMtr,
          emitidoEm: new Date(),
        },
        create: {
          coletaId: input.coletaId,
          status: "EMITIDO",
          numeroSinir: numeroMtr,
          emitidoEm: new Date(),
        },
        include: {
          coleta: {
            select: {
              id: true, status: true, dataAgendada: true, cidade: true, estado: true,
              residuos: { include: { residuo: { select: { tipo: true, descricao: true } } } },
            },
          },
        },
      });

      // 6. Log de auditoria
      await fastify.prisma.auditLog.create({
        data: {
          empresaId,
          usuarioId,
          acao: "EMITIR_MTR",
          recurso: "manifestoMTR",
          recursoId: manifesto.id,
          detalhes: { numeroMtr },
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      return reply.status(201).send({ success: true, data: manifesto });
    }
  );

  // ─── GET /:id — detalhar MTR ─────────────────────────────────────────────────
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["mtr"],
        summary: "Obter detalhes de um MTR",
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

      const manifesto = await fastify.prisma.manifestoMTR.findFirst({
        where: {
          id,
          coleta: { empresaId }, // multi-tenancy via JOIN
        },
        include: {
          coleta: {
            include: {
              empresa: {
                select: { id: true, razaoSocial: true, cnpj: true, logradouro: true, numero: true, cidade: true, estado: true, cep: true },
              },
              transportador: {
                select: { id: true, razaoSocial: true, cnpj: true, licencaAmbiental: true },
              },
              residuos: { include: { residuo: true } },
            },
          },
        },
      });

      if (!manifesto) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "MTR não encontrado" },
        });
      }

      return reply.status(200).send({ success: true, data: manifesto });
    }
  );

  // ─── POST /:id/assinar — assinar MTR digitalmente ───────────────────────────
  fastify.post(
    "/:id/assinar",
    {
      schema: {
        tags: ["mtr"],
        summary: "Assinar digitalmente o MTR (Gerador, Transportador ou Destinador)",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId, sub: usuarioId } = req.user;
      const { id } = req.params as { id: string };
      const input = assinarMtrSchema.parse(req.body);

      const manifesto = await fastify.prisma.manifestoMTR.findFirst({
        where: { id, coleta: { empresaId } },
      });

      if (!manifesto) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "MTR não encontrado" },
        });
      }

      if (!["EMITIDO", "ACEITO"].includes(manifesto.status)) {
        return reply.status(422).send({
          success: false,
          error: { code: "STATUS_INVALIDO", message: `MTR com status ${manifesto.status} não pode ser assinado` },
        });
      }

      // Mapear tipo de assinante para campo no banco
      const campoAssinatura = {
        GERADOR: "assinaturaGerador",
        TRANSPORTADOR: "assinaturaTransportador",
        DESTINADOR: "assinaturaDestinador",
      }[input.tipo] as "assinaturaGerador" | "assinaturaTransportador" | "assinaturaDestinador";

      // Verificar se todos assinaram após esta assinatura
      const atualizado = await fastify.prisma.manifestoMTR.update({
        where: { id },
        data: {
          [campoAssinatura]: input.assinatura,
          status: "ACEITO",
        },
      });

      // Se todos os três assinaram → FINALIZADO
      const todosAssinaram =
        (atualizado.assinaturaGerador || input.tipo === "GERADOR") &&
        (atualizado.assinaturaTransportador || input.tipo === "TRANSPORTADOR") &&
        (atualizado.assinaturaDestinador || input.tipo === "DESTINADOR");

      if (todosAssinaram) {
        await fastify.prisma.manifestoMTR.update({
          where: { id },
          data: { status: "FINALIZADO", finalizadoEm: new Date() },
        });
      }

      // Log de auditoria
      await fastify.prisma.auditLog.create({
        data: {
          empresaId,
          usuarioId,
          acao: `ASSINAR_MTR_${input.tipo}`,
          recurso: "manifestoMTR",
          recursoId: id,
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      return reply.status(200).send({
        success: true,
        data: {
          id,
          tipoAssinatura: input.tipo,
          status: todosAssinaram ? "FINALIZADO" : "ACEITO",
          assinadoEm: new Date().toISOString(),
        },
      });
    }
  );

  // ─── GET /:id/pdf — dados para PDF do MTR (CONAMA 275/2001) ─────────────────
  fastify.get(
    "/:id/pdf",
    {
      schema: {
        tags: ["mtr"],
        summary: "Obter dados completos do MTR para geração de PDF (CONAMA 275/2001)",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId, sub: usuarioId } = req.user;
      const { id } = req.params as { id: string };

      const manifesto = await fastify.prisma.manifestoMTR.findFirst({
        where: { id, coleta: { empresaId } },
        include: {
          coleta: {
            include: {
              empresa: {
                select: {
                  razaoSocial: true, cnpj: true, email: true, telefone: true,
                  logradouro: true, numero: true, complemento: true,
                  bairro: true, cidade: true, estado: true, cep: true,
                },
              },
              transportador: {
                select: {
                  razaoSocial: true, cnpj: true, licencaAmbiental: true,
                  logradouro: true, numero: true, cidade: true, estado: true,
                },
              },
              residuos: { include: { residuo: true } },
            },
          },
        },
      });

      if (!manifesto) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "MTR não encontrado" },
        });
      }

      // LGPD: log de download de documento com dados pessoais
      await fastify.prisma.auditLog.create({
        data: {
          empresaId,
          usuarioId,
          acao: "DOWNLOAD_PDF_MTR",
          recurso: "manifestoMTR",
          recursoId: id,
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      // Retorna dados estruturados para o frontend gerar o PDF
      return reply.status(200).send({
        success: true,
        data: {
          manifesto: {
            id: manifesto.id,
            numero: manifesto.numeroSinir ?? "RASCUNHO",
            status: manifesto.status,
            emitidoEm: manifesto.emitidoEm,
            finalizadoEm: manifesto.finalizadoEm,
          },
          gerador: manifesto.coleta.empresa,
          transportador: manifesto.coleta.transportador ?? null,
          coleta: {
            id: manifesto.coleta.id,
            dataAgendada: manifesto.coleta.dataAgendada,
            dataRealizada: manifesto.coleta.dataRealizada,
            logradouro: manifesto.coleta.logradouro,
            numero: manifesto.coleta.numero,
            bairro: manifesto.coleta.bairro,
            cidade: manifesto.coleta.cidade,
            estado: manifesto.coleta.estado,
            cep: manifesto.coleta.cep,
            residuos: manifesto.coleta.residuos,
          },
          conformidade: {
            resolucao: "CONAMA 275/2001",
            geradoEm: new Date().toISOString(),
            plataforma: "EcoTrack SaaS",
          },
        },
      });
    }
  );
};
