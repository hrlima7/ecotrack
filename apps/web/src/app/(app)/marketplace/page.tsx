/**
 * Página Marketplace — EcoTrack
 * Catálogo de transportadores e destinadores certificados.
 * Fase 1: dados simulados. Fase 2: API com geolocalização e matching.
 */

"use client";

import { useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoEmpresa = "TRANSPORTADOR" | "DESTINADOR";

interface Parceiro {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  tipo: TipoEmpresa;
  licencaAmbiental: string;
  licencaVencimento: string;
  cidade: string;
  estado: string;
  residuosAceitos: string[];
  avaliacaoMedia: number;
  totalColetas: number;
  distanciaKm: number;
}

// ─── Dados simulados (Fase 1) ─────────────────────────────────────────────────

const PARCEIROS: Parceiro[] = [
  {
    id: "1",
    razaoSocial: "EcoLog Transportes Ltda",
    nomeFantasia: "EcoLog",
    tipo: "TRANSPORTADOR",
    licencaAmbiental: "LP-SP-2024-00123",
    licencaVencimento: "2026-12-31",
    cidade: "São Paulo",
    estado: "SP",
    residuosAceitos: ["Orgânico", "Papel e Papelão", "Plástico"],
    avaliacaoMedia: 4.8,
    totalColetas: 312,
    distanciaKm: 2.4,
  },
  {
    id: "2",
    razaoSocial: "Verde Coleta Ambiental S.A.",
    nomeFantasia: "Verde Coleta",
    tipo: "TRANSPORTADOR",
    licencaAmbiental: "LP-SP-2023-00456",
    licencaVencimento: "2025-06-30",
    cidade: "São Paulo",
    estado: "SP",
    residuosAceitos: ["Eletrônico", "Metal", "Vidro"],
    avaliacaoMedia: 4.5,
    totalColetas: 189,
    distanciaKm: 5.1,
  },
  {
    id: "3",
    razaoSocial: "GreenDestino Tratamento de Resíduos",
    nomeFantasia: "GreenDestino",
    tipo: "DESTINADOR",
    licencaAmbiental: "LO-SP-2024-00789",
    licencaVencimento: "2027-03-15",
    cidade: "Guarulhos",
    estado: "SP",
    residuosAceitos: ["Orgânico", "Papel e Papelão", "Plástico", "Metal", "Vidro"],
    avaliacaoMedia: 4.9,
    totalColetas: 1204,
    distanciaKm: 18.7,
  },
  {
    id: "4",
    razaoSocial: "TecnoRecicla Ltda",
    nomeFantasia: "TecnoRecicla",
    tipo: "DESTINADOR",
    licencaAmbiental: "LO-SP-2023-01102",
    licencaVencimento: "2025-09-30",
    cidade: "Santo André",
    estado: "SP",
    residuosAceitos: ["Eletrônico", "Perigoso"],
    avaliacaoMedia: 4.3,
    totalColetas: 445,
    distanciaKm: 22.3,
  },
  {
    id: "5",
    razaoSocial: "Bio Tratamento Ambiental",
    nomeFantasia: "BioTrat",
    tipo: "DESTINADOR",
    licencaAmbiental: "LO-SP-2024-00334",
    licencaVencimento: "2026-07-20",
    cidade: "Osasco",
    estado: "SP",
    residuosAceitos: ["Orgânico", "Perigoso"],
    avaliacaoMedia: 4.6,
    totalColetas: 678,
    distanciaKm: 11.2,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function estrelas(media: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      style={{ color: i < Math.round(media) ? "#F59E0B" : "#D1D5DB" }}
    >
      ★
    </span>
  ));
}

function licencaStatus(vencimento: string): { label: string; cor: string } {
  const diasRestantes = Math.ceil(
    (new Date(vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diasRestantes < 0) return { label: "Vencida", cor: "#EF4444" };
  if (diasRestantes < 90) return { label: "Vence em breve", cor: "#F97316" };
  return { label: "Regular", cor: "#16A34A" };
}

// ─── Card de Parceiro ─────────────────────────────────────────────────────────

function ParceiroCard({ p }: { p: Parceiro }) {
  const [solicitado, setSolicitado] = useState(false);
  const licenca = licencaStatus(p.licencaVencimento);

  return (
    <div className="card hover:shadow-md transition-shadow">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
            style={{ backgroundColor: p.tipo === "TRANSPORTADOR" ? "#3B82F6" : "#8B5CF6" }}
          >
            {p.nomeFantasia[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{p.nomeFantasia}</p>
            <p className="text-xs text-muted-foreground">{p.razaoSocial}</p>
          </div>
        </div>
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
          style={
            p.tipo === "TRANSPORTADOR"
              ? { backgroundColor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }
              : { backgroundColor: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE" }
          }
        >
          {p.tipo === "TRANSPORTADOR" ? "Transportador" : "Destinador"}
        </span>
      </div>

      {/* Métricas */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-foreground">{p.avaliacaoMedia.toFixed(1)}</span>
          <span className="text-sm">{estrelas(p.avaliacaoMedia)}</span>
        </div>
        <span className="text-xs text-muted-foreground">{p.totalColetas} coletas</span>
        <span className="text-xs text-muted-foreground">{p.distanciaKm} km</span>
      </div>

      {/* Resíduos aceitos */}
      <div className="flex flex-wrap gap-1 mb-3">
        {p.residuosAceitos.map((r) => (
          <span
            key={r}
            className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
          >
            {r}
          </span>
        ))}
      </div>

      {/* Licença */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: licenca.cor }}
        />
        <span className="text-xs text-muted-foreground">
          Licença {p.licencaAmbiental} —{" "}
          <span style={{ color: licenca.cor }} className="font-medium">
            {licenca.label}
          </span>
        </span>
      </div>

      {/* Localização */}
      <p className="text-xs text-muted-foreground mb-4">
        {p.cidade}, {p.estado}
      </p>

      {/* CTA */}
      <button
        type="button"
        onClick={() => setSolicitado(true)}
        disabled={solicitado}
        className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
        style={
          solicitado
            ? { backgroundColor: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }
            : { backgroundColor: "#16A34A", color: "#fff" }
        }
      >
        {solicitado ? "✓ Solicitação enviada" : "Solicitar parceria"}
      </button>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const FILTROS_TIPO: Array<{ label: string; value: TipoEmpresa | "TODOS" }> = [
  { label: "Todos", value: "TODOS" },
  { label: "Transportadores", value: "TRANSPORTADOR" },
  { label: "Destinadores", value: "DESTINADOR" },
];

const RESIDUOS_UNICOS = [...new Set(PARCEIROS.flatMap((p) => p.residuosAceitos))].sort();

export default function MarketplacePage() {
  const [tipoFiltro, setTipoFiltro] = useState<TipoEmpresa | "TODOS">("TODOS");
  const [residuoFiltro, setResiduoFiltro] = useState<string>("TODOS");
  const [busca, setBusca] = useState("");

  const parceirosVisíveis = PARCEIROS.filter((p) => {
    if (tipoFiltro !== "TODOS" && p.tipo !== tipoFiltro) return false;
    if (residuoFiltro !== "TODOS" && !p.residuosAceitos.includes(residuoFiltro)) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return (
        p.nomeFantasia.toLowerCase().includes(q) ||
        p.razaoSocial.toLowerCase().includes(q) ||
        p.cidade.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Transportadores e destinadores certificados próximos a você
          </p>
        </div>
        <span className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full font-medium">
          Fase 1 — dados demonstrativos
        </span>
      </div>

      {/* Busca e filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Buscar por nome ou cidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <div className="flex items-center gap-2 flex-wrap">
          {FILTROS_TIPO.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTipoFiltro(f.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={
                tipoFiltro === f.value
                  ? { backgroundColor: "#16A34A", color: "#fff", borderColor: "#16A34A" }
                  : { backgroundColor: "#fff", color: "#6B7280", borderColor: "#D1D5DB" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro por resíduo */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Resíduo:</span>
        <button
          type="button"
          onClick={() => setResiduoFiltro("TODOS")}
          className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
          style={
            residuoFiltro === "TODOS"
              ? { backgroundColor: "#F3F4F6", color: "#111827", borderColor: "#D1D5DB" }
              : { backgroundColor: "#fff", color: "#9CA3AF", borderColor: "#E5E7EB" }
          }
        >
          Todos
        </button>
        {RESIDUOS_UNICOS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setResiduoFiltro(r)}
            className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
            style={
              residuoFiltro === r
                ? { backgroundColor: "#F3F4F6", color: "#111827", borderColor: "#D1D5DB" }
                : { backgroundColor: "#fff", color: "#9CA3AF", borderColor: "#E5E7EB" }
            }
          >
            {r}
          </button>
        ))}
      </div>

      {/* Grid de parceiros */}
      {parceirosVisíveis.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-foreground">Nenhum parceiro encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {parceirosVisíveis.length} parceiro{parceirosVisíveis.length !== 1 ? "s" : ""} encontrado{parceirosVisíveis.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {parceirosVisíveis.map((p) => (
              <ParceiroCard key={p.id} p={p} />
            ))}
          </div>
        </>
      )}

      {/* Nota Fase 2 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-xs font-medium text-blue-800">Em desenvolvimento — Fase 2</p>
        <p className="text-xs text-blue-700 mt-0.5">
          Matching automático por geolocalização, tipo de resíduo e disponibilidade.
          Integração com SINIR para validação de licenças ambientais em tempo real.
        </p>
      </div>
    </div>
  );
}
