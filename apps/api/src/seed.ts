/**
 * EcoTrack API — Seed de Desenvolvimento
 * Popula o banco com dados iniciais para testes locais.
 * Executar: pnpm --filter api db:seed
 */

import { PrismaClient, TipoEmpresa, RoleUsuario, TipoResiduo } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados EcoTrack...\n");

  // ─── 1. Empresa Geradora ────────────────────────────────────────────────────
  const empresaGerador = await prisma.empresa.upsert({
    where: { cnpj: "12.345.678/0001-90" },
    update: {},
    create: {
      cnpj: "12.345.678/0001-90",
      razaoSocial: "Restaurante Verde Ltda",
      nomeFantasia: "Verde Burguer",
      tipo: TipoEmpresa.GERADOR,
      email: "contato@verdeburger.com.br",
      telefone: "(11) 91234-5678",
      logradouro: "Rua das Flores",
      numero: "123",
      bairro: "Pinheiros",
      cidade: "São Paulo",
      estado: "SP",
      cep: "05422-010",
      latitude: -23.561684,
      longitude: -46.683368,
    },
  });
  console.log(`✅ Empresa Geradora: ${empresaGerador.nomeFantasia}`);

  // ─── 2. Empresa Transportadora ──────────────────────────────────────────────
  const empresaTransportador = await prisma.empresa.upsert({
    where: { cnpj: "98.765.432/0001-10" },
    update: {},
    create: {
      cnpj: "98.765.432/0001-10",
      razaoSocial: "EcoLogística Transportes S/A",
      nomeFantasia: "EcoLogística",
      tipo: TipoEmpresa.TRANSPORTADOR,
      email: "operacoes@ecologistica.com.br",
      telefone: "(11) 3456-7890",
      logradouro: "Av. Industrial",
      numero: "1500",
      bairro: "Santo André",
      cidade: "São Paulo",
      estado: "SP",
      cep: "09111-000",
      latitude: -23.653816,
      longitude: -46.543068,
      licencaAmbiental: "LA-SP-2024-00123",
      licencaVencimento: new Date("2025-12-31"),
    },
  });
  console.log(`✅ Empresa Transportadora: ${empresaTransportador.nomeFantasia}`);

  // ─── 3. Empresa Destinadora ─────────────────────────────────────────────────
  const empresaDestinador = await prisma.empresa.upsert({
    where: { cnpj: "55.444.333/0001-22" },
    update: {},
    create: {
      cnpj: "55.444.333/0001-22",
      razaoSocial: "Recicla Mais Destinadora Ambiental Ltda",
      nomeFantasia: "Recicla Mais",
      tipo: TipoEmpresa.DESTINADOR,
      email: "recepcao@reciclamais.com.br",
      telefone: "(11) 2233-4455",
      logradouro: "Estrada da Reciclagem",
      numero: "km 12",
      bairro: "Zona Industrial",
      cidade: "Guarulhos",
      estado: "SP",
      cep: "07140-000",
      latitude: -23.462765,
      longitude: -46.529884,
      licencaAmbiental: "LA-SP-2024-00456",
      licencaVencimento: new Date("2026-06-30"),
    },
  });
  console.log(`✅ Empresa Destinadora: ${empresaDestinador.nomeFantasia}`);

  // ─── 4. Usuários ────────────────────────────────────────────────────────────
  const senhaHash = await bcrypt.hash("senha123", 12);

  const adminGerador = await prisma.usuario.upsert({
    where: { email: "admin@verdeburger.com.br" },
    update: {},
    create: {
      empresaId: empresaGerador.id,
      email: "admin@verdeburger.com.br",
      senhaHash,
      nome: "Carlos Silva",
      role: RoleUsuario.ADMIN,
    },
  });
  console.log(`✅ Usuário Admin Gerador: ${adminGerador.email}`);

  const motorista = await prisma.usuario.upsert({
    where: { email: "motorista@ecologistica.com.br" },
    update: {},
    create: {
      empresaId: empresaTransportador.id,
      email: "motorista@ecologistica.com.br",
      senhaHash,
      nome: "João Pereira",
      role: RoleUsuario.MOTORISTA,
    },
  });
  console.log(`✅ Usuário Motorista: ${motorista.email}`);

  const adminDestinador = await prisma.usuario.upsert({
    where: { email: "recepcao@reciclamais.com.br" },
    update: {},
    create: {
      empresaId: empresaDestinador.id,
      email: "recepcao@reciclamais.com.br",
      senhaHash,
      nome: "Ana Lima",
      role: RoleUsuario.OPERADOR,
    },
  });
  console.log(`✅ Usuário Destinador: ${adminDestinador.email}`);

  // ─── 5. Catálogo de Resíduos ────────────────────────────────────────────────
  const residuos = await Promise.all([
    prisma.residuo.upsert({
      where: { id: "residuo-organico-1" },
      update: {},
      create: {
        id: "residuo-organico-1",
        tipo: TipoResiduo.ORGANICO,
        descricao: "Resíduo orgânico de alimentação (restos de alimentos)",
        classeAbnt: "Classe II-B",
        perigoso: false,
      },
    }),
    prisma.residuo.upsert({
      where: { id: "residuo-oleo-1" },
      update: {},
      create: {
        id: "residuo-oleo-1",
        tipo: TipoResiduo.PERIGOSO,
        descricao: "Óleo de fritura usado (graxas e óleos vegetais)",
        codigoIbama: "14 05 01",
        classeAbnt: "Classe I",
        perigoso: true,
      },
    }),
    prisma.residuo.upsert({
      where: { id: "residuo-reciclavel-1" },
      update: {},
      create: {
        id: "residuo-reciclavel-1",
        tipo: TipoResiduo.RECICLAVEL,
        descricao: "Embalagens plásticas (PET, PEAD, PP)",
        classeAbnt: "Classe II-B",
        perigoso: false,
      },
    }),
    prisma.residuo.upsert({
      where: { id: "residuo-eletronico-1" },
      update: {},
      create: {
        id: "residuo-eletronico-1",
        tipo: TipoResiduo.ELETRONICO,
        descricao: "Equipamentos eletrônicos em desuso (REEE)",
        codigoIbama: "16 02 13",
        classeAbnt: "Classe I",
        perigoso: false,
      },
    }),
  ]);
  console.log(`✅ ${residuos.length} tipos de resíduos cadastrados no catálogo`);

  // ─── 6. Inventário do Gerador ───────────────────────────────────────────────
  await prisma.inventarioResiduo.upsert({
    where: {
      empresaId_residuoId: {
        empresaId: empresaGerador.id,
        residuoId: "residuo-organico-1",
      },
    },
    update: {},
    create: {
      empresaId: empresaGerador.id,
      residuoId: "residuo-organico-1",
      quantidade: 50,
      unidade: "KG",
      frequencia: "DIARIA",
      observacoes: "Gerado principalmente no horário de almoço",
    },
  });

  await prisma.inventarioResiduo.upsert({
    where: {
      empresaId_residuoId: {
        empresaId: empresaGerador.id,
        residuoId: "residuo-oleo-1",
      },
    },
    update: {},
    create: {
      empresaId: empresaGerador.id,
      residuoId: "residuo-oleo-1",
      quantidade: 20,
      unidade: "LITRO",
      frequencia: "SEMANAL",
      observacoes: "Acumulado nas fritadeiras industriais",
    },
  });
  console.log(`✅ Inventário de resíduos do Gerador configurado`);

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("\n📋 Credenciais para login:");
  console.log("   Gerador  → admin@verdeburger.com.br / senha123");
  console.log("   Motorista→ motorista@ecologistica.com.br / senha123");
  console.log("   Destinad.→ recepcao@reciclamais.com.br / senha123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
