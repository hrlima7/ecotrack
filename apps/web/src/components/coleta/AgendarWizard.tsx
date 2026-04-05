/**
 * AgendarWizard — Wizard de 3 etapas para agendamento de coleta
 * Etapa 1: Selecao de residuos do inventario
 * Etapa 2: Volume, data e horario
 * Etapa 3: Revisao e confirmacao
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES, STATUS_COLETA_LABELS } from "@ecotrack/shared";
import { ResidueCard } from "@/components/ui/ResidueCard";
import { TipoResiduo } from "@ecotrack/shared";

const ETAPAS = ["Residuos", "Data e Volume", "Confirmacao"] as const;

const LABELS = {
  PROXIMO: "Proximo",
  VOLTAR: "Voltar",
  CONFIRMAR: "Confirmar Agendamento",
  CONFIRMANDO: "Agendando...",
  SELECIONE_RESIDUO: "Selecione o tipo de residuo",
  DATA_COLETA: "Data e horario de coleta",
  QUANTIDADE_ESTIMADA: "Quantidade estimada",
  OBSERVACOES: "Observacoes (opcional)",
  RESUMO: "Resumo do agendamento",
} as const;

// Tipos de residuo disponiveis (em producao: viriam do inventario da empresa)
const TIPOS_RESIDUO: Array<{ tipo: TipoResiduo; label: string; descricao: string }> = [
  { tipo: "ORGANICO", label: "Residuo Organico", descricao: "Restos de alimentos, cascas, etc." },
  { tipo: "RECICLAVEL", label: "Reciclavel", descricao: "Papel, plastico, vidro, metal" },
  { tipo: "ELETRONICO", label: "Eletronico", descricao: "Equipamentos, pilhas, baterias" },
  { tipo: "HOSPITALAR", label: "Hospitalar", descricao: "Material infectante, perfurocortante" },
  { tipo: "PERIGOSO", label: "Perigoso", descricao: "Quimicos, solventes, tintas" },
];

interface AgendamentoState {
  residuoTipo: TipoResiduo | null;
  dataAgendada: string;
  quantidade: number;
  unidade: "KG" | "LITRO" | "UNIDADE";
  observacoes: string;
}

export function AgendarWizard() {
  const router = useRouter();
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dados, setDados] = useState<AgendamentoState>({
    residuoTipo: null,
    dataAgendada: "",
    quantidade: 0,
    unidade: "KG",
    observacoes: "",
  });

  function selecionarResiduo(tipo: TipoResiduo) {
    setDados((prev) => ({ ...prev, residuoTipo: tipo }));
  }

  function avancarEtapa() {
    setEtapaAtual((e) => Math.min(e + 1, 2));
  }

  function voltarEtapa() {
    setEtapaAtual((e) => Math.max(e - 1, 0));
  }

  async function confirmarAgendamento() {
    setIsSubmitting(true);
    try {
      // TODO: chamar API POST /api/v1/coletas
      router.push(ROUTES.DASHBOARD);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Indicador de progresso */}
      <div className="flex items-center gap-1" aria-label="Progresso">
        {ETAPAS.map((etapa, idx) => (
          <div key={etapa} className="flex items-center gap-1 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0
                ${idx <= etapaAtual ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
            >
              {idx + 1}
            </div>
            <span className={`text-xs hidden sm:block ${idx === etapaAtual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {etapa}
            </span>
            {idx < ETAPAS.length - 1 && (
              <div className={`flex-1 h-px ${idx < etapaAtual ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Etapa 1: Selecao de residuo */}
      {etapaAtual === 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">
            {LABELS.SELECIONE_RESIDUO}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TIPOS_RESIDUO.map((item) => (
              <button
                key={item.tipo}
                type="button"
                onClick={() => selecionarResiduo(item.tipo)}
                className={`text-left p-4 rounded-lg border-2 transition-colors
                  ${dados.residuoTipo === item.tipo
                    ? "border-primary bg-primary-50"
                    : "border-border hover:border-primary-300 hover:bg-muted"}`}
                aria-pressed={dados.residuoTipo === item.tipo}
              >
                <ResidueCard tipo={item.tipo} label={item.label} descricao={item.descricao} />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!dados.residuoTipo}
            onClick={avancarEtapa}
          >
            {LABELS.PROXIMO}
          </button>
        </div>
      )}

      {/* Etapa 2: Data e Volume */}
      {etapaAtual === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="dataAgendada" className="block text-sm font-medium text-foreground">
              {LABELS.DATA_COLETA}
            </label>
            <input
              id="dataAgendada"
              type="datetime-local"
              className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={dados.dataAgendada}
              onChange={(e) => setDados((p) => ({ ...p, dataAgendada: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="quantidade" className="block text-sm font-medium text-foreground">
                {LABELS.QUANTIDADE_ESTIMADA}
              </label>
              <input
                id="quantidade"
                type="number"
                min={0}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={dados.quantidade || ""}
                onChange={(e) => setDados((p) => ({ ...p, quantidade: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="unidade" className="block text-sm font-medium text-foreground">
                Unidade
              </label>
              <select
                id="unidade"
                className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={dados.unidade}
                onChange={(e) =>
                  setDados((p) => ({ ...p, unidade: e.target.value as "KG" | "LITRO" | "UNIDADE" }))
                }
              >
                <option value="KG">Quilogramas (kg)</option>
                <option value="LITRO">Litros (L)</option>
                <option value="UNIDADE">Unidades</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="observacoes" className="block text-sm font-medium text-foreground">
              {LABELS.OBSERVACOES}
            </label>
            <textarea
              id="observacoes"
              rows={3}
              placeholder="Informacoes adicionais sobre o residuo ou acesso ao local..."
              className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                         resize-none"
              value={dados.observacoes}
              onChange={(e) => setDados((p) => ({ ...p, observacoes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={voltarEtapa}>
              {LABELS.VOLTAR}
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!dados.dataAgendada || !dados.quantidade}
              onClick={avancarEtapa}
            >
              {LABELS.PROXIMO}
            </button>
          </div>
        </div>
      )}

      {/* Etapa 3: Revisao */}
      {etapaAtual === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">{LABELS.RESUMO}</p>
          <div className="rounded-lg border border-border p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo de residuo</span>
              <span className="font-medium text-foreground">{dados.residuoTipo}</span>
            </div>
            <div className="divider my-0" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data agendada</span>
              <span className="font-medium text-foreground">
                {dados.dataAgendada
                  ? new Date(dados.dataAgendada).toLocaleString("pt-BR")
                  : "-"}
              </span>
            </div>
            <div className="divider my-0" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantidade estimada</span>
              <span className="font-medium text-foreground">
                {dados.quantidade} {dados.unidade.toLowerCase()}
              </span>
            </div>
            {dados.observacoes && (
              <>
                <div className="divider my-0" />
                <div>
                  <span className="text-muted-foreground block mb-1">Observacoes</span>
                  <span className="text-foreground">{dados.observacoes}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={voltarEtapa}>
              {LABELS.VOLTAR}
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={isSubmitting}
              onClick={confirmarAgendamento}
            >
              {isSubmitting ? LABELS.CONFIRMANDO : LABELS.CONFIRMAR}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
