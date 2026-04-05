# EcoTrack

Plataforma SaaS B2B de gestao de residuos. Conecta empresas geradoras a coletores certificados.

Conformidade: CONAMA 275/2001, SINIR, LGPD, ABNT NBR 10.004.

## Estrutura do Monorepo

```
/
├── apps/
│   ├── web/          Next.js 14 (App Router) + TypeScript + TailwindCSS
│   └── api/          Node.js 20 + Fastify + Prisma + PostgreSQL + Redis
├── packages/
│   └── shared/       Tipos TypeScript e constantes compartilhadas
├── package.json      Workspace root (pnpm)
├── pnpm-workspace.yaml
└── turbo.json        Turborepo config
```

## Pre-requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+
- Docker (opcional, para infraestrutura local)

## Instalacao

```bash
# 1. Instalar dependencias de todos os workspaces
pnpm install

# 2. Configurar variaveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edite os arquivos .env com suas configuracoes

# 3. Criar o banco de dados e rodar migrations
pnpm db:generate
pnpm db:migrate
```

## Desenvolvimento

```bash
# Rodar frontend e backend em paralelo
pnpm dev

# Rodar apenas o frontend
pnpm --filter web dev

# Rodar apenas o backend
pnpm --filter api dev

# Abrir Prisma Studio (interface visual do banco)
pnpm db:studio
```

A API estara disponivel em: http://localhost:3001
A documentacao OpenAPI (Swagger) em: http://localhost:3001/docs
O frontend estara disponivel em: http://localhost:3000

## Build de Producao

```bash
pnpm build
```

## Testes

```bash
# Todos os workspaces
pnpm test

# Apenas frontend
pnpm --filter web test

# Apenas backend
pnpm --filter api test
```

## Stack Tecnica

| Camada     | Tecnologia                                          |
|------------|-----------------------------------------------------|
| Frontend   | Next.js 14, TypeScript, TailwindCSS, shadcn/ui      |
| Backend    | Node.js 20, Fastify, Prisma, PostgreSQL, Redis      |
| Filas      | BullMQ (Redis)                                      |
| Auth       | JWT + Refresh Token                                 |
| Mapas      | Mapbox GL JS                                        |
| Testes     | Vitest + Testing Library + Supertest                |
| Deploy     | Vercel (frontend), Railway (backend)                |
| Monorepo   | pnpm workspaces + Turborepo                         |

## Convencoes

### API

- Prefixo: `/api/v1/`
- Sucesso: `{ "success": true, "data": {}, "meta": {} }`
- Erro: `{ "success": false, "error": { "code": "", "message": "" } }`
- Multi-tenancy: todo endpoint extrai `empresaId` do JWT

### Status de Coleta

```
PENDENTE -> CONFIRMADA -> EM_ROTA -> COLETADO -> FINALIZADO
                                              -> CANCELADO
```

### Commits

```
feat:   nova funcionalidade
fix:    correcao de bug
chore:  manutencao, dependencias
docs:   documentacao
```

## Conformidade Legal

- **LGPD**: logs de acesso a dados pessoais em `AuditLog`; endpoint `DELETE /api/v1/empresas/me/delete`
- **CONAMA 275/2001**: MTRs gerados em PDF com todos os campos obrigatorios
- **SINIR**: integracao prevista para Fase 2 (emissao automatica)
- **ABNT NBR 10.004**: base para classificacao de tipos de residuos

## Roadmap

| Fase | Status | Descricao                                    |
|------|--------|----------------------------------------------|
| 1    | Em andamento | MVP: cadastro, agendamento, MTR manual   |
| 2    | Planejado    | Integracao SINIR, app motorista, filas   |
| 3    | Planejado    | IA de rotas, marketplace, PGRS           |
