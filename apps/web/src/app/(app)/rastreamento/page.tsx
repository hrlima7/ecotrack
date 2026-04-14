/**
 * Pagina de Rastreamento — EcoTrack
 * Mapa interativo com coletas ativas e painel lateral de status.
 * Posicoes GPS atualizadas via polling a cada 10s.
 */

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RastreamentoMap } from "@/components/rastreamento/RastreamentoMap";
import { useAuth } from "@/contexts/auth.context";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusColeta, API_ROUTES } from "@ecotrack/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface ColetaAtiva {
  id: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  logradouro: string;
  numero: string;
  cidade: string;
  dataAgendada: string;
  atualizadoEm: string;
  residuos: Array<{ residuo: { descricao: string } }>;
  manifesto: { numeroSinir: string | null } | null;
}

export default function RastreamentoPage() {
  const [painelAberto, setPainelAberto] = useState(true);
  const { accessToken } = useAuth();

  const { data: coletasAtivas = [], isLoading } = useQuery<ColetaAtiva[]>({
    queryKey: ["rastreamento-ativas"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}${API_ROUTES.RASTREAMENTO.ATIVAS}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar coletas");
      const json = await res.json();
      return json.data;
    },
    enabled: !!accessToken,
    refetchInterval: 10_000,
  });

  const comGps = coletasAtivas.filter((c) => c.latitude && c.longitude).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rastreamento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {coletasAtivas.length} coleta{coletasAtivas.length !== 1 ? "s" : ""} ativa{coletasAtivas.length !== 1 ? "s" : ""}
            {comGps > 0 && ` · ${comGps} com GPS`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPainelAberto((v) => !v)}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          {painelAberto ? "Ocultar painel" : "Ver coletas"}
        </button>
      </div>

      {/* Layout: mapa + painel lateral */}
      <div
        className="flex gap-4"
        style={{ height: "calc(100vh - 200px)", minHeight: 420 }}
      >
        {/* Mapa */}
        <div className="flex-1 rounded-xl overflow-hidden border border-border">
          <RastreamentoMap />
        </div>

        {/* Painel lateral */}
        {painelAberto && (
          <div className="w-72 flex-shrink-0 flex flex-col bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Coletas ativas
              </h2>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {coletasAtivas.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : coletasAtivas.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma coleta ativa
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agende uma coleta para acompanhar aqui
                  </p>
                </div>
              ) : (
                coletasAtivas.map((coleta) => (
                  <div key={coleta.id} className="px-4 py-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs font-medium text-foreground leading-tight truncate">
                        {coleta.residuos.map((r) => r.residuo.descricao).join(", ")}
                      </p>
                      <StatusBadge status={coleta.status as StatusColeta} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {coleta.logradouro}, {coleta.numero} — {coleta.cidade}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(coleta.dataAgendada).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {coleta.latitude && coleta.longitude && (
                      <p className="text-xs text-blue-500 mt-0.5">
                        GPS: {coleta.latitude.toFixed(4)}, {coleta.longitude.toFixed(4)}
                      </p>
                    )}
                    {coleta.manifesto?.numeroSinir && (
                      <p className="text-xs text-primary font-medium mt-1">
                        {coleta.manifesto.numeroSinir}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Atualizado a cada 10 segundos
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
