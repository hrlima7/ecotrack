/**
 * Pagina de Perfil — EcoTrack
 * Exibe e permite editar dados do usuario e da empresa.
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth.context";
import { API_ROUTES } from "@ecotrack/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const LABELS = {
  TITULO: "Meu Perfil",
  SUBTITULO: "Visualize e edite suas informacoes",

  SECAO_USUARIO: "Dados pessoais",
  CAMPO_NOME: "Nome",
  CAMPO_EMAIL: "E-mail",
  CAMPO_PERFIL: "Perfil de acesso",

  SECAO_EMPRESA: "Empresa",
  CAMPO_RAZAO_SOCIAL: "Razao social",
  CAMPO_NOME_FANTASIA: "Nome fantasia",
  CAMPO_CNPJ: "CNPJ",
  CAMPO_PLANO: "Plano",
  CAMPO_TIPO: "Tipo de atuacao",

  SECAO_ENDERECO: "Endereco",
  CAMPO_LOGRADOURO: "Logradouro",
  CAMPO_NUMERO: "Numero",
  CAMPO_COMPLEMENTO: "Complemento",
  CAMPO_BAIRRO: "Bairro",
  CAMPO_CIDADE: "Cidade",
  CAMPO_ESTADO: "Estado",
  CAMPO_CEP: "CEP",

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

  BTN_EDITAR: "Editar empresa",
  BTN_SALVAR: "Salvar",
  BTN_CANCELAR: "Cancelar",
  SALVANDO: "Salvando...",
  SALVO: "Dados atualizados com sucesso",
  ERRO: "Erro ao atualizar dados",
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

interface EmpresaDetalhe {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  tipo: string;
  plano: string;
  email: string;
  telefone?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
}

export default function PerfilPage() {
  const { user, accessToken, isLoading } = useAuth();
  const [empresaDetalhe, setEmpresaDetalhe] = useState<EmpresaDetalhe | null>(null);
  const [carregandoEmpresa, setCarregandoEmpresa] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [formData, setFormData] = useState({
    nomeFantasia: "",
    telefone: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  async function carregarEmpresa() {
    if (!accessToken || empresaDetalhe) return;
    setCarregandoEmpresa(true);
    try {
      const res = await fetch(`${API_BASE}${API_ROUTES.EMPRESAS.ME}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        setEmpresaDetalhe(json.data);
      }
    } catch {
      // silencioso — mostra dados básicos do contexto
    } finally {
      setCarregandoEmpresa(false);
    }
  }

  // Carrega dados da empresa ao montar
  useState(() => {
    carregarEmpresa();
  });

  function iniciarEdicao() {
    const emp = empresaDetalhe;
    if (!emp) return;
    setFormData({
      nomeFantasia: emp.nomeFantasia ?? "",
      telefone: emp.telefone ?? "",
      logradouro: emp.logradouro ?? "",
      numero: emp.numero ?? "",
      complemento: emp.complemento ?? "",
      bairro: emp.bairro ?? "",
      cidade: emp.cidade ?? "",
      estado: emp.estado ?? "",
      cep: emp.cep ?? "",
    });
    setEditando(true);
    setMensagem(null);
  }

  async function handleSalvar() {
    if (!accessToken) return;
    setSalvando(true);
    setMensagem(null);

    // Enviar apenas campos preenchidos
    const payload: Record<string, string> = {};
    for (const [key, val] of Object.entries(formData)) {
      if (val.trim()) payload[key] = val.trim();
    }

    try {
      const res = await fetch(`${API_BASE}${API_ROUTES.EMPRESAS.ME}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMensagem({ tipo: "sucesso", texto: LABELS.SALVO });
        setEditando(false);
        // Recarregar dados
        const resMe = await fetch(`${API_BASE}${API_ROUTES.EMPRESAS.ME}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (resMe.ok) {
          const json = await resMe.json();
          setEmpresaDetalhe(json.data);
        }
      } else {
        const json = await res.json();
        setMensagem({ tipo: "erro", texto: json.error?.message ?? LABELS.ERRO });
      }
    } catch {
      setMensagem({ tipo: "erro", texto: LABELS.ERRO });
    } finally {
      setSalvando(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const empresa = empresaDetalhe ?? user.empresa;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{LABELS.TITULO}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{LABELS.SUBTITULO}</p>
      </div>

      {/* Mensagem de feedback */}
      {mensagem && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            mensagem.tipo === "sucesso"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      {/* Card: Avatar + Nome */}
      <section className="card flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xl">
            {user.nome.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{user.nome}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
            {roleLabel(user.role)}
          </span>
        </div>
      </section>

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
        <div className="flex items-center justify-between mb-1">
          <h2 id="secao-empresa" className="text-base font-semibold text-foreground">
            {LABELS.SECAO_EMPRESA}
          </h2>
          {!editando && user.role === "ADMIN" && empresaDetalhe && (
            <button
              type="button"
              onClick={iniciarEdicao}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {LABELS.BTN_EDITAR}
            </button>
          )}
        </div>

        {carregandoEmpresa ? (
          <div className="py-6 text-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div>
            <InfoRow label={LABELS.CAMPO_RAZAO_SOCIAL} valor={empresa.razaoSocial} />
            {(empresa as EmpresaDetalhe).cnpj && (
              <InfoRow label={LABELS.CAMPO_CNPJ} valor={(empresa as EmpresaDetalhe).cnpj} />
            )}
            <InfoRow label={LABELS.CAMPO_TIPO} valor={tipoLabel(empresa.tipo)} />
            <InfoRow label={LABELS.CAMPO_PLANO} valor={planoLabel(empresa.plano)} />
            {empresaDetalhe?.nomeFantasia && (
              <InfoRow label={LABELS.CAMPO_NOME_FANTASIA} valor={empresaDetalhe.nomeFantasia} />
            )}
          </div>
        )}
      </section>

      {/* Card: Endereco */}
      {empresaDetalhe?.logradouro && !editando && (
        <section className="card" aria-labelledby="secao-endereco">
          <h2 id="secao-endereco" className="text-base font-semibold text-foreground mb-1">
            {LABELS.SECAO_ENDERECO}
          </h2>
          <div>
            <InfoRow
              label={LABELS.CAMPO_LOGRADOURO}
              valor={`${empresaDetalhe.logradouro}, ${empresaDetalhe.numero ?? ""}${empresaDetalhe.complemento ? ` - ${empresaDetalhe.complemento}` : ""}`}
            />
            <InfoRow label={LABELS.CAMPO_BAIRRO} valor={empresaDetalhe.bairro ?? "-"} />
            <InfoRow label={LABELS.CAMPO_CIDADE} valor={`${empresaDetalhe.cidade ?? "-"} / ${empresaDetalhe.estado ?? "-"}`} />
            <InfoRow label={LABELS.CAMPO_CEP} valor={empresaDetalhe.cep ?? "-"} />
          </div>
        </section>
      )}

      {/* Formulario de edicao */}
      {editando && (
        <section className="card" aria-labelledby="secao-editar">
          <h2 id="secao-editar" className="text-base font-semibold text-foreground mb-3">
            Editar dados da empresa
          </h2>
          <div className="space-y-3">
            {[
              { key: "nomeFantasia", label: LABELS.CAMPO_NOME_FANTASIA },
              { key: "telefone", label: "Telefone" },
              { key: "logradouro", label: LABELS.CAMPO_LOGRADOURO },
              { key: "numero", label: LABELS.CAMPO_NUMERO },
              { key: "complemento", label: LABELS.CAMPO_COMPLEMENTO },
              { key: "bairro", label: LABELS.CAMPO_BAIRRO },
              { key: "cidade", label: LABELS.CAMPO_CIDADE },
              { key: "estado", label: LABELS.CAMPO_ESTADO },
              { key: "cep", label: LABELS.CAMPO_CEP },
            ].map(({ key, label }) => (
              <div key={key}>
                <label htmlFor={key} className="block text-sm text-muted-foreground mb-1">
                  {label}
                </label>
                <input
                  id={key}
                  type="text"
                  className="input"
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleSalvar}
              disabled={salvando}
              className="btn-primary text-sm"
            >
              {salvando ? LABELS.SALVANDO : LABELS.BTN_SALVAR}
            </button>
            <button
              type="button"
              onClick={() => { setEditando(false); setMensagem(null); }}
              className="btn-secondary text-sm"
            >
              {LABELS.BTN_CANCELAR}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
