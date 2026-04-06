/**
 * Página de Login — EcoTrack
 * Layout split-screen: painel verde à esquerda (md+), formulário à direita.
 * Server Component — sem "use client".
 */

import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Entrar | EcoTrack",
  description: "Acesse a plataforma EcoTrack de gestão inteligente de resíduos",
};

const LABELS = {
  TAGLINE: "Gestão inteligente de resíduos",
  BULLET_1: "Conformidade CONAMA 275/2001",
  BULLET_2: "Manifesto MTR digital",
  BULLET_3: "Rastreamento em tempo real",
  RODAPE_PAINEL: "Plataforma certificada SINIR",
  TITULO: "Bem-vindo de volta",
  SUBTITULO: "Entre com suas credenciais",
  LINK_CADASTRO_TEXTO: "Ainda não tem conta?",
  LINK_CADASTRO_CTA: "Cadastre sua empresa",
} as const;

function LogoLeaf() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="w-5 h-5"
    >
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 2 1 3.5 3 4 5-2-1-4-1-6-1-2.5 0-5 .8-6.8 2.6C6 13 5 15.3 5 18c0 .5.06 1 .14 1.5C4 15 5 11 8 9c0 0 3-3 9-1z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="w-4 h-4 flex-shrink-0 text-primary-300"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* ── Painel esquerdo — visível apenas md+ ─────────────────────────── */}
      <div
        className="hidden md:flex md:w-1/2 flex-col justify-between
                   bg-primary-700 px-10 py-12 text-white"
        aria-hidden="true"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center"
          >
            <LogoLeaf />
          </div>
          <span className="text-2xl font-bold tracking-tight">EcoTrack</span>
        </div>

        {/* Conteúdo central */}
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight text-white">
              {LABELS.TAGLINE}
            </h1>
            <p className="text-primary-200 text-base leading-relaxed">
              Conectamos empresas geradoras a coletores certificados com
              rastreabilidade completa e conformidade legal.
            </p>
          </div>

          <ul className="space-y-3" role="list">
            {([LABELS.BULLET_1, LABELS.BULLET_2, LABELS.BULLET_3] as const).map(
              (item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-primary-100">
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Rodapé do painel */}
        <p className="text-xs text-primary-400">{LABELS.RODAPE_PAINEL}</p>
      </div>

      {/* ── Painel direito — formulário ───────────────────────────────────── */}
      <div
        className="flex flex-1 flex-col items-center justify-center
                   bg-background px-4 py-10 sm:px-8"
      >
        <div className="w-full max-w-sm space-y-6">
          {/* Logo mobile — oculto em md+ */}
          <div className="flex items-center justify-center gap-2 md:hidden">
            <div
              className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white"
            >
              <LogoLeaf />
            </div>
            <span className="text-xl font-bold text-foreground">EcoTrack</span>
          </div>

          {/* Cabeçalho do formulário */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">{LABELS.TITULO}</h2>
            <p className="text-sm text-muted-foreground">{LABELS.SUBTITULO}</p>
          </div>

          {/* Card com o formulário */}
          <div className="card">
            <LoginForm />
          </div>

          {/* Link de cadastro */}
          <p className="text-center text-sm text-muted-foreground">
            {LABELS.LINK_CADASTRO_TEXTO}{" "}
            <Link
              href="/cadastro"
              className="font-medium text-primary hover:text-primary-700 hover:underline
                         transition-colors duration-150"
            >
              {LABELS.LINK_CADASTRO_CTA}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
