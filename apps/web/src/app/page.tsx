/**
 * Página raiz — redireciona para /dashboard (autenticado) ou /login
 */

import { redirect } from "next/navigation";
import { ROUTES } from "@ecotrack/shared";

export default function RootPage() {
  // Em produção: verificar cookie de sessão no middleware (middleware.ts)
  // e redirecionar adequadamente. Por ora, redireciona para o dashboard.
  redirect(ROUTES.DASHBOARD);
}
