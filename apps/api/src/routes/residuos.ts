/**
 * Rotas — Resíduos e Inventário
 * GET  /api/v1/residuos              — catálogo de resíduos (sem autenticação)
 * GET  /api/v1/residuos/inventario   — inventário da empresa autenticada
 * POST /api/v1/residuos/inventario   — adicionar resíduo ao inventário
 * PATCH /api/v1/residuos/inventario/:id — atualizar entrada do inventário
 * DELETE /api/v1/residuos/inventario/:id — remover do inventário
 */

import type { FastifyPluginAsync } from "fastify";
import { adicionarInventarioSchema, filtrosResiduoSchema } from "../schemas/residuo.schema";

export const residuosRoutes: FastifyPluginAsync = async (fastify) => {
  // GET / — catálogo público de tipos de resíduos
  fastify.get(
    "/",
    {
      schema: {
        tags: ["residuos"],
        summary: "Listar catálogo de resíduos (referência ABNT NBR 10.004 / IBAMA)",
        querystring: {
          type: "object",
          properties: {
            tipo: { type: "string" },
            perigoso: { type: "boolean" },
            page: { type: "number", default: 1 },
            limit: { type: "number", default: 20 },
          },
        },
      },
    },
    async (req, reply) => {
      const filtros = filtrosResiduoSchema.parse(req.query);

      // TODO: prisma.residuo.findMany({ where: filtros, ... })

      return reply.status(200).send({
        success: true,
        data: [],
        meta: { page: filtros.page, limit: filtros.limit, total: 0 },
      });
    }
  );

  // GET /inventario — inventário da empresa autenticada
  fastify.get(
    "/inventario",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["residuos"],
        summary: "Inventário de resíduos da empresa",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;

      // TODO: prisma.inventarioResiduo.findMany({ where: { empresaId, ativo: true }, include: { residuo: true } })

      return reply.status(200).send({
        success: true,
        data: [],
        meta: { total: 0 },
      });
    }
  );

  // POST /inventario — adicionar resíduo ao inventário
  fastify.post(
    "/inventario",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["residuos"],
        summary: "Adicionar resíduo ao inventário da empresa",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const input = adicionarInventarioSchema.parse(req.body);

      // TODO: implementar criação
      // 1. Verificar se residuoId existe no catálogo
      // 2. Verificar duplicata (empresaId + residuoId)
      // 3. Criar InventarioResiduo

      return reply.status(201).send({
        success: true,
        data: { id: "stub_inventario_id", empresaId, ...input },
      });
    }
  );

  // PATCH /inventario/:id — atualizar entrada do inventário
  fastify.patch(
    "/inventario/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["residuos"],
        summary: "Atualizar entrada no inventário",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { id } = req.params as { id: string };
      const input = adicionarInventarioSchema.partial().parse(req.body);

      // TODO: prisma.inventarioResiduo.update({ where: { id, empresaId }, data: input })

      return reply.status(200).send({
        success: true,
        data: { id, empresaId },
      });
    }
  );

  // DELETE /inventario/:id — desativar do inventário (soft delete)
  fastify.delete(
    "/inventario/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["residuos"],
        summary: "Remover resíduo do inventário (soft delete)",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { id } = req.params as { id: string };

      // TODO: prisma.inventarioResiduo.update({ where: { id, empresaId }, data: { ativo: false } })

      return reply.status(200).send({
        success: true,
        data: { id, ativo: false },
      });
    }
  );
};
