# Deploy — EcoTrack

Guia de deploy de produção do EcoTrack.

| Camada | Plataforma | Custo estimado |
|---|---|---|
| Frontend (Next.js) | Vercel | Hobby: gratis |
| Backend (Fastify) | Railway | ~US$ 5/mes |
| PostgreSQL | Railway (addon) | ~US$ 5/mes |
| Redis | Railway (addon) | ~US$ 3/mes |
| SMTP | Resend | 3000 emails/mes gratis |

---

## 1. Backend + Banco — Railway

### 1.1 Criar projeto no Railway

```bash
# Opcao A: via CLI
npm i -g @railway/cli
railway login
railway init
railway link  # ou cria novo projeto

# Opcao B: via dashboard
# https://railway.app/new
```

### 1.2 Adicionar PostgreSQL e Redis

No dashboard do projeto: **+ New** → **Database** → **PostgreSQL** (e repetir para Redis).

Railway injeta automaticamente as variaveis `DATABASE_URL` e `REDIS_URL` no servico da API.

### 1.3 Deploy da API

O arquivo `railway.json` na raiz aponta para `apps/api/Dockerfile`. Faca push para o branch principal:

```bash
git push origin master
```

Railway detecta o `Dockerfile` e builda automaticamente. Multi-stage build:
1. Instala dependencias com pnpm
2. Gera Prisma client + builda TypeScript
3. Roda `prisma migrate deploy` antes de iniciar o servidor

### 1.4 Configurar variaveis de ambiente

No dashboard Railway → Servico API → **Variables**:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=<gerar com: openssl rand -base64 64>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://ecotrack.app
WEB_BASE_URL=https://ecotrack.app

# SMTP — Resend
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<api-key-resend>
SMTP_FROM=EcoTrack <no-reply@ecotrack.app>

# SINIR (Fase 2 — manter mock ate credenciamento oficial)
SINIR_MODE=mock
```

`DATABASE_URL` e `REDIS_URL` ja sao injetadas pelos addons.

### 1.5 Healthcheck

Railway monitora `GET /health` automaticamente (definido em `railway.json`). Restart automatico em caso de falha.

---

## 2. Frontend — Vercel

### 2.1 Importar projeto

```bash
# Via CLI
npm i -g vercel
cd apps/web
vercel link

# Via dashboard
# https://vercel.com/new — apontar para o repo, root = apps/web
```

### 2.2 Configurar variaveis de ambiente

No dashboard Vercel → Project → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://ecotrack-api.up.railway.app
NEXT_PUBLIC_MAPBOX_TOKEN=<opcional>
```

### 2.3 Build settings

O `vercel.json` configura:
- Framework: Next.js
- Build command roda do root do monorepo (`pnpm --filter @ecotrack/web build`)
- Region: gru1 (Sao Paulo)
- Headers de seguranca

Cada push para `master` faz deploy de producao. PRs viram preview deployments.

---

## 3. Email — Resend (recomendado)

1. Criar conta em https://resend.com
2. Verificar dominio (DNS: SPF + DKIM)
3. Gerar API key em Settings → API Keys
4. Configurar variaveis `SMTP_*` na Railway

Free tier: 3000 emails/mes, 100/dia.

Alternativas testadas: SendGrid, AWS SES, Mailgun, Postmark.

---

## 4. SINIR (Fase 2)

Em producao inicial, manter `SINIR_MODE=mock`. Para integracao oficial:

1. Credenciamento da empresa no [SINIR](https://sinir.gov.br)
2. Obter certificado digital ICP-Brasil A1 ou A3
3. Implementar cliente SOAP em `apps/api/src/services/sinir.ts` (funcao `clienteReal`)
4. Configurar `SINIR_MODE=real`, `SINIR_API_URL`, `SINIR_USERNAME`, `SINIR_PASSWORD`

---

## 5. Migrations

Em DEV:
```bash
pnpm --filter @ecotrack/api db:migrate
```

Em PROD: o Dockerfile roda `prisma migrate deploy` antes de startar o servidor — migrations sao aplicadas automaticamente a cada deploy.

Para rodar manualmente em PROD:
```bash
railway run pnpm --filter @ecotrack/api db:migrate:deploy
```

---

## 6. Logs e observabilidade

- **Railway**: logs estruturados Pino disponiveis no dashboard, com filtro por nivel
- **Vercel**: logs de build + serverless functions no dashboard
- **Sentry** (opcional Fase 2): adicionar `@sentry/node` na API e `@sentry/nextjs` no web

---

## 7. Checklist de go-live

- [ ] DNS configurado: `app.ecotrack.com.br` → Vercel, `api.ecotrack.com.br` → Railway
- [ ] SSL ativo (automatico em ambas as plataformas)
- [ ] Variaveis de ambiente preenchidas
- [ ] `JWT_SECRET` gerado com `openssl rand -base64 64`
- [ ] `ALLOWED_ORIGINS` aponta para o dominio real do frontend
- [ ] SMTP configurado e dominio verificado
- [ ] Migrations aplicadas (`pnpm --filter @ecotrack/api db:migrate:deploy`)
- [ ] Seed inicial rodado (`pnpm --filter @ecotrack/api db:seed`) — apenas no primeiro deploy
- [ ] Healthcheck `/health` retornando 200
- [ ] Testar cadastro de empresa end-to-end
- [ ] Testar emissao de MTR
- [ ] Backup automatico do PostgreSQL ativado (Railway o faz por padrao)
