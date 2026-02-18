# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:18-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy dependency manifests first (better Docker cache)
COPY package.json ./

# 2. Install ALL dependencies (including devDependencies for tsc)
RUN npm install

# 3. Copy Prisma schema and generate the client
COPY prisma ./prisma
RUN npx prisma generate

# 4. Copy source code
COPY tsconfig.json ./
COPY src ./src

# 5. Compile TypeScript → dist/
RUN npx tsc

# ── Stage 2: Production ────────────────────────────────────────
FROM node:18-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy dependency manifest
COPY package.json ./

# 2. Install production dependencies only
RUN npm install --omit=dev

# 3. Copy Prisma schema + generated client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# 4. Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

# 5. Copy entrypoint script
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# 6. Expose the port Railway will route to
EXPOSE 3000

# 7. Start with entrypoint (syncs DB schema, then starts server)
CMD ["./entrypoint.sh"]
