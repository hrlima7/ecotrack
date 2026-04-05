/**
 * CadastroWizard — Onboarding em 3 etapas
 * Etapa 1: Dados da empresa (CNPJ, razão social, tipo)
 * Etapa 2: Endereço
 * Etapa 3: Usuário administrador
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ROUTES } from "@ecotrack/shared";

const ETAPAS = ["Empresa", "Endereco", "Administrador"] as const;
type Etapa = (typeof ETAPAS)[number];

const LABELS = {
  CNPJ: "CNPJ",
  RAZAO_SOCIAL: "Razao Social",
  TIPO_EMPRESA: "Tipo de Empresa",
  PROXIMO: "Proximo",
  VOLTAR: "Voltar",
  CADASTRAR: "Criar conta",
  CADASTRANDO: "Criando conta...",
} as const;

const empresaSchema = z.object({
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ invalido"),
  razaoSocial: z.string().min(3, "Minimo 3 caracteres"),
  nomeFantasia: z.string().optional(),
  tipo: z.enum(["GERADOR", "TRANSPORTADOR", "DESTINADOR"]),
});

const enderecoSchema = z.object({
  logradouro: z.string().min(3),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().length(2, "Use a sigla do estado"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP invalido"),
});

const adminSchema = z.object({
  nomeAdmin: z.string().min(2),
  emailAdmin: z.string().email("E-mail invalido"),
  senhaAdmin: z
    .string()
    .min(8, "Minimo 8 caracteres"),
});

type EmpresaValues = z.infer<typeof empresaSchema>;
type EnderecoValues = z.infer<typeof enderecoSchema>;
type AdminValues = z.infer<typeof adminSchema>;

export function CadastroWizard() {
  const router = useRouter();
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [dadosEmpresa, setDadosEmpresa] = useState<EmpresaValues | null>(null);
  const [dadosEndereco, setDadosEndereco] = useState<EnderecoValues | null>(null);

  const formEmpresa = useForm<EmpresaValues>({
    resolver: zodResolver(empresaSchema),
  });
  const formEndereco = useForm<EnderecoValues>({
    resolver: zodResolver(enderecoSchema),
  });
  const formAdmin = useForm<AdminValues>({
    resolver: zodResolver(adminSchema),
  });

  function avancarEtapa(dados: EmpresaValues | EnderecoValues) {
    if (etapaAtual === 0) setDadosEmpresa(dados as EmpresaValues);
    if (etapaAtual === 1) setDadosEndereco(dados as EnderecoValues);
    setEtapaAtual((e) => e + 1);
  }

  async function finalizarCadastro(dados: AdminValues) {
    // TODO: chamar API /auth/cadastro com todos os dados concatenados
    router.push(ROUTES.DASHBOARD);
  }

  return (
    <div className="space-y-6">
      {/* Indicador de progresso */}
      <div className="flex items-center gap-2" aria-label="Progresso do cadastro">
        {ETAPAS.map((etapa, idx) => (
          <div key={etapa} className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0
                ${idx <= etapaAtual ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
              aria-current={idx === etapaAtual ? "step" : undefined}
            >
              {idx + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block
                ${idx === etapaAtual ? "text-foreground" : "text-muted-foreground"}`}
            >
              {etapa}
            </span>
            {idx < ETAPAS.length - 1 && (
              <div
                className={`flex-1 h-px ${idx < etapaAtual ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Etapa 1: Empresa */}
      {etapaAtual === 0 && (
        <form
          onSubmit={formEmpresa.handleSubmit(avancarEtapa)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="cnpj" className="block text-sm font-medium text-foreground">
              {LABELS.CNPJ}
            </label>
            <input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...formEmpresa.register("cnpj")}
            />
            {formEmpresa.formState.errors.cnpj && (
              <p className="field-error">{formEmpresa.formState.errors.cnpj.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="razaoSocial" className="block text-sm font-medium text-foreground">
              {LABELS.RAZAO_SOCIAL}
            </label>
            <input
              id="razaoSocial"
              placeholder="Empresa Ltda"
              className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...formEmpresa.register("razaoSocial")}
            />
            {formEmpresa.formState.errors.razaoSocial && (
              <p className="field-error">
                {formEmpresa.formState.errors.razaoSocial.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tipo" className="block text-sm font-medium text-foreground">
              {LABELS.TIPO_EMPRESA}
            </label>
            <select
              id="tipo"
              className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...formEmpresa.register("tipo")}
            >
              <option value="">Selecione o tipo</option>
              <option value="GERADOR">Gerador de Residuos</option>
              <option value="TRANSPORTADOR">Transportador / Coletor</option>
              <option value="DESTINADOR">Destinador Final</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full">
            {LABELS.PROXIMO}
          </button>
        </form>
      )}

      {/* Etapa 2: Endereco */}
      {etapaAtual === 1 && (
        <form
          onSubmit={formEndereco.handleSubmit(avancarEtapa)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label htmlFor="logradouro" className="block text-sm font-medium text-foreground">
                Logradouro
              </label>
              <input
                id="logradouro"
                placeholder="Rua, Avenida..."
                className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                {...formEndereco.register("logradouro")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="numero" className="block text-sm font-medium text-foreground">
                Numero
              </label>
              <input
                id="numero"
                placeholder="123"
                className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                {...formEndereco.register("numero")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cep" className="block text-sm font-medium text-foreground">
                CEP
              </label>
              <input
                id="cep"
                placeholder="00000-000"
                className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                {...formEndereco.register("cep")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cidade" className="block text-sm font-medium text-foreground">
                Cidade
              </label>
              <input
                id="cidade"
                placeholder="Sao Paulo"
                className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                {...formEndereco.register("cidade")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="estado" className="block text-sm font-medium text-foreground">
                Estado
              </label>
              <input
                id="estado"
                placeholder="SP"
                maxLength={2}
                className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                {...formEndereco.register("estado")}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setEtapaAtual(0)}
            >
              {LABELS.VOLTAR}
            </button>
            <button type="submit" className="btn-primary flex-1">
              {LABELS.PROXIMO}
            </button>
          </div>
        </form>
      )}

      {/* Etapa 3: Administrador */}
      {etapaAtual === 2 && (
        <form
          onSubmit={formAdmin.handleSubmit(finalizarCadastro)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="nomeAdmin" className="block text-sm font-medium text-foreground">
              Seu nome
            </label>
            <input
              id="nomeAdmin"
              placeholder="Nome completo"
              className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...formAdmin.register("nomeAdmin")}
            />
            {formAdmin.formState.errors.nomeAdmin && (
              <p className="field-error">
                {formAdmin.formState.errors.nomeAdmin.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emailAdmin" className="block text-sm font-medium text-foreground">
              E-mail
            </label>
            <input
              id="emailAdmin"
              type="email"
              placeholder="admin@empresa.com"
              className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...formAdmin.register("emailAdmin")}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="senhaAdmin" className="block text-sm font-medium text-foreground">
              Senha
            </label>
            <input
              id="senhaAdmin"
              type="password"
              placeholder="Minimo 8 caracteres"
              className="w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...formAdmin.register("senhaAdmin")}
            />
            {formAdmin.formState.errors.senhaAdmin && (
              <p className="field-error">
                {formAdmin.formState.errors.senhaAdmin.message}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setEtapaAtual(1)}
            >
              {LABELS.VOLTAR}
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={formAdmin.formState.isSubmitting}
            >
              {formAdmin.formState.isSubmitting
                ? LABELS.CADASTRANDO
                : LABELS.CADASTRAR}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
