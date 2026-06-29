FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install dependencies (includes native better-sqlite3 build)
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (gitignored, must be generated in build)
RUN npx prisma generate

# Create empty database with schema applied (local DB is not committed)
RUN mkdir -p data && npx prisma migrate deploy

# Branding build args — Coolify injects build-time envs as --build-arg.
# NEXT_PUBLIC_* values are inlined at build, so they MUST be present here
# (declare the ARG + promote to ENV before `npm run build`).
ARG NEXT_PUBLIC_CLIENT_NAME
ARG NEXT_PUBLIC_CLIENT_LOGO
ARG NEXT_PUBLIC_DASHBOARD_TITLE
ARG NEXT_PUBLIC_AUTO_REFRESH_MS
ENV NEXT_PUBLIC_CLIENT_NAME=$NEXT_PUBLIC_CLIENT_NAME
ENV NEXT_PUBLIC_CLIENT_LOGO=$NEXT_PUBLIC_CLIENT_LOGO
ENV NEXT_PUBLIC_DASHBOARD_TITLE=$NEXT_PUBLIC_DASHBOARD_TITLE
ENV NEXT_PUBLIC_AUTO_REFRESH_MS=$NEXT_PUBLIC_AUTO_REFRESH_MS

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM base AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy empty schema'd SQLite database from builder
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
