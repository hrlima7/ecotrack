/**
 * Zod schemas — Auth
 * Validação de entrada para endpoints de autenticação.
 */

import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email é obrigatório" })
    .email("Email inválido")
    .toLowerCase(),
  senha: z
    .string({ required_error: "Senha é obrigatória" })
    .min(8, "Senha deve ter no mínimo 8 caracteres"),
});

export const cadastroEmpresaSchema = z.object({
  cnpj: z
    .string({ required_error: "CNPJ é obrigatório" })
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido (formato: XX.XXX.XXX/XXXX-XX)"),
  razaoSocial: z
    .string({ required_error: "Razão social é obrigatória" })
    .min(3, "Razão social muito curta")
    .max(255),
  nomeFantasia: z.string().max(255).optional(),
  tipo: z.enum(["GERADOR", "TRANSPORTADOR", "DESTINADOR"]),
  email: z.string().email("Email inválido").toLowerCase(),
  telefone: z.string().optional(),
  // Endereço
  logradouro: z.string().min(3).max(255),
  numero: z.string().max(20),
  complemento: z.string().max(100).optional(),
  bairro: z.string().min(2).max(100),
  cidade: z.string().min(2).max(100),
  estado: z.string().length(2, "Use a sigla do estado (ex: SP)"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  // Usuário admin inicial
  nomeAdmin: z.string().min(2).max(255),
  emailAdmin: z.string().email().toLowerCase(),
  senhaAdmin: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: "Refresh token é obrigatório" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CadastroEmpresaInput = z.infer<typeof cadastroEmpresaSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
