/**
 * MetricCard — Card de KPI com tendencia
 * Exibe metrica principal com valor, descricao e variacao percentual.
 * Mobile-first. Skeleton para loading state.
 */

interface Tendencia {
  valor: number;
  tipo: "alta" | "baixa" | "neutro";
}

interface MetricCardProps {
  titulo: string;
  valor: string | number;
  descricao?: string;
  tendencia?: Tendencia;
  className?: string;
}

const TENDENCIA_LABELS = {
  alta: "alta",
  baixa: "queda",
  neutro: "estavel",
} as const;

export function MetricCard({
  titulo,
  valor,
  descricao,
  tendencia,
  className = "",
}: MetricCardProps) {
  const tendenciaPositiva =
    tendencia?.tipo === "alta" && tendencia.valor > 0;
  const tendenciaNegativa =
    tendencia?.tipo === "baixa" && tendencia.valor < 0;

  return (
    <div
      className={`card flex flex-col gap-3 ${className}`}
      aria-label={`Metrica: ${titulo}`}
    >
      {/* Titulo */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {titulo}
      </p>

      {/* Valor principal */}
      <p className="text-3xl font-bold text-foreground leading-none">
        {valor}
      </p>

      {/* Rodape: descricao + tendencia */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        {descricao && (
          <p className="text-xs text-muted-foreground truncate">{descricao}</p>
        )}

        {tendencia && tendencia.valor !== 0 && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium flex-shrink-0
              ${tendenciaPositiva ? "text-primary-600" : ""}
              ${tendenciaNegativa ? "text-danger-600" : ""}
              ${tendencia.tipo === "neutro" ? "text-muted-foreground" : ""}`}
            aria-label={`Tendencia: ${TENDENCIA_LABELS[tendencia.tipo]} de ${Math.abs(tendencia.valor)}%`}
          >
            {tendenciaPositiva && (
              <svg
                aria-hidden="true"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <path d="M6 2L10 8H2L6 2z" />
              </svg>
            )}
            {tendenciaNegativa && (
              <svg
                aria-hidden="true"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <path d="M6 10L2 4H10L6 10z" />
              </svg>
            )}
            {Math.abs(tendencia.valor)}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * MetricCardSkeleton — Estado de carregamento (skeleton screen)
 */
export function MetricCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3" aria-hidden="true">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-8 w-20 rounded" />
      <div className="skeleton h-3 w-32 rounded" />
    </div>
  );
}
