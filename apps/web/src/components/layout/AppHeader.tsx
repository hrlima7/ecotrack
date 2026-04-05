/**
 * AppHeader — Cabecalho da area autenticada
 * Mobile: exibe logo + menu hamburger
 * Desktop: exibe apenas breadcrumb e acoes do usuario
 */

"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth.context";
import { ROUTES } from "@ecotrack/shared";

const LABELS = {
  LOGO: "EcoTrack",
  SAIR: "Sair",
  PERFIL_ARIA: "Menu do usuario",
  SKIP_NAV: "Pular para o conteudo",
} as const;

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Skip link para acessibilidade */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2
                   focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white
                   focus:rounded-md focus:text-sm focus:font-medium"
      >
        {LABELS.SKIP_NAV}
      </a>

      <header className="h-16 bg-white border-b border-border flex items-center px-4 gap-4 flex-shrink-0">
        {/* Logo — visivel apenas em mobile (md: oculto, pois a sidebar exibe) */}
        <Link
          href={ROUTES.DASHBOARD}
          className="md:hidden flex items-center gap-2"
          aria-label={LABELS.LOGO}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-foreground">{LABELS.LOGO}</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Acoes do usuario */}
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden sm:block text-sm text-muted-foreground">
              {user.nome}
            </span>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="btn-secondary py-1.5 px-3 text-xs"
            aria-label={LABELS.SAIR}
          >
            {LABELS.SAIR}
          </button>
        </div>
      </header>
    </>
  );
}
