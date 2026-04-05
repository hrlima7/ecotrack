/**
 * Auth Context — EcoTrack
 * Gerencia estado de autenticação: usuário, empresa, tokens.
 * Persiste accessToken em memória e refreshToken em httpOnly cookie (via API).
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
import type { Usuario, Empresa, RoleUsuario, TipoEmpresa } from "@ecotrack/shared";

interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: RoleUsuario;
  empresa: Pick<Empresa, "id" | "razaoSocial" | "tipo">;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const login = useCallback(async (email: string, senha: string) => {
    // TODO: chamar API /auth/login e armazenar tokens
    // O refreshToken é armazenado via cookie httpOnly (definido pelo backend)
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      isLoading: false,
    }));
  }, []);

  const logout = useCallback(async () => {
    // TODO: chamar API /auth/logout para revogar refreshToken
    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshSession = useCallback(async () => {
    // TODO: chamar API /auth/refresh com cookie
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  // Inicializar sessão ao montar o provider
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshSession }}>
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
