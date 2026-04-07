/**
 * Página de Relatórios — EcoTrack
 * Métricas de impacto ambiental calculadas a partir das coletas reais.
 * Gráfico de barras nativo (sem lib externa).
 */

"use client";

import { useState, useMemo } from "react";
import { useColetas, type Coleta } from "@/hooks/useColetas";
import { useMtr } from "@/hooks/useMtr";
import { StatusColeta } from "@ecotrack/shared";

// ─── Períodos ─────────────────────────────────────────────────────────────────

type Periodo = "mensal" | "trimestral" | "anual";

const PERIODOS: Array<{ label: string; value: Periodo }> = [
  { label: "Este mês", value: "mensal" },
  { label: "Trimestre", value: "trimestral" },
  { label: "Este ano", value: "anual" },
];

function calcularDataInicio(periodo: Periodo): Date {
  const hoje = new Date();
  if (periodo === "mensal") return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  if (periodo === "trimestral") return new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
  return new Date(hoje.getFullYear(), 0, 1);
}

// ─── Gráfico de barras nativo ─────────────────────────────────────────────────

interface BarData {
  label: string;
  valor: number;
  max: number;
}

function GraficoBarras({ dados, unidade }: { dados: BarData[]; unidade: string }) {
  if (dados.length === 0 || dados.every((d) => d.valor === 0)) {
    return (
      <div className="h-40 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sem dados no período</p>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {dados.map((d) => {
        const pct = d.max > 0 ? (d.valor / d.max) * 100 : 0;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground font-medium">
              {d.valor > 0 ? `${d.valor.toFixed(0)}${unidade}` : ""}
            </span>
            <div className="w-full flex items-end" style={{ height: 96 }}>
              <div
                className="w-full rounded-t-md bg-primary transition-all duration-500"
                style={{ height: `${Math.max(pct, d.valor > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Card de métrica ──────────────────────────────────────────────────────────

function MetricaCard({
  label,
  valor,
  unidade,
  descricao,
  cor = "text-foreground",
}: {
  label: string;
  valor: string | number;
  unidade?: string;
  descricao: string;
  cor?: string;
}) {
  return (
    <div className="card text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
        {label}
      </p>
      <p className={`text-3xl font-bold ${cor}`}>
        {valor}
        {unidade && (
          <span className="text-base font-normal text-muted-foreground ml-1">
            {unidade}
          </span>
        )}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{descricao}</p>
    </div>
  );
}

// ─── Tabela de histórico ──────────────────────────────────────────────────────

function TabelaHistorico({ coletas }: { coletas: Coleta[] }) {
  if (coletas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhuma coleta no período selecionado
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 text-xs font-medium text-muted-foreground">Data</th>
            <th className="text-left py-2 text-xs font-medium text-muted-foreground">Resíduos</th>
            <th className="text-left py-2 text-xs font-medium text-muted-foreground">Local</th>
            <th className="text-right py-2 text-xs font-medium text-muted-foreground">Peso</th>
            <th className="text-right py-2 text-xs font-medium text-muted-foreground">MTR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {coletas.map((c) => (
            <tr key={c.id} className="hover:bg-muted/30 transition-colors">
              <td className="py-2.5 text-xs text-foreground whitespace-nowrap">
                {new Date(c.dataAgendada).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </td>
              <td className="py-2.5 text-xs text-foreground max-w-[180px] truncate">
                {c.residuos.map((r) => r.residuo.descricao).join(", ")}
              </td>
              <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                {c.cidade}/{c.estado}
              </td>
              <td className="py-2.5 text-xs text-foreground text-right whitespace-nowrap">
                {c.pesoRealKg ? `${c.pesoRealKg.toFixed(1)} kg` : "—"}
              </td>
              <td className="py-2.5 text-xs text-right whitespace-nowrap">
                {c.manifesto?.numeroSinir ? (
                  <span className="text-primary font-medium">{c.manifesto.numeroSinir}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<Periodo>("mensal");

  const { query: coletasQuery } = useColetas({ limit: 100 });
  const { query: mtrQuery } = useMtr();
  const todasColetas = coletasQuery.data?.data ?? [];

  // Filtrar por período
  const dataInicio = calcularDataInicio(periodo);
  const coletasPeriodo = useMemo(
    () =>
      todasColetas.filter(
        (c) => new Date(c.dataAgendada) >= dataInicio
      ),
    [todasColetas, dataInicio]
  );

  const coletasFinalizadas = coletasPeriodo.filter(
    (c) => c.status === StatusColeta.COLETADO || c.status === StatusColeta.FINALIZADO
  );

  // Métricas
  const totalKg = coletasFinalizadas.reduce((acc, c) => acc + (c.pesoRealKg ?? 0), 0);
  const co2Evitado = totalKg * 2.5;
  const aguaEconomizada = totalKg * 10; // estimativa: 10L por kg reciclado
  const taxaDesvio =
    coletasPeriodo.length > 0
      ? Math.round((coletasFinalizadas.length / coletasPeriodo.length) * 100)
      : 0;
  const mtrsEmitidos = (mtrQuery.data?.data ?? []).filter((m) => m.status !== "RASCUNHO").length;

  // Dados do gráfico — coletas por tipo de resíduo
  const graficoData = useMemo(() => {
    const contagem: Record<string, number> = {};
    coletasFinalizadas.forEach((c) => {
      c.residuos.forEach((r) => {
        const tipo = r.residuo.descricao;
        contagem[tipo] = (contagem[tipo] ?? 0) + (r.quantidadeEstimada ?? 0);
      });
    });
    const entradas = Object.entries(contagem)
      .map(([label, valor]) => ({ label, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
    const max = Math.max(...entradas.map((e) => e.valor), 1);
    return entradas.map((e) => ({ ...e, max }));
  }, [coletasFinalizadas]);

  function exportarCSV() {
    const linhas = [
      ["Data", "Resíduos", "Cidade", "Peso (kg)", "Status", "MTR"],
      ...coletasPeriodo.map((c) => [
        new Date(c.dataAgendada).toLocaleDateString("pt-BR"),
        c.residuos.map((r) => r.residuo.descricao).join("; "),
        `${c.cidade}/${c.estado}`,
        c.pesoRealKg ?? "",
        c.status,
        c.manifesto?.numeroSinir ?? "",
      ]),
    ];
    const csv = linhas.map((l) => l.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecotrack-relatorio-${periodo}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios de Impacto</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Desempenho ambiental e conformidade
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={exportarCSV}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium opacity-50 cursor-not-allowed"
            title="Disponível na Fase 2"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Filtro de período */}
      <div
        className="flex items-center gap-2 flex-wrap"
        role="group"
        aria-label="Período do relatório"
      >
        <span className="text-sm text-muted-foreground">Período:</span>
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriodo(p.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
            style={
              periodo === p.value
                ? { backgroundColor: "#16A34A", color: "#fff", borderColor: "#16A34A" }
                : { backgroundColor: "#fff", color: "#6B7280", borderColor: "#D1D5DB" }
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricaCard
          label="Resíduos coletados"
          valor={totalKg > 0 ? totalKg.toFixed(1) : "0"}
          unidade="kg"
          descricao={`${coletasFinalizadas.length} coletas realizadas`}
          cor="text-primary"
        />
        <MetricaCard
          label="CO₂ evitado"
          valor={co2Evitado > 0 ? co2Evitado.toFixed(1) : "0"}
          unidade="kg"
          descricao={`≈ ${Math.round(co2Evitado / 22)} árvores poupadas`}
        />
        <MetricaCard
          label="Água economizada"
          valor={aguaEconomizada > 0 ? aguaEconomizada.toFixed(0) : "0"}
          unidade="L"
          descricao="estimativa de reciclagem"
        />
        <MetricaCard
          label="Desvio de aterros"
          valor={`${taxaDesvio}%`}
          descricao={`${mtrsEmitidos} MTRs emitidos`}
          cor={taxaDesvio >= 80 ? "text-primary" : taxaDesvio >= 50 ? "text-orange-600" : "text-foreground"}
        />
      </div>

      {/* Gráfico por tipo de resíduo */}
      <div className="card">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Volume por tipo de resíduo
        </h2>
        {coletasQuery.isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <GraficoBarras dados={graficoData} unidade="un" />
        )}
      </div>

      {/* Histórico de coletas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Histórico do período
          </h2>
          <span className="text-xs text-muted-foreground">
            {coletasPeriodo.length} coleta{coletasPeriodo.length !== 1 ? "s" : ""}
          </span>
        </div>
        {coletasQuery.isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <TabelaHistorico coletas={coletasPeriodo} />
        )}
      </div>

      {/* Nota de conformidade */}
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <p className="text-xs font-medium text-green-800">Conformidade Ambiental</p>
        <p className="text-xs text-green-700 mt-0.5">
          Relatórios gerados conforme PNRS (Lei 12.305/2010) e resolução CONAMA 275/2001.
          Dados arquivados por 5 anos para fins de auditoria ambiental.
        </p>
      </div>
    </div>
  );
}
