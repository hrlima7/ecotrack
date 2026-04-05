/**
 * Rotas — Auth
 * POST /api/v1/auth/login
 * POST /api/v1/auth/cadastro
 * POST /api/v1/auth/refresh
 * POST /api/v1/auth/logout
 * GET  /api/v1/auth/me
 */

import type { FastifyPluginAsync } from "fastify";
import { loginSchema, cadastroEmpresaSchema, refreshTokenSchema } from "../schemas/auth.schema";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /login
  fastify.post(
    "/login",
    {
      schema: {
        tags: ["auth"],
        summary: "Autenticar usuário",
        body: {
          type: "object",
          required: ["email", "senha"],
          properties: {
            email: { type: "string", format: "email" },
            senha: { type: "string", minLength: 8 },
          },
        },
      },
    },
    async (req, reply) => {
      const input = loginSchema.parse(req.body);

      // TODO: implementar lógica de autenticação
      // 1. Buscar usuário pelo email (filtrando por empresa ativa)
      // 2. Verificar senha com bcrypt
      // 3. Gerar accessToken (JWT) + refreshToken
      // 4. Salvar refreshToken no banco
      // 5. Log de auditoria LGPD

      return reply.status(200).send({
        success: true,
        data: {
          accessToken: "stub_access_token",
          refreshToken: "stub_refresh_token",
          usuario: { id: "stub_id", nome: "Stub User", email: input.email },
        },
      });
    }
  );

  // POST /cadastro — onboarding de nova empresa
  fastify.post(
    "/cadastro",
    {
      schema: {
        tags: ["auth"],
        summary: "Cadastrar nova empresa e usuário admin",
      },
    },
    async (req, reply) => {
      const input = cadastroEmpresaSchema.parse(req.body);

      // TODO: implementar lógica de cadastro
      // 1. Verificar se CNPJ já existe
      // 2. Criar Empresa
      // 3. Criar Usuario admin com senhaHash (bcrypt)
      // 4. Gerar tokens

      return reply.status(201).send({
        success: true,
        data: {
          empresaId: "stub_empresa_id",
          mensagem: "Empresa cadastrada com sucesso",
        },
      });
    }
  );

  // POST /refresh — renovar access token
  fastify.post(
    "/refresh",
    {
      schema: {
        tags: ["auth"],
        summary: "Renovar access token via refresh token",
      },
    },
    async (req, reply) => {
      const input = refreshTokenSchema.parse(req.body);

      // TODO: implementar renovação de token
      // 1. Verificar refreshToken no banco (não revogado, não expirado)
      // 2. Gerar novo accessToken
      // 3. Opcionalmente rotacionar refreshToken

      return reply.status(200).send({
        success: true,
        data: { accessToken: "stub_new_access_token" },
      });
    }
  );

  // POST /logout
  fastify.post(
    "/logout",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["auth"],
        summary: "Encerrar sessão e revogar refresh token",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      // TODO: revogar refreshToken no banco

      return reply.status(200).send({
        success: true,
        data: { mensagem: "Logout realizado com sucesso" },
      });
    }
  );

  // GET /me — dados do usuário autenticado
  fastify.get(
    "/me",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["auth"],
        summary: "Obter dados do usuário autenticado",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { sub: usuarioId, empresaId } = req.user;

      // TODO: buscar dados completos do usuário + empresa
      // LGPD: registrar acesso a dados pessoais

      return reply.status(200).send({
        success: true,
        data: { usuarioId, empresaId },
      });
    }
  );
};
