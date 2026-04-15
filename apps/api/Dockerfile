# EcoTrack API — Dockerfile multi-stage para Railway/Fly/Render
# Base: Node 20 Alpine — minimo, seguro, rapido

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /repo

# ─── Stage 1: install dependencias ─────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ─── Stage 2: build ────────────────────────────────────────────────────────
FROM deps AS build
COPY packages packages
COPY apps/api apps/api
RUN cd apps/api && pnpm db:generate
RUN pnpm --filter @ecotrack/api build

# ─── Stage 3: runtime ──────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copia apenas o necessario
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/packages ./packages

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Healthcheck consome /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Roda migrations e starta servidor
CMD ["sh", "-c", "cd apps/api && pnpm prisma migrate deploy && cd /app && node dist/apps/api/src/server.js"]
