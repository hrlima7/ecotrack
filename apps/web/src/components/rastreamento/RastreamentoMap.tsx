/**
 * RastreamentoMap — Mapa Mapbox GL JS
 * Exibe posicao do coletor em tempo real via WebSocket.
 * Client component (requer acesso ao DOM).
 */

"use client";

import { useEffect, useRef, useState } from "react";

const LABELS = {
  CARREGANDO: "Carregando mapa...",
  TOKEN_AUSENTE: "Configure NEXT_PUBLIC_MAPBOX_TOKEN no .env",
  NENHUMA_COLETA: "Nenhuma coleta ativa. Agende uma coleta para acompanhar.",
} as const;

export function RastreamentoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
      setError(LABELS.TOKEN_AUSENTE);
      setIsLoading(false);
      return;
    }

    // Importacao dinamica para evitar SSR (Mapbox requer window)
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (!containerRef.current) return;

      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-46.6333, -23.5505], // Sao Paulo, SP
        zoom: 11,
        attributionControl: false,
      });

      map.addControl(
        new mapboxgl.AttributionControl({ compact: true }),
        "bottom-right"
      );

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.on("load", () => {
        setIsLoading(false);
        mapRef.current = map;

        // TODO: conectar WebSocket /ws/rastreamento/:coletaId
        // e atualizar marcador com a posicao do coletor em tempo real
      });

      map.on("error", () => {
        setError("Erro ao carregar o mapa");
        setIsLoading(false);
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    });
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-danger-600 text-xl">!</span>
          </div>
          <p className="text-sm text-danger-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{LABELS.CARREGANDO}</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
