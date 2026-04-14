/**
 * Rotas — Auth
 * POST /api/v1/auth/login
 * POST /api/v1/auth/cadastro
 * POST /api/v1/auth/refresh
 * POST /api/v1/auth/logout
 * GET  /api/v1/auth/me
 */

import type { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import type { RoleUsuario } from "@ecotrack/shared";
import { loginSchema, cadastroEmpresaSchema, refreshTokenSchema } from "../schemas/auth.schema";

const BCRYPT_ROUNDS = 12;

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
      const { email, senha } = loginSchema.parse(req.body);

      // 1. Buscar usuário pelo email (empresa ativa)
      const usuario = await fastify.prisma.usuario.findFirst({
        where: {
          email,
          ativo: true,
          empresa: { ativo: true },
        },
        include: {
          empresa: {
            select: { id: true, razaoSocial: true, nomeFantasia: true, tipo: true, plano: true },
          },
        },
      });

      if (!usuario) {
        return reply.status(401).send({
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "E-mail ou senha inválidos" },
        });
      }

      // 2. Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
      if (!senhaValida) {
        return reply.status(401).send({
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "E-mail ou senha inválidos" },
        });
      }

      // 3. Gerar access token
      const accessToken = fastify.jwt.sign({
        sub: usuario.id,
        empresaId: usuario.empresaId,
        role: usuario.role as RoleUsuario,
        email: usuario.email,
      });

      // 4. Gerar refresh token e salvar no banco
      const refreshToken = fastify.jwt.sign(
        { sub: usuario.id, empresaId: usuario.empresaId, role: usuario.role as RoleUsuario, email: usuario.email, type: "refresh" as const, jti: randomUUID() },
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d" }
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await fastify.prisma.refreshToken.create({
        data: {
          usuarioId: usuario.id,
          token: refreshToken,
          expiresAt,
        },
      });

      // 5. Log LGPD: acesso a dados pessoais
      await fastify.prisma.auditLog.create({
        data: {
          empresaId: usuario.empresaId,
          usuarioId: usuario.id,
          acao: "LOGIN",
          recurso: "usuario",
          recursoId: usuario.id,
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      // 6. Atualizar último acesso
      await fastify.prisma.usuario.update({
        where: { id: usuario.id },
        data: { ultimoAcessoDados: new Date() },
      });

      return reply.status(200).send({
        success: true,
        data: {
          accessToken,
          refreshToken,
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role,
            empresa: usuario.empresa,
          },
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

      // 1. Verificar se CNPJ já existe
      const empresaExistente = await fastify.prisma.empresa.findUnique({
        where: { cnpj: input.cnpj },
      });

      if (empresaExistente) {
        return reply.status(409).send({
          success: false,
          error: { code: "CNPJ_ALREADY_EXISTS", message: "CNPJ já cadastrado na plataforma" },
        });
      }

      // 2. Verificar se email admin já existe
      const emailExistente = await fastify.prisma.usuario.findUnique({
        where: { email: input.emailAdmin },
      });

      if (emailExistente) {
        return reply.status(409).send({
          success: false,
          error: { code: "EMAIL_ALREADY_EXISTS", message: "E-mail já cadastrado na plataforma" },
        });
      }

      // 3. Hash da senha
      const senhaHash = await bcrypt.hash(input.senhaAdmin, BCRYPT_ROUNDS);

      // 4. Criar Empresa + Usuario admin em transação
      const { empresa, usuario } = await fastify.prisma.$transaction(async (tx) => {
        const empresa = await tx.empresa.create({
          data: {
            cnpj: input.cnpj,
            razaoSocial: input.razaoSocial,
            nomeFantasia: input.nomeFantasia,
            tipo: input.tipo,
            email: input.email,
            telefone: input.telefone,
            logradouro: input.logradouro,
            numero: input.numero,
            complemento: input.complemento,
            bairro: input.bairro,
            cidade: input.cidade,
            estado: input.estado,
            cep: input.cep,
          },
        });

        const usuario = await tx.usuario.create({
          data: {
            empresaId: empresa.id,
            nome: input.nomeAdmin,
            email: input.emailAdmin,
            senhaHash,
            role: "ADMIN",
          },
        });

        return { empresa, usuario };
      });

      // 5. Gerar tokens para login automático após cadastro
      const accessToken = fastify.jwt.sign({
        sub: usuario.id,
        empresaId: empresa.id,
        role: usuario.role as RoleUsuario,
        email: usuario.email,
      });

      const refreshToken = fastify.jwt.sign(
        { sub: usuario.id, empresaId: empresa.id, role: usuario.role as RoleUsuario, email: usuario.email, type: "refresh" as const, jti: randomUUID() },
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d" }
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await fastify.prisma.refreshToken.create({
        data: { usuarioId: usuario.id, token: refreshToken, expiresAt },
      });

      // 6. Log de auditoria
      await fastify.prisma.auditLog.create({
        data: {
          empresaId: empresa.id,
          usuarioId: usuario.id,
          acao: "CADASTRO",
          recurso: "empresa",
          recursoId: empresa.id,
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      const empresaDTO = {
        id: empresa.id,
        razaoSocial: empresa.razaoSocial,
        nomeFantasia: empresa.nomeFantasia ?? null,
        tipo: empresa.tipo,
        plano: empresa.plano,
      };

      return reply.status(201).send({
        success: true,
        data: {
          accessToken,
          refreshToken,
          empresa: empresaDTO,
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role,
            empresa: empresaDTO,
          },
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
      const { refreshToken } = refreshTokenSchema.parse(req.body);

      // 1. Verificar refresh token no banco
      const tokenRecord = await fastify.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          usuario: {
            include: {
              empresa: { select: { id: true, ativo: true } },
            },
          },
        },
      });

      if (
        !tokenRecord ||
        tokenRecord.revogado ||
        tokenRecord.expiresAt < new Date() ||
        !tokenRecord.usuario.ativo ||
        !tokenRecord.usuario.empresa.ativo
      ) {
        return reply.status(401).send({
          success: false,
          error: { code: "INVALID_REFRESH_TOKEN", message: "Refresh token inválido ou expirado" },
        });
      }

      const usuario = tokenRecord.usuario;

      // 2. Revogar token antigo e emitir novo (rotação)
      await fastify.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revogado: true },
      });

      const newAccessToken = fastify.jwt.sign({
        sub: usuario.id,
        empresaId: usuario.empresaId,
        role: usuario.role as RoleUsuario,
        email: usuario.email,
      });

      const newRefreshToken = fastify.jwt.sign(
        { sub: usuario.id, empresaId: usuario.empresaId, role: usuario.role as RoleUsuario, email: usuario.email, type: "refresh" as const, jti: randomUUID() },
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d" }
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await fastify.prisma.refreshToken.create({
        data: { usuarioId: usuario.id, token: newRefreshToken, expiresAt },
      });

      return reply.status(200).send({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
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
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const { sub: usuarioId } = req.user;

      // Revogar o refresh token informado (pertencente ao usuário autenticado)
      await fastify.prisma.refreshToken.updateMany({
        where: { token: refreshToken, usuarioId, revogado: false },
        data: { revogado: true },
      });

      return reply.status(200).send({
        success: true,
        data: { mensagem: "Logout realizado com sucesso" },
      });
    }
  );

  // PATCH /senha — trocar senha do usuário autenticado
  fastify.patch(
    "/senha",
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ["auth"],
        summary: "Trocar senha do usuário autenticado",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["senhaAtual", "novaSenha"],
          properties: {
            senhaAtual: { type: "string", minLength: 1 },
            novaSenha: { type: "string", minLength: 8 },
          },
        },
      },
    },
    async (req, reply) => {
      const { sub: usuarioId, empresaId } = req.user;
      const { senhaAtual, novaSenha } = req.body as { senhaAtual: string; novaSenha: string };

      const usuario = await fastify.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { senhaHash: true },
      });

      if (!usuario) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Usuário não encontrado" },
        });
      }

      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senhaHash);
      if (!senhaValida) {
        return reply.status(401).send({
          success: false,
          error: { code: "SENHA_INCORRETA", message: "Senha atual incorreta" },
        });
      }

      const novaSenhaHash = await bcrypt.hash(novaSenha, BCRYPT_ROUNDS);
      await fastify.prisma.usuario.update({
        where: { id: usuarioId },
        data: { senhaHash: novaSenhaHash },
      });

      // Revogar todos os refresh tokens (forçar re-login em outros dispositivos)
      await fastify.prisma.refreshToken.updateMany({
        where: { usuarioId, revogado: false },
        data: { revogado: true },
      });

      await fastify.prisma.auditLog.create({
        data: {
          empresaId,
          usuarioId,
          acao: "TROCAR_SENHA",
          recurso: "usuario",
          recursoId: usuarioId,
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      return reply.status(200).send({
        success: true,
        data: { mensagem: "Senha alterada com sucesso" },
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

      const usuario = await fastify.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          criadoEm: true,
          empresa: {
            select: {
              id: true,
              razaoSocial: true,
              nomeFantasia: true,
              tipo: true,
              plano: true,
              cnpj: true,
            },
          },
        },
      });

      if (!usuario) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Usuário não encontrado" },
        });
      }

      // LGPD: registrar acesso a dados pessoais
      await fastify.prisma.auditLog.create({
        data: {
          empresaId,
          usuarioId,
          acao: "ACESSO_DADOS_PESSOAIS",
          recurso: "usuario",
          recursoId: usuarioId,
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      return reply.status(200).send({
        success: true,
        data: usuario,
      });
    }
  );
};
