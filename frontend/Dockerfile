FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build env vars (baked into the static bundle at build time)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SITE_NAME="Minha Loja"
ENV MEDUSA_BACKEND_URL=http://medusa-backend
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://shop-back.dozecrew.com
ENV MEDUSA_PUBLISHABLE_KEY=""
ENV MEDUSA_REVALIDATION_SECRET=ecommerce_jwt_secret_2026

RUN npm run build && mkdir -p /app/public

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000
CMD ["npm", "start"]
