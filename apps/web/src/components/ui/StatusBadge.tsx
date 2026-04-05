/**
 * StatusBadge — Badge colorido por status de coleta
 * Segue design tokens: cores por status definidas em packages/shared/design-tokens.ts
 * Sem strings hardcoded — usa STATUS_COLETA_LABELS do shared.
 */

import { statusColors, STATUS_COLETA_LABELS } from "@ecotrack/shared";
import type { ColetaStatus } from "@ecotrack/shared";

interface StatusBadgeProps {
  status: ColetaStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const cores = statusColors[status];
  const label = STATUS_COLETA_LABELS[status];

  return (
    <span
      role="status"
      aria-label={`Status: ${label}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: cores.bg,
        color: cores.text,
        border: `1px solid ${cores.border}`,
      }}
    >
      {/* Dot indicador */}
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: cores.dot }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

/**
 * StatusBadgeSkeleton — Estado de carregamento
 */
export function StatusBadgeSkeleton() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full">
      <span className="skeleton w-1.5 h-1.5 rounded-full" />
      <span className="skeleton h-3 w-16 rounded" />
    </span>
  );
}
