# syntax=docker/dockerfile:1

# ---- deps: install dependencies once, cached across builds ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: generate Prisma client + build the production Next.js app ----
# Also used directly (via `--target builder`) to run `prisma migrate deploy`
# and `prisma db seed` on the VPS, since it still has the full source tree,
# devDependencies, and the Prisma CLI that the slim runner image drops.
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal production image ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# File uploads (see src/lib/storage.ts) are written under ./uploads relative
# to the process cwd (/app here) — the compose file mounts a volume there so
# uploads survive container rebuilds.
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
