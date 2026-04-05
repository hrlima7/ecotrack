/**
 * Layout da area autenticada — EcoTrack
 * Sidebar (desktop) + bottom nav (mobile) + header
 */

import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — visivel apenas em desktop (md+) */}
      <AppSidebar />

      {/* Conteudo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />

        {/* Area de conteudo com padding responsivo */}
        <main
          id="main-content"
          className="flex-1 container-app py-4 sm:py-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
