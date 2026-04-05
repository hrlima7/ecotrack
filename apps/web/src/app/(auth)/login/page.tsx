/**
 * Página de Login — EcoTrack
 * Mobile-first. Campos: email + senha. Link para cadastro.
 */

import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse a plataforma EcoTrack de gestão de resíduos",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-2xl font-bold text-foreground">EcoTrack</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestão inteligente de resíduos
          </p>
        </div>

        {/* Card de login */}
        <div className="card">
          <div className="space-y-1 mb-6">
            <h1 className="text-xl font-semibold text-foreground">
              Entrar na plataforma
            </h1>
            <p className="text-sm text-muted-foreground">
              Informe seus dados de acesso
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Link para cadastro */}
        <p className="text-center text-sm text-muted-foreground">
          Ainda nao tem conta?{" "}
          <a href="/cadastro" className="font-medium text-primary hover:underline">
            Cadastre sua empresa
          </a>
        </p>
      </div>
    </main>
  );
}
