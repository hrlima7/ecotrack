/**
 * Spinner — EcoTrack
 *
 * SVG animado para estados de loading em botões e ações inline.
 * Nunca usar como spinner centralizado de página inteira; para isso,
 * use skeleton screens (ver classe `.skeleton` no globals.css).
 *
 * Uso:
 *   <Spinner />                          // sm, cor herdada do contexto
 *   <Spinner size="md" />                // 20px
 *   <Spinner size="sm" className="text-white" />  // dentro de btn-primary
 */

import { cn } from "@/lib/utils";

interface SpinnerProps {
  /**
   * "sm" → 16px (padrão — ideal dentro de botões)
   * "md" → 20px (ideal em campos ou áreas menores da UI)
   */
  size?: "sm" | "md";
  /** Classes Tailwind adicionais. Use `text-*` para definir a cor do traço. */
  className?: string;
}

const sizeMap: Record<NonNullable<SpinnerProps["size"]>, number> = {
  sm: 16,
  md: 20,
};

export function Spinner({ size = "sm", className }: SpinnerProps) {
  const px = sizeMap[size];

  return (
    <svg
      role="status"
      aria-label="Carregando"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      width={px}
      height={px}
      className={cn("animate-spin", className)}
    >
      {/*
       * Trilha (track): círculo de fundo semi-opaco.
       * Usa `currentColor` com opacidade reduzida para que a cor seja
       * sempre derivada de `text-*` do elemento pai — sem hardcode.
       */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/*
       * Arco animado: quarto de círculo que gira via `animate-spin`.
       * Comprimento de dash calculado para cobrir ~25% da circunferência
       * (2π × 10 ≈ 62.8; dasharray 15.7 ≈ 25%).
       */}
      <path
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        d="M12 2a10 10 0 0 1 10 10"
        opacity="0.85"
      />
    </svg>
  );
}

export default Spinner;
