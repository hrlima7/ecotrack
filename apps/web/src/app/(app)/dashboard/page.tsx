/**
 * Dashboard — EcoTrack
 * Metricas de sustentabilidade e coletas recentes.
 * Mobile-first. Dados via React Query.
 */

import type { Metadata } from "next";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Visao geral das coletas e metricas de impacto ambiental",
};

const LABELS = {
  TITULO: "Dashboard",
  SUBTITULO: "Visao geral do seu impacto ambiental",
  COLETAS_RECENTES: "Coletas Recentes",
  VER_TODAS: "Ver todas",
  AGENDAR_COLETA: "Agendar Coleta",
  NENHUMA_COLETA: "Nenhuma coleta encontrada",
} as const;

// Dados placeholder enquanto API nao esta implementada
const METRICAS_PLACEHOLDER = [
  {
    titulo: "Total Coletado",
    valor: "0 kg",
    descricao: "Este mes",
    tendencia: { valor: 0, tipo: "neutro" as const },
    icone: "Recycle",
    cor: "verde",
  },
  {
    titulo: "CO2 Evitado",
    valor: "0 kg",
    descricao: "Equivalente a 0 arvores",
    tendencia: { valor: 0, tipo: "neutro" as const },
    icone: "Leaf",
    cor: "verde",
  },
  {
    titulo: "Coletas Realizadas",
    valor: "0",
    descricao: "Este mes",
    tendencia: { valor: 0, tipo: "neutro" as const },
    icone: "Truck",
    cor: "azul",
  },
  {
    titulo: "MTRs Emitidos",
    valor: "0",
    descricao: "Em conformidade",
    tendencia: { valor: 0, tipo: "neutro" as const },
    icone: "FileCheck",
    cor: "azul",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{LABELS.TITULO}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {LABELS.SUBTITULO}
          </p>
        </div>
        <a href="/agendar" className="btn-primary self-start sm:self-auto">
          {LABELS.AGENDAR_COLETA}
        </a>
      </div>

      {/* Grid de metricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICAS_PLACEHOLDER.map((metrica) => (
          <MetricCard
            key={metrica.titulo}
            titulo={metrica.titulo}
            valor={metrica.valor}
            descricao={metrica.descricao}
            tendencia={metrica.tendencia}
          />
        ))}
      </div>

      {/* Coletas recentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">
            {LABELS.COLETAS_RECENTES}
          </h2>
          <a
            href="/agendar"
            className="text-sm text-secondary hover:underline font-medium"
          >
            {LABELS.VER_TODAS}
          </a>
        </div>

        {/* Estado vazio inicial */}
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">♻️</span>
          </div>
          <p className="text-sm font-medium text-foreground">
            Nenhuma coleta ainda
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Agende sua primeira coleta para comecar
          </p>
          <a href="/agendar" className="btn-primary mt-4 inline-flex">
            {LABELS.AGENDAR_COLETA}
          </a>
        </div>
      </div>
    </div>
  );
}
