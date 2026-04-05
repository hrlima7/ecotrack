/**
 * LoginForm — Formulário de autenticação
 * React Hook Form + Zod. Mobile-first. Sem strings hardcoded.
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { ROUTES } from "@ecotrack/shared";

const LABELS = {
  EMAIL: "E-mail",
  SENHA: "Senha",
  BTN_ENTRAR: "Entrar",
  BTN_CARREGANDO: "Entrando...",
  LINK_ESQUECI_SENHA: "Esqueci a senha",
  ERRO_GENERICO: "Credenciais inválidas. Tente novamente.",
} as const;

const loginFormSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

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
    } catch (err) {
      setError("root", { message: LABELS.ERRO_GENERICO });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
          placeholder="seu@email.com"
          className="w-full px-3 py-2.5 rounded-md border border-border bg-white
                     text-sm text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          {...register("email")}
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="field-error" role="alert">
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
            className="text-xs text-secondary hover:underline"
          >
            {LABELS.LINK_ESQUECI_SENHA}
          </a>
        </div>
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full px-3 py-2.5 rounded-md border border-border bg-white
                     text-sm text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          {...register("senha")}
          disabled={isSubmitting}
          aria-invalid={!!errors.senha}
          aria-describedby={errors.senha ? "senha-error" : undefined}
        />
        {errors.senha && (
          <p id="senha-error" className="field-error" role="alert">
            {errors.senha.message}
          </p>
        )}
      </div>

      {/* Erro geral */}
      {errors.root && (
        <div
          role="alert"
          className="rounded-md bg-danger-50 border border-danger-200 px-3 py-2.5
                     text-sm text-danger-700"
        >
          {errors.root.message}
        </div>
      )}

      {/* Botão submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
        aria-busy={isSubmitting}
      >
        {isSubmitting ? LABELS.BTN_CARREGANDO : LABELS.BTN_ENTRAR}
      </button>
    </form>
  );
}
