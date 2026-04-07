/**
 * Pagina de Configuracoes — EcoTrack
 * Exibe dados do usuario logado e da empresa.
 * Acoes: trocar senha (placeholder) e excluir conta (LGPD).
 */

"use client";

import { useAuth } from "@/contexts/auth.context";

const LABELS = {
  TITULO: "Configuracoes",
  SUBTITULO: "Gerencie sua conta e preferencias",

  SECAO_USUARIO: "Dados do usuario",
  CAMPO_NOME: "Nome",
  CAMPO_EMAIL: "E-mail",
  CAMPO_PERFIL: "Perfil de acesso",

  SECAO_EMPRESA: "Dados da empresa",
  CAMPO_RAZAO_SOCIAL: "Razao social",
  CAMPO_PLANO: "Plano atual",
  CAMPO_TIPO: "Tipo de atuacao",

  SECAO_SEGURANCA: "Seguranca",
  BTN_TROCAR_SENHA: "Trocar senha",
  BTN_TROCAR_SENHA_DICA: "Enviaremos um link para o seu e-mail cadastrado.",

  SECAO_LGPD: "Privacidade e dados",
  BTN_EXCLUIR_CONTA: "Excluir minha conta",
  EXCLUIR_AVISO:
    "Ao excluir sua conta todos os seus dados serao removidos permanentemente da plataforma, em conformidade com a LGPD (Lei 13.709/2018). Esta acao nao pode ser desfeita.",

  ROLE_ADMIN: "Administrador",
  ROLE_OPERADOR: "Operador",
  ROLE_MOTORISTA: "Motorista",

  TIPO_GERADOR: "Gerador de Residuos",
  TIPO_TRANSPORTADOR: "Transportador / Coletor",
  TIPO_DESTINADOR: "Destinador Final",

  PLANO_FREE: "Free",
  PLANO_PRO: "Pro",
  PLANO_ENTERPRISE: "Enterprise",

  EM_BREVE: "Em breve",
} as const;

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN: LABELS.ROLE_ADMIN,
    OPERADOR: LABELS.ROLE_OPERADOR,
    MOTORISTA: LABELS.ROLE_MOTORISTA,
  };
  return map[role] ?? role;
}

function tipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    GERADOR: LABELS.TIPO_GERADOR,
    TRANSPORTADOR: LABELS.TIPO_TRANSPORTADOR,
    DESTINADOR: LABELS.TIPO_DESTINADOR,
  };
  return map[tipo] ?? tipo;
}

function planoLabel(plano: string): string {
  const map: Record<string, string> = {
    FREE: LABELS.PLANO_FREE,
    PRO: LABELS.PLANO_PRO,
    ENTERPRISE: LABELS.PLANO_ENTERPRISE,
  };
  return map[plano] ?? plano;
}

interface InfoRowProps {
  label: string;
  valor: string;
}

function InfoRow({ label, valor }: InfoRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground sm:w-40 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground">{valor}</span>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { usuario, empresa } = useAuth();

  if (!usuario || !empresa) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{LABELS.TITULO}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{LABELS.SUBTITULO}</p>
      </div>

      {/* Card: Dados do usuario */}
      <section className="card" aria-labelledby="secao-usuario">
        <h2
          id="secao-usuario"
          className="text-base font-semibold text-foreground mb-1"
        >
          {LABELS.SECAO_USUARIO}
        </h2>
        <div>
          <InfoRow label={LABELS.CAMPO_NOME} valor={usuario.nome} />
          <InfoRow label={LABELS.CAMPO_EMAIL} valor={usuario.email} />
          <InfoRow label={LABELS.CAMPO_PERFIL} valor={roleLabel(usuario.role)} />
        </div>
      </section>

      {/* Card: Dados da empresa */}
      <section className="card" aria-labelledby="secao-empresa">
        <h2
          id="secao-empresa"
          className="text-base font-semibold text-foreground mb-1"
        >
          {LABELS.SECAO_EMPRESA}
        </h2>
        <div>
          <InfoRow label={LABELS.CAMPO_RAZAO_SOCIAL} valor={empresa.razaoSocial} />
          <InfoRow label={LABELS.CAMPO_TIPO} valor={tipoLabel(empresa.tipo)} />
          <InfoRow label={LABELS.CAMPO_PLANO} valor={planoLabel(empresa.plano)} />
        </div>
      </section>

      {/* Card: Seguranca */}
      <section className="card" aria-labelledby="secao-seguranca">
        <h2
          id="secao-seguranca"
          className="text-base font-semibold text-foreground mb-3"
        >
          {LABELS.SECAO_SEGURANCA}
        </h2>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Senha</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {LABELS.BTN_TROCAR_SENHA_DICA}
            </p>
          </div>
          <button
            type="button"
            disabled
            className="btn-secondary text-xs px-3 py-1.5 opacity-60 cursor-not-allowed flex-shrink-0"
            title={LABELS.EM_BREVE}
          >
            {LABELS.BTN_TROCAR_SENHA}
            <span className="ml-1.5 text-xs bg-muted rounded px-1">
              {LABELS.EM_BREVE}
            </span>
          </button>
        </div>
      </section>

      {/* Card: LGPD — Excluir conta */}
      <section
        className="card border-red-200 bg-red-50/30"
        aria-labelledby="secao-lgpd"
      >
        <h2
          id="secao-lgpd"
          className="text-base font-semibold text-red-700 mb-2"
        >
          {LABELS.SECAO_LGPD}
        </h2>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {LABELS.EXCLUIR_AVISO}
        </p>
        <button
          type="button"
          disabled
          className="px-4 py-2 rounded-lg border border-red-300 bg-white text-sm font-medium
                     text-red-600 hover:bg-red-50 transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed"
          title={LABELS.EM_BREVE}
        >
          {LABELS.BTN_EXCLUIR_CONTA}
          <span className="ml-2 text-xs bg-red-100 text-red-500 rounded px-1">
            {LABELS.EM_BREVE}
          </span>
        </button>
      </section>
    </div>
  );
}
