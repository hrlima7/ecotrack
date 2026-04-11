/**
 * Vitest — configuração de testes do backend EcoTrack.
 * Testes de integração usam um servidor Fastify real (buildApp) + DB Postgres.
 *
 * Pré-requisitos:
 *   1. Postgres acessível em DATABASE_URL (usar .env.test com ecotrack_test)
 *   2. Rodar `pnpm --filter @ecotrack/api db:migrate` no DB de teste antes dos testes
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    // Execução sequencial — cada teste trunca tabelas compartilhadas
    fileParallelism: false,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
