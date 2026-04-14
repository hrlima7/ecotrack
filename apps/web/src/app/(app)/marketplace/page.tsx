/**
 * Pagina Marketplace — EcoTrack
 * Catalogo de transportadores e destinadores certificados.
 * Busca dados reais da API; exibe dados demo se nao houver parceiros no banco.
 */

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth.context";
import { API_ROUTES } from "@ecotrack/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type TipoEmpresa = "TRANSPORTADOR" | "DESTINADOR";

interface Parceiro {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  tipo: TipoEmpresa;
  cidade: string;
  estado: string;
  licencaAmbiental: string | null;
  licencaVencimento: string | null;
  totalColetas: number;
  residuosAceitos: string[];
}

// Dados demo caso o banco esteja vazio
const PARCEIROS_DEMO: Parceiro[] = [
  {
    id: "demo-1", razaoSocial: "EcoLog Transportes Ltda", nomeFantasia: "EcoLog",
    tipo: "TRANSPORTADOR", cidade: "Sao Paulo", estado: "SP",
    licencaAmbiental: "LP-SP-2024-00123", licencaVencimento: "2026-12-31",
    totalColetas: 312, residuosAceitos: ["Organico", "Papel e Papelao", "Plastico"],
  },
  {
    id: "demo-2", razaoSocial: "Verde Coleta Ambiental S.A.", nomeFantasia: "Verde Coleta",
    tipo: "TRANSPORTADOR", cidade: "Sao Paulo", estado: "SP",
    licencaAmbiental: "LP-SP-2023-00456", licencaVencimento: "2025-06-30",
    totalColetas: 189, residuosAceitos: ["Eletronico", "Metal", "Vidro"],
  },
  {
    id: "demo-3", razaoSocial: "GreenDestino Tratamento de Residuos", nomeFantasia: "GreenDestino",
    tipo: "DESTINADOR", cidade: "Guarulhos", estado: "SP",
    licencaAmbiental: "LO-SP-2024-00789", licencaVencimento: "2027-03-15",
    totalColetas: 1204, residuosAceitos: ["Organico", "Papel e Papelao", "Plastico", "Metal"],
  },
  {
    id: "demo-4", razaoSocial: "TecnoRecicla Ltda", nomeFantasia: "TecnoRecicla",
    tipo: "DESTINADOR", cidade: "Santo Andre", estado: "SP",
    licencaAmbiental: "LO-SP-2023-01102", licencaVencimento: "2025-09-30",
    totalColetas: 445, residuosAceitos: ["Eletronico", "Perigoso"],
  },
];

function licencaStatus(vencimento: string | null): { label: string; cor: string } {
  if (!vencimento) return { label: "Nao informada", cor: "#6B7280" };
  const diasRestantes = Math.ceil(
    (new Date(vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diasRestantes < 0) return { label: "Vencida", cor: "#EF4444" };
  if (diasRestantes < 90) return { label: "Vence em breve", cor: "#F97316" };
  return { label: "Regular", cor: "#16A34A" };
}

function ParceiroCard({ p }: { p: Parceiro }) {
  const [solicitado, setSolicitado] = useState(false);
  const licenca = licencaStatus(p.licencaVencimento);

  return (
    <div className="card hover:shadow-md transition-shadow">
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

      <div className="flex items-center gap-4 mb-3">
        <span className="text-xs text-muted-foreground">{p.totalColetas} coletas</span>
        <span className="text-xs text-muted-foreground">{p.cidade}, {p.estado}</span>
      </div>

      {p.residuosAceitos.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {p.residuosAceitos.map((r) => (
            <span key={r} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
              {r}
            </span>
          ))}
        </div>
      )}

      {p.licencaAmbiental && (
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: licenca.cor }} />
          <span className="text-xs text-muted-foreground">
            Licenca {p.licencaAmbiental} —{" "}
            <span style={{ color: licenca.cor }} className="font-medium">{licenca.label}</span>
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setSolicitado(true)}
        disabled={solicitado || p.id.startsWith("demo")}
        className="w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={
          solicitado
            ? { backgroundColor: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }
            : { backgroundColor: "#16A34A", color: "#fff" }
        }
      >
        {solicitado ? "Solicitacao enviada" : p.id.startsWith("demo") ? "Dados demonstrativos" : "Solicitar parceria"}
      </button>
    </div>
  );
}

const FILTROS_TIPO: Array<{ label: string; value: TipoEmpresa | "TODOS" }> = [
  { label: "Todos", value: "TODOS" },
  { label: "Transportadores", value: "TRANSPORTADOR" },
  { label: "Destinadores", value: "DESTINADOR" },
];

export default function MarketplacePage() {
  const { accessToken } = useAuth();
  const [tipoFiltro, setTipoFiltro] = useState<TipoEmpresa | "TODOS">("TODOS");
  const [busca, setBusca] = useState("");

  const { data: parceirosApi, isLoading } = useQuery<Parceiro[]>({
    queryKey: ["marketplace", tipoFiltro, busca],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tipoFiltro !== "TODOS") params.set("tipo", tipoFiltro);
      if (busca) params.set("busca", busca);
      params.set("limit", "50");

      const res = await fetch(
        `${API_BASE}${API_ROUTES.MARKETPLACE.BASE}?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error("Erro ao buscar parceiros");
      const json = await res.json();
      return json.data;
    },
    enabled: !!accessToken,
  });

  // Usar dados da API; se nenhum parceiro real, mostrar dados demo
  const usandoDemo = !parceirosApi || parceirosApi.length === 0;
  const todosParceirosFonte = usandoDemo ? PARCEIROS_DEMO : parceirosApi;

  // Filtrar localmente (dados demo nao passam pelo filtro da API)
  const parceirosVisiveis = todosParceirosFonte.filter((p) => {
    if (usandoDemo) {
      if (tipoFiltro !== "TODOS" && p.tipo !== tipoFiltro) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          p.nomeFantasia.toLowerCase().includes(q) ||
          p.razaoSocial.toLowerCase().includes(q) ||
          p.cidade.toLowerCase().includes(q)
        );
      }
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
            Transportadores e destinadores certificados
          </p>
        </div>
        {usandoDemo && !isLoading && (
          <span className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full font-medium">
            Dados demonstrativos
          </span>
        )}
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                tipoFiltro === f.value
                  ? "bg-primary text-white"
                  : "bg-white text-muted-foreground border border-border hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : parceirosVisiveis.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-foreground">Nenhum parceiro encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {parceirosVisiveis.length} parceiro{parceirosVisiveis.length !== 1 ? "s" : ""} encontrado{parceirosVisiveis.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {parceirosVisiveis.map((p) => (
              <ParceiroCard key={p.id} p={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
