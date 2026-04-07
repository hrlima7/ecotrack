/**
 * AppSidebar — Navegacao lateral (visivel em md+)
 * Mobile-first: oculta em telas menores, substituido por bottom nav.
 */

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@ecotrack/shared";

const NAV_ITEMS = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icone: "📊" },
  { href: ROUTES.AGENDAR, label: "Agendar Coleta", icone: "📅" },
  { href: ROUTES.RASTREAMENTO, label: "Rastreamento", icone: "🗺️" },
  { href: ROUTES.MANIFESTO, label: "Manifestos MTR", icone: "📋" },
  { href: ROUTES.RELATORIOS, label: "Relatorios", icone: "📈" },
  { href: ROUTES.MARKETPLACE, label: "Marketplace", icone: "🏪" },
] as const;

const LABELS = {
  LOGO: "EcoTrack",
  CONFIGURACOES: "Configuracoes",
  SAIR: "Sair",
  NAV_ARIA: "Navegacao principal",
} as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-60 bg-white border-r border-border flex-shrink-0"
      aria-label={LABELS.NAV_ARIA}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">E</span>
        </div>
        <span className="font-bold text-foreground text-lg">{LABELS.LOGO}</span>
      </div>

      {/* Navegacao */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label={LABELS.NAV_ARIA}>
        {NAV_ITEMS.map((item) => {
          const isAtivo = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isAtivo ? "nav-item--active" : ""}`}
              aria-current={isAtivo ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icone}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Rodape da sidebar */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-4">
        <Link href={ROUTES.CONFIGURACOES} className="nav-item">
          <span aria-hidden="true">⚙️</span>
          {LABELS.CONFIGURACOES}
        </Link>
      </div>
    </aside>
  );
}
