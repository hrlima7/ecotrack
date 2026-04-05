# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

**EcoTrack** — plataforma SaaS B2B de coleta de resíduos que conecta empresas geradoras a coletores certificados. Funcionalidades: agendamento de coletas por tipo de resíduo, rastreamento em tempo real, manifesto digital (conformidade CONAMA), marketplace de coletores e relatórios de impacto ambiental.

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| Backend | Node.js 20 + Fastify, Prisma ORM, PostgreSQL, Redis + BullMQ |
| Auth | JWT + Refresh Token (ou Clerk) |
| Mapas | Mapbox GL JS |
| Testes | Vitest + Testing Library (frontend), Vitest + Supertest (backend) |
| Deploy | Vercel (frontend), Railway (backend) |

## Agentes Disponíveis

Este repositório usa o sistema de agentes do Claude Code. Acione com `@nome-do-agente`:

- **`@tech-leader`** — orquestrador; acione primeiro para qualquer nova funcionalidade. Delega para os demais agentes e integra os resultados.
- **`@frontend-specialist`** — componentes React/Next.js, páginas, integração com APIs e mapas.
- **`@design-specialist`** — identidade visual, tokens de design, UX/UI, guias de estilo.
- **`@backend-engineer`** — API REST, schema Prisma, migrations, WebSocket, cron jobs.

Fluxo recomendado: `@tech-leader` → decompõe → aciona especialistas → integra.

## Convenções do Projeto

### Git
- Commits automáticos via hook `PostToolUse` a cada arquivo salvo
- Mensagem gerada automaticamente: `auto: update <nome-do-arquivo>`
- Para commits manuais semânticos: `feat:`, `fix:`, `chore:`, `docs:`

### API Backend
- Prefixo: `/api/v1/`
- Resposta de sucesso: `{ "success": true, "data": {}, "meta": {} }`
- Resposta de erro: `{ "success": false, "error": { "code": "", "message": "" } }`
- Multi-tenancy: todas as queries filtram por `empresaId` extraído do JWT

### Status de Coleta
`PENDENTE → CONFIRMADA → EM_ROTA → COLETADO → FINALIZADO | CANCELADO`

### Design
- Cor primária: `#16A34A` (verde) — apenas em CTAs e confirmações
- Fonte: Inter; espaçamento base de 4px
- Mobile-first obrigatório; contraste mínimo WCAG AA

## Conformidade Legal
- LGPD: logar acesso a dados pessoais, implementar endpoint de exclusão de conta
- Manifesto MTR: geração de PDF conforme resolução CONAMA 275/2001
