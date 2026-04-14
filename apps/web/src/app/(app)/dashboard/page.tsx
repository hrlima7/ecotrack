/**
 * Dashboard — EcoTrack
 * Métricas de sustentabilidade reais via endpoint /metricas/dashboard.
 * Client Component para usar React Query.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth.context";
import { useColetas } from "@/hooks/useColetas";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusColeta, API_ROUTES } from "@ecotrack/shared";
import Link from "next/link";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const LABELS = {
  TITULO: "Dashboard",
  SUBTITULO: "Visao geral do seu impacto ambiental",
  COLETAS_RECENTES: "Coletas Recentes",
  VER_TODAS: "Ver todas",
  AGENDAR_COLETA: "Agendar Coleta",
  NENHUMA_COLETA: "Nenhuma coleta ainda",
  NENHUMA_COLETA_DESC: "Agende sua primeira coleta para comecar",
  CARREGANDO: "Carregando...",
  IMPACTO: "Impacto Ambiental",
  DISTRIBUICAO: "Distribuicao por Tipo",
} as const;

const PERIODOS = [
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "90 dias", value: "90d" },
  { label: "12 meses", value: "12m" },
] as const;

const TIPO_RESIDUO_LABELS: Record<string, string> = {
  ORGANICO: "Organico",
  RECICLAVEL: "Reciclavel",
  ELETRONICO: "Eletronico",
  HOSPITALAR: "Hospitalar",
  PERIGOSO: "Perigoso",
};

const TIPO_COLORS: Record<string, string> = {
  ORGANICO: "bg-amber-500",
  RECICLAVEL: "bg-green-500",
  ELETRONICO: "bg-blue-500",
  HOSPITALAR: "bg-red-500",
  PERIGOSO: "bg-purple-500",
};

interface DashboardData {
  periodo: { inicio: string; fim: string };
  resumo: {
    totalColetas: number;
    coletasRealizadas: number;
    totalPesoKg: number;
    co2EvitadoKg: number;
    aguaEconomizadaLitros: number;
    arvoresEquivalentes: number;
    mtrsEmitidos: number;
  };
  tendencias: {
    peso: { valor: number; tipo: "positivo" | "negativo" };
    coletas: { valor: number; tipo: "positivo" | "negativo" };
  };
  porTipo: Record<string, { quantidade: number; pesoKg: number }>;
  porStatus: Record<string, number>;
  coletasPorDia: Array<{ dia: string; total: number }>;
}

export default function DashboardPage() {
  const { accessToken } = useAuth();
  const [periodo, setPeriodo] = useState("30d");
  const { query: coletasQuery } = useColetas({ limit: 5 });
  const coletas = coletasQuery.data?.data ?? [];

  const metricsQuery = useQuery<DashboardData>({
    queryKey: ["metricas-dashboard", periodo],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}${API_ROUTES.METRICAS.DASHBOARD}?periodo=${periodo}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) throw new Error("Erro ao carregar metricas");
      const json = await res.json();
      return json.data;
    },
    enabled: !!accessToken,
  });

  const m = metricsQuery.data;

  function mapTendencia(t?: { valor: number; tipo: "positivo" | "negativo" }) {
    if (!t) return { valor: 0, tipo: "neutro" as const };
    return {
      valor: t.valor,
      tipo: t.tipo === "positivo" ? ("alta" as const) : ("baixa" as const),
    };
  }

  const metricas = [
    {
      titulo: "Total Coletado",
      valor: m ? `${m.resumo.totalPesoKg.toLocaleString("pt-BR")} kg` : "-- kg",
      descricao: PERIODOS.find((p) => p.value === periodo)?.label ?? "",
      tendencia: mapTendencia(m?.tendencias.peso),
    },
    {
      titulo: "CO2 Evitado",
      valor: m ? `${m.resumo.co2EvitadoKg.toLocaleString("pt-BR")} kg` : "-- kg",
      descricao: m ? `${m.resumo.arvoresEquivalentes} arvores` : "",
      tendencia: mapTendencia(m?.tendencias.peso),
    },
    {
      titulo: "Coletas Realizadas",
      valor: m ? String(m.resumo.coletasRealizadas) : "--",
      descricao: m ? `de ${m.resumo.totalColetas} agendadas` : "",
      tendencia: mapTendencia(m?.tendencias.coletas),
    },
    {
      titulo: "MTRs Emitidos",
      valor: m ? String(m.resumo.mtrsEmitidos) : "--",
      descricao: "Em conformidade",
      tendencia: { valor: 0, tipo: "neutro" as const },
    },
  ];

  const porTipoEntries = m ? Object.entries(m.porTipo) : [];
  const totalTipo = porTipoEntries.reduce((acc, [, v]) => acc + v.pesoKg, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{LABELS.TITULO}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{LABELS.SUBTITULO}</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Link href="/agendar" className="btn-primary">
            {LABELS.AGENDAR_COLETA}
          </Link>
        </div>
      </div>

      {/* Filtro de período */}
      <div className="flex gap-1.5 flex-wrap">
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriodo(p.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              periodo === p.value
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {p.label}
          </button>
        ))}
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

      {/* Impacto ambiental + distribuição por tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Impacto */}
        <div className="card">
          <h2 className="text-base font-semibold text-foreground mb-4">{LABELS.IMPACTO}</h2>
          {m ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Agua economizada</span>
                <span className="text-sm font-semibold text-foreground">
                  {m.resumo.aguaEconomizadaLitros.toLocaleString("pt-BR")} litros
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CO2 evitado</span>
                <span className="text-sm font-semibold text-foreground">
                  {m.resumo.co2EvitadoKg.toLocaleString("pt-BR")} kg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Arvores equivalentes</span>
                <span className="text-sm font-semibold text-primary">
                  {m.resumo.arvoresEquivalentes}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Residuos desviados</span>
                <span className="text-sm font-semibold text-foreground">
                  {m.resumo.totalPesoKg.toLocaleString("pt-BR")} kg
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {metricsQuery.isLoading ? LABELS.CARREGANDO : "Sem dados no periodo"}
            </div>
          )}
        </div>

        {/* Distribuição por tipo */}
        <div className="card">
          <h2 className="text-base font-semibold text-foreground mb-4">{LABELS.DISTRIBUICAO}</h2>
          {porTipoEntries.length > 0 ? (
            <div className="space-y-3">
              {porTipoEntries.map(([tipo, dados]) => {
                const pct = totalTipo > 0 ? Math.round((dados.pesoKg / totalTipo) * 100) : 0;
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">
                        {TIPO_RESIDUO_LABELS[tipo] ?? tipo}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dados.pesoKg} kg ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${TIPO_COLORS[tipo] ?? "bg-gray-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {metricsQuery.isLoading ? LABELS.CARREGANDO : "Sem dados no periodo"}
            </div>
          )}
        </div>
      </div>

      {/* Coletas recentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">{LABELS.COLETAS_RECENTES}</h2>
          <Link href="/coletas" className="text-sm text-secondary hover:underline font-medium">
            {LABELS.VER_TODAS}
          </Link>
        </div>

        {coletasQuery.isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">{LABELS.CARREGANDO}</div>
        ) : coletas.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">&#9851;</span>
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
