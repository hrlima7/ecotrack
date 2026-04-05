/**
 * Rotas — Manifesto de Transporte de Resíduos (MTR)
 * GET  /api/v1/mtr              — listar MTRs da empresa
 * POST /api/v1/mtr              — emitir MTR para uma coleta
 * GET  /api/v1/mtr/:id          — detalhar MTR
 * GET  /api/v1/mtr/:id/pdf      — download do PDF (CONAMA 275/2001)
 * POST /api/v1/mtr/:id/assinar  — assinar digitalmente o MTR
 */

import type { FastifyPluginAsync } from "fastify";
import { emitirMtrSchema, assinarMtrSchema, filtrosMtrSchema } from "../schemas/mtr.schema";

export const mtrRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  // GET / — listar MTRs da empresa
  fastify.get(
    "/",
    {
      schema: {
        tags: ["mtr"],
        summary: "Listar Manifestos de Transporte de Resíduos da empresa",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const filtros = filtrosMtrSchema.parse(req.query);

      // TODO: buscar MTRs via JOIN Coleta -> ManifestoMTR filtrando por empresaId

      return reply.status(200).send({
        success: true,
        data: [],
        meta: { page: filtros.page, limit: filtros.limit, total: 0 },
      });
    }
  );

  // POST / — emitir MTR para uma coleta
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
      const { empresaId } = req.user;
      const input = emitirMtrSchema.parse(req.body);

      // TODO: implementar emissão
      // 1. Verificar se coleta pertence à empresa (multi-tenancy)
      // 2. Verificar se coleta está em status CONFIRMADA ou EM_ROTA
      // 3. Gerar número MTR (em Fase 1: sequencial local; Fase 2: integrar SINIR)
      // 4. Gerar QR Code
      // 5. Gerar PDF conforme CONAMA 275/2001 e armazenar no storage
      // 6. Atualizar ManifestoMTR.status para EMITIDO

      return reply.status(201).send({
        success: true,
        data: {
          id: "stub_mtr_id",
          coletaId: input.coletaId,
          status: "EMITIDO",
          numeroSinir: "MTR-2026-000001",
        },
      });
    }
  );

  // GET /:id — detalhar MTR
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["mtr"],
        summary: "Obter detalhes de um MTR",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { id } = req.params as { id: string };

      // TODO: buscar MTR com JOIN de Coleta para garantir multi-tenancy

      return reply.status(200).send({
        success: true,
        data: { id, status: "EMITIDO" },
      });
    }
  );

  // GET /:id/pdf — download do PDF do MTR
  fastify.get(
    "/:id/pdf",
    {
      schema: {
        tags: ["mtr"],
        summary: "Download do PDF do MTR (CONAMA 275/2001)",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      // TODO: retornar PDF do storage ou gerar on-demand
      // LGPD: registrar download de documento com dados pessoais

      return reply.status(200).send({
        success: true,
        data: { pdfUrl: `https://storage.ecotrack.app/mtr/${id}.pdf` },
      });
    }
  );

  // POST /:id/assinar — assinar MTR digitalmente
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
      const { empresaId } = req.user;
      const { id } = req.params as { id: string };
      const input = assinarMtrSchema.parse(req.body);

      // TODO: implementar assinatura
      // 1. Verificar permissão do tipo de empresa para assinar
      // 2. Armazenar hash da assinatura no campo correto
      // 3. Se todos assinaram -> atualizar status para FINALIZADO
      // 4. Integrar SINIR (Fase 2): POST /cdf/confirmar

      return reply.status(200).send({
        success: true,
        data: { id, tipoAssinatura: input.tipo, assinadoEm: new Date().toISOString() },
      });
    }
  );
};
