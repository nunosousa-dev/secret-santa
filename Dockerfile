FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --include=dev

FROM dependencies AS build
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 DATABASE_PATH=/data/family.sqlite
RUN groupadd --system --gid 1001 nodejs && useradd --uid 1001 --gid nodejs --no-create-home nextjs && mkdir /data /backups && chown nextjs:nodejs /data /backups
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/scripts/runtime-backup.mjs ./scripts/backup.mjs
USER 1001:1001
EXPOSE 3000
CMD ["node", "server.js"]
