# EcoTrack API — Dockerfile multi-stage para Railway/Fly/Render

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /repo

# ─── Stage 1: install + build ──────────────────────────────────────────────
FROM base AS build

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# --shamefully-hoist: flatten node_modules para compatibilidade com Docker COPY
RUN pnpm install --frozen-lockfile --shamefully-hoist

COPY packages packages
COPY apps/api apps/api

WORKDIR /repo/apps/api
RUN pnpm db:generate
WORKDIR /repo
RUN pnpm --filter @ecotrack/api build

# ─── Stage 2: runtime ──────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# node_modules hoisted (sem symlinks)
COPY --from=build /repo/node_modules ./node_modules
# Prisma client gerado
COPY --from=build /repo/node_modules/.prisma ./node_modules/.prisma
# JS compilado
COPY --from=build /repo/apps/api/dist ./dist
# Schema Prisma (para migrations)
COPY --from=build /repo/apps/api/prisma ./prisma
# Shared package compilado
COPY --from=build /repo/packages ./packages
# Start script
COPY apps/api/start.js ./start.js

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "start.js"]
