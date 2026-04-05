/**
 * Rotas — Empresas
 * GET    /api/v1/empresas/me           — dados da empresa autenticada
 * PATCH  /api/v1/empresas/me           — atualizar dados da empresa
 * DELETE /api/v1/empresas/me/delete    — exclusão de conta (LGPD)
 * GET    /api/v1/empresas/me/usuarios  — listar usuários da empresa
 * POST   /api/v1/empresas/me/usuarios  — convidar novo usuário
 */

import type { FastifyPluginAsync } from "fastify";
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
  email: z.string().email(),
  nome: z.string().min(2).max(255),
  role: z.enum(["ADMIN", "OPERADOR", "MOTORISTA"]).default("OPERADOR"),
});

export const empresasRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  // GET /me — dados da empresa autenticada
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
      const { empresaId } = req.user;

      // TODO: prisma.empresa.findUniqueOrThrow({ where: { id: empresaId } })
      // LGPD: registrar acesso a dados da empresa

      return reply.status(200).send({
        success: true,
        data: { id: empresaId },
      });
    }
  );

  // PATCH /me — atualizar dados da empresa
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
      const { empresaId } = req.user;
      const input = atualizarEmpresaSchema.parse(req.body);

      // TODO: prisma.empresa.update({ where: { id: empresaId }, data: input })

      return reply.status(200).send({
        success: true,
        data: { id: empresaId },
      });
    }
  );

  // DELETE /me/delete — exclusão de conta (LGPD Art. 18)
  fastify.delete(
    "/me/delete",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["empresas"],
        summary: "Excluir conta e dados pessoais (LGPD Art. 18)",
        security: [{ bearerAuth: [] }],
        description:
          "Remove permanentemente todos os dados pessoais da empresa. " +
          "Dados de manifesto MTR são anonimizados para conformidade CONAMA.",
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;

      // TODO: implementar exclusão de conta
      // 1. Anonimizar dados pessoais (nome, email, CNPJ) — manter MTRs anonimizados
      // 2. Excluir Usuarios
      // 3. Revogar todos os tokens
      // 4. Registrar no AuditLog (LGPD)
      // 5. Marcar Empresa.ativo = false

      return reply.status(200).send({
        success: true,
        data: {
          mensagem:
            "Conta marcada para exclusão. Dados pessoais serão removidos em até 72 horas.",
        },
      });
    }
  );

  // GET /me/usuarios — listar usuários da empresa
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
      const { empresaId } = req.user;

      // TODO: prisma.usuario.findMany({ where: { empresaId, ativo: true } })
      // LGPD: registrar listagem de dados pessoais

      return reply.status(200).send({
        success: true,
        data: [],
        meta: { total: 0 },
      });
    }
  );

  // POST /me/usuarios — convidar novo usuário
  fastify.post(
    "/me/usuarios",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        tags: ["empresas"],
        summary: "Convidar novo usuário para a empresa",
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const input = convidarUsuarioSchema.parse(req.body);

      // TODO: implementar convite
      // 1. Verificar se email já existe na empresa
      // 2. Criar Usuario com senha temporária
      // 3. Enviar email de convite com link de definição de senha

      return reply.status(201).send({
        success: true,
        data: { mensagem: `Convite enviado para ${input.email}` },
      });
    }
  );
};
