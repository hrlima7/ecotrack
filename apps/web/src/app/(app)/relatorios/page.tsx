/**
 * Pagina de Relatorios — EcoTrack
 * Metricas de impacto ambiental via endpoint /metricas/relatorio.
 * Grafico de barras nativo (sem lib externa).
 * Export CSV e PDF funcional.
 */

"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth.context";
import { API_ROUTES } from "@ecotrack/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Periodo = "mensal" | "trimestral" | "anual";

const PERIODOS: Array<{ label: string; value: Periodo }> = [
  { label: "Este mes", value: "mensal" },
  { label: "Trimestre", value: "trimestral" },
  { label: "Este ano", value: "anual" },
];

function calcularDatas(periodo: Periodo) {
  const hoje = new Date();
  let inicio: Date;
  if (periodo === "mensal") inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  else if (periodo === "trimestral") inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
  else inicio = new Date(hoje.getFullYear(), 0, 1);
  return {
    dataInicio: inicio.toISOString().slice(0, 10),
    dataFim: hoje.toISOString().slice(0, 10),
  };
}

// ─── Grafico de barras nativo ─────────────────────────────────────────────────

interface BarData {
  label: string;
  valor: number;
  max: number;
}

function GraficoBarras({ dados, unidade }: { dados: BarData[]; unidade: string }) {
  if (dados.length === 0 || dados.every((d) => d.valor === 0)) {
    return (
      <div className="h-40 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sem dados no periodo</p>
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

// ─── Card de metrica ──────────────────────────────────────────────────────────

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

// ─── Tipos da API ─────────────────────────────────────────────────────────────

interface RelatorioLinha {
  id: string;
  dataAgendada: string;
  dataRealizada: string | null;
  status: string;
  endereco: string;
  pesoRealKg: number | null;
  residuos: Array<{
    tipo: string;
    descricao: string;
    quantidadeEstimada: number;
    quantidadeReal: number | null;
    unidade: string;
  }>;
  mtr: { numero: string | null; status: string } | null;
}

interface RelatorioData {
  periodo: { inicio: string; fim: string };
  totalColetas: number;
  totalPesoKg: number;
  co2EvitadoKg: number;
  linhas: RelatorioLinha[];
}

// ─── Pagina principal ─────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const { accessToken } = useAuth();
  const [periodo, setPeriodo] = useState<Periodo>("mensal");

  const datas = calcularDatas(periodo);

  const relatorioQuery = useQuery<RelatorioData>({
    queryKey: ["relatorio", periodo],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}${API_ROUTES.METRICAS.RELATORIO}?dataInicio=${datas.dataInicio}&dataFim=${datas.dataFim}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error("Erro ao carregar relatorio");
      const json = await res.json();
      return json.data;
    },
    enabled: !!accessToken,
  });

  const dados = relatorioQuery.data;
  const linhas = dados?.linhas ?? [];

  // Metricas
  const totalKg = dados?.totalPesoKg ?? 0;
  const co2Evitado = dados?.co2EvitadoKg ?? 0;
  const aguaEconomizada = totalKg * 6;
  const finalizadas = linhas.filter(
    (c) => c.status === "COLETADO" || c.status === "FINALIZADO"
  );
  const taxaDesvio =
    linhas.length > 0 ? Math.round((finalizadas.length / linhas.length) * 100) : 0;
  const mtrsEmitidos = linhas.filter((c) => c.mtr?.numero).length;

  // Grafico por tipo
  const graficoData = useMemo(() => {
    const contagem: Record<string, number> = {};
    finalizadas.forEach((c) => {
      c.residuos.forEach((r) => {
        contagem[r.descricao] = (contagem[r.descricao] ?? 0) + (r.quantidadeReal ?? r.quantidadeEstimada);
      });
    });
    const entradas = Object.entries(contagem)
      .map(([label, valor]) => ({ label, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
    const max = Math.max(...entradas.map((e) => e.valor), 1);
    return entradas.map((e) => ({ ...e, max }));
  }, [finalizadas]);

  // ─── Export CSV ─────────────────────────────────────────────────────────────

  function exportarCSV() {
    if (!linhas.length) return;

    const header = ["Data", "Residuos", "Endereco", "Peso (kg)", "Status", "MTR"];
    const rows = linhas.map((c) => [
      new Date(c.dataAgendada).toLocaleDateString("pt-BR"),
      c.residuos.map((r) => r.descricao).join("; "),
      `"${c.endereco}"`,
      c.pesoRealKg ?? "",
      c.status,
      c.mtr?.numero ?? "",
    ]);

    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecotrack-relatorio-${periodo}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Export PDF via window.print ────────────────────────────────────────────

  function exportarPDF() {
    if (!linhas.length) return;

    const periodoLabel = PERIODOS.find((p) => p.value === periodo)?.label ?? periodo;

    const tableRows = linhas
      .map(
        (c) => `
        <tr>
          <td>${new Date(c.dataAgendada).toLocaleDateString("pt-BR")}</td>
          <td>${c.residuos.map((r) => r.descricao).join(", ")}</td>
          <td>${c.endereco}</td>
          <td style="text-align:right">${c.pesoRealKg ? `${c.pesoRealKg} kg` : "-"}</td>
          <td>${c.status}</td>
          <td>${c.mtr?.numero ?? "-"}</td>
        </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>EcoTrack - Relatorio ${periodoLabel}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 20px; }
    h1 { color: #16A34A; font-size: 18px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 11px; margin-bottom: 20px; }
    .metrics { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .metric { border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; text-align: center; flex: 1; min-width: 120px; }
    .metric-value { font-size: 20px; font-weight: bold; color: #16A34A; }
    .metric-label { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: left; font-size: 11px; }
    th { background: #f5f5f5; font-weight: 600; }
    .footer { margin-top: 24px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>EcoTrack - Relatorio de Impacto Ambiental</h1>
  <p class="subtitle">Periodo: ${periodoLabel} | Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>

  <div class="metrics">
    <div class="metric">
      <div class="metric-label">Residuos coletados</div>
      <div class="metric-value">${totalKg.toFixed(1)} kg</div>
    </div>
    <div class="metric">
      <div class="metric-label">CO2 evitado</div>
      <div class="metric-value">${co2Evitado.toFixed(1)} kg</div>
    </div>
    <div class="metric">
      <div class="metric-label">Agua economizada</div>
      <div class="metric-value">${aguaEconomizada.toFixed(0)} L</div>
    </div>
    <div class="metric">
      <div class="metric-label">Taxa de desvio</div>
      <div class="metric-value">${taxaDesvio}%</div>
    </div>
  </div>

  <h2 style="font-size:14px;margin-bottom:8px;">Historico de Coletas</h2>
  <table>
    <thead>
      <tr><th>Data</th><th>Residuos</th><th>Endereco</th><th style="text-align:right">Peso</th><th>Status</th><th>MTR</th></tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer">
    Conformidade: PNRS (Lei 12.305/2010) e CONAMA 275/2001 | Plataforma EcoTrack SaaS
  </div>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatorios de Impacto</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Desempenho ambiental e conformidade
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={exportarCSV}
            disabled={!linhas.length}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={exportarPDF}
            disabled={!linhas.length}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Filtro de periodo */}
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Periodo do relatorio">
        <span className="text-sm text-muted-foreground">Periodo:</span>
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriodo(p.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              periodo === p.value
                ? "bg-primary text-white"
                : "bg-white text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cards de metricas */}
      {relatorioQuery.isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricaCard
              label="Residuos coletados"
              valor={totalKg > 0 ? totalKg.toFixed(1) : "0"}
              unidade="kg"
              descricao={`${finalizadas.length} coletas realizadas`}
              cor="text-primary"
            />
            <MetricaCard
              label="CO2 evitado"
              valor={co2Evitado > 0 ? co2Evitado.toFixed(1) : "0"}
              unidade="kg"
              descricao={`${Math.round(co2Evitado / 22)} arvores poupadas`}
            />
            <MetricaCard
              label="Agua economizada"
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

          {/* Grafico por tipo */}
          <div className="card">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Volume por tipo de residuo
            </h2>
            <GraficoBarras dados={graficoData} unidade="un" />
          </div>

          {/* Historico */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Historico do periodo</h2>
              <span className="text-xs text-muted-foreground">
                {linhas.length} coleta{linhas.length !== 1 ? "s" : ""}
              </span>
            </div>
            {linhas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma coleta no periodo selecionado
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-xs font-medium text-muted-foreground">Data</th>
                      <th className="text-left py-2 text-xs font-medium text-muted-foreground">Residuos</th>
                      <th className="text-left py-2 text-xs font-medium text-muted-foreground">Local</th>
                      <th className="text-right py-2 text-xs font-medium text-muted-foreground">Peso</th>
                      <th className="text-right py-2 text-xs font-medium text-muted-foreground">MTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {linhas.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 text-xs text-foreground whitespace-nowrap">
                          {new Date(c.dataAgendada).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </td>
                        <td className="py-2.5 text-xs text-foreground max-w-[180px] truncate">
                          {c.residuos.map((r) => r.descricao).join(", ")}
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap max-w-[200px] truncate">
                          {c.endereco}
                        </td>
                        <td className="py-2.5 text-xs text-foreground text-right whitespace-nowrap">
                          {c.pesoRealKg ? `${c.pesoRealKg.toFixed(1)} kg` : "-"}
                        </td>
                        <td className="py-2.5 text-xs text-right whitespace-nowrap">
                          {c.mtr?.numero ? (
                            <span className="text-primary font-medium">{c.mtr.numero}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Nota de conformidade */}
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <p className="text-xs font-medium text-green-800">Conformidade Ambiental</p>
        <p className="text-xs text-green-700 mt-0.5">
          Relatorios gerados conforme PNRS (Lei 12.305/2010) e resolucao CONAMA 275/2001.
          Dados arquivados por 5 anos para fins de auditoria ambiental.
        </p>
      </div>
    </div>
  );
}
