/**
 * Hook — useColetas
 * React Query para buscar e criar coletas via API.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth.context";
import { API_ROUTES } from "@ecotrack/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface ColetaResiduo {
  id: string;
  residuoId: string;
  quantidadeEstimada: number;
  quantidadeReal?: number;
  unidade: "KG" | "LITRO" | "UNIDADE";
  residuo: { tipo: string; descricao: string };
}

export interface Coleta {
  id: string;
  empresaId: string;
  status: string;
  dataAgendada: string;
  dataRealizada?: string;
  pesoRealKg?: number;
  observacoes?: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  residuos: ColetaResiduo[];
  manifesto?: { id: string; status: string; numeroSinir?: string };
  criadoEm: string;
}

export interface CriarColetaPayload {
  dataAgendada: string;
  residuos: Array<{
    residuoId: string;
    quantidadeEstimada: number;
    unidade: "KG" | "LITRO" | "UNIDADE";
  }>;
  observacoes?: string;
}

export type ColetaStatus = "PENDENTE" | "CONFIRMADA" | "EM_ROTA" | "COLETADO" | "FINALIZADO" | "CANCELADO";

export interface AtualizarStatusPayload {
  id: string;
  status: ColetaStatus;
  pesoRealKg?: number;
  motivo?: string;
}

export interface FiltrosColeta {
  status?: string;
  page?: number;
  limit?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useColetas(filtros: FiltrosColeta = {}) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (filtros.status) params.set("status", filtros.status);
  if (filtros.page) params.set("page", String(filtros.page));
  if (filtros.limit) params.set("limit", String(filtros.limit));

  const query = useQuery({
    queryKey: ["coletas", filtros],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}${API_ROUTES.COLETAS.BASE}?${params.toString()}`,
        { headers: authHeaders(accessToken!) }
      );
      if (!res.ok) throw new Error("Erro ao buscar coletas");
      const json = await res.json();
      return json as { data: Coleta[]; meta: { total: number; page: number; totalPages: number } };
    },
  });

  const criar = useMutation({
    mutationFn: async (payload: CriarColetaPayload) => {
      const res = await fetch(`${API_BASE}${API_ROUTES.COLETAS.BASE}`, {
        method: "POST",
        headers: authHeaders(accessToken!),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Erro ao criar coleta");
      return json.data as Coleta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coletas"] });
    },
  });

  return { query, criar };
}
