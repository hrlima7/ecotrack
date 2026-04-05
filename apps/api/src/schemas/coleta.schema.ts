/**
 * Zod schemas — Coleta
 * Validação de entrada para endpoints de coleta.
 */

import { z } from "zod";

export const criarColetaSchema = z.object({
  dataAgendada: z
    .string({ required_error: "Data de agendamento é obrigatória" })
    .datetime("Data inválida (use formato ISO 8601)"),
  residuos: z
    .array(
      z.object({
        residuoId: z.string().cuid("ID de resíduo inválido"),
        quantidadeEstimada: z
          .number()
          .positive("Quantidade deve ser positiva"),
        unidade: z.enum(["KG", "LITRO", "UNIDADE"]).default("KG"),
      })
    )
    .min(1, "Informe ao menos um resíduo"),
  observacoes: z.string().max(1000).optional(),
  // Endereço (opcional — se não informado, usa endereço da empresa)
  endereco: z
    .object({
      logradouro: z.string().min(3).max(255),
      numero: z.string().max(20),
      complemento: z.string().max(100).optional(),
      bairro: z.string().min(2).max(100),
      cidade: z.string().min(2).max(100),
      estado: z.string().length(2),
      cep: z.string().regex(/^\d{5}-?\d{3}$/),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
});

export const atualizarStatusColetaSchema = z.object({
  status: z.enum([
    "PENDENTE",
    "CONFIRMADA",
    "EM_ROTA",
    "COLETADO",
    "FINALIZADO",
    "CANCELADO",
  ]),
  motivo: z.string().max(255).optional(),
  pesoRealKg: z.number().positive().optional(),
});

export const filtrosColetaSchema = z.object({
  status: z
    .enum(["PENDENTE", "CONFIRMADA", "EM_ROTA", "COLETADO", "FINALIZADO", "CANCELADO"])
    .optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CriarColetaInput = z.infer<typeof criarColetaSchema>;
export type AtualizarStatusColetaInput = z.infer<typeof atualizarStatusColetaSchema>;
export type FiltrosColetaInput = z.infer<typeof filtrosColetaSchema>;
