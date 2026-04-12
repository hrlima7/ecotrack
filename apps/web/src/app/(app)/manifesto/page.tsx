/**
 * Página de Manifesto MTR — EcoTrack
 * Lista, emite e assina Manifestos de Transporte de Resíduos (MTR digital).
 * Conformidade CONAMA 275/2001.
 */

"use client";

import { useState } from "react";
import { useMtr } from "@/hooks/useMtr";
import { useColetas } from "@/hooks/useColetas";
import { Spinner } from "@/components/ui/Spinner";
import type { StatusMtr, ManifestoMTR } from "@/hooks/useMtr";

// ─── Cores por status MTR ────────────────────────────────────────────────────

const STATUS_MTR_CONFIG: Record<
  StatusMtr,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  RASCUNHO: {
    label: "Rascunho",
    bg: "#F3F4F6",
    text: "#6B7280",
    border: "#D1D5DB",
    dot: "#9CA3AF",
  },
  EMITIDO: {
    label: "Emitido",
    bg: "#EFF6FF",
    text: "#1D4ED8",
    border: "#BFDBFE",
    dot: "#3B82F6",
  },
  ACEITO: {
    label: "Aceito",
    bg: "#FFF7ED",
    text: "#C2410C",
    border: "#FED7AA",
    dot: "#F97316",
  },
  FINALIZADO: {
    label: "Finalizado",
    bg: "#F0FDF4",
    text: "#15803D",
    border: "#BBF7D0",
    dot: "#22C55E",
  },
};

function MtrStatusBadge({ status }: { status: StatusMtr }) {
  const cfg = STATUS_MTR_CONFIG[status];
  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ─── Filtros ─────────────────────────────────────────────────────────────────

const FILTROS: Array<{ label: string; value: StatusMtr | "TODOS" }> = [
  { label: "Todos", value: "TODOS" },
  { label: "Rascunho", value: "RASCUNHO" },
  { label: "Emitido", value: "EMITIDO" },
  { label: "Aceito", value: "ACEITO" },
  { label: "Finalizado", value: "FINALIZADO" },
];

// ─── Modal de emissão ─────────────────────────────────────────────────────────

function EmitirMtrModal({
  onClose,
  onEmitir,
  isPending,
  erro,
}: {
  onClose: () => void;
  onEmitir: (coletaId: string) => void;
  isPending: boolean;
  erro: string | null;
}) {
  const { query } = useColetas({ limit: 50 });
  const coletasElegiveis = (query.data?.data ?? []).filter(
    (c) =>
      ["PENDENTE", "CONFIRMADA", "EM_ROTA"].includes(c.status) &&
      (!c.manifesto || c.manifesto.status === "RASCUNHO")
  );
  const [coletaId, setColetaId] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Emitir MTR</h2>

        {query.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : coletasElegiveis.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma coleta elegível para emissão de MTR.
            <br />
            <span className="text-xs">Apenas coletas PENDENTE, CONFIRMADA ou EM_ROTA podem receber MTR.</span>
          </p>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Selecione a coleta
            </label>
            <select
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={coletaId}
              onChange={(e) => setColetaId(e.target.value)}
            >
              <option value="">Escolha uma coleta...</option>
              {coletasElegiveis.map((c) => (
                <option key={c.id} value={c.id}>
                  {new Date(c.dataAgendada).toLocaleDateString("pt-BR")} — {c.cidade}/{c.estado} —{" "}
                  {c.residuos.map((r) => r.residuo.descricao).join(", ")}
                </option>
              ))}
            </select>
          </div>
        )}

        {erro && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => coletaId && onEmitir(coletaId)}
            disabled={!coletaId || isPending}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {isPending && <Spinner size="sm" className="text-white" />}
            Emitir MTR
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de MTR ─────────────────────────────────────────────────────────────

function MtrCard({
  mtr,
  onAssinar,
  onBaixarPdf,
  isAssinarPending,
}: {
  mtr: ManifestoMTR;
  onAssinar: (id: string) => void;
  onBaixarPdf: (id: string) => void;
  isAssinarPending: boolean;
}) {
  const residuosLabel = mtr.coleta.residuos
    .map((r) => r.residuo.descricao)
    .join(", ");

  const podeAssinar = mtr.status === "EMITIDO" || mtr.status === "ACEITO";
  const podeBaixarPdf = mtr.status !== "RASCUNHO";

  const signaturas = [
    { label: "Gerador", ok: Boolean(mtr.assinaturaGerador) },
    { label: "Transportador", ok: Boolean(mtr.assinaturaTransportador) },
    { label: "Destinador", ok: Boolean(mtr.assinaturaDestinador) },
  ];

  return (
    <div className="py-4 flex flex-col sm:flex-row sm:items-start gap-3">
      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">
            {mtr.numeroSinir ?? "Rascunho"}
          </span>
          <MtrStatusBadge status={mtr.status} />
        </div>

        <p className="text-xs text-muted-foreground mt-1 truncate">{residuosLabel}</p>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">
            Coleta: {new Date(mtr.coleta.dataAgendada).toLocaleDateString("pt-BR")} —{" "}
            {mtr.coleta.cidade}/{mtr.coleta.estado}
          </span>
          {mtr.emitidoEm && (
            <span className="text-xs text-muted-foreground">
              Emitido: {new Date(mtr.emitidoEm).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>

        {/* Assinaturas */}
        {mtr.status !== "RASCUNHO" && (
          <div className="flex items-center gap-2 mt-2">
            {signaturas.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: s.ok ? "#F0FDF4" : "#F9FAFB",
                  color: s.ok ? "#15803D" : "#9CA3AF",
                  border: `1px solid ${s.ok ? "#BBF7D0" : "#E5E7EB"}`,
                }}
              >
                {s.ok ? "✓" : "○"} {s.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {podeBaixarPdf && (
          <a
            href={`/api/v1/mtr/${mtr.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            PDF
          </a>
        )}
        {podeAssinar && (
          <button
            type="button"
            onClick={() => onAssinar(mtr.id)}
            disabled={isAssinarPending}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Assinar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ManifestoPage() {
  const [filtroAtivo, setFiltroAtivo] = useState<StatusMtr | "TODOS">("TODOS");
  const [modalAberto, setModalAberto] = useState(false);
  const [erroEmissao, setErroEmissao] = useState<string | null>(null);

  const { query, emitir, assinar } = useMtr(
    filtroAtivo !== "TODOS" ? { status: filtroAtivo } : {}
  );

  const manifestos = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  function handleEmitir(coletaId: string) {
    setErroEmissao(null);
    emitir.mutate(coletaId, {
      onSuccess: () => setModalAberto(false),
      onError: (err) => setErroEmissao(err.message),
    });
  }

  function handleAssinar(id: string) {
    // Fase 1: assinatura digital simplificada (hash timestamp)
    const assinatura = `ASSINATURA_DIGITAL_${Date.now()}`;
    assinar.mutate({ id, tipo: "GERADOR", assinatura });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manifestos MTR</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manifesto de Transporte de Resíduos — CONAMA 275/2001
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setErroEmissao(null); setModalAberto(true); }}
          className="btn-primary self-start sm:self-auto"
        >
          Emitir MTR
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filtrar por status">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltroAtivo(f.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
            style={
              filtroAtivo === f.value
                ? { backgroundColor: "#16A34A", color: "#fff", borderColor: "#16A34A" }
                : { backgroundColor: "#fff", color: "#6B7280", borderColor: "#D1D5DB" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de MTRs */}
      <div className="card">
        {query.isLoading ? (
          <div className="py-10 flex justify-center">
            <Spinner />
          </div>
        ) : manifestos.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {filtroAtivo === "TODOS" ? "Nenhum manifesto emitido" : `Nenhum MTR com status "${STATUS_MTR_CONFIG[filtroAtivo as StatusMtr]?.label}"`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Os manifestos são gerados ao confirmar uma coleta e emitidos aqui
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-2">{total} manifesto{total !== 1 ? "s" : ""}</p>
            <div className="divide-y divide-border">
              {manifestos.map((mtr) => (
                <MtrCard
                  key={mtr.id}
                  mtr={mtr}
                  onAssinar={handleAssinar}
                  isAssinarPending={assinar.isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Nota de conformidade */}
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <p className="text-xs font-medium text-green-800">Conformidade Legal</p>
        <p className="text-xs text-green-700 mt-0.5">
          MTRs gerados conforme Resolução CONAMA 275/2001, arquivados eletronicamente por 5 anos.
          Fase 2: integração direta com API SINIR para emissão oficial.
        </p>
      </div>

      {/* Modal de emissão */}
      {modalAberto && (
        <EmitirMtrModal
          onClose={() => setModalAberto(false)}
          onEmitir={handleEmitir}
          isPending={emitir.isPending}
          erro={erroEmissao}
        />
      )}
    </div>
  );
}
