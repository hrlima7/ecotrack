/**
 * Servico SINIR — Sistema Nacional de Informacoes sobre a Gestao dos Residuos Solidos
 * Resolucao CONAMA 275/2001 + Lei 12.305/2010 (PNRS)
 *
 * Modo MOCK (default): gera numero local determinístico — usado em DEV/STAGING.
 * Modo REAL: integra com o webservice oficial via SOAP/REST do IBAMA.
 *
 * Para ativar modo REAL, configurar:
 *   SINIR_MODE=real
 *   SINIR_API_URL=https://mtr.sinir.gov.br/api
 *   SINIR_USERNAME=<usuario CNPJ>
 *   SINIR_PASSWORD=<senha>
 *
 * Como a API oficial e burocratica e exige credenciamento prévio,
 * o cliente real e implementado em uma fase futura (Fase 2 do projeto).
 */

import type { FastifyInstance } from "fastify";

export interface ResiduoSinir {
  codigoIbama: string;
  descricao: string;
  quantidadeKg: number;
  unidade: "KG" | "LITRO" | "UNIDADE";
  classe?: "I" | "IIA" | "IIB"; // Classe ABNT NBR 10004
}

export interface EmissaoMtrPayload {
  coletaId: string;
  geradorCnpj: string;
  geradorRazaoSocial: string;
  transportadorCnpj?: string;
  destinadorCnpj?: string;
  residuos: ResiduoSinir[];
  dataPrevista: Date;
}

export interface EmissaoMtrResposta {
  numero: string;
  protocolo: string | null;
  emitidoEm: Date;
  modo: "mock" | "real";
}

interface SinirService {
  emitir: (payload: EmissaoMtrPayload) => Promise<EmissaoMtrResposta>;
  cancelar: (numero: string, motivo: string) => Promise<{ cancelado: boolean; protocolo: string | null }>;
  consultar: (numero: string) => Promise<{ numero: string; situacao: string } | null>;
  modo: "mock" | "real";
}

// ─── Cliente Mock ────────────────────────────────────────────────────────────

function gerarNumeroLocal(coletaId: string): string {
  const ano = new Date().getFullYear();
  const sufixo = coletaId.slice(-6).toUpperCase();
  return `MTR-${ano}-${sufixo}`;
}

function clienteMock(fastify: FastifyInstance): SinirService {
  return {
    modo: "mock",
    emitir: async (payload) => {
      fastify.log.info(
        { coletaId: payload.coletaId, residuos: payload.residuos.length },
        "[SINIR-MOCK] Emitindo MTR"
      );
      return {
        numero: gerarNumeroLocal(payload.coletaId),
        protocolo: null,
        emitidoEm: new Date(),
        modo: "mock",
      };
    },
    cancelar: async (numero, motivo) => {
      fastify.log.info({ numero, motivo }, "[SINIR-MOCK] Cancelando MTR");
      return { cancelado: true, protocolo: null };
    },
    consultar: async (numero) => {
      fastify.log.info({ numero }, "[SINIR-MOCK] Consultando MTR");
      return { numero, situacao: "EMITIDO" };
    },
  };
}

// ─── Cliente Real (placeholder — Fase 2) ─────────────────────────────────────
//
// A API oficial do SINIR exige certificado digital ICP-Brasil A1/A3
// e cadastro previo no sistema. O cliente real fara:
// 1. Autenticacao via certificado
// 2. SOAP envelope para metodo `manifestar`
// 3. Parse da resposta XML para extrair `numero` e `protocolo`
// 4. Persistir `protocolo` no campo `protocoloSinir` do ManifestoMTR
//
// Documentacao oficial: https://mtr.sinir.gov.br/manuais

function clienteReal(fastify: FastifyInstance): SinirService {
  const apiUrl = process.env.SINIR_API_URL;
  const username = process.env.SINIR_USERNAME;
  const password = process.env.SINIR_PASSWORD;

  if (!apiUrl || !username || !password) {
    fastify.log.warn("SINIR_MODE=real mas credenciais ausentes — caindo para mock");
    return clienteMock(fastify);
  }

  return {
    modo: "real",
    emitir: async (payload) => {
      // TODO Fase 2: implementar SOAP/REST oficial
      fastify.log.error("Cliente SINIR real ainda nao implementado — usando fallback mock");
      const fallback = clienteMock(fastify);
      return fallback.emitir(payload);
    },
    cancelar: async (numero, motivo) => {
      fastify.log.error("Cliente SINIR real ainda nao implementado");
      const fallback = clienteMock(fastify);
      return fallback.cancelar(numero, motivo);
    },
    consultar: async (numero) => {
      fastify.log.error("Cliente SINIR real ainda nao implementado");
      const fallback = clienteMock(fastify);
      return fallback.consultar(numero);
    },
  };
}

// ─── Factory ────────────────────────────────────────────────────────────────

let cached: SinirService | null = null;

export function criarSinir(fastify: FastifyInstance): SinirService {
  if (cached) return cached;
  const modo = (process.env.SINIR_MODE ?? "mock").toLowerCase();
  cached = modo === "real" ? clienteReal(fastify) : clienteMock(fastify);
  fastify.log.info({ modo: cached.modo }, "Servico SINIR inicializado");
  return cached;
}

// Util: mapear TipoResiduo interno para codigo IBAMA aproximado
const CODIGO_IBAMA_POR_TIPO: Record<string, string> = {
  ORGANICO: "20 02 01",
  RECICLAVEL: "20 01 01",
  ELETRONICO: "20 01 35",
  HOSPITALAR: "18 01 03",
  PERIGOSO: "20 01 13",
};

export function tipoParaCodigoIbama(tipo: string): string {
  return CODIGO_IBAMA_POR_TIPO[tipo] ?? "20 03 01";
}
