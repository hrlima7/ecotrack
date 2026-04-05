-- CreateEnum
CREATE TYPE "TipoEmpresa" AS ENUM ('GERADOR', 'TRANSPORTADOR', 'DESTINADOR');

-- CreateEnum
CREATE TYPE "RoleUsuario" AS ENUM ('ADMIN', 'OPERADOR', 'MOTORISTA');

-- CreateEnum
CREATE TYPE "TipoResiduo" AS ENUM ('ORGANICO', 'RECICLAVEL', 'ELETRONICO', 'HOSPITALAR', 'PERIGOSO');

-- CreateEnum
CREATE TYPE "UnidadeMedida" AS ENUM ('KG', 'LITRO', 'UNIDADE');

-- CreateEnum
CREATE TYPE "FrequenciaColeta" AS ENUM ('DIARIA', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'SOB_DEMANDA');

-- CreateEnum
CREATE TYPE "StatusColeta" AS ENUM ('PENDENTE', 'CONFIRMADA', 'EM_ROTA', 'COLETADO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusMTR" AS ENUM ('RASCUNHO', 'EMITIDO', 'ACEITO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PlanoSaaS" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "cnpj" VARCHAR(18) NOT NULL,
    "razaoSocial" VARCHAR(255) NOT NULL,
    "nomeFantasia" VARCHAR(255),
    "tipo" "TipoEmpresa" NOT NULL,
    "plano" "PlanoSaaS" NOT NULL DEFAULT 'FREE',
    "email" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20),
    "logradouro" VARCHAR(255) NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "complemento" VARCHAR(100),
    "bairro" VARCHAR(100) NOT NULL,
    "cidade" VARCHAR(100) NOT NULL,
    "estado" VARCHAR(2) NOT NULL,
    "cep" VARCHAR(9) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "licencaAmbiental" VARCHAR(100),
    "licencaVencimento" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "role" "RoleUsuario" NOT NULL DEFAULT 'OPERADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "ultimo_acesso_dados" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revogado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residuos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoResiduo" NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "codigo_ibama" VARCHAR(50),
    "classe_abnt" VARCHAR(20),
    "perigoso" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "residuos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_residuos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "residuo_id" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "unidade" "UnidadeMedida" NOT NULL DEFAULT 'KG',
    "frequencia" "FrequenciaColeta" NOT NULL DEFAULT 'SOB_DEMANDA',
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_residuos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coletas" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "transportador_id" TEXT,
    "status" "StatusColeta" NOT NULL DEFAULT 'PENDENTE',
    "data_agendada" TIMESTAMP(3) NOT NULL,
    "data_realizada" TIMESTAMP(3),
    "logradouro" VARCHAR(255) NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "complemento" VARCHAR(100),
    "bairro" VARCHAR(100) NOT NULL,
    "cidade" VARCHAR(100) NOT NULL,
    "estado" VARCHAR(2) NOT NULL,
    "cep" VARCHAR(9) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "peso_real_kg" DOUBLE PRECISION,
    "observacoes" TEXT,
    "foto_evidencia_url" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coletas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coleta_residuos" (
    "id" TEXT NOT NULL,
    "coleta_id" TEXT NOT NULL,
    "residuo_id" TEXT NOT NULL,
    "quantidade_estimada" DOUBLE PRECISION NOT NULL,
    "quantidade_real" DOUBLE PRECISION,
    "unidade" "UnidadeMedida" NOT NULL DEFAULT 'KG',

    CONSTRAINT "coleta_residuos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coleta_status_historico" (
    "id" TEXT NOT NULL,
    "coleta_id" TEXT NOT NULL,
    "status_antes" "StatusColeta" NOT NULL,
    "status_depois" "StatusColeta" NOT NULL,
    "motivo" VARCHAR(255),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coleta_status_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifestos_mtr" (
    "id" TEXT NOT NULL,
    "coleta_id" TEXT NOT NULL,
    "numero_sinir" VARCHAR(50),
    "qr_code" TEXT,
    "pdf_url" VARCHAR(512),
    "status" "StatusMTR" NOT NULL DEFAULT 'RASCUNHO',
    "assinatura_gerador" TEXT,
    "assinatura_transportador" TEXT,
    "assinatura_destinador" TEXT,
    "emitido_em" TIMESTAMP(3),
    "aceito_em" TIMESTAMP(3),
    "finalizado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manifestos_mtr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "acao" VARCHAR(100) NOT NULL,
    "recurso" VARCHAR(100) NOT NULL,
    "recurso_id" VARCHAR(100),
    "detalhes" JSONB,
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_empresa_id_idx" ON "usuarios"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuario_id_idx" ON "refresh_tokens"("usuario_id");

-- CreateIndex
CREATE INDEX "inventario_residuos_empresa_id_idx" ON "inventario_residuos"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_residuos_empresa_id_residuo_id_key" ON "inventario_residuos"("empresa_id", "residuo_id");

-- CreateIndex
CREATE INDEX "coletas_empresa_id_idx" ON "coletas"("empresa_id");

-- CreateIndex
CREATE INDEX "coletas_transportador_id_idx" ON "coletas"("transportador_id");

-- CreateIndex
CREATE INDEX "coletas_status_idx" ON "coletas"("status");

-- CreateIndex
CREATE INDEX "coletas_data_agendada_idx" ON "coletas"("data_agendada");

-- CreateIndex
CREATE UNIQUE INDEX "coleta_residuos_coleta_id_residuo_id_key" ON "coleta_residuos"("coleta_id", "residuo_id");

-- CreateIndex
CREATE INDEX "coleta_status_historico_coleta_id_idx" ON "coleta_status_historico"("coleta_id");

-- CreateIndex
CREATE UNIQUE INDEX "manifestos_mtr_coleta_id_key" ON "manifestos_mtr"("coleta_id");

-- CreateIndex
CREATE INDEX "manifestos_mtr_numero_sinir_idx" ON "manifestos_mtr"("numero_sinir");

-- CreateIndex
CREATE INDEX "audit_logs_empresa_id_idx" ON "audit_logs"("empresa_id");

-- CreateIndex
CREATE INDEX "audit_logs_usuario_id_idx" ON "audit_logs"("usuario_id");

-- CreateIndex
CREATE INDEX "audit_logs_criado_em_idx" ON "audit_logs"("criado_em");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_residuos" ADD CONSTRAINT "inventario_residuos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_residuos" ADD CONSTRAINT "inventario_residuos_residuo_id_fkey" FOREIGN KEY ("residuo_id") REFERENCES "residuos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coletas" ADD CONSTRAINT "coletas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coletas" ADD CONSTRAINT "coletas_transportador_id_fkey" FOREIGN KEY ("transportador_id") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coleta_residuos" ADD CONSTRAINT "coleta_residuos_coleta_id_fkey" FOREIGN KEY ("coleta_id") REFERENCES "coletas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coleta_residuos" ADD CONSTRAINT "coleta_residuos_residuo_id_fkey" FOREIGN KEY ("residuo_id") REFERENCES "residuos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coleta_status_historico" ADD CONSTRAINT "coleta_status_historico_coleta_id_fkey" FOREIGN KEY ("coleta_id") REFERENCES "coletas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifestos_mtr" ADD CONSTRAINT "manifestos_mtr_coleta_id_fkey" FOREIGN KEY ("coleta_id") REFERENCES "coletas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
