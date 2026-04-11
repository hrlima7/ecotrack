/**
 * Testes de integração — rotas /coletas
 * Foco: máquina de estados (PENDENTE → CONFIRMADA → EM_ROTA → COLETADO → FINALIZADO)
 * e isolamento multi-tenant por empresaId.
 *
 * Motivo: o usuário reportou que não consegue "realizar a coleta" pela web.
 * Estes testes validam que o backend aceita toda a cadeia de transições.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  authHeaders,
  buildTestApp,
  criarEmpresaFixture,
  criarResiduoInventario,
  limparBanco,
  loginAs,
  prisma,
  type EmpresaFixture,
} from "../test/helpers";

describe("rotas /coletas", () => {
  let app: FastifyInstance;
  let empresa: EmpresaFixture;
  let residuoId: string;
  let accessToken: string;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await limparBanco();
    empresa = await criarEmpresaFixture();
    residuoId = await criarResiduoInventario(empresa.empresaId);
    const tokens = await loginAs(app, empresa.email, empresa.senha);
    accessToken = tokens.accessToken;
  });

  // Helper local — cria uma coleta PENDENTE e devolve seu id
  async function criarColetaPendente(horasFuturas = 48): Promise<string> {
    const dataAgendada = new Date(Date.now() + horasFuturas * 3600 * 1000).toISOString();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/coletas",
      headers: authHeaders(accessToken),
      payload: {
        dataAgendada,
        residuos: [
          { residuoId, quantidadeEstimada: 25, unidade: "KG" },
        ],
        observacoes: "Coleta de teste",
      },
    });

    if (res.statusCode !== 201) {
      throw new Error(`criarColetaPendente falhou: ${res.statusCode} ${res.body}`);
    }
    return JSON.parse(res.body).data.id;
  }

  // Helper — muda o status via PATCH
  async function mudarStatus(
    coletaId: string,
    status: string,
    extras: Record<string, unknown> = {}
  ) {
    return app.inject({
      method: "PATCH",
      url: `/api/v1/coletas/${coletaId}/status`,
      headers: authHeaders(accessToken),
      payload: { status, ...extras },
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // POST / — criar
  // ──────────────────────────────────────────────────────────────────────
  describe("POST /coletas (agendamento)", () => {
    it("cria coleta PENDENTE e MTR rascunho", async () => {
      const dataAgendada = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/coletas",
        headers: authHeaders(accessToken),
        payload: {
          dataAgendada,
          residuos: [{ residuoId, quantidadeEstimada: 10, unidade: "KG" }],
        },
      });

      expect(res.statusCode).toBe(201);
      const coleta = JSON.parse(res.body).data;
      expect(coleta.status).toBe("PENDENTE");
      expect(coleta.empresaId).toBe(empresa.empresaId);

      // MTR rascunho criado
      const mtr = await prisma.manifestoMTR.findUnique({ where: { coletaId: coleta.id } });
      expect(mtr?.status).toBe("RASCUNHO");

      // Histórico inicial registrado
      const historico = await prisma.coletaStatusHistorico.findMany({
        where: { coletaId: coleta.id },
      });
      expect(historico).toHaveLength(1);
    });

    it("rejeita resíduo que não pertence ao inventário da empresa", async () => {
      const dataAgendada = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/coletas",
        headers: authHeaders(accessToken),
        payload: {
          dataAgendada,
          residuos: [{ residuoId: "residuo-inexistente", quantidadeEstimada: 5, unidade: "KG" }],
        },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error.code).toBe("RESIDUO_NAO_ENCONTRADO");
    });

    it("exige ao menos um resíduo", async () => {
      const dataAgendada = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/coletas",
        headers: authHeaders(accessToken),
        payload: { dataAgendada, residuos: [] },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // GET / — listar
  // ──────────────────────────────────────────────────────────────────────
  describe("GET /coletas", () => {
    it("lista apenas as coletas da empresa autenticada (multi-tenancy)", async () => {
      await criarColetaPendente();
      await criarColetaPendente();

      // Cria outra empresa com sua própria coleta
      const outraEmpresa = await criarEmpresaFixture();
      const outroResiduo = await criarResiduoInventario(outraEmpresa.empresaId);
      const { accessToken: outroToken } = await loginAs(
        app,
        outraEmpresa.email,
        outraEmpresa.senha
      );
      await app.inject({
        method: "POST",
        url: "/api/v1/coletas",
        headers: authHeaders(outroToken),
        payload: {
          dataAgendada: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          residuos: [{ residuoId: outroResiduo, quantidadeEstimada: 5, unidade: "KG" }],
        },
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/coletas",
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data).toHaveLength(2);
      expect(json.data.every((c: { empresaId: string }) => c.empresaId === empresa.empresaId)).toBe(
        true
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // PATCH /:id/status — máquina de estados
  // ──────────────────────────────────────────────────────────────────────
  describe("PATCH /coletas/:id/status (máquina de estados)", () => {
    it("PENDENTE → CONFIRMADA", async () => {
      const id = await criarColetaPendente();
      const res = await mudarStatus(id, "CONFIRMADA");
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data.status).toBe("CONFIRMADA");
    });

    it("fluxo completo PENDENTE → FINALIZADO", async () => {
      const id = await criarColetaPendente();

      expect((await mudarStatus(id, "CONFIRMADA")).statusCode).toBe(200);
      expect((await mudarStatus(id, "EM_ROTA")).statusCode).toBe(200);

      const coletado = await mudarStatus(id, "COLETADO", { pesoRealKg: 27.5 });
      expect(coletado.statusCode).toBe(200);
      const coletadoData = JSON.parse(coletado.body).data;
      expect(coletadoData.pesoRealKg).toBe(27.5);
      expect(coletadoData.dataRealizada).toBeTruthy();

      const finalizado = await mudarStatus(id, "FINALIZADO");
      expect(finalizado.statusCode).toBe(200);
      expect(JSON.parse(finalizado.body).data.status).toBe("FINALIZADO");

      // Histórico deve conter todas as transições (entrada inicial + 4 transições)
      const historico = await prisma.coletaStatusHistorico.findMany({
        where: { coletaId: id },
        orderBy: { criadoEm: "asc" },
      });
      expect(historico.length).toBeGreaterThanOrEqual(5);
    });

    it("rejeita transição inválida (PENDENTE → COLETADO) com 422", async () => {
      const id = await criarColetaPendente();
      const res = await mudarStatus(id, "COLETADO");

      expect(res.statusCode).toBe(422);
      expect(JSON.parse(res.body).error.code).toBe("TRANSICAO_INVALIDA");
    });

    it("rejeita avanço a partir de status final (FINALIZADO)", async () => {
      const id = await criarColetaPendente();
      await mudarStatus(id, "CONFIRMADA");
      await mudarStatus(id, "EM_ROTA");
      await mudarStatus(id, "COLETADO");
      await mudarStatus(id, "FINALIZADO");

      const tentativa = await mudarStatus(id, "CONFIRMADA");
      expect(tentativa.statusCode).toBe(422);
    });

    it("isola entre empresas — token errado retorna 404", async () => {
      const id = await criarColetaPendente();

      // Outra empresa com outro token
      const outra = await criarEmpresaFixture();
      const { accessToken: outroToken } = await loginAs(app, outra.email, outra.senha);

      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/coletas/${id}/status`,
        headers: authHeaders(outroToken),
        payload: { status: "CONFIRMADA" },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // DELETE /:id — cancelamento
  // ──────────────────────────────────────────────────────────────────────
  describe("DELETE /coletas/:id (cancelamento)", () => {
    it("cancela coleta agendada para daqui a 48h (dentro do prazo)", async () => {
      const id = await criarColetaPendente(48);

      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/coletas/${id}`,
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const coleta = await prisma.coleta.findUnique({ where: { id } });
      expect(coleta?.status).toBe("CANCELADO");
    });

    it("recusa cancelamento quando faltam menos de 24h", async () => {
      const id = await criarColetaPendente(1);

      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/coletas/${id}`,
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(422);
      expect(JSON.parse(res.body).error.code).toBe("PRAZO_CANCELAMENTO_EXPIRADO");
    });

    it("recusa cancelamento de coleta já FINALIZADA", async () => {
      const id = await criarColetaPendente();
      await mudarStatus(id, "CONFIRMADA");
      await mudarStatus(id, "EM_ROTA");
      await mudarStatus(id, "COLETADO");
      await mudarStatus(id, "FINALIZADO");

      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/coletas/${id}`,
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(422);
      expect(JSON.parse(res.body).error.code).toBe("CANCELAMENTO_NAO_PERMITIDO");
    });
  });
});
