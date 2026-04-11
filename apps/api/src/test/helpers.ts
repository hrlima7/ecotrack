/**
 * Helpers de teste — EcoTrack API
 * Fornece: buildApp isolado, truncate de tabelas, fixtures de empresa/usuário/resíduo,
 * login rápido e montagem de headers autenticados.
 */

import bcrypt from "bcrypt";
import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { buildApp as buildServerApp } from "../server";

// Client Prisma compartilhado — usado para limpar e semear o banco.
// Cada teste pode usar este client diretamente em vez do `app.prisma` quando
// precisa preparar dados antes de subir o servidor.
export const prisma = new PrismaClient();

/**
 * Ordem de truncagem importa por causa das FKs: filhos antes de pais.
 * `TRUNCATE ... CASCADE` resolve as dependências, mas preferimos ser explícitos.
 */
const TABELAS_PARA_LIMPAR = [
  "audit_logs",
  "coleta_status_historico",
  "manifestos_mtr",
  "coleta_residuos",
  "coletas",
  "refresh_tokens",
  "inventario_residuos",
  "usuarios",
  "empresas",
  "residuos",
] as const;

export async function limparBanco() {
  // TRUNCATE com CASCADE garante limpeza consistente mesmo se alguma FK escapar.
  const lista = TABELAS_PARA_LIMPAR.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE;`);
}

/**
 * Sobe uma instância Fastify nova — sem chamar listen().
 * Cada arquivo de teste usa sua própria instância para evitar poluição entre suites.
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await buildServerApp();
  await app.ready();
  return app;
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

export interface EmpresaFixture {
  empresaId: string;
  usuarioId: string;
  email: string;
  senha: string;
}

/**
 * Cria uma empresa + usuário admin diretamente via Prisma (sem passar pelo endpoint).
 * Útil para testes de coletas que precisam só de um token válido.
 */
export async function criarEmpresaFixture(overrides?: {
  cnpj?: string;
  email?: string;
  tipo?: "GERADOR" | "TRANSPORTADOR" | "DESTINADOR";
}): Promise<EmpresaFixture> {
  const email = overrides?.email ?? `admin-${Date.now()}@teste.com`;
  const senha = "senha-teste-123";
  const senhaHash = await bcrypt.hash(senha, 10);

  const empresa = await prisma.empresa.create({
    data: {
      cnpj: overrides?.cnpj ?? gerarCnpjAleatorio(),
      razaoSocial: "Empresa Teste LTDA",
      nomeFantasia: "Teste",
      tipo: overrides?.tipo ?? "GERADOR",
      email: "contato@teste.com",
      logradouro: "Rua Teste",
      numero: "100",
      bairro: "Centro",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01000-000",
    },
  });

  const usuario = await prisma.usuario.create({
    data: {
      empresaId: empresa.id,
      nome: "Admin Teste",
      email,
      senhaHash,
      role: "ADMIN",
    },
  });

  return { empresaId: empresa.id, usuarioId: usuario.id, email, senha };
}

/**
 * Cria um resíduo catalogado e já vincula ao inventário da empresa.
 * Retorna o id do resíduo (usado no payload de criação de coleta).
 */
export async function criarResiduoInventario(empresaId: string): Promise<string> {
  const residuo = await prisma.residuo.create({
    data: {
      tipo: "RECICLAVEL",
      descricao: "Papel e papelão",
      classeAbnt: "IIA",
    },
  });

  await prisma.inventarioResiduo.create({
    data: {
      empresaId,
      residuoId: residuo.id,
      quantidade: 50,
      unidade: "KG",
      frequencia: "SOB_DEMANDA",
    },
  });

  return residuo.id;
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────

export async function loginAs(
  app: FastifyInstance,
  email: string,
  senha: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, senha },
  });

  if (res.statusCode !== 200) {
    throw new Error(`Login falhou: ${res.statusCode} ${res.body}`);
  }

  const json = JSON.parse(res.body);
  return {
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken,
  };
}

export function authHeaders(token: string) {
  return { authorization: `Bearer ${token}` };
}

// ─── Utilidades ─────────────────────────────────────────────────────────────

/** Gera um CNPJ aleatório no formato XX.XXX.XXX/XXXX-XX (não precisa ser válido) */
export function gerarCnpjAleatorio(): string {
  const d = () => Math.floor(Math.random() * 10);
  return `${d()}${d()}.${d()}${d()}${d()}.${d()}${d()}${d()}/${d()}${d()}${d()}${d()}-${d()}${d()}`;
}

/** Payload de cadastro válido usado em múltiplos testes */
export function payloadCadastroValido(overrides?: Record<string, unknown>) {
  return {
    cnpj: gerarCnpjAleatorio(),
    razaoSocial: "Nova Empresa Teste",
    nomeFantasia: "Nova Teste",
    tipo: "GERADOR" as const,
    email: "contato@novaempresa.com",
    telefone: "(11) 98765-4321",
    logradouro: "Av. Paulista",
    numero: "1000",
    complemento: "Sala 10",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01310-100",
    nomeAdmin: "Admin Novo",
    emailAdmin: `admin-${Date.now()}@novaempresa.com`,
    senhaAdmin: "senha-forte-123",
    ...overrides,
  };
}
