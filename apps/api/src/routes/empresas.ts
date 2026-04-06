/**
 * Rotas — Empresas
 * GET    /api/v1/empresas/me           — dados da empresa autenticada
 * PATCH  /api/v1/empresas/me           — atualizar dados da empresa (ADMIN)
 * DELETE /api/v1/empresas/me/delete    — exclusão de conta (LGPD Art. 18)
 * GET    /api/v1/empresas/me/usuarios  — listar usuários da empresa
 * POST   /api/v1/empresas/me/usuarios  — convidar novo usuário
 * PATCH  /api/v1/empresas/me/usuarios/:id — atualizar role de usuário
 * DELETE /api/v1/empresas/me/usuarios/:id — desativar usuário
 */

import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";

const atualizarEmpresaSchema = z.object({
  nomeFantasia: z.string().max(255).optional(),
  telefone: z.string().max(20).optional(),
  logradouro: z.string().max(255).optional(),
  numero: z.string().max(20).optional(),
  complemento: z.string().max(100).optional(),
  bairro: z.string().max(100).optional(),
  cidade: z.string().max(100).optional(),
  estado: z.string().length(2).optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/).optional(),
});

const convidarUsuarioSchema = z.object({
  email: z.string().email("E-mail inválido").toLowerCase(),
  nome: z.string().min(2).max(255),
  role: z.enum(["ADMIN", "OPERADOR", "MOTORISTA"]).default("OPERADOR"),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
});

const atualizarUsuarioSchema = z.object({
  role: z.enum(["ADMIN", "OPERADOR", "MOTORISTA"]).optional(),
  nome: z.string().min(2).max(255).optional(),
});

export const empresasRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  // ─── GET /me ────────────────────────────────────────────────────────────────
  fastify.get(
    "/me",
    {
      schema: {
        tags: ["empresas"],
        summary: "Obter dados da empresa autenticada",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId, sub: usuarioId } = req.user;

      const empresa = await fastify.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: {
          id: true, cnpj: true, razaoSocial: true, nomeFantasia: true,
          tipo: true, plano: true, email: true, telefone: true,
          logradouro: true, numero: true, complemento: true,
          bairro: true, cidade: true, estado: true, cep: true,
          latitude: true, longitude: true,
          licencaAmbiental: true, licencaVencimento: true,
          ativo: true, criadoEm: true, atualizadoEm: true,
          _count: { select: { usuarios: true, coletasGeradas: true } },
        },
      });

      if (!empresa) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Empresa não encontrada" },
        });
      }

      // LGPD: log de acesso a dados da empresa
      await fastify.prisma.auditLog.create({
        data: {
          empresaId,
          usuarioId,
          acao: "ACESSO_DADOS_EMPRESA",
          recurso: "empresa",
          recursoId: empresaId,
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      return reply.status(200).send({ success: true, data: empresa });
    }
  );

  // ─── PATCH /me ──────────────────────────────────────────────────────────────
  fastify.patch(
    "/me",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["empresas"],
        summary: "Atualizar dados da empresa (somente ADMIN)",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId, sub: usuarioId } = req.user;
      const input = atualizarEmpresaSchema.parse(req.body);

      if (Object.keys(input).length === 0) {
        return reply.status(400).send({
          success: false,
          error: { code: "EMPTY_BODY", message: "Nenhum campo para atualizar" },
        });
      }

      const empresa = await fastify.prisma.empresa.update({
        where: { id: empresaId },
        data: input,
        select: {
          id: true, razaoSocial: true, nomeFantasia: true,
          email: true, telefone: true, logradouro: true,
          numero: true, bairro: true, cidade: true, estado: true, cep: true,
          atualizadoEm: true,
        },
      });

      await fastify.prisma.auditLog.create({
        data: {
          empresaId,
          usuarioId,
          acao: "ATUALIZAR_EMPRESA",
          recurso: "empresa",
          recursoId: empresaId,
          detalhes: { campos: Object.keys(input) },
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      return reply.status(200).send({ success: true, data: empresa });
    }
  );

  // ─── DELETE /me/delete ───────────────────────────────────────────────────────
  fastify.delete(
    "/me/delete",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["empresas"],
        summary: "Excluir conta e dados pessoais (LGPD Art. 18)",
        security: [{ bearerAuth: [] }],
        description:
          "Anonimiza dados pessoais e desativa a empresa. " +
          "Registros de MTR são mantidos anonimizados para conformidade CONAMA.",
      },
    },
    async (req, reply) => {
      const { empresaId, sub: usuarioId } = req.user;

      await fastify.prisma.$transaction(async (tx) => {
        // 1. Revogar todos os refresh tokens da empresa
        await tx.refreshToken.updateMany({
          where: { usuario: { empresaId } },
          data: { revogado: true },
        });

        // 2. Desativar todos os usuários
        await tx.usuario.updateMany({
          where: { empresaId },
          data: { ativo: false },
        });

        // 3. Anonimizar dados pessoais da empresa (LGPD)
        const timestamp = Date.now();
        await tx.empresa.update({
          where: { id: empresaId },
          data: {
            ativo: false,
            email: `deletado_${timestamp}@anonimizado.ecotrack`,
            telefone: null,
            cnpj: `00.000.000/0000-${String(timestamp).slice(-2)}`,
            razaoSocial: `[CONTA ENCERRADA ${timestamp}]`,
            nomeFantasia: null,
          },
        });

        // 4. Anonimizar emails dos usuários
        const usuarios = await tx.usuario.findMany({ where: { empresaId } });
        for (const u of usuarios) {
          await tx.usuario.update({
            where: { id: u.id },
            data: { email: `deletado_${u.id}@anonimizado.ecotrack`, nome: "[USUÁRIO REMOVIDO]" },
          });
        }

        // 5. Log de auditoria LGPD (manter para rastreabilidade)
        await tx.auditLog.create({
          data: {
            empresaId,
            usuarioId,
            acao: "EXCLUSAO_CONTA_LGPD",
            recurso: "empresa",
            recursoId: empresaId,
            detalhes: { motivoLegal: "LGPD Art. 18 - Direito à exclusão" },
            ip: req.ip,
            userAgent: req.headers["user-agent"] ?? null,
          },
        });
      });

      return reply.status(200).send({
        success: true,
        data: { mensagem: "Conta encerrada e dados pessoais removidos conforme LGPD Art. 18." },
      });
    }
  );

  // ─── GET /me/usuarios ────────────────────────────────────────────────────────
  fastify.get(
    "/me/usuarios",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["empresas"],
        summary: "Listar usuários da empresa",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId, sub: usuarioId } = req.user;

      const usuarios = await fastify.prisma.usuario.findMany({
        where: { empresaId, ativo: true },
        select: {
          id: true, nome: true, email: true, role: true,
          criadoEm: true, ultimoAcessoDados: true,
        },
        orderBy: { criadoEm: "asc" },
      });

      // LGPD: log de listagem de dados pessoais
      await fastify.prisma.auditLog.create({
        data: {
          empresaId,
          usuarioId,
          acao: "LISTAR_USUARIOS",
          recurso: "usuario",
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      return reply.status(200).send({
        success: true,
        data: usuarios,
        meta: { total: usuarios.length },
      });
    }
  );

  // ─── POST /me/usuarios ───────────────────────────────────────────────────────
  fastify.post(
    "/me/usuarios",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["empresas"],
        summary: "Adicionar novo usuário à empresa",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId, sub: usuarioId } = req.user;
      const input = convidarUsuarioSchema.parse(req.body);

      // Verificar se email já existe
      const existente = await fastify.prisma.usuario.findUnique({
        where: { email: input.email },
      });

      if (existente) {
        return reply.status(409).send({
          success: false,
          error: { code: "EMAIL_JA_CADASTRADO", message: "E-mail já cadastrado na plataforma" },
        });
      }

      const senhaHash = await bcrypt.hash(input.senha, 12);

      const novoUsuario = await fastify.prisma.usuario.create({
        data: {
          empresaId,
          email: input.email,
          nome: input.nome,
          senhaHash,
          role: input.role,
        },
        select: { id: true, nome: true, email: true, role: true, criadoEm: true },
      });

      await fastify.prisma.auditLog.create({
        data: {
          empresaId,
          usuarioId,
          acao: "CRIAR_USUARIO",
          recurso: "usuario",
          recursoId: novoUsuario.id,
          ip: req.ip,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      return reply.status(201).send({ success: true, data: novoUsuario });
    }
  );

  // ─── PATCH /me/usuarios/:id ──────────────────────────────────────────────────
  fastify.patch(
    "/me/usuarios/:id",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["empresas"],
        summary: "Atualizar role ou nome de usuário",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId, sub: usuarioId } = req.user;
      const { id } = req.params as { id: string };
      const input = atualizarUsuarioSchema.parse(req.body);

      // Verificar se usuário pertence à empresa (multi-tenancy)
      const usuario = await fastify.prisma.usuario.findFirst({
        where: { id, empresaId, ativo: true },
      });

      if (!usuario) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Usuário não encontrado" },
        });
      }

      // Impedir que o admin remova sua própria role
      if (id === usuarioId && input.role && input.role !== "ADMIN") {
        return reply.status(422).send({
          success: false,
          error: { code: "OPERACAO_INVALIDA", message: "Não é possível alterar a própria role de ADMIN" },
        });
      }

      const atualizado = await fastify.prisma.usuario.update({
        where: { id },
        data: input,
        select: { id: true, nome: true, email: true, role: true },
      });

      return reply.status(200).send({ success: true, data: atualizado });
    }
  );

  // ─── DELETE /me/usuarios/:id ─────────────────────────────────────────────────
  fastify.delete(
    "/me/usuarios/:id",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["empresas"],
        summary: "Desativar usuário da empresa",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId, sub: usuarioId } = req.user;
      const { id } = req.params as { id: string };

      if (id === usuarioId) {
        return reply.status(422).send({
          success: false,
          error: { code: "OPERACAO_INVALIDA", message: "Não é possível desativar o próprio usuário" },
        });
      }

      const usuario = await fastify.prisma.usuario.findFirst({
        where: { id, empresaId, ativo: true },
      });

      if (!usuario) {
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Usuário não encontrado" },
        });
      }

      await fastify.prisma.$transaction(async (tx) => {
        await tx.usuario.update({ where: { id }, data: { ativo: false } });
        await tx.refreshToken.updateMany({ where: { usuarioId: id }, data: { revogado: true } });
      });

      return reply.status(200).send({ success: true, data: { id, ativo: false } });
    }
  );
};
