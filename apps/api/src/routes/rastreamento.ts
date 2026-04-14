/**
 * Rotas — Rastreamento GPS
 * PATCH /api/v1/rastreamento/:coletaId/posicao — motorista atualiza posicao GPS
 * GET   /api/v1/rastreamento/ativas             — posicoes ativas da empresa
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const atualizarPosicaoSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const rastreamentoRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  // ─── PATCH /:coletaId/posicao — motorista envia GPS ──────────────────────────
  fastify.patch(
    "/:coletaId/posicao",
    {
      schema: {
        tags: ["rastreamento"],
        summary: "Atualizar posicao GPS de uma coleta em andamento",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { coletaId } = req.params as { coletaId: string };
      const { latitude, longitude } = atualizarPosicaoSchema.parse(req.body);

      // Verificar se coleta pertence a empresa e esta em rota
      const coleta = await fastify.prisma.coleta.findFirst({
        where: {
          id: coletaId,
          OR: [
            { empresaId },
            { transportadorId: empresaId },
          ],
          status: { in: ["CONFIRMADA", "EM_ROTA"] },
        },
      });

      if (!coleta) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Coleta nao encontrada ou nao esta em andamento" },
        });
      }

      await fastify.prisma.coleta.update({
        where: { id: coletaId },
        data: { latitude, longitude, atualizadoEm: new Date() },
      });

      return reply.status(200).send({
        success: true,
        data: { coletaId, latitude, longitude, atualizadoEm: new Date().toISOString() },
      });
    }
  );

  // ─── GET /ativas — posicoes de coletas ativas da empresa ─────────────────────
  fastify.get(
    "/ativas",
    {
      schema: {
        tags: ["rastreamento"],
        summary: "Obter posicoes GPS das coletas ativas da empresa",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;

      const coletas = await fastify.prisma.coleta.findMany({
        where: {
          OR: [
            { empresaId },
            { transportadorId: empresaId },
          ],
          status: { in: ["PENDENTE", "CONFIRMADA", "EM_ROTA", "COLETADO"] },
        },
        select: {
          id: true,
          status: true,
          latitude: true,
          longitude: true,
          logradouro: true,
          numero: true,
          cidade: true,
          estado: true,
          dataAgendada: true,
          atualizadoEm: true,
          residuos: {
            select: {
              residuo: { select: { tipo: true, descricao: true } },
              quantidadeEstimada: true,
              unidade: true,
            },
          },
          manifesto: {
            select: { numeroSinir: true, status: true },
          },
        },
        orderBy: { atualizadoEm: "desc" },
      });

      return reply.status(200).send({
        success: true,
        data: coletas,
        meta: { total: coletas.length },
      });
    }
  );
};
