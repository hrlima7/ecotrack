/**
 * CadastroWizard — Onboarding em 3 etapas
 * Etapa 1: Dados da empresa (CNPJ com máscara, Razão Social, Tipo, E-mail, Telefone)
 * Etapa 2: Endereço (CEP com busca automática via ViaCEP)
 * Etapa 3: Usuário administrador (Nome, E-mail, Senha, Confirmar senha)
 *
 * Chama POST /api/v1/auth/cadastro na etapa 3.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ROUTES } from "@ecotrack/shared";
import { useAuth } from "@/contexts/auth.context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Constantes de texto ───────────────────────────────────────────────────

const LABELS = {
  // Etapas
  ETAPA_EMPRESA: "Empresa",
  ETAPA_ENDERECO: "Endereço",
  ETAPA_ADMIN: "Administrador",

  // Campos — Empresa
  CNPJ: "CNPJ",
  CNPJ_PLACEHOLDER: "00.000.000/0000-00",
  RAZAO_SOCIAL: "Razão Social",
  RAZAO_SOCIAL_PLACEHOLDER: "Nome da empresa conforme CNPJ",
  EMAIL_EMPRESA: "E-mail da empresa",
  EMAIL_EMPRESA_PLACEHOLDER: "contato@empresa.com.br",
  TELEFONE: "Telefone",
  TELEFONE_PLACEHOLDER: "(11) 99999-9999",
  TIPO_EMPRESA: "Tipo de atuação",
  TIPO_PLACEHOLDER: "Selecione o tipo",
  TIPO_GERADOR: "Gerador de Resíduos",
  TIPO_TRANSPORTADOR: "Transportador / Coletor",
  TIPO_DESTINADOR: "Destinador Final",

  // Campos — Endereço
  CEP: "CEP",
  CEP_PLACEHOLDER: "00000-000",
  CEP_BUSCANDO: "Buscando...",
  CEP_ERRO_BUSCA: "CEP não encontrado. Preencha manualmente.",
  LOGRADOURO: "Logradouro",
  LOGRADOURO_PLACEHOLDER: "Rua, Avenida, Travessa...",
  NUMERO: "Número",
  NUMERO_PLACEHOLDER: "123",
  COMPLEMENTO: "Complemento",
  COMPLEMENTO_PLACEHOLDER: "Sala, andar, bloco (opcional)",
  BAIRRO: "Bairro",
  BAIRRO_PLACEHOLDER: "Nome do bairro",
  CIDADE: "Cidade",
  CIDADE_PLACEHOLDER: "Nome da cidade",
  ESTADO: "UF",
  ESTADO_PLACEHOLDER: "SP",

  // Campos — Admin
  NOME_ADMIN: "Nome completo",
  NOME_ADMIN_PLACEHOLDER: "Seu nome completo",
  EMAIL_ADMIN: "E-mail pessoal",
  EMAIL_ADMIN_PLACEHOLDER: "voce@empresa.com",
  SENHA: "Senha",
  SENHA_PLACEHOLDER: "Mínimo 8 caracteres",
  CONFIRMAR_SENHA: "Confirmar senha",
  CONFIRMAR_SENHA_PLACEHOLDER: "Repita a senha",
  MOSTRAR_SENHA: "Mostrar senha",
  OCULTAR_SENHA: "Ocultar senha",

  // Botões
  PROXIMO: "Próximo",
  VOLTAR: "Voltar",
  CADASTRAR: "Criar conta",
  CADASTRANDO: "Criando conta...",

  // Erros
  ERRO_CNPJ: "CNPJ inválido. Use o formato XX.XXX.XXX/XXXX-XX",
  ERRO_RAZAO_SOCIAL: "Mínimo 3 caracteres",
  ERRO_EMAIL: "E-mail inválido",
  ERRO_TELEFONE: "Telefone inválido",
  ERRO_TIPO: "Selecione o tipo de empresa",
  ERRO_CEP: "CEP inválido. Use o formato 00000-000",
  ERRO_LOGRADOURO: "Logradouro obrigatório",
  ERRO_NUMERO: "Número obrigatório",
  ERRO_BAIRRO: "Bairro obrigatório",
  ERRO_CIDADE: "Cidade obrigatória",
  ERRO_ESTADO: "Use a sigla do estado (ex: SP)",
  ERRO_NOME_ADMIN: "Mínimo 2 caracteres",
  ERRO_SENHA_MIN: "Mínimo 8 caracteres",
  ERRO_SENHA_CONFIRMACAO: "As senhas não conferem",
  ERRO_CADASTRO: "Erro ao criar conta. Tente novamente.",
} as const;

// ─── Schemas de validação ──────────────────────────────────────────────────

const empresaSchema = z.object({
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, LABELS.ERRO_CNPJ),
  razaoSocial: z.string().min(3, LABELS.ERRO_RAZAO_SOCIAL),
  emailEmpresa: z.string().email(LABELS.ERRO_EMAIL),
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, LABELS.ERRO_TELEFONE),
  tipo: z.enum(["GERADOR", "TRANSPORTADOR", "DESTINADOR"], {
    errorMap: () => ({ message: LABELS.ERRO_TIPO }),
  }),
});

const enderecoSchema = z.object({
  cep: z.string().regex(/^\d{5}-\d{3}$/, LABELS.ERRO_CEP),
  logradouro: z.string().min(3, LABELS.ERRO_LOGRADOURO),
  numero: z.string().min(1, LABELS.ERRO_NUMERO),
  complemento: z.string().optional(),
  bairro: z.string().min(2, LABELS.ERRO_BAIRRO),
  cidade: z.string().min(2, LABELS.ERRO_CIDADE),
  estado: z.string().length(2, LABELS.ERRO_ESTADO),
});

const adminSchema = z
  .object({
    nomeAdmin: z.string().min(2, LABELS.ERRO_NOME_ADMIN),
    emailAdmin: z.string().email(LABELS.ERRO_EMAIL),
    senhaAdmin: z.string().min(8, LABELS.ERRO_SENHA_MIN),
    confirmarSenha: z.string().min(8, LABELS.ERRO_SENHA_MIN),
  })
  .refine((data) => data.senhaAdmin === data.confirmarSenha, {
    message: LABELS.ERRO_SENHA_CONFIRMACAO,
    path: ["confirmarSenha"],
  });

type EmpresaValues = z.infer<typeof empresaSchema>;
type EnderecoValues = z.infer<typeof enderecoSchema>;
type AdminValues = z.infer<typeof adminSchema>;

// ─── Interface ViaCEP ──────────────────────────────────────────────────────

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

// ─── Ícones inline ─────────────────────────────────────────────────────────

function IconEyeOpen() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="w-4 h-4"
    >
      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path
        fillRule="evenodd"
        d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z"
        clipRule="evenodd"
      />
      <path d="m10.748 13.93 2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="w-4 h-4 animate-spin"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
      />
    </svg>
  );
}

function IconAlerta() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="w-4 h-4 flex-shrink-0 mt-0.5 text-danger-500"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ─── Componentes internos ──────────────────────────────────────────────────

const INPUT_BASE =
  "w-full px-3 py-2.5 rounded-md border border-border bg-white " +
  "text-sm text-foreground placeholder:text-muted-foreground " +
  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150";

const INPUT_ERROR = "border-danger-500 focus:ring-danger-500";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          className="field-error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Máscaras ──────────────────────────────────────────────────────────────

function aplicarMascaraCNPJ(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 14);
  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
}

function aplicarMascaraTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/^(\(\d{2}\) \d{4})(\d)/, "$1-$2");
  }
  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^(\(\d{2}\) \d{5})(\d)/, "$1-$2");
}

function aplicarMascaraCEP(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);
  return numeros.replace(/^(\d{5})(\d)/, "$1-$2");
}

// ─── Etapa 1 — Empresa ─────────────────────────────────────────────────────

interface EtapaEmpresaProps {
  onAvancar: (dados: EmpresaValues) => void;
}

function EtapaEmpresa({ onAvancar }: EtapaEmpresaProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmpresaValues>({ resolver: zodResolver(empresaSchema) });

  return (
    <form onSubmit={handleSubmit(onAvancar)} noValidate className="space-y-4">
      <Field id="cnpj" label={LABELS.CNPJ} error={errors.cnpj?.message}>
        <input
          id="cnpj"
          placeholder={LABELS.CNPJ_PLACEHOLDER}
          inputMode="numeric"
          className={`${INPUT_BASE} ${errors.cnpj ? INPUT_ERROR : ""}`}
          aria-invalid={!!errors.cnpj}
          aria-describedby={errors.cnpj ? "cnpj-error" : undefined}
          {...register("cnpj", {
            onChange: (e) => {
              e.target.value = aplicarMascaraCNPJ(e.target.value);
              setValue("cnpj", e.target.value, { shouldValidate: false });
            },
          })}
        />
      </Field>

      <Field
        id="razaoSocial"
        label={LABELS.RAZAO_SOCIAL}
        error={errors.razaoSocial?.message}
      >
        <input
          id="razaoSocial"
          placeholder={LABELS.RAZAO_SOCIAL_PLACEHOLDER}
          className={`${INPUT_BASE} ${errors.razaoSocial ? INPUT_ERROR : ""}`}
          aria-invalid={!!errors.razaoSocial}
          aria-describedby={errors.razaoSocial ? "razaoSocial-error" : undefined}
          {...register("razaoSocial")}
        />
      </Field>

      <Field
        id="tipo"
        label={LABELS.TIPO_EMPRESA}
        error={errors.tipo?.message}
      >
        <select
          id="tipo"
          className={`${INPUT_BASE} ${errors.tipo ? INPUT_ERROR : ""}`}
          aria-invalid={!!errors.tipo}
          aria-describedby={errors.tipo ? "tipo-error" : undefined}
          defaultValue=""
          {...register("tipo")}
        >
          <option value="" disabled>
            {LABELS.TIPO_PLACEHOLDER}
          </option>
          <option value="GERADOR">{LABELS.TIPO_GERADOR}</option>
          <option value="TRANSPORTADOR">{LABELS.TIPO_TRANSPORTADOR}</option>
          <option value="DESTINADOR">{LABELS.TIPO_DESTINADOR}</option>
        </select>
      </Field>

      <Field
        id="emailEmpresa"
        label={LABELS.EMAIL_EMPRESA}
        error={errors.emailEmpresa?.message}
      >
        <input
          id="emailEmpresa"
          type="email"
          placeholder={LABELS.EMAIL_EMPRESA_PLACEHOLDER}
          autoComplete="organization-email"
          className={`${INPUT_BASE} ${errors.emailEmpresa ? INPUT_ERROR : ""}`}
          aria-invalid={!!errors.emailEmpresa}
          aria-describedby={errors.emailEmpresa ? "emailEmpresa-error" : undefined}
          {...register("emailEmpresa")}
        />
      </Field>

      <Field
        id="telefone"
        label={LABELS.TELEFONE}
        error={errors.telefone?.message}
      >
        <input
          id="telefone"
          type="tel"
          placeholder={LABELS.TELEFONE_PLACEHOLDER}
          inputMode="tel"
          className={`${INPUT_BASE} ${errors.telefone ? INPUT_ERROR : ""}`}
          aria-invalid={!!errors.telefone}
          aria-describedby={errors.telefone ? "telefone-error" : undefined}
          {...register("telefone", {
            onChange: (e) => {
              e.target.value = aplicarMascaraTelefone(e.target.value);
              setValue("telefone", e.target.value, { shouldValidate: false });
            },
          })}
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
        aria-busy={isSubmitting}
      >
        {isSubmitting && <Spinner />}
        {LABELS.PROXIMO}
      </button>
    </form>
  );
}

// ─── Etapa 2 — Endereço ────────────────────────────────────────────────────

interface EtapaEnderecoProps {
  onAvancar: (dados: EnderecoValues) => void;
  onVoltar: () => void;
}

function EtapaEndereco({ onAvancar, onVoltar }: EtapaEnderecoProps) {
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EnderecoValues>({ resolver: zodResolver(enderecoSchema) });

  async function buscarCep(cepRaw: string) {
    const cepLimpo = cepRaw.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    setErroCep(null);

    try {
      const res = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );
      const data: ViaCepResponse = await res.json();

      if (data.erro) {
        setErroCep(LABELS.CEP_ERRO_BUSCA);
        return;
      }

      setValue("logradouro", data.logradouro, { shouldValidate: true });
      setValue("bairro", data.bairro, { shouldValidate: true });
      setValue("cidade", data.localidade, { shouldValidate: true });
      setValue("estado", data.uf, { shouldValidate: true });
      if (data.complemento) {
        setValue("complemento", data.complemento);
      }
    } catch {
      setErroCep(LABELS.CEP_ERRO_BUSCA);
    } finally {
      setBuscandoCep(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onAvancar)} noValidate className="space-y-4">
      {/* CEP com busca automática */}
      <Field id="cep" label={LABELS.CEP} error={errors.cep?.message ?? erroCep ?? undefined}>
        <div className="relative">
          <input
            id="cep"
            placeholder={LABELS.CEP_PLACEHOLDER}
            inputMode="numeric"
            className={`${INPUT_BASE} ${
              errors.cep || erroCep ? INPUT_ERROR : ""
            } ${buscandoCep ? "pr-10" : ""}`}
            aria-invalid={!!errors.cep || !!erroCep}
            aria-describedby="cep-error"
            {...register("cep", {
              onChange: (e) => {
                const mascarado = aplicarMascaraCEP(e.target.value);
                e.target.value = mascarado;
                setValue("cep", mascarado, { shouldValidate: false });
                buscarCep(mascarado);
              },
            })}
          />
          {buscandoCep && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Spinner />
            </div>
          )}
        </div>
      </Field>

      <Field
        id="logradouro"
        label={LABELS.LOGRADOURO}
        error={errors.logradouro?.message}
      >
        <input
          id="logradouro"
          placeholder={LABELS.LOGRADOURO_PLACEHOLDER}
          className={`${INPUT_BASE} ${errors.logradouro ? INPUT_ERROR : ""}`}
          aria-invalid={!!errors.logradouro}
          aria-describedby={errors.logradouro ? "logradouro-error" : undefined}
          {...register("logradouro")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field
          id="numero"
          label={LABELS.NUMERO}
          error={errors.numero?.message}
        >
          <input
            id="numero"
            placeholder={LABELS.NUMERO_PLACEHOLDER}
            className={`${INPUT_BASE} ${errors.numero ? INPUT_ERROR : ""}`}
            aria-invalid={!!errors.numero}
            aria-describedby={errors.numero ? "numero-error" : undefined}
            {...register("numero")}
          />
        </Field>

        <Field id="complemento" label={LABELS.COMPLEMENTO}>
          <input
            id="complemento"
            placeholder={LABELS.COMPLEMENTO_PLACEHOLDER}
            className={INPUT_BASE}
            {...register("complemento")}
          />
        </Field>
      </div>

      <Field id="bairro" label={LABELS.BAIRRO} error={errors.bairro?.message}>
        <input
          id="bairro"
          placeholder={LABELS.BAIRRO_PLACEHOLDER}
          className={`${INPUT_BASE} ${errors.bairro ? INPUT_ERROR : ""}`}
          aria-invalid={!!errors.bairro}
          aria-describedby={errors.bairro ? "bairro-error" : undefined}
          {...register("bairro")}
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Field
            id="cidade"
            label={LABELS.CIDADE}
            error={errors.cidade?.message}
          >
            <input
              id="cidade"
              placeholder={LABELS.CIDADE_PLACEHOLDER}
              className={`${INPUT_BASE} ${errors.cidade ? INPUT_ERROR : ""}`}
              aria-invalid={!!errors.cidade}
              aria-describedby={errors.cidade ? "cidade-error" : undefined}
              {...register("cidade")}
            />
          </Field>
        </div>

        <Field id="estado" label={LABELS.ESTADO} error={errors.estado?.message}>
          <input
            id="estado"
            placeholder={LABELS.ESTADO_PLACEHOLDER}
            maxLength={2}
            className={`${INPUT_BASE} uppercase ${errors.estado ? INPUT_ERROR : ""}`}
            aria-invalid={!!errors.estado}
            aria-describedby={errors.estado ? "estado-error" : undefined}
            {...register("estado", {
              onChange: (e) => {
                e.target.value = e.target.value.toUpperCase();
                setValue("estado", e.target.value, { shouldValidate: false });
              },
            })}
          />
        </Field>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onVoltar}
          className="btn-secondary flex-1"
        >
          {LABELS.VOLTAR}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || buscandoCep}
          className="btn-primary flex-1"
          aria-busy={isSubmitting}
        >
          {isSubmitting && <Spinner />}
          {LABELS.PROXIMO}
        </button>
      </div>
    </form>
  );
}

// ─── Etapa 3 — Administrador ───────────────────────────────────────────────

interface EtapaAdminProps {
  onCadastrar: (dados: AdminValues) => Promise<void>;
  onVoltar: () => void;
  erroCadastro: string | null;
}

function EtapaAdmin({ onCadastrar, onVoltar, erroCadastro }: EtapaAdminProps) {
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [confirmarVisivel, setConfirmarVisivel] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminValues>({ resolver: zodResolver(adminSchema) });

  return (
    <form onSubmit={handleSubmit(onCadastrar)} noValidate className="space-y-4">
      <Field
        id="nomeAdmin"
        label={LABELS.NOME_ADMIN}
        error={errors.nomeAdmin?.message}
      >
        <input
          id="nomeAdmin"
          type="text"
          placeholder={LABELS.NOME_ADMIN_PLACEHOLDER}
          autoComplete="name"
          className={`${INPUT_BASE} ${errors.nomeAdmin ? INPUT_ERROR : ""}`}
          aria-invalid={!!errors.nomeAdmin}
          aria-describedby={errors.nomeAdmin ? "nomeAdmin-error" : undefined}
          {...register("nomeAdmin")}
        />
      </Field>

      <Field
        id="emailAdmin"
        label={LABELS.EMAIL_ADMIN}
        error={errors.emailAdmin?.message}
      >
        <input
          id="emailAdmin"
          type="email"
          placeholder={LABELS.EMAIL_ADMIN_PLACEHOLDER}
          autoComplete="email"
          className={`${INPUT_BASE} ${errors.emailAdmin ? INPUT_ERROR : ""}`}
          aria-invalid={!!errors.emailAdmin}
          aria-describedby={errors.emailAdmin ? "emailAdmin-error" : undefined}
          {...register("emailAdmin")}
        />
      </Field>

      <Field
        id="senhaAdmin"
        label={LABELS.SENHA}
        error={errors.senhaAdmin?.message}
      >
        <div className="relative">
          <input
            id="senhaAdmin"
            type={senhaVisivel ? "text" : "password"}
            placeholder={LABELS.SENHA_PLACEHOLDER}
            autoComplete="new-password"
            className={`${INPUT_BASE} pr-10 ${errors.senhaAdmin ? INPUT_ERROR : ""}`}
            aria-invalid={!!errors.senhaAdmin}
            aria-describedby={errors.senhaAdmin ? "senhaAdmin-error" : undefined}
            {...register("senhaAdmin")}
          />
          <button
            type="button"
            onClick={() => setSenhaVisivel((v) => !v)}
            aria-label={senhaVisivel ? LABELS.OCULTAR_SENHA : LABELS.MOSTRAR_SENHA}
            aria-pressed={senhaVisivel}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-muted-foreground hover:text-foreground
                       transition-colors duration-150 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {senhaVisivel ? <IconEyeOff /> : <IconEyeOpen />}
          </button>
        </div>
      </Field>

      <Field
        id="confirmarSenha"
        label={LABELS.CONFIRMAR_SENHA}
        error={errors.confirmarSenha?.message}
      >
        <div className="relative">
          <input
            id="confirmarSenha"
            type={confirmarVisivel ? "text" : "password"}
            placeholder={LABELS.CONFIRMAR_SENHA_PLACEHOLDER}
            autoComplete="new-password"
            className={`${INPUT_BASE} pr-10 ${errors.confirmarSenha ? INPUT_ERROR : ""}`}
            aria-invalid={!!errors.confirmarSenha}
            aria-describedby={
              errors.confirmarSenha ? "confirmarSenha-error" : undefined
            }
            {...register("confirmarSenha")}
          />
          <button
            type="button"
            onClick={() => setConfirmarVisivel((v) => !v)}
            aria-label={
              confirmarVisivel ? LABELS.OCULTAR_SENHA : LABELS.MOSTRAR_SENHA
            }
            aria-pressed={confirmarVisivel}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-muted-foreground hover:text-foreground
                       transition-colors duration-150 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {confirmarVisivel ? <IconEyeOff /> : <IconEyeOpen />}
          </button>
        </div>
      </Field>

      {/* Erro global de cadastro */}
      {erroCadastro && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 rounded-md
                     bg-danger-50 border border-danger-200 px-3 py-2.5
                     text-sm text-danger-700"
        >
          <IconAlerta />
          <span>{erroCadastro}</span>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onVoltar}
          disabled={isSubmitting}
          className="btn-secondary flex-1"
        >
          {LABELS.VOLTAR}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex-1"
          aria-busy={isSubmitting}
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? LABELS.CADASTRANDO : LABELS.CADASTRAR}
        </button>
      </div>
    </form>
  );
}

// ─── Barra de progresso ────────────────────────────────────────────────────

const ETAPAS_NOMES = [
  LABELS.ETAPA_EMPRESA,
  LABELS.ETAPA_ENDERECO,
  LABELS.ETAPA_ADMIN,
] as const;

interface BarraProgressoProps {
  etapaAtual: number;
}

function BarraProgresso({ etapaAtual }: BarraProgressoProps) {
  return (
    <nav aria-label="Progresso do cadastro">
      <ol className="flex items-center" role="list">
        {ETAPAS_NOMES.map((nome, idx) => {
          const concluida = idx < etapaAtual;
          const atual = idx === etapaAtual;

          return (
            <li
              key={nome}
              className={`flex items-center ${
                idx < ETAPAS_NOMES.length - 1 ? "flex-1" : ""
              }`}
            >
              {/* Marcador da etapa */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center
                              text-xs font-semibold flex-shrink-0 border-2 transition-colors
                              ${
                                concluida
                                  ? "bg-primary border-primary text-white"
                                  : atual
                                  ? "bg-white border-primary text-primary"
                                  : "bg-white border-border text-muted-foreground"
                              }`}
                  aria-current={atual ? "step" : undefined}
                >
                  {concluida ? (
                    /* Check mark para etapas concluídas */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium hidden sm:block whitespace-nowrap
                              ${
                                atual
                                  ? "text-primary"
                                  : concluida
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                >
                  {nome}
                </span>
              </div>

              {/* Linha de conexão entre etapas */}
              {idx < ETAPAS_NOMES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-5 sm:mb-4 transition-colors ${
                    concluida ? "bg-primary" : "bg-border"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────

export function CadastroWizard() {
  const router = useRouter();
  const { loginComTokens } = useAuth();
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [dadosEmpresa, setDadosEmpresa] = useState<EmpresaValues | null>(null);
  const [dadosEndereco, setDadosEndereco] = useState<EnderecoValues | null>(null);
  const [erroCadastro, setErroCadastro] = useState<string | null>(null);

  function handleAvancarEmpresa(dados: EmpresaValues) {
    setDadosEmpresa(dados);
    setEtapaAtual(1);
  }

  function handleAvancarEndereco(dados: EnderecoValues) {
    setDadosEndereco(dados);
    setEtapaAtual(2);
  }

  async function handleFinalizarCadastro(dadosAdmin: AdminValues) {
    if (!dadosEmpresa || !dadosEndereco) return;

    setErroCadastro(null);

    // A API espera payload flat (cadastroEmpresaSchema):
    // campos da empresa: cnpj, razaoSocial, email, telefone, tipo
    // campos de endereco: logradouro, numero, complemento, bairro, cidade, estado, cep
    // campos do admin: nomeAdmin, emailAdmin, senhaAdmin
    const payload = {
      cnpj: dadosEmpresa.cnpj,
      razaoSocial: dadosEmpresa.razaoSocial,
      email: dadosEmpresa.emailEmpresa,
      telefone: dadosEmpresa.telefone,
      tipo: dadosEmpresa.tipo,
      logradouro: dadosEndereco.logradouro,
      numero: dadosEndereco.numero,
      complemento: dadosEndereco.complemento,
      bairro: dadosEndereco.bairro,
      cidade: dadosEndereco.cidade,
      estado: dadosEndereco.estado,
      cep: dadosEndereco.cep,
      nomeAdmin: dadosAdmin.nomeAdmin,
      emailAdmin: dadosAdmin.emailAdmin,
      senhaAdmin: dadosAdmin.senhaAdmin,
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setErroCadastro(json?.error?.message ?? LABELS.ERRO_CADASTRO);
        return;
      }

      // Usar o login do AuthContext para salvar tokens e redirecionar
      // A API de cadastro retorna tokens — fazemos login direto com as credenciais
      await login(payload.emailAdmin, payload.senhaAdmin);
      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      setErroCadastro(err instanceof Error ? err.message : LABELS.ERRO_CADASTRO);
    }
  }

  return (
    <div className="space-y-6">
      <BarraProgresso etapaAtual={etapaAtual} />

      {etapaAtual === 0 && (
        <EtapaEmpresa onAvancar={handleAvancarEmpresa} />
      )}

      {etapaAtual === 1 && (
        <EtapaEndereco
          onAvancar={handleAvancarEndereco}
          onVoltar={() => setEtapaAtual(0)}
        />
      )}

      {etapaAtual === 2 && (
        <EtapaAdmin
          onCadastrar={handleFinalizarCadastro}
          onVoltar={() => setEtapaAtual(1)}
          erroCadastro={erroCadastro}
        />
      )}
    </div>
  );
}
