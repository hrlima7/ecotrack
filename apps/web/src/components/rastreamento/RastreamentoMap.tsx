/**
 * RastreamentoMap — Mapa Mapbox GL JS
 * Exibe coletas ativas com marcadores por status.
 * Client component (requer acesso ao DOM).
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useColetas, type Coleta } from "@/hooks/useColetas";

const LABELS = {
  CARREGANDO_MAPA: "Carregando mapa...",
  TOKEN_AUSENTE: "Token Mapbox não configurado. Adicione NEXT_PUBLIC_MAPBOX_TOKEN no .env.local",
  NENHUMA_COLETA: "Nenhuma coleta ativa no momento",
  ERRO_MAPA: "Erro ao carregar o mapa",
} as const;

// Cor do marcador por status
const STATUS_COR: Record<string, string> = {
  PENDENTE: "#6B7280",
  CONFIRMADA: "#3B82F6",
  EM_ROTA: "#F97316",
  COLETADO: "#22C55E",
  FINALIZADO: "#16A34A",
  CANCELADO: "#EF4444",
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  CONFIRMADA: "Confirmada",
  EM_ROTA: "Em Rota",
  COLETADO: "Coletado",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

function criarPopupHtml(coleta: Coleta): string {
  const residuos = coleta.residuos.map((r) => r.residuo.descricao).join(", ");
  const data = new Date(coleta.dataAgendada).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const cor = STATUS_COR[coleta.status] ?? "#6B7280";
  const label = STATUS_LABEL[coleta.status] ?? coleta.status;

  return `
    <div style="font-family:Inter,sans-serif;min-width:200px;padding:4px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cor}"></span>
        <span style="font-size:11px;font-weight:600;color:${cor}">${label}</span>
      </div>
      <p style="font-size:12px;font-weight:600;color:#111827;margin:0 0 2px">${residuos}</p>
      <p style="font-size:11px;color:#6B7280;margin:0 0 2px">${coleta.logradouro}, ${coleta.numero}</p>
      <p style="font-size:11px;color:#6B7280;margin:0 0 4px">${coleta.cidade} — ${data}</p>
      ${coleta.manifesto?.numeroSinir
        ? `<p style="font-size:10px;color:#16A34A;margin:0">MTR: ${coleta.manifesto.numeroSinir}</p>`
        : ""}
    </div>
  `;
}

// ─── Legenda ──────────────────────────────────────────────────────────────────

function Legenda({ visíveis }: { visíveis: string[] }) {
  const itens = Object.entries(STATUS_LABEL).filter(([k]) => visíveis.includes(k));
  if (itens.length === 0) return null;

  return (
    <div
      className="absolute bottom-8 left-3 z-10 bg-white rounded-lg shadow-md px-3 py-2 space-y-1"
      style={{ minWidth: 130 }}
    >
      <p className="text-xs font-semibold text-foreground mb-1.5">Coletas</p>
      {itens.map(([status, label]) => (
        <div key={status} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: STATUS_COR[status] }}
          />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function RastreamentoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coletas ativas (sem CANCELADO/FINALIZADO para foco no mapa)
  const { query } = useColetas({ limit: 50 });
  const coletas = query.data?.data ?? [];
  const coletasAtivas = coletas.filter(
    (c) => !["CANCELADO", "FINALIZADO"].includes(c.status)
  );
  const statusVisíveis = [...new Set(coletasAtivas.map((c) => c.status))];

  // Inicializar mapa
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token || token.includes("exemplo")) {
      setError(LABELS.TOKEN_AUSENTE);
      setIsLoading(false);
      return;
    }

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (!containerRef.current || mapRef.current) return;

      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-46.6333, -23.5505], // São Paulo, SP
        zoom: 11,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.on("load", () => {
        setIsLoading(false);
        setMapReady(true);
        mapRef.current = map;
      });

      map.on("error", () => {
        setError(LABELS.ERRO_MAPA);
        setIsLoading(false);
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Adicionar marcadores quando coletas carregarem
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      const map = mapRef.current as InstanceType<typeof mapboxgl.Map>;

      // Limpar marcadores antigos
      (markersRef.current as InstanceType<typeof mapboxgl.Marker>[]).forEach((m) => m.remove());
      markersRef.current = [];

      coletasAtivas.forEach((coleta) => {
        // Geocodificação simulada: usar coordenadas fixas de SP com variação por id
        // Em produção: salvar lat/lng no banco na criação da coleta
        const hash = coleta.id
          .split("")
          .reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const lat = -23.5505 + ((hash % 100) - 50) * 0.003;
        const lng = -46.6333 + ((hash % 70) - 35) * 0.004;

        const cor = STATUS_COR[coleta.status] ?? "#6B7280";

        // Elemento do marcador
        const el = document.createElement("div");
        el.style.cssText = `
          width:32px;height:32px;border-radius:50%;
          background:${cor};border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          cursor:pointer;display:flex;align-items:center;justify-content:center;
        `;
        el.innerHTML = `<span style="font-size:14px">♻️</span>`;

        const popup = new mapboxgl.Popup({ offset: 18, closeButton: false })
          .setHTML(criarPopupHtml(coleta));

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Ajustar bounds se houver marcadores
      if (coletasAtivas.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        (markersRef.current as InstanceType<typeof mapboxgl.Marker>[]).forEach((m) =>
          bounds.extend(m.getLngLat())
        );
        map.fitBounds(bounds, { padding: 80, maxZoom: 14 });
      }
    });
  }, [mapReady, coletasAtivas]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-red-500 text-xl font-bold">!</span>
          </div>
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Crie um token em mapbox.com e adicione em .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{LABELS.CARREGANDO_MAPA}</p>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {mapReady && coletasAtivas.length === 0 && !query.isLoading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full shadow px-4 py-2">
          <p className="text-xs text-muted-foreground">{LABELS.NENHUMA_COLETA}</p>
        </div>
      )}

      {/* Legenda */}
      {mapReady && <Legenda visíveis={statusVisíveis} />}

      {/* Container do mapa */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
