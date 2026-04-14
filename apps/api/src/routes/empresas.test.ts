/**
 * Testes de integração — Rotas de Empresas
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

describe("Empresas Routes", () => {
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

  // ─── GET /me ────────────────────────────────────────────────────────────────

  describe("GET /api/v1/empresas/me", () => {
    it("retorna dados da empresa autenticada", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/empresas/me",
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(fixture.empresaId);
      expect(body.data.razaoSocial).toBe("Empresa Teste LTDA");
      expect(body.data.cnpj).toBeDefined();
    });

    it("401 sem token", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/empresas/me",
      });
      expect(res.statusCode).toBe(401);
    });

    it("registra audit log de acesso", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      await app.inject({
        method: "GET",
        url: "/api/v1/empresas/me",
        headers: authHeaders(accessToken),
      });

      const logs = await prisma.auditLog.findMany({
        where: { empresaId: fixture.empresaId, acao: "ACESSO_DADOS_EMPRESA" },
      });
      expect(logs.length).toBe(1);
    });
  });

  // ─── PATCH /me ──────────────────────────────────────────────────────────────

  describe("PATCH /api/v1/empresas/me", () => {
    it("admin atualiza dados da empresa", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/empresas/me",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { nomeFantasia: "Novo Nome", telefone: "(11) 99999-0000" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.nomeFantasia).toBe("Novo Nome");
      expect(body.data.telefone).toBe("(11) 99999-0000");
    });

    it("rejeita body vazio", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/empresas/me",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });

    it("operador nao pode atualizar empresa", async () => {
      const fixture = await criarEmpresaFixture();
      // Criar usuario operador
      const bcrypt = await import("bcrypt");
      const senhaHash = await bcrypt.hash("senha-op-123", 10);
      await prisma.usuario.create({
        data: {
          empresaId: fixture.empresaId,
          nome: "Operador",
          email: "operador@teste.com",
          senhaHash,
          role: "OPERADOR",
        },
      });

      const { accessToken } = await loginAs(app, "operador@teste.com", "senha-op-123");

      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/empresas/me",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { nomeFantasia: "Hack" },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // ─── DELETE /me/delete ──────────────────────────────────────────────────────

  describe("DELETE /api/v1/empresas/me/delete", () => {
    it("exclui conta e anonimiza dados (LGPD)", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const res = await app.inject({
        method: "DELETE",
        url: "/api/v1/empresas/me/delete",
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.mensagem).toContain("LGPD");

      // Verificar anonimizacao
      const empresa = await prisma.empresa.findUnique({
        where: { id: fixture.empresaId },
      });
      expect(empresa!.ativo).toBe(false);
      expect(empresa!.razaoSocial).toContain("CONTA ENCERRADA");
      expect(empresa!.email).toContain("anonimizado");

      // Usuario anonimizado
      const usuario = await prisma.usuario.findUnique({
        where: { id: fixture.usuarioId },
      });
      expect(usuario!.ativo).toBe(false);
      expect(usuario!.nome).toBe("[USUÁRIO REMOVIDO]");
    });

    it("registra audit log LGPD", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      await app.inject({
        method: "DELETE",
        url: "/api/v1/empresas/me/delete",
        headers: authHeaders(accessToken),
      });

      const logs = await prisma.auditLog.findMany({
        where: { acao: "EXCLUSAO_CONTA_LGPD" },
      });
      expect(logs.length).toBe(1);
      expect((logs[0].detalhes as Record<string, string>).motivoLegal).toContain("LGPD");
    });
  });

  // ─── GET /me/usuarios ───────────────────────────────────────────────────────

  describe("GET /api/v1/empresas/me/usuarios", () => {
    it("lista usuarios da empresa", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/empresas/me/usuarios",
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.length).toBe(1);
      expect(body.data[0].email).toBe(fixture.email);
    });
  });

  // ─── POST /me/usuarios ──────────────────────────────────────────────────────

  describe("POST /api/v1/empresas/me/usuarios", () => {
    it("admin convida novo usuario", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/empresas/me/usuarios",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: {
          email: "novo@teste.com",
          nome: "Novo Usuario",
          role: "OPERADOR",
          senha: "senha-nova-123",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data.email).toBe("novo@teste.com");
      expect(body.data.role).toBe("OPERADOR");
    });

    it("rejeita email duplicado", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/empresas/me/usuarios",
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: {
          email: fixture.email,
          nome: "Dup",
          senha: "senha-dup-123",
        },
      });

      expect(res.statusCode).toBe(409);
    });
  });

  // ─── PATCH /me/usuarios/:id ─────────────────────────────────────────────────

  describe("PATCH /api/v1/empresas/me/usuarios/:id", () => {
    it("atualiza role de usuario", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      // Criar segundo usuario
      const bcrypt = await import("bcrypt");
      const senhaHash = await bcrypt.hash("senha123", 10);
      const outro = await prisma.usuario.create({
        data: {
          empresaId: fixture.empresaId,
          nome: "Outro",
          email: "outro@teste.com",
          senhaHash,
          role: "OPERADOR",
        },
      });

      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/empresas/me/usuarios/${outro.id}`,
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { role: "MOTORISTA" },
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data.role).toBe("MOTORISTA");
    });

    it("admin nao pode rebaixar a si mesmo", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/empresas/me/usuarios/${fixture.usuarioId}`,
        headers: { ...authHeaders(accessToken), "content-type": "application/json" },
        payload: { role: "OPERADOR" },
      });

      expect(res.statusCode).toBe(422);
    });
  });

  // ─── DELETE /me/usuarios/:id ────────────────────────────────────────────────

  describe("DELETE /api/v1/empresas/me/usuarios/:id", () => {
    it("desativa usuario", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const bcrypt = await import("bcrypt");
      const senhaHash = await bcrypt.hash("senha123", 10);
      const outro = await prisma.usuario.create({
        data: {
          empresaId: fixture.empresaId,
          nome: "Desativar",
          email: "desativar@teste.com",
          senhaHash,
          role: "OPERADOR",
        },
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/empresas/me/usuarios/${outro.id}`,
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.ativo).toBe(false);
    });

    it("admin nao pode desativar a si mesmo", async () => {
      const fixture = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, fixture.email, fixture.senha);

      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/empresas/me/usuarios/${fixture.usuarioId}`,
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(422);
    });
  });
});
