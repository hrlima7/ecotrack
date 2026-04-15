import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useColetas } from "./useColetas";

vi.mock("@/contexts/auth.context", () => ({
  useAuth: () => ({ accessToken: "fake-token" }),
}));

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useColetas", () => {
  beforeEach(() => fetchMock.mockReset());

  it("busca coletas via GET com Authorization header", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], meta: { total: 0, page: 1, totalPages: 0 } }),
    });

    const { result } = renderHook(() => useColetas(), { wrapper });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/v1/coletas");
    expect((opts as RequestInit).headers).toMatchObject({
      Authorization: "Bearer fake-token",
    });
  });

  it("propaga filtros de status na query string", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], meta: { total: 0, page: 1, totalPages: 0 } }),
    });

    const { result } = renderHook(() => useColetas({ status: "PENDENTE", limit: 5 }), { wrapper });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("status=PENDENTE");
    expect(String(url)).toContain("limit=5");
  });

  it("criar() faz POST e retorna a coleta criada", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], meta: { total: 0, page: 1, totalPages: 0 } }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "c-1", status: "PENDENTE" } }),
    });

    const { result } = renderHook(() => useColetas(), { wrapper });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    const created = await result.current.criar.mutateAsync({
      dataAgendada: "2026-05-01T10:00:00Z",
      residuos: [{ residuoId: "r-1", quantidadeEstimada: 10, unidade: "KG" }],
    });

    expect(created).toMatchObject({ id: "c-1", status: "PENDENTE" });
    const [, opts] = fetchMock.mock.calls[1];
    expect((opts as RequestInit).method).toBe("POST");
  });

  it("atualizarStatus() faz PATCH com payload correto", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], meta: { total: 0, page: 1, totalPages: 0 } }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "c-1", status: "EM_ROTA" } }),
    });

    const { result } = renderHook(() => useColetas(), { wrapper });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await result.current.atualizarStatus.mutateAsync({ id: "c-1", status: "EM_ROTA" });

    const [url, opts] = fetchMock.mock.calls[1];
    expect(String(url)).toContain("/api/v1/coletas/c-1/status");
    expect((opts as RequestInit).method).toBe("PATCH");
    expect(JSON.parse((opts as RequestInit).body as string)).toMatchObject({ status: "EM_ROTA" });
  });

  it("cancelar() faz DELETE", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], meta: { total: 0, page: 1, totalPages: 0 } }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "c-1", status: "CANCELADO" } }),
    });

    const { result } = renderHook(() => useColetas(), { wrapper });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await result.current.cancelar.mutateAsync("c-1");

    const [url, opts] = fetchMock.mock.calls[1];
    expect(String(url)).toContain("/api/v1/coletas/c-1");
    expect((opts as RequestInit).method).toBe("DELETE");
  });

  it("propaga mensagem de erro do backend em criar()", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], meta: { total: 0, page: 1, totalPages: 0 } }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Resíduo fora do inventário" } }),
    });

    const { result } = renderHook(() => useColetas(), { wrapper });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await expect(
      result.current.criar.mutateAsync({
        dataAgendada: "2026-05-01T10:00:00Z",
        residuos: [{ residuoId: "x", quantidadeEstimada: 1, unidade: "KG" }],
      })
    ).rejects.toThrow("Resíduo fora do inventário");
  });
});
