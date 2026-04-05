/**
 * Pagina de Rastreamento — EcoTrack
 * Mapa com posicao em tempo real do coletor.
 * Usa Mapbox GL JS.
 */

import type { Metadata } from "next";
import { RastreamentoMap } from "@/components/rastreamento/RastreamentoMap";

export const metadata: Metadata = {
  title: "Rastreamento",
  description: "Acompanhe em tempo real a posicao do coletor",
};

const LABELS = {
  TITULO: "Rastreamento em Tempo Real",
  SUBTITULO: "Acompanhe a posicao do coletor na sua rota",
  NENHUMA_COLETA_ATIVA: "Nenhuma coleta ativa no momento",
} as const;

export default function RastreamentoPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{LABELS.TITULO}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {LABELS.SUBTITULO}
        </p>
      </div>

      {/* Mapa — altura responsiva */}
      <div className="rounded-lg overflow-hidden border border-border" style={{ height: "calc(100vh - 220px)", minHeight: "400px" }}>
        <RastreamentoMap />
      </div>
    </div>
  );
}
