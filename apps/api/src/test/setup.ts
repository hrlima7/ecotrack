/**
 * Setup global dos testes — carrega .env.test antes de qualquer import.
 * Executado uma vez por processo, antes de todos os arquivos de teste.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Carrega .env.test manualmente (sem dependência extra).
// Vitest seta NODE_ENV=test por padrão; forçamos as variáveis críticas.
const envPath = resolve(__dirname, "../../.env.test");
try {
  const content = readFileSync(envPath, "utf-8");
  for (const linha of content.split("\n")) {
    const trimmed = linha.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [chave, ...resto] = trimmed.split("=");
    if (!chave) continue;
    const valor = resto.join("=").replace(/^"(.*)"$/, "$1");
    if (!process.env[chave]) process.env[chave] = valor;
  }
} catch (err) {
  console.warn(`[vitest setup] Não foi possível carregar .env.test: ${(err as Error).message}`);
}

// Garantias mínimas
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-jwt-secret-com-pelo-menos-32-caracteres-para-passar";
}
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não definida. Crie .env.test em apps/api ou exporte a variável."
  );
}
