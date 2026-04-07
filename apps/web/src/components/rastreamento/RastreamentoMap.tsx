/**
 * RastreamentoMap — Mapa Leaflet + OpenStreetMap (gratuito, sem API key)
 * Exibe coletas ativas com marcadores por status.
 * Client component (requer acesso ao DOM).
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useColetas, type Coleta } from "@/hooks/useColetas";

// Cor e emoji do marcador por status
const STATUS_CONFIG: Record<string, { cor: string; label: string }> = {
  PENDENTE:   { cor: "#6B7280", label: "Pendente" },
  CONFIRMADA: { cor: "#3B82F6", label: "Confirmada" },
  EM_ROTA:    { cor: "#F97316", label: "Em Rota" },
  COLETADO:   { cor: "#22C55E", label: "Coletado" },
  FINALIZADO: { cor: "#16A34A", label: "Finalizado" },
  CANCELADO:  { cor: "#EF4444", label: "Cancelado" },
};

function criarPopupHtml(coleta: Coleta): string {
  const residuos = coleta.residuos.map((r) => r.residuo.descricao).join(", ");
  const data = new Date(coleta.dataAgendada).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const cfg = STATUS_CONFIG[coleta.status] ?? STATUS_CONFIG.PENDENTE;

  return `
    <div style="font-family:Inter,sans-serif;min-width:190px;padding:2px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cfg.cor}"></span>
        <span style="font-size:11px;font-weight:600;color:${cfg.cor}">${cfg.label}</span>
      </div>
      <p style="font-size:12px;font-weight:600;color:#111827;margin:0 0 2px">${residuos}</p>
      <p style="font-size:11px;color:#6B7280;margin:0 0 1px">${coleta.logradouro}, ${coleta.numero}</p>
      <p style="font-size:11px;color:#6B7280;margin:0 0 4px">${coleta.cidade} — ${data}</p>
      ${coleta.manifesto?.numeroSinir
        ? `<p style="font-size:10px;color:#16A34A;margin:0;font-weight:600">MTR: ${coleta.manifesto.numeroSinir}</p>`
        : ""}
    </div>
  `;
}

// Legenda de status presentes no mapa
function Legenda({ statusPresentes }: { statusPresentes: string[] }) {
  if (statusPresentes.length === 0) return null;
  return (
    <div
      className="absolute bottom-8 left-3 z-[1000] bg-white rounded-lg shadow-md px-3 py-2 space-y-1"
      style={{ minWidth: 130 }}
    >
      <p className="text-xs font-semibold text-foreground mb-1.5">Coletas</p>
      {statusPresentes.map((s) => {
        const cfg = STATUS_CONFIG[s];
        if (!cfg) return null;
        return (
          <div key={s} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.cor }} />
            <span className="text-xs text-muted-foreground">{cfg.label}</span>
          </div>
        );
      })}
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

  const { query } = useColetas({ limit: 50 });
  const coletas = query.data?.data ?? [];
  const coletasAtivas = coletas.filter(
    (c) => !["CANCELADO", "FINALIZADO"].includes(c.status)
  );
  const statusPresentes = [...new Set(coletasAtivas.map((c) => c.status))];

  // Inicializar mapa Leaflet
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelado = false;
    let mapInstance: { remove: () => void } | null = null;

    // Injetar CSS do Leaflet dinamicamente
    const linkId = "leaflet-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (cancelado || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [-23.5505, -46.6333], // São Paulo, SP
        zoom: 12,
        zoomControl: true,
      });

      // OpenStreetMap — gratuito, sem token
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstance = map;
      mapRef.current = map;

      if (!cancelado) {
        setIsLoading(false);
        setMapReady(true);
      }
    });

    return () => {
      cancelado = true;
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Adicionar/atualizar marcadores quando coletas carregarem
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current as ReturnType<typeof L.map>;

      // Remover marcadores antigos
      (markersRef.current as ReturnType<typeof L.marker>[]).forEach((m) => m.remove());
      markersRef.current = [];

      const bounds: [number, number][] = [];

      coletasAtivas.forEach((coleta) => {
        const cfg = STATUS_CONFIG[coleta.status] ?? STATUS_CONFIG.PENDENTE;

        // Coordenadas: usa lat/lng do banco se disponíveis, senão distribui em torno de SP
        const hash = coleta.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const lat = coleta.latitude ?? (-23.5505 + ((hash % 100) - 50) * 0.003);
        const lng = coleta.longitude ?? (-46.6333 + ((hash % 70) - 35) * 0.004);

        // Ícone SVG colorido por status
        const icon = L.divIcon({
          html: `
            <div style="
              width:32px;height:32px;border-radius:50%;
              background:${cfg.cor};border:3px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
              display:flex;align-items:center;justify-content:center;
              font-size:14px;cursor:pointer;
            ">♻️</div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

        const marker = L.marker([lat, lng], { icon })
          .bindPopup(criarPopupHtml(coleta), { maxWidth: 240 })
          .addTo(map);

        markersRef.current.push(marker);
        bounds.push([lat, lng]);
      });

      // Ajustar zoom para mostrar todos os marcadores
      if (bounds.length > 1) {
        map.fitBounds(bounds as [number, number][], { padding: [60, 60], maxZoom: 14 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      }
    });
  }, [mapReady, coletasAtivas]);

  return (
    <div className="relative w-full h-full">
      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {mapReady && coletasAtivas.length === 0 && !query.isLoading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-full shadow px-4 py-2">
          <p className="text-xs text-muted-foreground">Nenhuma coleta ativa no momento</p>
        </div>
      )}

      {/* Legenda */}
      {mapReady && <Legenda statusPresentes={statusPresentes} />}

      {/* Container do mapa */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
