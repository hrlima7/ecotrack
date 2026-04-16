#!/bin/sh
set -e

cd /app/apps/api
pnpm prisma migrate deploy

cd /app
node dist/apps/api/src/server.js
