/**
 * EcoTrack API — Bootstrap Fastify
 * Registra plugins, rotas e inicia o servidor.
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { prismaPlugin } from "./plugins/prisma";
import { redisPlugin } from "./plugins/redis";
import { jwtPlugin } from "./plugins/jwt";

import { ZodError } from "zod";
import { authRoutes } from "./routes/auth";
import { coletasRoutes } from "./routes/coletas";
import { residuosRoutes } from "./routes/residuos";
import { mtrRoutes } from "./routes/mtr";
import { empresasRoutes } from "./routes/empresas";
import { metricasRoutes } from "./routes/metricas";

const API_PREFIX = "/api/v1";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport:
        process.env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  // ─── Segurança ──────────────────────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: false, // Desativado para Swagger UI em dev
  });

  await app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (req) =>
      (req.headers["x-forwarded-for"] as string) ?? req.ip,
  });

  // ─── Documentação OpenAPI ────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    await app.register(swagger, {
      openapi: {
        info: {
          title: "EcoTrack API",
          description:
            "API da plataforma SaaS EcoTrack de gestão de resíduos. Conformidade CONAMA 275/2001, SINIR, LGPD.",
          version: "1.0.0",
        },
        servers: [{ url: `http://localhost:${process.env.PORT ?? 3001}` }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        security: [{ bearerAuth: [] }],
        tags: [
          { name: "auth", description: "Autenticação e sessão" },
          { name: "coletas", description: "Agendamento e gestão de coletas" },
          { name: "residuos", description: "Catálogo e inventário de resíduos" },
          { name: "mtr", description: "Manifesto de Transporte de Resíduos" },
          { name: "empresas", description: "Gestão de empresas e usuários" },
        ],
      },
    });

    await app.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: { deepLinking: true },
    });
  }

  // ─── Plugins de Infraestrutura ──────────────────────────────────────────
  await app.register(prismaPlugin);
  // Redis não é necessário nos testes de integração (auth/coletas).
  // Em produção/dev é obrigatório para filas e rate limit distribuído.
  if (!process.env.VITEST) {
    await app.register(redisPlugin);
  }
  await app.register(jwtPlugin);

  // ─── Handler de erros global ─────────────────────────────────────────────
  // Registrado ANTES das rotas para que os plugins encapsulados o herdem.
  app.setErrorHandler((error, _req, reply) => {
    app.log.error(error);

    // Erros de validação Zod — .parse() lança ZodError sem statusCode
    if (error.name === "ZodError" || (error as any).issues) {
      const issues = (error as any).issues ?? (error as any).errors ?? [];
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: issues.map((e: { message: string }) => e.message).join("; "),
          details: issues,
        },
      });
    }

    const statusCode = error.statusCode ?? 500;

    // Erros de validação Fastify (schema JSON)
    if (statusCode === 400) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: (error as any).validation,
        },
      });
    }

    // Erros de autenticação
    if (statusCode === 401) {
      return reply.status(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Não autorizado" },
      });
    }

    // Erros de recurso não encontrado
    if (statusCode === 404) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: error.message },
      });
    }

    // Erros internos
    return reply.status(500).send({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "Erro interno do servidor"
            : error.message,
      },
    });
  });

  // ─── Health Check ────────────────────────────────────────────────────────
  app.get("/health", { schema: { hide: true } }, async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
  }));

  // ─── Rotas da API ────────────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: `${API_PREFIX}/auth` });
  await app.register(coletasRoutes, { prefix: `${API_PREFIX}/coletas` });
  await app.register(residuosRoutes, { prefix: `${API_PREFIX}/residuos` });
  await app.register(mtrRoutes, { prefix: `${API_PREFIX}/mtr` });
  await app.register(empresasRoutes, { prefix: `${API_PREFIX}/empresas` });

  return app;
}

// ─── Entry point ─────────────────────────────────────────────────────────────
async function main() {
  const app = await buildApp();

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? "0.0.0.0";

  try {
    await app.listen({ port, host });
    app.log.info(`EcoTrack API rodando em http://${host}:${port}`);
    app.log.info(`Documentação disponível em http://${host}:${port}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Não inicia o servidor quando o módulo é importado durante os testes (vitest)
if (!process.env.VITEST) {
  main();
}
