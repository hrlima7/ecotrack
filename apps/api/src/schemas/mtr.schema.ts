/**
 * Zod schemas — Manifesto MTR
 */

import { z } from "zod";

export const emitirMtrSchema = z.object({
  coletaId: z.string().cuid("ID de coleta inválido"),
});

export const assinarMtrSchema = z.object({
  tipo: z.enum(["GERADOR", "TRANSPORTADOR", "DESTINADOR"]),
  assinatura: z.string().min(1, "Assinatura é obrigatória"),
});

export const filtrosMtrSchema = z.object({
  status: z
    .enum(["RASCUNHO", "EMITIDO", "ACEITO", "FINALIZADO", "CANCELADO"])
    .optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type EmitirMtrInput = z.infer<typeof emitirMtrSchema>;
export type AssinarMtrInput = z.infer<typeof assinarMtrSchema>;
export type FiltrosMtrInput = z.infer<typeof filtrosMtrSchema>;
