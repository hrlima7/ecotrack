/**
 * Testes — Servico SINIR (modo mock)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { criarSinir, tipoParaCodigoIbama } from "./sinir";

const fastifyMock = {
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
} as unknown as FastifyInstance;

beforeEach(() => {
  // limpa cache do singleton entre testes
  vi.resetModules();
  delete process.env.SINIR_MODE;
});

describe("criarSinir (mock)", () => {
  it("usa modo mock por padrao", async () => {
    vi.resetModules();
    const { criarSinir } = await import("./sinir");
    const svc = criarSinir(fastifyMock);
    expect(svc.modo).toBe("mock");
  });

  it("emite MTR com numero deterministico baseado no coletaId", async () => {
    vi.resetModules();
    const { criarSinir } = await import("./sinir");
    const svc = criarSinir(fastifyMock);

    const r = await svc.emitir({
      coletaId: "abc123def456ghi789",
      geradorCnpj: "12345678000190",
      geradorRazaoSocial: "Teste Ltda",
      residuos: [
        { codigoIbama: "20 02 01", descricao: "Organico", quantidadeKg: 10, unidade: "KG" },
      ],
      dataPrevista: new Date("2026-05-01"),
    });

    const ano = new Date().getFullYear();
    expect(r.numero).toBe(`MTR-${ano}-789GHI`.replace("789GHI", "GHI789"));
    expect(r.modo).toBe("mock");
    expect(r.protocolo).toBeNull();
    expect(r.emitidoEm).toBeInstanceOf(Date);
  });

  it("cancelar retorna sucesso em modo mock", async () => {
    vi.resetModules();
    const { criarSinir } = await import("./sinir");
    const svc = criarSinir(fastifyMock);

    const r = await svc.cancelar("MTR-2026-ABC123", "Erro de digitacao");
    expect(r.cancelado).toBe(true);
  });

  it("consultar retorna situacao EMITIDO em modo mock", async () => {
    vi.resetModules();
    const { criarSinir } = await import("./sinir");
    const svc = criarSinir(fastifyMock);

    const r = await svc.consultar("MTR-2026-ABC123");
    expect(r).toMatchObject({ numero: "MTR-2026-ABC123", situacao: "EMITIDO" });
  });

  it("modo real sem credenciais cai para mock", async () => {
    process.env.SINIR_MODE = "real";
    vi.resetModules();
    const { criarSinir } = await import("./sinir");
    const svc = criarSinir(fastifyMock);
    expect(svc.modo).toBe("mock");
  });
});

describe("tipoParaCodigoIbama", () => {
  it("mapeia tipos conhecidos para codigos IBAMA", () => {
    expect(tipoParaCodigoIbama("ORGANICO")).toBe("20 02 01");
    expect(tipoParaCodigoIbama("RECICLAVEL")).toBe("20 01 01");
    expect(tipoParaCodigoIbama("ELETRONICO")).toBe("20 01 35");
    expect(tipoParaCodigoIbama("HOSPITALAR")).toBe("18 01 03");
    expect(tipoParaCodigoIbama("PERIGOSO")).toBe("20 01 13");
  });

  it("retorna codigo generico para tipo desconhecido", () => {
    expect(tipoParaCodigoIbama("DESCONHECIDO")).toBe("20 03 01");
  });
});
