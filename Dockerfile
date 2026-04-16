# EcoTrack API — Dockerfile para Railway v2

FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copiar todo o repo (Railway monta o contexto na raiz)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages packages
COPY apps/api apps/api

# Instalar deps com hoist para evitar symlinks
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Gerar Prisma client e buildar TypeScript
WORKDIR /app/apps/api
RUN pnpm db:generate
RUN pnpm build

# Voltar para raiz
WORKDIR /app

# Copiar start script
COPY apps/api/start.js ./start.js

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "start.js"]
