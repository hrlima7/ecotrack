/**
 * Testes de integração — Rotas de Manifesto MTR
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  prisma,
  limparBanco,
  buildTestApp,
  criarEmpresaFixture,
  criarResiduoInventario,
  loginAs,
  authHeaders,
} from "../test/helpers";

/** Helper: cria uma coleta com MTR rascunho para testes de MTR */
async function criarColetaComMtr(app: FastifyInstance, empresaId: string, accessToken: string) {
  const residuoId = await criarResiduoInventario(empresaId);

  const resColeta = await app.inject({
    method: "POST",
    url: "/api/v1/coletas",
    headers: { ...authHeaders(accessToken), "content-type": "application/json" },
    payload: {
      dataAgendada: new Date(Date.now() + 7 * 86400000).toISOString(),
      logradouro: "Rua MTR",
      numero: "200",
      bairro: "Centro",
      cidade: "Sao Paulo",
      estado: "SP",
      cep: "01000-000",
      residuos: [{ residuoId, quantidadeEstimada: 30, unidade: "KG" }],
    },
  });

  const coleta = JSON.parse(resColeta.body).data;
  return { coletaId: coleta.id, mtrId: coleta.manifesto?.id, residuoId };
}

describe("MTR Routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await limparBanco();
  });

  // ─── GET /mtr — listar ─────────────────────────────────────────────────────

  describe("GET /api/v1/mtr", () => {
    it("lista MTRs da empresa", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);
      await criarColetaComMtr(app, fixture.empresaId, accessToken);

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/mtr",
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("filtra por status", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);
      await criarColetaComMtr(app, fixture.empresaId, accessToken);

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/mtr?status=RASCUNHO",
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.every((m: { status: string }) => m.status === "RASCUNHO")).toBe(true);
    });

    it("multi-tenancy: nao mostra MTRs de outra empresa", async () => {
      const fixtureA = await criarEmpresaFixture({ email: "mtra@teste.com" });
      const fixtureB = await criarEmpresaFixture({ email: "mtrb@teste.com" });

      const { accessToken: tokenA } = await loginAs(app, fixtureA.email, fixtureA.senha);
      await criarColetaComMtr(app, fixtureA.empresaId, tokenA);

      const { accessToken: tokenB } = await loginAs(app, fixtureB.email, fixtureB.senha);

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/mtr",
        headers: authHeaders(tokenB),
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data.length).toBe(0);
    });
  });

  // ─── POST /mtr — emitir ────────────────────────────────────────────────────

  describe("POST /api/v1/mtr", () => {
    it("emite MTR para coleta pendente", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);
      const { coletaId } = await criarColetaComMtr(app, fixture.empresaId, accessToken);

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mtr",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { coletaId },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data.status).toBe("EMITIDO");
      expect(body.data.numeroSinir).toMatch(/^MTR-\d{4}-/);
    });

    it("rejeita emissao duplicada", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);
      const { coletaId } = await criarColetaComMtr(app, fixture.empresaId, accessToken);

      // Primeira emissao
      await app.inject({
        method: "POST",
        url: "/api/v1/mtr",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { coletaId },
      });

      // Segunda emissao — deve ser rejeitada
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mtr",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { coletaId },
      });

      expect(res.statusCode).toBe(409);
    });

    it("rejeita coleta finalizada", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);
      const { coletaId } = await criarColetaComMtr(app, fixture.empresaId, accessToken);

      // Avancar coleta ate FINALIZADO
      for (const status of ["CONFIRMADA", "EM_ROTA", "COLETADO", "FINALIZADO"]) {
        await app.inject({
          method: "PATCH",
          url: `/api/v1/coletas/${coletaId}/status`,
          headers: { ...authHeaders(accessToken), "content-type": "application/json" },
          payload: status === "COLETADO" ? { status, pesoRealKg: 25 } : { status },
        });
      }

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mtr",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { coletaId },
      });

      expect(res.statusCode).toBe(422);
    });

    it("rejeita coleta de outra empresa", async () => {
      const fixtureA = await criarEmpresaFixture({ email: "emita@teste.com" });
      const fixtureB = await criarEmpresaFixture({ email: "emitb@teste.com" });

      const { accessToken: tokenA } = await loginAs(app, fixtureA.email, fixtureA.senha);
      const { coletaId } = await criarColetaComMtr(app, fixtureA.empresaId, tokenA);

      const { accessToken: tokenB } = await loginAs(app, fixtureB.email, fixtureB.senha);

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/mtr",
        headers: { ...authHeaders(tokenB), "content-type": "application/json" },
        payload: { coletaId },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── GET /mtr/:id ──────────────────────────────────────────────────────────

  describe("GET /api/v1/mtr/:id", () => {
    it("retorna detalhes do MTR", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);
      const { coletaId } = await criarColetaComMtr(app, fixture.empresaId, accessToken);

      // Emitir para ter um MTR com numero
      const emitRes = await app.inject({
        method: "POST",
        url: "/api/v1/mtr",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { coletaId },
      });
      const mtrId = JSON.parse(emitRes.body).data.id;

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/mtr/${mtrId}`,
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.id).toBe(mtrId);
      expect(body.data.coleta).toBeDefined();
    });

    it("404 para MTR inexistente", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/mtr/clxxxxxxxxxxxxxxxxxxxxxxxxx",
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── POST /mtr/:id/assinar ─────────────────────────────────────────────────

  describe("POST /api/v1/mtr/:id/assinar", () => {
    it("assina MTR como gerador", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);
      const { coletaId } = await criarColetaComMtr(app, fixture.empresaId, accessToken);

      // Emitir MTR
      const emitRes = await app.inject({
        method: "POST",
        url: "/api/v1/mtr",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { coletaId },
      });
      const mtrId = JSON.parse(emitRes.body).data.id;

      const res = await app.inject({
        method: "POST",
        url: `/api/v1/mtr/${mtrId}/assinar`,
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { tipo: "GERADOR", assinatura: "Assinado por Admin Teste" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.tipoAssinatura).toBe("GERADOR");
      expect(body.data.status).toBe("ACEITO");
    });

    it("rejeita assinatura de MTR rascunho", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);
      const { mtrId } = await criarColetaComMtr(app, fixture.empresaId, accessToken);

      const res = await app.inject({
        method: "POST",
        url: `/api/v1/mtr/${mtrId}/assinar`,
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { tipo: "GERADOR", assinatura: "Assinatura" },
      });

      expect(res.statusCode).toBe(422);
    });
  });

  // ─── GET /mtr/:id/pdf ──────────────────────────────────────────────────────

  describe("GET /api/v1/mtr/:id/pdf", () => {
    it("retorna dados estruturados para PDF CONAMA", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);
      const { coletaId } = await criarColetaComMtr(app, fixture.empresaId, accessToken);

      // Emitir MTR
      const emitRes = await app.inject({
        method: "POST",
        url: "/api/v1/mtr",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { coletaId },
      });
      const mtrId = JSON.parse(emitRes.body).data.id;

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/mtr/${mtrId}/pdf`,
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.manifesto.numero).toMatch(/^MTR-/);
      expect(body.data.gerador).toBeDefined();
      expect(body.data.coleta.residuos).toBeDefined();
      expect(body.data.conformidade.resolucao).toBe("CONAMA 275/2001");
    });

    it("registra audit log de download", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);
      const { coletaId } = await criarColetaComMtr(app, fixture.empresaId, accessToken);

      const emitRes = await app.inject({
        method: "POST",
        url: "/api/v1/mtr",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { coletaId },
      });
      const mtrId = JSON.parse(emitRes.body).data.id;

      await app.inject({
        method: "GET",
        url: `/api/v1/mtr/${mtrId}/pdf`,
        headers: authHeaders(accessToken),
      });

      const logs = await prisma.auditLog.findMany({
        where: { acao: "DOWNLOAD_PDF_MTR" },
      });
      expect(logs.length).toBe(1);
    });
  });
});
