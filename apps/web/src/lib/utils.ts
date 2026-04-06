/**
 * Utilitários gerais — EcoTrack
 * cn: helper para mesclar classes Tailwind sem shadcn/ui.
 * Substitui o clsx + tailwind-merge para evitar dependência extra.
 */

type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[];

/**
 * Concatena classes CSS, ignorando valores falsy.
 * Compatível com a assinatura usada pelo shadcn/ui sem exigir clsx.
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity as 20)
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(" ");
}
