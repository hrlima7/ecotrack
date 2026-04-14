/**
 * Constantes compartilhadas do domínio EcoTrack.
 * Nenhuma string de negócio deve ser hardcoded nos componentes.
 */

import { TipoResiduo, StatusColeta, RoleUsuario, TipoEmpresa } from "./types";

export const RESIDUO_LABELS: Record<TipoResiduo, string> = {
  ORGANICO: "Resíduo Orgânico",
  RECICLAVEL: "Reciclável",
  ELETRONICO: "Eletrônico (E-Waste)",
  HOSPITALAR: "Hospitalar / Infectante",
  PERIGOSO: "Perigoso / Químico",
};

export const STATUS_COLETA_LABELS: Record<StatusColeta, string> = {
  PENDENTE: "Pendente",
  CONFIRMADA: "Confirmada",
  EM_ROTA: "Em Rota",
  COLETADO: "Coletado",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export const ROLE_LABELS: Record<RoleUsuario, string> = {
  ADMIN: "Administrador",
  OPERADOR: "Operador",
  MOTORISTA: "Motorista",
};

export const TIPO_EMPRESA_LABELS: Record<TipoEmpresa, string> = {
  GERADOR: "Gerador de Resíduos",
  TRANSPORTADOR: "Transportador / Coletor",
  DESTINADOR: "Destinador Final",
};

/** Prazo mínimo em horas para cancelamento de coleta */
export const CANCELAMENTO_PRAZO_HORAS = 24;

/** Paginação padrão */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Fator de conversão para cálculo de impacto ambiental */
export const FATORES_IMPACTO = {
  /** kg de CO2 evitado por kg de resíduo reciclado */
  CO2_POR_KG_RECICLAVEL: 2.5,
  /** litros de água economizados por kg de reciclável */
  AGUA_POR_KG_RECICLAVEL: 6.0,
  /** kg de CO2 evitado por kg de orgânico compostado */
  CO2_POR_KG_ORGANICO: 0.8,
} as const;

/** Rotas da aplicação web */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  CADASTRO: "/cadastro",
  DASHBOARD: "/dashboard",
  COLETAS: "/coletas",
  AGENDAR: "/agendar",
  RASTREAMENTO: "/rastreamento",
  RELATORIOS: "/relatorios",
  MANIFESTO: "/manifesto",
  MARKETPLACE: "/marketplace",
  PERFIL: "/perfil",
  CONFIGURACOES: "/configuracoes",
} as const;

/** Prefixo de todas as rotas da API */
export const API_PREFIX = "/api/v1";

/** Endpoints da API */
export const API_ROUTES = {
  AUTH: {
    LOGIN: `${API_PREFIX}/auth/login`,
    REFRESH: `${API_PREFIX}/auth/refresh`,
    LOGOUT: `${API_PREFIX}/auth/logout`,
    ME: `${API_PREFIX}/auth/me`,
    CHANGE_PASSWORD: `${API_PREFIX}/auth/senha`,
  },
  COLETAS: {
    BASE: `${API_PREFIX}/coletas`,
    BY_ID: (id: string) => `${API_PREFIX}/coletas/${id}`,
    STATUS: (id: string) => `${API_PREFIX}/coletas/${id}/status`,
  },
  RESIDUOS: {
    BASE: `${API_PREFIX}/residuos`,
    INVENTARIO: `${API_PREFIX}/residuos/inventario`,
  },
  MTR: {
    BASE: `${API_PREFIX}/mtr`,
    BY_ID: (id: string) => `${API_PREFIX}/mtr/${id}`,
    PDF: (id: string) => `${API_PREFIX}/mtr/${id}/pdf`,
  },
  EMPRESAS: {
    BASE: `${API_PREFIX}/empresas`,
    ME: `${API_PREFIX}/empresas/me`,
    DELETE_ACCOUNT: `${API_PREFIX}/empresas/me/delete`,
  },
  METRICAS: {
    DASHBOARD: `${API_PREFIX}/metricas/dashboard`,
    RELATORIO: `${API_PREFIX}/metricas/relatorio`,
  },
  RASTREAMENTO: {
    ATIVAS: `${API_PREFIX}/rastreamento/ativas`,
    POSICAO: (coletaId: string) => `${API_PREFIX}/rastreamento/${coletaId}/posicao`,
  },
} as const;
