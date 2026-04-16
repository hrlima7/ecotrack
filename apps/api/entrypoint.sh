#!/bin/sh
set -e

npx prisma migrate deploy --schema /app/apps/api/prisma/schema.prisma

exec node /app/dist/apps/api/src/server.js
