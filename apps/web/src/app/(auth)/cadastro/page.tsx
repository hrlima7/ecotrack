/**
 * Página de Cadastro — EcoTrack
 * Onboarding de nova empresa com campo CNPJ.
 * Wizard de 3 etapas: Empresa → Endereço → Admin
 */

import type { Metadata } from "next";
import { CadastroWizard } from "@/components/auth/CadastroWizard";

export const metadata: Metadata = {
  title: "Cadastrar Empresa",
  description:
    "Cadastre sua empresa na plataforma EcoTrack de gestão de resíduos",
};

export default function CadastroPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-2xl font-bold text-foreground">EcoTrack</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Cadastrar sua empresa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preencha os dados abaixo para criar sua conta
          </p>
        </div>

        <div className="card">
          <CadastroWizard />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Ja tem conta?{" "}
          <a href="/login" className="font-medium text-primary hover:underline">
            Entrar na plataforma
          </a>
        </p>
      </div>
    </main>
  );
}
