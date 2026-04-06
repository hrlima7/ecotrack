/**
 * Rotas — Resíduos e Inventário
 * GET    /api/v1/residuos                — catálogo de resíduos (público)
 * GET    /api/v1/residuos/inventario     — inventário da empresa autenticada
 * POST   /api/v1/residuos/inventario     — adicionar resíduo ao inventário
 * PATCH  /api/v1/residuos/inventario/:id — atualizar entrada do inventário
 * DELETE /api/v1/residuos/inventario/:id — remover do inventário (soft delete)
 */

import type { FastifyPluginAsync } from "fastify";
import { adicionarInventarioSchema, filtrosResiduoSchema } from "../schemas/residuo.schema";

export const residuosRoutes: FastifyPluginAsync = async (fastify) => {

  // ─── GET / — catálogo público ───────────────────────────────────────────────
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
      const { tipo, perigoso, page, limit } = filtrosResiduoSchema.parse(req.query);

      const where = {
        ...(tipo && { tipo }),
        ...(perigoso !== undefined && { perigoso }),
      };

      const [residuos, total] = await Promise.all([
        fastify.prisma.residuo.findMany({
          where,
          orderBy: { tipo: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        fastify.prisma.residuo.count({ where }),
      ]);

      return reply.status(200).send({
        success: true,
        data: residuos,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  );

  // ─── GET /inventario ────────────────────────────────────────────────────────
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

      const inventario = await fastify.prisma.inventarioResiduo.findMany({
        where: { empresaId, ativo: true },
        include: { residuo: true },
        orderBy: { criadoEm: "asc" },
      });

      return reply.status(200).send({
        success: true,
        data: inventario,
        meta: { total: inventario.length },
      });
    }
  );

  // ─── POST /inventario ───────────────────────────────────────────────────────
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

      // Verificar se resíduo existe no catálogo
      const residuo = await fastify.prisma.residuo.findUnique({
        where: { id: input.residuoId },
      });

      if (!residuo) {
        return reply.status(404).send({
          success: false,
          error: { code: "RESIDUO_NAO_ENCONTRADO", message: "Resíduo não encontrado no catálogo" },
        });
      }

      // Verificar duplicata
      const existente = await fastify.prisma.inventarioResiduo.findUnique({
        where: { empresaId_residuoId: { empresaId, residuoId: input.residuoId } },
      });

      if (existente) {
        // Reativar se estava inativo
        if (!existente.ativo) {
          const atualizado = await fastify.prisma.inventarioResiduo.update({
            where: { id: existente.id },
            data: { ativo: true, quantidade: input.quantidade, unidade: input.unidade, frequencia: input.frequencia },
            include: { residuo: true },
          });
          return reply.status(200).send({ success: true, data: atualizado });
        }

        return reply.status(409).send({
          success: false,
          error: { code: "JA_CADASTRADO", message: "Resíduo já cadastrado no inventário" },
        });
      }

      const item = await fastify.prisma.inventarioResiduo.create({
        data: {
          empresaId,
          residuoId: input.residuoId,
          quantidade: input.quantidade,
          unidade: input.unidade,
          frequencia: input.frequencia,
          observacoes: input.observacoes,
        },
        include: { residuo: true },
      });

      return reply.status(201).send({ success: true, data: item });
    }
  );

  // ─── PATCH /inventario/:id ──────────────────────────────────────────────────
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

      const item = await fastify.prisma.inventarioResiduo.findFirst({
        where: { id, empresaId },
      });

      if (!item) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Item não encontrado no inventário" },
        });
      }

      const atualizado = await fastify.prisma.inventarioResiduo.update({
        where: { id },
        data: input,
        include: { residuo: true },
      });

      return reply.status(200).send({ success: true, data: atualizado });
    }
  );

  // ─── DELETE /inventario/:id ─────────────────────────────────────────────────
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

      const item = await fastify.prisma.inventarioResiduo.findFirst({
        where: { id, empresaId },
      });

      if (!item) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Item não encontrado no inventário" },
        });
      }

      await fastify.prisma.inventarioResiduo.update({
        where: { id },
        data: { ativo: false },
      });

      return reply.status(200).send({ success: true, data: { id, ativo: false } });
    }
  );
};
