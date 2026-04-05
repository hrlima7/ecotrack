/**
 * Pagina de Agendamento — EcoTrack
 * Wizard de 3 etapas:
 *   1. Tipo de residuo (do inventario da empresa)
 *   2. Volume, data e endereco de coleta
 *   3. Revisao e confirmacao
 */

import type { Metadata } from "next";
import { AgendarWizard } from "@/components/coleta/AgendarWizard";

export const metadata: Metadata = {
  title: "Agendar Coleta",
  description: "Agende uma nova coleta de residuos em 3 passos simples",
};

const LABELS = {
  TITULO: "Agendar Coleta",
  SUBTITULO: "Preencha as informacoes para solicitar uma coleta",
} as const;

export default function AgendarPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{LABELS.TITULO}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {LABELS.SUBTITULO}
        </p>
      </div>

      <div className="card">
        <AgendarWizard />
      </div>
    </div>
  );
}
