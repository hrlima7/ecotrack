/**
 * Zod schemas — Residuo e Inventário
 */

import { z } from "zod";

export const adicionarInventarioSchema = z.object({
  residuoId: z.string().cuid("ID de resíduo inválido"),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
  unidade: z.enum(["KG", "LITRO", "UNIDADE"]).default("KG"),
  frequencia: z
    .enum(["DIARIA", "SEMANAL", "QUINZENAL", "MENSAL", "SOB_DEMANDA"])
    .default("SOB_DEMANDA"),
  observacoes: z.string().max(500).optional(),
});

export const filtrosResiduoSchema = z.object({
  tipo: z
    .enum(["ORGANICO", "RECICLAVEL", "ELETRONICO", "HOSPITALAR", "PERIGOSO"])
    .optional(),
  perigoso: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type AdicionarInventarioInput = z.infer<typeof adicionarInventarioSchema>;
export type FiltrosResiduoInput = z.infer<typeof filtrosResiduoSchema>;
