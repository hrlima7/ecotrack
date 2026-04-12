/**
 * Pagina de Coletas — EcoTrack
 * Lista coletas com filtros por status e acoes contextuais
 * para avancar a maquina de estados:
 * PENDENTE → CONFIRMADA → EM_ROTA → COLETADO → FINALIZADO | CANCELADO
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@ecotrack/shared";
import {
  useColetas,
  type Coleta,
  type ColetaStatus,
} from "@/hooks/useColetas";
import { Spinner } from "@/components/ui/Spinner";

// ─── Configuracao de status ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; cor: string; bg: string; border: string }
> = {
  PENDENTE: {
    label: "Pendente",
    cor: "#6B7280",
    bg: "#F3F4F6",
    border: "#D1D5DB",
  },
  CONFIRMADA: {
    label: "Confirmada",
    cor: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  EM_ROTA: {
    label: "Em Rota",
    cor: "#C2410C",
    bg: "#FFF7ED",
    border: "#FED7AA",
  },
  COLETADO: {
    label: "Coletado",
    cor: "#15803D",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  FINALIZADO: {
    label: "Finalizado",
    cor: "#166534",
    bg: "#DCFCE7",
    border: "#86EFAC",
  },
  CANCELADO: {
    label: "Cancelado",
    cor: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
};

const FILTROS: Array<{ label: string; value: ColetaStatus | "TODAS" }> = [
  { label: "Todas", value: "TODAS" },
  { label: "Pendentes", value: "PENDENTE" },
  { label: "Confirmadas", value: "CONFIRMADA" },
  { label: "Em Rota", value: "EM_ROTA" },
  { label: "Coletadas", value: "COLETADO" },
  { label: "Finalizadas", value: "FINALIZADO" },
  { label: "Canceladas", value: "CANCELADO" },
];

// Proxima acao permitida por status
const ACOES_POR_STATUS: Record<
  string,
  Array<{ label: string; status: ColetaStatus; variant: "primary" | "danger" | "secondary"; pedePeso?: boolean }>
> = {
  PENDENTE: [
    { label: "Confirmar", status: "CONFIRMADA", variant: "primary" },
    { label: "Cancelar", status: "CANCELADO", variant: "danger" },
  ],
  CONFIRMADA: [
    { label: "Iniciar Rota", status: "EM_ROTA", variant: "primary" },
    { label: "Cancelar", status: "CANCELADO", variant: "danger" },
  ],
  EM_ROTA: [
    { label: "Marcar Coletado", status: "COLETADO", variant: "primary", pedePeso: true },
  ],
  COLETADO: [
    { label: "Finalizar", status: "FINALIZADO", variant: "primary" },
  ],
  FINALIZADO: [],
  CANCELADO: [],
};

// ─── Badge de status ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDENTE;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: cfg.bg,
        color: cfg.cor,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: cfg.cor }}
      />
      {cfg.label}
    </span>
  );
}

// ─── Modal de peso real ──────────────────────────────────────────────────────

function ModalPesoReal({
  onConfirmar,
  onCancelar,
  isPending,
}: {
  onConfirmar: (peso: number) => void;
  onCancelar: () => void;
  isPending: boolean;
}) {
  const [peso, setPeso] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">
          Peso Real da Coleta
        </h2>
        <div className="space-y-1.5">
          <label
            htmlFor="pesoReal"
            className="block text-sm font-medium text-foreground"
          >
            Peso coletado (kg)
          </label>
          <input
            id="pesoReal"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="Ex: 25.5"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => {
              const val = parseFloat(peso);
              if (val > 0) onConfirmar(val);
            }}
            disabled={!peso || parseFloat(peso) <= 0 || isPending}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {isPending && <Spinner size="sm" className="text-white" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de coleta ──────────────────────────────────────────────────────────

function ColetaCard({
  coleta,
  onAtualizarStatus,
  onCancelar,
  isPending,
}: {
  coleta: Coleta;
  onAtualizarStatus: (
    id: string,
    status: ColetaStatus,
    pesoRealKg?: number
  ) => void;
  onCancelar: (id: string) => void;
  isPending: boolean;
}) {
  const [modalPeso, setModalPeso] = useState(false);

  const residuos = coleta.residuos
    .map((r) => r.residuo.descricao)
    .join(", ");
  const data = new Date(coleta.dataAgendada).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const acoes = ACOES_POR_STATUS[coleta.status] ?? [];

  return (
    <>
      <div className="py-4 flex flex-col gap-3">
        {/* Info */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={coleta.status} />
              {coleta.manifesto?.numeroSinir && (
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  MTR: {coleta.manifesto.numeroSinir}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground mt-2 truncate">
              {residuos || "Sem residuos"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {coleta.logradouro}, {coleta.numero} — {coleta.bairro},{" "}
              {coleta.cidade}/{coleta.estado}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{data}</p>
            {coleta.pesoRealKg != null && (
              <p className="text-xs font-medium text-foreground mt-1">
                Peso real: {coleta.pesoRealKg} kg
              </p>
            )}
          </div>
        </div>

        {/* Acoes */}
        {acoes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {acoes.map((acao) => {
              const btnClass =
                acao.variant === "primary"
                  ? "btn-primary text-xs px-3 py-1.5"
                  : acao.variant === "danger"
                  ? "px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                  : "px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors";

              return (
                <button
                  key={acao.status}
                  type="button"
                  disabled={isPending}
                  className={btnClass}
                  onClick={() => {
                    if (acao.status === "CANCELADO") {
                      onCancelar(coleta.id);
                    } else if (acao.pedePeso) {
                      setModalPeso(true);
                    } else {
                      onAtualizarStatus(coleta.id, acao.status);
                    }
                  }}
                >
                  {acao.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de peso */}
      {modalPeso && (
        <ModalPesoReal
          isPending={isPending}
          onCancelar={() => setModalPeso(false)}
          onConfirmar={(peso) => {
            onAtualizarStatus(coleta.id, "COLETADO", peso);
            setModalPeso(false);
          }}
        />
      )}
    </>
  );
}

// ─── Pagina principal ────────────────────────────────────────────────────────

export default function ColetasPage() {
  const [filtroAtivo, setFiltroAtivo] = useState<ColetaStatus | "TODAS">(
    "TODAS"
  );

  const { query, atualizarStatus, cancelar } = useColetas(
    filtroAtivo !== "TODAS" ? { status: filtroAtivo } : {}
  );

  const coletas = query.data?.data ?? [];
  const total = query.data?.meta?.total ?? 0;

  function handleAtualizarStatus(
    id: string,
    status: ColetaStatus,
    pesoRealKg?: number
  ) {
    atualizarStatus.mutate({ id, status, pesoRealKg });
  }

  function handleCancelar(id: string) {
    cancelar.mutate(id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minhas Coletas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie e acompanhe o status das suas coletas
          </p>
        </div>
        <Link href={ROUTES.AGENDAR} className="btn-primary self-start sm:self-auto">
          Nova Coleta
        </Link>
      </div>

      {/* Filtros */}
      <div
        className="flex items-center gap-2 flex-wrap"
        role="group"
        aria-label="Filtrar por status"
      >
        {FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltroAtivo(f.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
            style={
              filtroAtivo === f.value
                ? {
                    backgroundColor: "#16A34A",
                    color: "#fff",
                    borderColor: "#16A34A",
                  }
                : {
                    backgroundColor: "#fff",
                    color: "#6B7280",
                    borderColor: "#D1D5DB",
                  }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="card">
        {query.isLoading ? (
          <div className="py-10 flex justify-center">
            <Spinner />
          </div>
        ) : coletas.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">♻️</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {filtroAtivo === "TODAS"
                ? "Nenhuma coleta encontrada"
                : `Nenhuma coleta com status "${STATUS_CONFIG[filtroAtivo]?.label}"`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Agende uma nova coleta para comecar
            </p>
            <Link
              href={ROUTES.AGENDAR}
              className="inline-block btn-primary mt-4 text-sm"
            >
              Agendar Coleta
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              {total} coleta{total !== 1 ? "s" : ""}
            </p>
            <div className="divide-y divide-border">
              {coletas.map((coleta) => (
                <ColetaCard
                  key={coleta.id}
                  coleta={coleta}
                  onAtualizarStatus={handleAtualizarStatus}
                  onCancelar={handleCancelar}
                  isPending={
                    atualizarStatus.isPending || cancelar.isPending
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
