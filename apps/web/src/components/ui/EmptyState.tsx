/**
 * EmptyState — Estado vazio com ilustracao simples e CTA
 * Reutilizavel em todas as paginas que podem nao ter dados.
 * Sem strings hardcoded — todas as strings passadas via props.
 */

interface EmptyStateProps {
  icone?: string;
  titulo: string;
  descricao?: string;
  acao?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icone = "📭",
  titulo,
  descricao,
  acao,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      role="status"
      aria-label={titulo}
    >
      {/* Ilustracao */}
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <span className="text-3xl" aria-hidden="true">
          {icone}
        </span>
      </div>

      {/* Titulo */}
      <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>

      {/* Descricao */}
      {descricao && (
        <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
          {descricao}
        </p>
      )}

      {/* CTA */}
      {acao && (
        <div className="mt-5">
          {acao.href ? (
            <a href={acao.href} className="btn-primary">
              {acao.label}
            </a>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={acao.onClick}
            >
              {acao.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
