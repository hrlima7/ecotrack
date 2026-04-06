/**
 * Hook — useInventario
 * Busca o inventário de resíduos da empresa autenticada.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth.context";
import { API_ROUTES } from "@ecotrack/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface InventarioItem {
  id: string;
  residuoId: string;
  quantidade: number;
  unidade: "KG" | "LITRO" | "UNIDADE";
  frequencia: string;
  residuo: { tipo: string; descricao: string };
}

export function useInventario() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["inventario"],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const res = await fetch(`${API_BASE}${API_ROUTES.RESIDUOS.INVENTARIO}`, {
        headers: { Authorization: `Bearer ${accessToken!}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar inventário");
      const json = await res.json();
      return json as { data: InventarioItem[] };
    },
  });
}
