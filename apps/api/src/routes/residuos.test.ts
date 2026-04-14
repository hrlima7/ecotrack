/**
 * Testes de integração — Rotas de Resíduos e Inventário
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  prisma,
  limparBanco,
  buildTestApp,
  criarEmpresaFixture,
  loginAs,
  authHeaders,
} from "../test/helpers";

describe("Residuos Routes", () => {
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

  // ─── GET /residuos — catalogo publico ──────────────────────────────────────

  describe("GET /api/v1/residuos", () => {
    it("lista catalogo de residuos sem autenticacao", async () => {
      // Seed residuos
      await prisma.residuo.createMany({
        data: [
          { tipo: "RECICLAVEL", descricao: "Papel", classeAbnt: "IIA" },
          { tipo: "ORGANICO", descricao: "Restos de comida", classeAbnt: "IIA" },
          { tipo: "PERIGOSO", descricao: "Baterias", classeAbnt: "I", perigoso: true },
        ],
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/residuos",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(3);
      expect(body.meta.total).toBe(3);
    });

    it("filtra por tipo", async () => {
      await prisma.residuo.createMany({
        data: [
          { tipo: "RECICLAVEL", descricao: "Papel", classeAbnt: "IIA" },
          { tipo: "ORGANICO", descricao: "Restos de comida", classeAbnt: "IIA" },
        ],
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/residuos?tipo=RECICLAVEL",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.length).toBe(1);
      expect(body.data[0].tipo).toBe("RECICLAVEL");
    });

    it("filtra por perigoso", async () => {
      await prisma.residuo.createMany({
        data: [
          { tipo: "RECICLAVEL", descricao: "Papel", classeAbnt: "IIA", perigoso: false },
          { tipo: "PERIGOSO", descricao: "Baterias", classeAbnt: "I", perigoso: true },
        ],
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/residuos?perigoso=true",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.length).toBe(1);
      expect(body.data[0].perigoso).toBe(true);
    });

    it("paginacao funciona", async () => {
      const residuos = Array.from({ length: 5 }, (_, i) => ({
        tipo: "RECICLAVEL" as const,
        descricao: `Residuo ${i}`,
        classeAbnt: "IIA",
      }));
      await prisma.residuo.createMany({ data: residuos });

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/residuos?page=1&limit=2",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.length).toBe(2);
      expect(body.meta.total).toBe(5);
      expect(body.meta.totalPages).toBe(3);
    });
  });

  // ─── GET /residuos/inventario ──────────────────────────────────────────────

  describe("GET /api/v1/residuos/inventario", () => {
    it("lista inventario da empresa autenticada", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      // Adicionar residuo ao inventario
      const residuo = await prisma.residuo.create({
        data: { tipo: "RECICLAVEL", descricao: "Plastico", classeAbnt: "IIA" },
      });
      await prisma.inventarioResiduo.create({
        data: {
          empresaId: fixture.empresaId,
          residuoId: residuo.id,
          quantidade: 100,
          unidade: "KG",
          frequencia: "SEMANAL",
        },
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/residuos/inventario",
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.length).toBe(1);
      expect(body.data[0].residuo.descricao).toBe("Plastico");
    });

    it("multi-tenancy: nao mostra inventario de outra empresa", async () => {
      const fixtureA = await criarEmpresaFixture({ email: "a@teste.com" });
      const fixtureB = await criarEmpresaFixture({ email: "b@teste.com" });

      const residuo = await prisma.residuo.create({
        data: { tipo: "RECICLAVEL", descricao: "Metal", classeAbnt: "IIA" },
      });

      // Inventario da empresa A
      await prisma.inventarioResiduo.create({
        data: {
          empresaId: fixtureA.empresaId,
          residuoId: residuo.id,
          quantidade: 50,
          unidade: "KG",
          frequencia: "MENSAL",
        },
      });

      // Login como empresa B
      const { accessToken } = await loginAs(app, fixtureB.email, fixtureB.senha);

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/residuos/inventario",
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.length).toBe(0);
    });

    it("401 sem token", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/residuos/inventario",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── POST /residuos/inventario ─────────────────────────────────────────────

  describe("POST /api/v1/residuos/inventario", () => {
    it("adiciona residuo ao inventario", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const residuo = await prisma.residuo.create({
        data: { tipo: "ELETRONICO", descricao: "Monitores", classeAbnt: "I" },
      });

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/residuos/inventario",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: {
          residuoId: residuo.id,
          quantidade: 25,
          unidade: "UNIDADE",
          frequencia: "MENSAL",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data.residuo.descricao).toBe("Monitores");
      expect(body.data.quantidade).toBe(25);
    });

    it("rejeita residuo inexistente", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/residuos/inventario",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: {
          residuoId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
          quantidade: 10,
          unidade: "KG",
        },
      });

      expect(res.statusCode).toBe(404);
    });

    it("rejeita duplicata no inventario", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const residuo = await prisma.residuo.create({
        data: { tipo: "ORGANICO", descricao: "Alimentos", classeAbnt: "IIA" },
      });

      // Primeiro — sucesso
      await app.inject({
        method: "POST",
        url: "/api/v1/residuos/inventario",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { residuoId: residuo.id, quantidade: 10, unidade: "KG" },
      });

      // Segundo — conflito
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/residuos/inventario",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { residuoId: residuo.id, quantidade: 20, unidade: "KG" },
      });

      expect(res.statusCode).toBe(409);
    });
  });

  // ─── PATCH /residuos/inventario/:id ────────────────────────────────────────

  describe("PATCH /api/v1/residuos/inventario/:id", () => {
    it("atualiza quantidade no inventario", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const residuo = await prisma.residuo.create({
        data: { tipo: "RECICLAVEL", descricao: "Vidro", classeAbnt: "IIA" },
      });
      const item = await prisma.inventarioResiduo.create({
        data: {
          empresaId: fixture.empresaId,
          residuoId: residuo.id,
          quantidade: 30,
          unidade: "KG",
          frequencia: "SEMANAL",
        },
      });

      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/residuos/inventario/${item.id}`,
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { quantidade: 75 },
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data.quantidade).toBe(75);
    });

    it("404 para item de outra empresa", async () => {
      const fixtureA = await criarEmpresaFixture({ email: "xa@teste.com" });
      const fixtureB = await criarEmpresaFixture({ email: "xb@teste.com" });

      const residuo = await prisma.residuo.create({
        data: { tipo: "RECICLAVEL", descricao: "Papel", classeAbnt: "IIA" },
      });
      const item = await prisma.inventarioResiduo.create({
        data: {
          empresaId: fixtureA.empresaId,
          residuoId: residuo.id,
          quantidade: 30,
          unidade: "KG",
          frequencia: "SEMANAL",
        },
      });

      const { accessToken } = await loginAs(app, fixtureB.email, fixtureB.senha);

      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/residuos/inventario/${item.id}`,
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { quantidade: 999 },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ─── DELETE /residuos/inventario/:id ───────────────────────────────────────

  describe("DELETE /api/v1/residuos/inventario/:id", () => {
    it("soft delete do item (ativo=false)", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const residuo = await prisma.residuo.create({
        data: { tipo: "RECICLAVEL", descricao: "Aluminio", classeAbnt: "IIA" },
      });
      const item = await prisma.inventarioResiduo.create({
        data: {
          empresaId: fixture.empresaId,
          residuoId: residuo.id,
          quantidade: 40,
          unidade: "KG",
          frequencia: "MENSAL",
        },
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/residuos/inventario/${item.id}`,
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data.ativo).toBe(false);

      // Verificar no banco
      const dbItem = await prisma.inventarioResiduo.findUnique({ where: { id: item.id } });
      expect(dbItem!.ativo).toBe(false);
    });
  });
});
