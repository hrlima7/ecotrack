/**
 * Pagina de Manifesto MTR — EcoTrack
 * Formulario de Manifesto de Transporte de Residuos (MTR digital).
 * Conformidade CONAMA 275/2001.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manifesto MTR",
  description:
    "Emita e gerencie Manifestos de Transporte de Residuos (MTR) conforme CONAMA 275/2001",
};

const LABELS = {
  TITULO: "Manifestos MTR",
  SUBTITULO: "Manifesto de Transporte de Residuos — conforme CONAMA 275/2001",
  EMITIR_MTR: "Emitir MTR",
  STATUS_RASCUNHO: "Rascunho",
  STATUS_EMITIDO: "Emitido",
  STATUS_ACEITO: "Aceito",
  STATUS_FINALIZADO: "Finalizado",
  NENHUM_MTR: "Nenhum manifesto emitido",
  NUMERO: "Numero",
  DATA_EMISSAO: "Emissao",
  DOWNLOAD_PDF: "Baixar PDF",
} as const;

export default function ManifestoPage() {
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
        <button type="button" className="btn-primary self-start sm:self-auto" disabled>
          {LABELS.EMITIR_MTR}
        </button>
      </div>

      {/* Filtros de status */}
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filtrar por status">
        {[
          LABELS.STATUS_RASCUNHO,
          LABELS.STATUS_EMITIDO,
          LABELS.STATUS_ACEITO,
          LABELS.STATUS_FINALIZADO,
        ].map((status) => (
          <button
            key={status}
            type="button"
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-border
                       bg-white text-muted-foreground hover:bg-muted transition-colors"
          >
            {status}
          </button>
        ))}
      </div>

      {/* Lista de MTRs */}
      <div className="card">
        {/* Estado vazio */}
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-sm font-medium text-foreground">
            {LABELS.NENHUM_MTR}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Os manifestos sao gerados automaticamente ao confirmar uma coleta
          </p>
        </div>
      </div>

      {/* Informacao de conformidade */}
      <div className="rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3">
        <p className="text-xs text-secondary-700 font-medium">
          Conformidade Legal
        </p>
        <p className="text-xs text-secondary-600 mt-0.5">
          Os MTRs sao gerados conforme a Resolucao CONAMA 275/2001 e arquivados
          eletronicamente para fins de auditoria por 5 anos.
          Em conformidade com a Politica Nacional de Residuos Solidos (Lei 12.305/2010).
        </p>
      </div>
    </div>
  );
}
