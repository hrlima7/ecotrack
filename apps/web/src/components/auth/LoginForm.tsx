/**
 * LoginForm — Formulário de autenticação
 * React Hook Form + Zod. Mobile-first. Sem strings hardcoded.
 * Inclui: toggle de visibilidade de senha, spinner no loading, erro global acessível.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { ROUTES } from "@ecotrack/shared";

const LABELS = {
  EMAIL: "E-mail",
  EMAIL_PLACEHOLDER: "seu@empresa.com",
  SENHA: "Senha",
  SENHA_PLACEHOLDER: "••••••••",
  MOSTRAR_SENHA: "Mostrar senha",
  OCULTAR_SENHA: "Ocultar senha",
  BTN_ENTRAR: "Entrar",
  BTN_CARREGANDO: "Entrando...",
  LINK_ESQUECI_SENHA: "Esqueci a senha",
  ERRO_GENERICO: "Credenciais inválidas. Verifique seus dados e tente novamente.",
  ERRO_EMAIL: "E-mail inválido",
  ERRO_SENHA_MIN: "Senha deve ter no mínimo 8 caracteres",
} as const;

const loginFormSchema = z.object({
  email: z.string().email(LABELS.ERRO_EMAIL),
  senha: z.string().min(8, LABELS.ERRO_SENHA_MIN),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

/** Ícone de olho aberto — senha visível */
function IconEyeOpen({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
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

/** Ícone de olho fechado — senha oculta */
function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
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

/** Spinner SVG animado para estado de carregamento */
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

/** Ícone de alerta para erros globais */
function IconAlerta({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const INPUT_BASE =
  "w-full px-3 py-2.5 rounded-md border border-border bg-white " +
  "text-sm text-foreground placeholder:text-muted-foreground " +
  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150";

const INPUT_ERROR =
  "border-danger-500 focus:ring-danger-500";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      await login(data.email, data.senha);
      router.push(ROUTES.DASHBOARD);
    } catch {
      setError("root", { message: LABELS.ERRO_GENERICO });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4"
      aria-label="Formulário de login"
    >
      {/* Campo E-mail */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          {LABELS.EMAIL}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={LABELS.EMAIL_PLACEHOLDER}
          className={`${INPUT_BASE} ${errors.email ? INPUT_ERROR : ""}`}
          {...register("email")}
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p
            id="email-error"
            className="field-error"
            role="alert"
            aria-live="polite"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Campo Senha */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="senha"
            className="block text-sm font-medium text-foreground"
          >
            {LABELS.SENHA}
          </label>
          <a
            href="/recuperar-senha"
            className="text-xs text-secondary hover:text-secondary-700 hover:underline
                       transition-colors duration-150"
          >
            {LABELS.LINK_ESQUECI_SENHA}
          </a>
        </div>

        {/* Wrapper relativo para posicionar o botão de olho */}
        <div className="relative">
          <input
            id="senha"
            type={senhaVisivel ? "text" : "password"}
            autoComplete="current-password"
            placeholder={LABELS.SENHA_PLACEHOLDER}
            className={`${INPUT_BASE} pr-10 ${errors.senha ? INPUT_ERROR : ""}`}
            {...register("senha")}
            disabled={isSubmitting}
            aria-invalid={!!errors.senha}
            aria-describedby={errors.senha ? "senha-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setSenhaVisivel((v) => !v)}
            disabled={isSubmitting}
            aria-label={senhaVisivel ? LABELS.OCULTAR_SENHA : LABELS.MOSTRAR_SENHA}
            aria-pressed={senhaVisivel}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-muted-foreground hover:text-foreground
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-150 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {senhaVisivel ? (
              <IconEyeOff className="w-4 h-4" />
            ) : (
              <IconEyeOpen className="w-4 h-4" />
            )}
          </button>
        </div>

        {errors.senha && (
          <p
            id="senha-error"
            className="field-error"
            role="alert"
            aria-live="polite"
          >
            {errors.senha.message}
          </p>
        )}
      </div>

      {/* Erro global */}
      {errors.root && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 rounded-md
                     bg-danger-50 border border-danger-200 px-3 py-2.5
                     text-sm text-danger-700"
        >
          <IconAlerta className="w-4 h-4 flex-shrink-0 mt-0.5 text-danger-500" />
          <span>{errors.root.message}</span>
        </div>
      )}

      {/* Botão submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
        aria-busy={isSubmitting}
        aria-label={isSubmitting ? LABELS.BTN_CARREGANDO : LABELS.BTN_ENTRAR}
      >
        {isSubmitting && <Spinner />}
        {isSubmitting ? LABELS.BTN_CARREGANDO : LABELS.BTN_ENTRAR}
      </button>
    </form>
  );
}
