/**
 * Pagina de Relatorios — EcoTrack
 * Relatorios de impacto ambiental com metricas de sustentabilidade.
 * Exportacao em PDF e CSV.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relatorios de Impacto",
  description: "Gere relatorios de sustentabilidade e conformidade ambiental",
};

const LABELS = {
  TITULO: "Relatorios de Impacto",
  SUBTITULO: "Acompanhe seu desempenho ambiental e gere relatorios de conformidade",
  GERAR_PDF: "Exportar PDF",
  GERAR_CSV: "Exportar CSV",
  PERIODO: "Periodo",
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  ANUAL: "Anual",
  TOTAL_RESIDUOS: "Total de Residuos",
  CO2_EVITADO: "CO2 Evitado",
  AGUA_ECONOMIZADA: "Agua Economizada",
  RESIDUOS_DESVIADOS: "Desviado de Aterros",
  UNIDADE_KG: "kg",
  UNIDADE_LITROS: "L",
  EM_BREVE: "Disponivel em breve",
} as const;

const PERIODOS = [
  { label: LABELS.MENSAL, value: "mensal" },
  { label: LABELS.TRIMESTRAL, value: "trimestral" },
  { label: LABELS.ANUAL, value: "anual" },
] as const;

export default function RelatoriosPage() {
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
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="btn-secondary" disabled>
            {LABELS.GERAR_CSV}
          </button>
          <button type="button" className="btn-primary" disabled>
            {LABELS.GERAR_PDF}
          </button>
        </div>
      </div>

      {/* Filtro de periodo */}
      <div className="flex items-center gap-2" role="group" aria-label={LABELS.PERIODO}>
        <span className="text-sm text-muted-foreground">{LABELS.PERIODO}:</span>
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            type="button"
            className="px-3 py-1.5 rounded-md text-sm border border-border bg-white
                       text-muted-foreground hover:bg-muted transition-colors
                       aria-pressed:bg-primary-50 aria-pressed:text-primary-700 aria-pressed:border-primary-300"
            aria-pressed={p.value === "mensal"}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cards de impacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: LABELS.TOTAL_RESIDUOS, valor: "0", unidade: LABELS.UNIDADE_KG, descricao: "coletados no periodo" },
          { label: LABELS.CO2_EVITADO, valor: "0", unidade: LABELS.UNIDADE_KG, descricao: "emissoes evitadas" },
          { label: LABELS.AGUA_ECONOMIZADA, valor: "0", unidade: LABELS.UNIDADE_LITROS, descricao: "agua preservada" },
          { label: LABELS.RESIDUOS_DESVIADOS, valor: "0%", unidade: "", descricao: "indice de desvio" },
        ].map((item) => (
          <div key={item.label} className="card text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
              {item.label}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {item.valor}
              {item.unidade && (
                <span className="text-base font-normal text-muted-foreground ml-1">
                  {item.unidade}
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{item.descricao}</p>
          </div>
        ))}
      </div>

      {/* Grafico placeholder */}
      <div className="card">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Evolucao por tipo de residuo
        </h2>
        <div className="h-48 flex items-center justify-center bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">{LABELS.EM_BREVE}</p>
        </div>
      </div>

      {/* Tabela de historico */}
      <div className="card">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Historico de coletas
        </h2>
        <div className="h-32 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma coleta no periodo selecionado
          </p>
        </div>
      </div>
    </div>
  );
}
