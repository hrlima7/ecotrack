/**
 * Rotas — Coletas
 * GET    /api/v1/coletas              — listar (paginado, com filtros)
 * POST   /api/v1/coletas              — criar agendamento
 * GET    /api/v1/coletas/:id          — detalhar
 * PATCH  /api/v1/coletas/:id/status   — atualizar status
 * DELETE /api/v1/coletas/:id          — cancelar
 *
 * IMPORTANTE: Todas as queries filtram por `empresaId` do JWT (multi-tenancy).
 */

import type { FastifyPluginAsync } from "fastify";
import {
  criarColetaSchema,
  atualizarStatusColetaSchema,
  filtrosColetaSchema,
} from "../schemas/coleta.schema";

export const coletasRoutes: FastifyPluginAsync = async (fastify) => {
  // Todas as rotas exigem autenticação
  fastify.addHook("onRequest", fastify.authenticate);

  // GET / — listar coletas da empresa autenticada
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
      const filtros = filtrosColetaSchema.parse(req.query);

      // TODO: implementar query com Prisma
      // prisma.coleta.findMany({ where: { empresaId, ...filtros }, ... })

      return reply.status(200).send({
        success: true,
        data: [],
        meta: {
          page: filtros.page,
          limit: filtros.limit,
          total: 0,
          totalPages: 0,
        },
      });
    }
  );

  // POST / — criar agendamento de coleta
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

      // TODO: implementar criação
      // 1. Validar inventário de resíduos da empresa
      // 2. Criar Coleta com ColetaResiduo[]
      // 3. Disparar notificação aos transportadores (fila BullMQ)
      // 4. Criar ManifestoMTR em rascunho

      return reply.status(201).send({
        success: true,
        data: {
          id: "stub_coleta_id",
          empresaId,
          status: "PENDENTE",
          dataAgendada: input.dataAgendada,
        },
      });
    }
  );

  // GET /:id — detalhar coleta
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

      // TODO: prisma.coleta.findFirst({ where: { id, empresaId } })
      // Retornar 404 se não encontrada (multi-tenancy: nunca expor coleta de outra empresa)

      return reply.status(200).send({
        success: true,
        data: { id, empresaId, status: "PENDENTE" },
      });
    }
  );

  // PATCH /:id/status — atualizar status
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

      // TODO: implementar transição de status
      // 1. Validar se transição é permitida (máquina de estados)
      // 2. Atualizar Coleta.status
      // 3. Criar ColetaStatusHistorico
      // 4. Disparar webhook/notificação se necessário

      return reply.status(200).send({
        success: true,
        data: { id, status: input.status },
      });
    }
  );

  // DELETE /:id — cancelar coleta
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

      // TODO: implementar cancelamento
      // 1. Verificar se a coleta pertence à empresa (multi-tenancy)
      // 2. Verificar prazo de cancelamento (24h)
      // 3. Atualizar status para CANCELADO
      // 4. Notificar transportador se já confirmado

      return reply.status(200).send({
        success: true,
        data: { id, status: "CANCELADO" },
      });
    }
  );
};
