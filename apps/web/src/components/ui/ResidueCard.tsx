/**
 * ResidueCard — Card com icone por tipo de residuo
 * Usa design tokens de residueColors e residueIcons do shared.
 * Sem strings hardcoded.
 */

import { residueColors, residueIcons, RESIDUO_LABELS } from "@ecotrack/shared";
import type { TipoResiduo } from "@ecotrack/shared";

interface ResidueCardProps {
  tipo: TipoResiduo;
  /** Sobrescreve o label padrao do tipo */
  label?: string;
  /** Descricao adicional abaixo do label */
  descricao?: string;
  /** Tamanho do icone: sm | md | lg */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ICONE_SIZE = {
  sm: "w-6 h-6 text-sm",
  md: "w-8 h-8 text-base",
  lg: "w-10 h-10 text-xl",
} as const;

// Icones como texto (em producao: usar componentes Lucide Icons)
const ICONE_FALLBACK: Record<string, string> = {
  Leaf: "🌿",
  Recycle: "♻️",
  Cpu: "💻",
  Cross: "🏥",
  AlertTriangle: "⚠️",
};

export function ResidueCard({
  tipo,
  label,
  descricao,
  size = "md",
  className = "",
}: ResidueCardProps) {
  const cores = residueColors[tipo];
  const iconeNome = residueIcons[tipo];
  const icone = ICONE_FALLBACK[iconeNome] ?? "♻️";
  const labelTexto = label ?? RESIDUO_LABELS[tipo];

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      aria-label={`Tipo de residuo: ${labelTexto}`}
    >
      {/* Icone colorido */}
      <div
        className={`${ICONE_SIZE[size]} rounded-lg flex items-center justify-center flex-shrink-0`}
        style={{ backgroundColor: cores.bg }}
        aria-hidden="true"
      >
        <span>{icone}</span>
      </div>

      {/* Textos */}
      <div className="min-w-0">
        <p
          className="text-sm font-medium text-foreground leading-tight"
          style={{ color: cores.text }}
        >
          {labelTexto}
        </p>
        {descricao && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {descricao}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * ResidueTag — Versao compacta como tag/chip
 */
export function ResidueTag({ tipo }: { tipo: TipoResiduo }) {
  const cores = residueColors[tipo];
  const iconeNome = residueIcons[tipo];
  const icone = ICONE_FALLBACK[iconeNome] ?? "♻️";
  const label = RESIDUO_LABELS[tipo];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: cores.bg, color: cores.text }}
      aria-label={`Tipo: ${label}`}
    >
      <span aria-hidden="true">{icone}</span>
      {label}
    </span>
  );
}
