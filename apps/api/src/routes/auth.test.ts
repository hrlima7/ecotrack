/**
 * Testes de integração — rotas /auth
 * Cobrem o fluxo que o usuário reportou como quebrado (cadastro de empresa)
 * e previnem regressões nos endpoints críticos: login, refresh, me.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import {
  authHeaders,
  buildTestApp,
  criarEmpresaFixture,
  gerarCnpjAleatorio,
  limparBanco,
  loginAs,
  payloadCadastroValido,
  prisma,
} from "../test/helpers";

describe("rotas /auth", () => {
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

  // ───────────────────────────────────────────────────────────────────────
  // POST /auth/cadastro
  // ───────────────────────────────────────────────────────────────────────
  describe("POST /auth/cadastro", () => {
    it("cria empresa + usuário admin e retorna tokens + usuario.empresa aninhado", async () => {
      const payload = payloadCadastroValido();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/cadastro",
        payload,
      });

      expect(res.statusCode).toBe(201);

      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.accessToken).toBeTypeOf("string");
      expect(json.data.refreshToken).toBeTypeOf("string");

      // Regressão: usuario.empresa deve vir aninhado (mesma shape do /login)
      expect(json.data.usuario).toMatchObject({
        nome: "Admin Novo",
        email: payload.emailAdmin,
        role: "ADMIN",
        empresa: {
          razaoSocial: "Nova Empresa Teste",
          tipo: "GERADOR",
          plano: "FREE",
        },
      });
      expect(json.data.usuario.empresa.id).toBeTypeOf("string");

      // Valida persistência no banco
      const empresaDb = await prisma.empresa.findUnique({
        where: { cnpj: payload.cnpj },
      });
      expect(empresaDb).not.toBeNull();

      const usuarioDb = await prisma.usuario.findUnique({
        where: { email: payload.emailAdmin },
      });
      expect(usuarioDb?.role).toBe("ADMIN");
    });

    it("aceita payload sem telefone (campo opcional)", async () => {
      const payload = payloadCadastroValido();
      delete (payload as Record<string, unknown>).telefone;

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/cadastro",
        payload,
      });

      expect(res.statusCode).toBe(201);
    });

    it("rejeita CNPJ duplicado com 409 CNPJ_ALREADY_EXISTS", async () => {
      const cnpj = gerarCnpjAleatorio();
      const primeiro = payloadCadastroValido({ cnpj });
      await app.inject({ method: "POST", url: "/api/v1/auth/cadastro", payload: primeiro });

      const segundo = payloadCadastroValido({ cnpj, emailAdmin: "outro@teste.com" });
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/cadastro",
        payload: segundo,
      });

      expect(res.statusCode).toBe(409);
      const json = JSON.parse(res.body);
      expect(json.error.code).toBe("CNPJ_ALREADY_EXISTS");
    });

    it("rejeita email admin duplicado com 409 EMAIL_ALREADY_EXISTS", async () => {
      const emailAdmin = `dup-${Date.now()}@teste.com`;
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/cadastro",
        payload: payloadCadastroValido({ emailAdmin }),
      });

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/cadastro",
        payload: payloadCadastroValido({ emailAdmin }),
      });

      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res.body).error.code).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("rejeita CNPJ com formato inválido", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/cadastro",
        payload: payloadCadastroValido({ cnpj: "123" }),
      });

      expect(res.statusCode).toBe(400);
    });

    it("rejeita senha com menos de 8 caracteres", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/cadastro",
        payload: payloadCadastroValido({ senhaAdmin: "curta" }),
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // POST /auth/login
  // ───────────────────────────────────────────────────────────────────────
  describe("POST /auth/login", () => {
    it("autentica com credenciais corretas e retorna tokens", async () => {
      const { email, senha } = await criarEmpresaFixture();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email, senha },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.accessToken).toBeTypeOf("string");
      expect(json.data.refreshToken).toBeTypeOf("string");
      expect(json.data.usuario.empresa).toBeDefined();
    });

    it("rejeita senha incorreta com 401 INVALID_CREDENTIALS", async () => {
      const { email } = await criarEmpresaFixture();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email, senha: "senha-errada-123" },
      });

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).error.code).toBe("INVALID_CREDENTIALS");
    });

    it("rejeita email inexistente com 401", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email: "fantasma@teste.com", senha: "qualquer-senha-123" },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // POST /auth/refresh
  // ───────────────────────────────────────────────────────────────────────
  describe("POST /auth/refresh", () => {
    it("rotaciona tokens e revoga o antigo", async () => {
      const { email, senha } = await criarEmpresaFixture();
      const { refreshToken } = await loginAs(app, email, senha);

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: { refreshToken },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.accessToken).toBeTypeOf("string");
      expect(json.data.refreshToken).toBeTypeOf("string");
      expect(json.data.refreshToken).not.toBe(refreshToken);

      // Token antigo foi revogado
      const antigo = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
      expect(antigo?.revogado).toBe(true);
    });

    it("rejeita refresh token inválido com 401", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: { refreshToken: "token-inexistente" },
      });

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).error.code).toBe("INVALID_REFRESH_TOKEN");
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // GET /auth/me
  // ───────────────────────────────────────────────────────────────────────
  describe("GET /auth/me", () => {
    it("retorna dados do usuário autenticado com empresa aninhada", async () => {
      const { email, senha } = await criarEmpresaFixture();
      const { accessToken } = await loginAs(app, email, senha);

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: authHeaders(accessToken),
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.data.email).toBe(email);
      expect(json.data.empresa).toBeDefined();
      expect(json.data.empresa.razaoSocial).toBe("Empresa Teste LTDA");
    });

    it("rejeita request sem token com 401", async () => {
      const res = await app.inject({ method: "GET", url: "/api/v1/auth/me" });
      expect(res.statusCode).toBe(401);
    });

    it("rejeita token inválido com 401", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: authHeaders("token-invalido"),
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Hash bcrypt — sanity check
  // ───────────────────────────────────────────────────────────────────────
  it("bcrypt está funcionando (sanity)", async () => {
    const hash = await bcrypt.hash("senha-teste-123", 10);
    expect(await bcrypt.compare("senha-teste-123", hash)).toBe(true);
    expect(await bcrypt.compare("outra-senha", hash)).toBe(false);
  });
});
