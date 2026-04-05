/**
 * Plugin Fastify — Redis (ioredis)
 * Injeta cliente Redis para cache, sessões e filas BullMQ.
 */

import fp from "fastify-plugin";
import Redis from "ioredis";
import type { FastifyPluginAsync } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

const redisPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 5) return null; // Para de tentar
      return Math.min(times * 100, 2000);
    },
    lazyConnect: true,
  });

  await redis.connect();
  fastify.log.info("Redis conectado");

  fastify.decorate("redis", redis);

  fastify.addHook("onClose", async () => {
    await redis.quit();
    fastify.log.info("Redis desconectado");
  });

  redis.on("error", (err) => {
    fastify.log.error({ err }, "Erro Redis");
  });
});

export { redisPlugin };
