/**
 * Next.js Middleware — Proteção de rotas
 * Redireciona para /login se o accessToken não estiver presente.
 * O token é armazenado em cookie "access_token" (httpOnly=false para
 * ser lido pelo middleware; segurança adicional via refresh token httpOnly).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Rotas que exigem autenticação */
const ROTAS_PROTEGIDAS = [
  "/dashboard",
  "/agendar",
  "/rastreamento",
  "/relatorios",
  "/manifesto",
  "/marketplace",
  "/perfil",
  "/configuracoes",
];

/** Rotas acessíveis apenas para não-autenticados */
const ROTAS_PUBLICAS_EXCLUSIVAS = ["/login", "/cadastro"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const isAutenticado = Boolean(token);

  // Rota protegida sem token → redireciona para login
  const rotaProtegida = ROTAS_PROTEGIDAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );

  if (rotaProtegida && !isAutenticado) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Já autenticado tentando acessar login/cadastro → redireciona para dashboard
  const rotaPublicaExclusiva = ROTAS_PUBLICAS_EXCLUSIVAS.includes(pathname);
  if (rotaPublicaExclusiva && isAutenticado) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Executa em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - arquivos com extensão (png, jpg, svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
