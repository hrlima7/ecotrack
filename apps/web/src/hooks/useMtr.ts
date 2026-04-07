/**
 * Hook — useMtr
 * React Query para listar, emitir e assinar MTRs via API.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth.context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type StatusMtr = "RASCUNHO" | "EMITIDO" | "ACEITO" | "FINALIZADO";
export type TipoAssinante = "GERADOR" | "TRANSPORTADOR" | "DESTINADOR";

export interface ManifestoMTR {
  id: string;
  coletaId: string;
  numeroSinir: string | null;
  status: StatusMtr;
  emitidoEm: string | null;
  finalizadoEm: string | null;
  assinaturaGerador: string | null;
  assinaturaTransportador: string | null;
  assinaturaDestinador: string | null;
  criadoEm: string;
  coleta: {
    id: string;
    status: string;
    dataAgendada: string;
    cidade: string;
    estado: string;
    residuos: Array<{
      id: string;
      residuo: { tipo: string; descricao: string };
    }>;
  };
}

export interface FiltrosMtr {
  status?: StatusMtr;
  page?: number;
  limit?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useMtr(filtros: FiltrosMtr = {}) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (filtros.status) params.set("status", filtros.status);
  if (filtros.page) params.set("page", String(filtros.page));
  if (filtros.limit) params.set("limit", String(filtros.limit));

  const query = useQuery({
    queryKey: ["mtr", filtros],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/v1/mtr?${params.toString()}`,
        { headers: authHeaders(accessToken!) }
      );
      if (!res.ok) throw new Error("Erro ao buscar manifestos");
      const json = await res.json();
      return json as {
        data: ManifestoMTR[];
        meta: { total: number; page: number; totalPages: number };
      };
    },
  });

  const emitir = useMutation({
    mutationFn: async (coletaId: string) => {
      const res = await fetch(`${API_BASE}/api/v1/mtr`, {
        method: "POST",
        headers: authHeaders(accessToken!),
        body: JSON.stringify({ coletaId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Erro ao emitir MTR");
      return json.data as ManifestoMTR;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mtr"] });
      queryClient.invalidateQueries({ queryKey: ["coletas"] });
    },
  });

  const assinar = useMutation({
    mutationFn: async ({
      id,
      tipo,
      assinatura,
    }: {
      id: string;
      tipo: TipoAssinante;
      assinatura: string;
    }) => {
      const res = await fetch(`${API_BASE}/api/v1/mtr/${id}/assinar`, {
        method: "POST",
        headers: authHeaders(accessToken!),
        body: JSON.stringify({ tipo, assinatura }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Erro ao assinar MTR");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mtr"] });
    },
  });

  return { query, emitir, assinar };
}
