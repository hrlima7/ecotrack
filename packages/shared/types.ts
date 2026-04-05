/**
 * Tipos TypeScript compartilhados entre frontend e backend.
 * Enums e interfaces do domínio EcoTrack.
 */

// ─── Enums de Domínio ───────────────────────────────────────────────────────

export enum TipoEmpresa {
  GERADOR = "GERADOR",
  TRANSPORTADOR = "TRANSPORTADOR",
  DESTINADOR = "DESTINADOR",
}

export enum RoleUsuario {
  ADMIN = "ADMIN",
  OPERADOR = "OPERADOR",
  MOTORISTA = "MOTORISTA",
}

export enum TipoResiduo {
  ORGANICO = "ORGANICO",
  RECICLAVEL = "RECICLAVEL",
  ELETRONICO = "ELETRONICO",
  HOSPITALAR = "HOSPITALAR",
  PERIGOSO = "PERIGOSO",
}

export enum UnidadeMedida {
  KG = "KG",
  LITRO = "LITRO",
  UNIDADE = "UNIDADE",
}

export enum FrequenciaColeta {
  DIARIA = "DIARIA",
  SEMANAL = "SEMANAL",
  QUINZENAL = "QUINZENAL",
  MENSAL = "MENSAL",
  SOB_DEMANDA = "SOB_DEMANDA",
}

export enum StatusColeta {
  PENDENTE = "PENDENTE",
  CONFIRMADA = "CONFIRMADA",
  EM_ROTA = "EM_ROTA",
  COLETADO = "COLETADO",
  FINALIZADO = "FINALIZADO",
  CANCELADO = "CANCELADO",
}

export enum StatusMTR {
  RASCUNHO = "RASCUNHO",
  EMITIDO = "EMITIDO",
  ACEITO = "ACEITO",
  FINALIZADO = "FINALIZADO",
  CANCELADO = "CANCELADO",
}

export enum PlanoSaaS {
  FREE = "FREE",
  STARTER = "STARTER",
  PROFESSIONAL = "PROFESSIONAL",
  ENTERPRISE = "ENTERPRISE",
}

// ─── Interfaces de Domínio ───────────────────────────────────────────────────

export interface Empresa {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  tipo: TipoEmpresa;
  plano: PlanoSaaS;
  email: string;
  telefone?: string;
  endereco: Endereco;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Usuario {
  id: string;
  empresaId: string;
  email: string;
  nome: string;
  role: RoleUsuario;
  ativo: boolean;
  criadoEm: Date;
}

export interface Residuo {
  id: string;
  tipo: TipoResiduo;
  descricao: string;
  codigoIbama?: string;
  classeAbnt?: string;
  perigoso: boolean;
  criadoEm: Date;
}

export interface InventarioResiduo {
  id: string;
  empresaId: string;
  residuoId: string;
  residuo: Residuo;
  quantidade: number;
  unidade: UnidadeMedida;
  frequencia: FrequenciaColeta;
  observacoes?: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Coleta {
  id: string;
  empresaId: string;
  coletorId?: string;
  status: StatusColeta;
  dataAgendada: Date;
  dataRealizada?: Date;
  endereco: Endereco;
  observacoes?: string;
  pesoRealKg?: number;
  residuos: ColetaResiduo[];
  manifesto?: ManifestoMTR;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ColetaResiduo {
  id: string;
  coletaId: string;
  residuoId: string;
  residuo: Residuo;
  quantidadeEstimada: number;
  quantidadeReal?: number;
  unidade: UnidadeMedida;
}

export interface ManifestoMTR {
  id: string;
  coletaId: string;
  numeroSinir?: string;
  qrCode?: string;
  pdfUrl?: string;
  status: StatusMTR;
  emitidoEm?: Date;
  finalizadoEm?: Date;
  criadoEm: Date;
}

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude?: number;
  longitude?: number;
}

// ─── Tipos de Resposta de API ────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Tipos de Métricas / Dashboard ──────────────────────────────────────────

export interface MetricaSustentabilidade {
  empresaId: string;
  periodo: { inicio: Date; fim: Date };
  totalColetasRealizadas: number;
  totalPesoKg: number;
  pesoDesviado: number;
  co2Evitado: number;
  aguaEconomizadaLitros: number;
  porTipo: Record<TipoResiduo, { quantidade: number; pesoKg: number }>;
}

// ─── Tipos de Auth ───────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  empresaId: string;
  email: string;
  role: RoleUsuario;
  tipo: TipoEmpresa;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: Omit<Usuario, "criadoEm"> & { empresa: Pick<Empresa, "id" | "razaoSocial" | "tipo"> };
}
