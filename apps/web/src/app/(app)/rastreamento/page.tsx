/**
 * Página de Rastreamento — EcoTrack
 * Mapa interativo com coletas ativas e painel lateral de status.
 */

"use client";

import { useState } from "react";
import { RastreamentoMap } from "@/components/rastreamento/RastreamentoMap";
import { useColetas } from "@/hooks/useColetas";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusColeta } from "@ecotrack/shared";

const STATUS_ATIVOS: StatusColeta[] = [
  StatusColeta.PENDENTE,
  StatusColeta.CONFIRMADA,
  StatusColeta.EM_ROTA,
  StatusColeta.COLETADO,
];

export default function RastreamentoPage() {
  const [painelAberto, setPainelAberto] = useState(true);
  const { query } = useColetas({ limit: 50 });
  const coletas = query.data?.data ?? [];
  const coletasAtivas = coletas.filter((c) =>
    STATUS_ATIVOS.includes(c.status as StatusColeta)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rastreamento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Coletas ativas em tempo real
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
              {query.isLoading ? (
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
                    {coleta.manifesto?.numeroSinir && (
                      <p className="text-xs text-primary font-medium mt-1">
                        {coleta.manifesto.numeroSinir}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Nota Fase 2 */}
            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Fase 2: posição GPS em tempo real via WebSocket
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
