/**
 * Auth Context — EcoTrack
 * Gerencia estado de autenticação: usuário, empresa, tokens.
 * - accessToken: armazenado em memória (seguro contra XSS)
 * - refreshToken: armazenado em cookie "refresh_token" (persistência)
 * - access_token cookie: armazenado para leitura pelo middleware Next.js
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { RoleUsuario, TipoEmpresa, PlanoSaaS } from "@ecotrack/shared";
import { API_ROUTES, ROUTES } from "@ecotrack/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface AuthEmpresa {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  tipo: TipoEmpresa;
  plano: PlanoSaaS;
  cnpj?: string;
}

interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: RoleUsuario;
  empresa: AuthEmpresa;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, senha: string) => Promise<void>;
  loginComTokens: (accessToken: string, refreshToken: string, usuario: AuthUser) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ─── Helpers de cookie ──────────────────────────────────────────────────────

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Salva tokens nos cookies (para o middleware ler) + memória
  function persistTokens(accessToken: string, refreshToken: string) {
    setCookie("access_token", accessToken, 1);       // 1 dia — curta duração
    setCookie("refresh_token", refreshToken, 7);     // 7 dias — refresh
  }

  function clearTokens() {
    deleteCookie("access_token");
    deleteCookie("refresh_token");
  }

  // Busca dados do usuário autenticado
  async function fetchMe(accessToken: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}${API_ROUTES.AUTH.ME}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error("Sessão inválida");

    const json = await res.json();
    return json.data as AuthUser;
  }

  const login = useCallback(async (email: string, senha: string) => {
    const res = await fetch(`${API_BASE}${API_ROUTES.AUTH.LOGIN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error?.message ?? "Erro ao fazer login");
    }

    const { accessToken, refreshToken, usuario } = json.data;

    persistTokens(accessToken, refreshToken);

    setState({
      user: usuario,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getCookie("refresh_token");

    // Tenta revogar o refresh token no servidor (best-effort)
    if (state.accessToken && refreshToken) {
      try {
        await fetch(`${API_BASE}${API_ROUTES.AUTH.LOGOUT}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // silencioso — logout local garante segurança
      }
    }

    clearTokens();

    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });

    router.push(ROUTES.LOGIN);
  }, [state.accessToken, router]);

  const refreshSession = useCallback(async () => {
    const refreshToken = getCookie("refresh_token");

    if (!refreshToken) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}${API_ROUTES.AUTH.REFRESH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) throw new Error("Refresh falhou");

      const json = await res.json();
      const { accessToken, refreshToken: newRefreshToken } = json.data;

      persistTokens(accessToken, newRefreshToken);

      const user = await fetchMe(accessToken);

      setState({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      clearTokens();
      setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  // Restaurar sessão ao montar o provider
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Usado após cadastro: recebe tokens já prontos da API sem fazer novo request
  const loginComTokens = useCallback((accessToken: string, refreshToken: string, usuario: AuthUser) => {
    persistTokens(accessToken, refreshToken);
    setState({ user: usuario, accessToken, isAuthenticated: true, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, loginComTokens, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}
