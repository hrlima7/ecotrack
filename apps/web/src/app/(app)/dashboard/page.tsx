/**
 * Dashboard — EcoTrack
 * Métricas de sustentabilidade e coletas recentes.
 * Client Component para usar React Query.
 */

"use client";

import { useColetas } from "@/hooks/useColetas";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusColeta } from "@ecotrack/shared";
import Link from "next/link";

const LABELS = {
  TITULO: "Dashboard",
  SUBTITULO: "Visão geral do seu impacto ambiental",
  COLETAS_RECENTES: "Coletas Recentes",
  VER_TODAS: "Ver todas",
  AGENDAR_COLETA: "Agendar Coleta",
  NENHUMA_COLETA: "Nenhuma coleta ainda",
  NENHUMA_COLETA_DESC: "Agende sua primeira coleta para começar",
  CARREGANDO: "Carregando...",
} as const;

export default function DashboardPage() {
  const { query: coletasQuery } = useColetas({ limit: 5 });
  const coletas = coletasQuery.data?.data ?? [];
  const total = coletasQuery.data?.meta.total ?? 0;

  // Métricas calculadas a partir das coletas
  const coletasRealizadas = coletas.filter((c) => c.status === StatusColeta.COLETADO || c.status === StatusColeta.FINALIZADO).length;
  const totalKg = coletas
    .filter((c) => c.pesoRealKg)
    .reduce((acc, c) => acc + (c.pesoRealKg ?? 0), 0);

  const metricas = [
    {
      titulo: "Total Coletado",
      valor: totalKg > 0 ? `${totalKg.toFixed(1)} kg` : "0 kg",
      descricao: "Este mês",
      tendencia: { valor: 0, tipo: "neutro" as const },
    },
    {
      titulo: "CO2 Evitado",
      valor: `${(totalKg * 2.5).toFixed(1)} kg`,
      descricao: `≈ ${Math.round(totalKg * 2.5 / 22)} árvores`,
      tendencia: { valor: 0, tipo: "neutro" as const },
    },
    {
      titulo: "Coletas Realizadas",
      valor: String(coletasRealizadas),
      descricao: `de ${total} agendadas`,
      tendencia: { valor: 0, tipo: "neutro" as const },
    },
    {
      titulo: "MTRs Emitidos",
      valor: String(coletas.filter((c) => c.manifesto?.status !== "RASCUNHO").length),
      descricao: "Em conformidade",
      tendencia: { valor: 0, tipo: "neutro" as const },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{LABELS.TITULO}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{LABELS.SUBTITULO}</p>
        </div>
        <Link href="/agendar" className="btn-primary self-start sm:self-auto">
          {LABELS.AGENDAR_COLETA}
        </Link>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricas.map((metrica) => (
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
          <h2 className="text-base font-semibold text-foreground">{LABELS.COLETAS_RECENTES}</h2>
          <Link href="/agendar" className="text-sm text-secondary hover:underline font-medium">
            {LABELS.VER_TODAS}
          </Link>
        </div>

        {coletasQuery.isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">{LABELS.CARREGANDO}</div>
        ) : coletas.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">♻️</span>
            </div>
            <p className="text-sm font-medium text-foreground">{LABELS.NENHUMA_COLETA}</p>
            <p className="text-xs text-muted-foreground mt-1">{LABELS.NENHUMA_COLETA_DESC}</p>
            <Link href="/agendar" className="btn-primary mt-4 inline-flex">
              {LABELS.AGENDAR_COLETA}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {coletas.map((coleta) => (
              <div key={coleta.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {coleta.residuos.map((r) => r.residuo.descricao).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(coleta.dataAgendada).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {coleta.cidade}, {coleta.estado}
                  </p>
                </div>
                <StatusBadge status={coleta.status as StatusColeta} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
