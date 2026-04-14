/**
 * Rotas — Marketplace
 * GET /api/v1/marketplace — listar transportadores e destinadores certificados
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const filtrosMarketplaceSchema = z.object({
  tipo: z.enum(["TRANSPORTADOR", "DESTINADOR"]).optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  busca: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const marketplaceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get(
    "/",
    {
      schema: {
        tags: ["marketplace"],
        summary: "Listar transportadores e destinadores certificados",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            tipo: { type: "string", enum: ["TRANSPORTADOR", "DESTINADOR"] },
            cidade: { type: "string" },
            estado: { type: "string" },
            busca: { type: "string" },
            page: { type: "number", default: 1 },
            limit: { type: "number", default: 20 },
          },
        },
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { tipo, cidade, estado, busca, page, limit } = filtrosMarketplaceSchema.parse(req.query);

      const where: Record<string, unknown> = {
        tipo: tipo ?? { in: ["TRANSPORTADOR", "DESTINADOR"] },
        ativo: true,
        id: { not: empresaId }, // Excluir a propria empresa
      };

      if (cidade) where.cidade = { contains: cidade, mode: "insensitive" };
      if (estado) where.estado = estado;
      if (busca) {
        where.OR = [
          { razaoSocial: { contains: busca, mode: "insensitive" } },
          { nomeFantasia: { contains: busca, mode: "insensitive" } },
          { cidade: { contains: busca, mode: "insensitive" } },
        ];
      }

      const [empresas, total] = await Promise.all([
        fastify.prisma.empresa.findMany({
          where: where as any,
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
            tipo: true,
            cidade: true,
            estado: true,
            licencaAmbiental: true,
            licencaVencimento: true,
            _count: { select: { coletasColetadas: true } },
          },
          orderBy: { razaoSocial: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        fastify.prisma.empresa.count({ where: where as any }),
      ]);

      // Enriquecer com dados do inventário de resíduos aceitos
      const parceiros = await Promise.all(
        empresas.map(async (e) => {
          const inventario = await fastify.prisma.inventarioResiduo.findMany({
            where: { empresaId: e.id, ativo: true },
            select: { residuo: { select: { tipo: true, descricao: true } } },
          });

          return {
            id: e.id,
            razaoSocial: e.razaoSocial,
            nomeFantasia: e.nomeFantasia ?? e.razaoSocial,
            tipo: e.tipo,
            cidade: e.cidade,
            estado: e.estado,
            licencaAmbiental: e.licencaAmbiental,
            licencaVencimento: e.licencaVencimento,
            totalColetas: e._count.coletasColetadas,
            residuosAceitos: inventario.map((i) => i.residuo.descricao),
          };
        })
      );

      return reply.status(200).send({
        success: true,
        data: parceiros,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  );
};
