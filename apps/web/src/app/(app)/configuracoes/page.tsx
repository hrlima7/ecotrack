/**
 * Pagina de Configuracoes — EcoTrack
 * Exibe dados do usuario logado e da empresa.
 * Acoes: trocar senha e excluir conta (LGPD).
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth.context";
import { API_ROUTES } from "@ecotrack/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
  PLANO_STARTER: "Starter",
  PLANO_PROFESSIONAL: "Professional",
  PLANO_ENTERPRISE: "Enterprise",
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
    STARTER: LABELS.PLANO_STARTER,
    PROFESSIONAL: LABELS.PLANO_PROFESSIONAL,
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
  const { user, accessToken, isLoading, logout } = useAuth();

  // Estado trocar senha
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [senhaMsg, setSenhaMsg] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Estado excluir conta
  const [mostrarExcluir, setMostrarExcluir] = useState(false);
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState("");
  const [excluindoConta, setExcluindoConta] = useState(false);
  const [excluirMsg, setExcluirMsg] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  async function handleTrocarSenha() {
    setSenhaMsg(null);

    if (novaSenha.length < 8) {
      setSenhaMsg({ tipo: "erro", texto: "A nova senha deve ter no minimo 8 caracteres" });
      return;
    }

    if (novaSenha !== confirmaSenha) {
      setSenhaMsg({ tipo: "erro", texto: "As senhas nao conferem" });
      return;
    }

    setSalvandoSenha(true);
    try {
      const res = await fetch(`${API_BASE}${API_ROUTES.AUTH.CHANGE_PASSWORD}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const json = await res.json();

      if (res.ok) {
        setSenhaMsg({ tipo: "sucesso", texto: "Senha alterada com sucesso" });
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmaSenha("");
        setMostrarSenha(false);
      } else {
        setSenhaMsg({ tipo: "erro", texto: json.error?.message ?? "Erro ao trocar senha" });
      }
    } catch {
      setSenhaMsg({ tipo: "erro", texto: "Erro de conexao. Tente novamente." });
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function handleExcluirConta() {
    if (confirmacaoExcluir !== "EXCLUIR") return;

    setExcluindoConta(true);
    setExcluirMsg(null);
    try {
      const res = await fetch(`${API_BASE}${API_ROUTES.EMPRESAS.DELETE_ACCOUNT}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        setExcluirMsg({ tipo: "sucesso", texto: "Conta excluida. Redirecionando..." });
        setTimeout(() => logout(), 2000);
      } else {
        const json = await res.json();
        setExcluirMsg({ tipo: "erro", texto: json.error?.message ?? "Erro ao excluir conta" });
      }
    } catch {
      setExcluirMsg({ tipo: "erro", texto: "Erro de conexao. Tente novamente." });
    } finally {
      setExcluindoConta(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const empresa = user.empresa;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{LABELS.TITULO}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{LABELS.SUBTITULO}</p>
      </div>

      {/* Card: Dados do usuario */}
      <section className="card" aria-labelledby="secao-usuario">
        <h2 id="secao-usuario" className="text-base font-semibold text-foreground mb-1">
          {LABELS.SECAO_USUARIO}
        </h2>
        <div>
          <InfoRow label={LABELS.CAMPO_NOME} valor={user.nome} />
          <InfoRow label={LABELS.CAMPO_EMAIL} valor={user.email} />
          <InfoRow label={LABELS.CAMPO_PERFIL} valor={roleLabel(user.role)} />
        </div>
      </section>

      {/* Card: Dados da empresa */}
      <section className="card" aria-labelledby="secao-empresa">
        <h2 id="secao-empresa" className="text-base font-semibold text-foreground mb-1">
          {LABELS.SECAO_EMPRESA}
        </h2>
        <div>
          <InfoRow label={LABELS.CAMPO_RAZAO_SOCIAL} valor={empresa.razaoSocial} />
          <InfoRow label={LABELS.CAMPO_TIPO} valor={tipoLabel(empresa.tipo)} />
          <InfoRow label={LABELS.CAMPO_PLANO} valor={planoLabel(empresa.plano)} />
        </div>
      </section>

      {/* Card: Seguranca — Trocar Senha */}
      <section className="card" aria-labelledby="secao-seguranca">
        <h2 id="secao-seguranca" className="text-base font-semibold text-foreground mb-3">
          {LABELS.SECAO_SEGURANCA}
        </h2>

        {senhaMsg && (
          <div
            className={`px-3 py-2 rounded-lg text-sm mb-3 ${
              senhaMsg.tipo === "sucesso"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {senhaMsg.texto}
          </div>
        )}

        {!mostrarSenha ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Senha</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Altere sua senha de acesso a plataforma
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarSenha(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0"
            >
              {LABELS.BTN_TROCAR_SENHA}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="senhaAtual" className="block text-sm text-muted-foreground mb-1">
                Senha atual
              </label>
              <input
                id="senhaAtual"
                type="password"
                className="input"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="novaSenha" className="block text-sm text-muted-foreground mb-1">
                Nova senha (minimo 8 caracteres)
              </label>
              <input
                id="novaSenha"
                type="password"
                className="input"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmaSenha" className="block text-sm text-muted-foreground mb-1">
                Confirmar nova senha
              </label>
              <input
                id="confirmaSenha"
                type="password"
                className="input"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleTrocarSenha}
                disabled={salvandoSenha || !senhaAtual || !novaSenha || !confirmaSenha}
                className="btn-primary text-sm"
              >
                {salvandoSenha ? "Salvando..." : "Salvar nova senha"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarSenha(false);
                  setSenhaMsg(null);
                  setSenhaAtual("");
                  setNovaSenha("");
                  setConfirmaSenha("");
                }}
                className="btn-secondary text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Card: LGPD — Excluir conta */}
      <section className="card border-red-200 bg-red-50/30" aria-labelledby="secao-lgpd">
        <h2 id="secao-lgpd" className="text-base font-semibold text-red-700 mb-2">
          {LABELS.SECAO_LGPD}
        </h2>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {LABELS.EXCLUIR_AVISO}
        </p>

        {excluirMsg && (
          <div
            className={`px-3 py-2 rounded-lg text-sm mb-3 ${
              excluirMsg.tipo === "sucesso"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {excluirMsg.texto}
          </div>
        )}

        {!mostrarExcluir ? (
          <button
            type="button"
            onClick={() => setMostrarExcluir(true)}
            disabled={user.role !== "ADMIN"}
            className="px-4 py-2 rounded-lg border border-red-300 bg-white text-sm font-medium
                       text-red-600 hover:bg-red-50 transition-colors
                       disabled:opacity-60 disabled:cursor-not-allowed"
            title={user.role !== "ADMIN" ? "Apenas administradores podem excluir a conta" : undefined}
          >
            {LABELS.BTN_EXCLUIR_CONTA}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600 font-medium">
              Digite EXCLUIR para confirmar:
            </p>
            <input
              type="text"
              className="input border-red-300"
              placeholder="EXCLUIR"
              value={confirmacaoExcluir}
              onChange={(e) => setConfirmacaoExcluir(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleExcluirConta}
                disabled={confirmacaoExcluir !== "EXCLUIR" || excluindoConta}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium
                           hover:bg-red-700 transition-colors
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {excluindoConta ? "Excluindo..." : "Confirmar exclusao"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarExcluir(false);
                  setConfirmacaoExcluir("");
                  setExcluirMsg(null);
                }}
                className="btn-secondary text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
