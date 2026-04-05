/**
 * Plugin Fastify — JWT
 * Configura autenticação JWT e helper de verificação de token.
 * Injeta `empresaId` e `role` no contexto de cada request autenticado.
 */

import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import type { JwtPayload } from "@ecotrack/shared";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

const jwtPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado");

  await fastify.register(fastifyJwt, {
    secret,
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
      algorithm: "HS256",
    },
  });

  // Decorator: verifica JWT e injeta payload no request
  fastify.decorate(
    "authenticate",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
      } catch (err) {
        reply.status(401).send({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Token inválido ou expirado" },
        });
      }
    }
  );

  // Decorator: verifica JWT + exige role ADMIN
  fastify.decorate(
    "authenticateAdmin",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
        if (req.user.role !== "ADMIN") {
          return reply.status(403).send({
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Acesso restrito a administradores",
            },
          });
        }
      } catch (err) {
        reply.status(401).send({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Token inválido ou expirado" },
        });
      }
    }
  );
});

export { jwtPlugin };
