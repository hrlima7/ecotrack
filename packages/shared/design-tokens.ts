/**
 * EcoTrack Design Tokens
 * Fonte única de verdade para identidade visual da plataforma.
 * Estes tokens são consumidos pelo tailwind.config.ts e componentes React.
 */

export const colors = {
  primary: {
    DEFAULT: "#16A34A",
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
    950: "#052E16",
  },
  secondary: {
    DEFAULT: "#0EA5E9",
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9",
    600: "#0284C7",
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
    950: "#082F49",
  },
  accent: {
    DEFAULT: "#F59E0B",
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  danger: {
    DEFAULT: "#DC2626",
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },
  neutral: {
    background: "#F8FAFC",
    card: "#FFFFFF",
    border: "#E2E8F0",
    textTitle: "#0F172A",
    textBody: "#475569",
    textPlaceholder: "#94A3B8",
    textDisabled: "#CBD5E1",
  },
} as const;

export const typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
    mono: ["JetBrains Mono", "Fira Code", "monospace"],
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.05em" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.625" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "600" }],
    "4xl": ["2rem", { lineHeight: "2.5rem", fontWeight: "700", letterSpacing: "-0.025em" }],
  },
} as const;

export const spacing = {
  /** Sistema base de 4px */
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
} as const;

export const borderRadius = {
  sm: "4px",
  DEFAULT: "6px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  card: "0 2px 8px 0 rgb(15 23 42 / 0.06)",
} as const;

/** Status de coleta — mapeamento de cores por status */
export const statusColors = {
  PENDENTE: {
    bg: "#FFFBEB",
    text: "#B45309",
    border: "#FDE68A",
    dot: "#F59E0B",
  },
  CONFIRMADA: {
    bg: "#EFF6FF",
    text: "#1D4ED8",
    border: "#BFDBFE",
    dot: "#3B82F6",
  },
  EM_ROTA: {
    bg: "#F0F9FF",
    text: "#0369A1",
    border: "#BAE6FD",
    dot: "#0EA5E9",
  },
  COLETADO: {
    bg: "#F0FDF4",
    text: "#15803D",
    border: "#BBF7D0",
    dot: "#16A34A",
  },
  FINALIZADO: {
    bg: "#F0FDF4",
    text: "#14532D",
    border: "#86EFAC",
    dot: "#15803D",
  },
  CANCELADO: {
    bg: "#FEF2F2",
    text: "#B91C1C",
    border: "#FECACA",
    dot: "#DC2626",
  },
} as const;

/** Ícones por tipo de resíduo (nome do ícone Lucide) */
export const residueIcons = {
  ORGANICO: "Leaf",
  RECICLAVEL: "Recycle",
  ELETRONICO: "Cpu",
  HOSPITALAR: "Cross",
  PERIGOSO: "AlertTriangle",
} as const;

/** Cores por tipo de resíduo */
export const residueColors = {
  ORGANICO: { bg: "#F0FDF4", text: "#15803D", icon: "#16A34A" },
  RECICLAVEL: { bg: "#EFF6FF", text: "#1D4ED8", icon: "#3B82F6" },
  ELETRONICO: { bg: "#F5F3FF", text: "#5B21B6", icon: "#7C3AED" },
  HOSPITALAR: { bg: "#FFF1F2", text: "#BE123C", icon: "#E11D48" },
  PERIGOSO: { bg: "#FFF7ED", text: "#C2410C", icon: "#EA580C" },
} as const;

export type ColorToken = typeof colors;
export type StatusColorToken = typeof statusColors;
export type ResidueType = keyof typeof residueIcons;
export type ColetaStatus = keyof typeof statusColors;
