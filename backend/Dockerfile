# Debian-based image: @swc/core native bindings require glibc (linux-x64-gnu)
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build without NODE_ENV=production so ts-node/swc can transpile medusa-config.ts
ENV DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa_build
ENV JWT_SECRET=build_secret
ENV COOKIE_SECRET=build_secret
ENV STORE_CORS=http://localhost:3000
ENV ADMIN_CORS=http://localhost:9000
ENV AUTH_CORS=http://localhost:3000
ENV ASAAS_API_KEY=dummy_for_build
# S3/MinIO: valores dummy para satisfazer o build (não fazem conexão real)
ENV S3_URL=http://localhost:9002/ecommerce-uploads
ENV S3_BUCKET=ecommerce-uploads
ENV S3_REGION=us-east-1
ENV S3_ENDPOINT=http://localhost:9002
ENV S3_ACCESS_KEY_ID=dummy_for_build
ENV S3_SECRET_ACCESS_KEY=dummy_for_build

RUN npm run build
# Sobrescreve o medusa-config.js compilado com a versão prod.js pré-compilada
# Garante que os módulos S3 e Asaas estejam sempre incluídos mesmo que o build
# gere uma versão incompleta do config por tree-shaking ou quirks do compilador.
RUN cp medusa-config.prod.js .medusa/server/medusa-config.js

# Production runner: start from the compiled .medusa/server directory
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the compiled server output
COPY --from=builder /app/.medusa/server ./server
# Copy node_modules so medusa can find its dependencies
COPY --from=builder /app/node_modules ./server/node_modules

# Patch: normalize emails to lowercase in auth-emailpass provider (case-insensitive login fix)
RUN sed -i 's/entity_id: email,$/entity_id: typeof email === "string" ? email.toLowerCase() : email,/' ./server/node_modules/@medusajs/auth-emailpass/dist/services/emailpass.js
RUN sed -i 's/entity_id: email,$/entity_id: typeof email === "string" ? email.toLowerCase() : email,/' ./server/node_modules/@medusajs/auth-emailpass/dist/services/emailpass.js

WORKDIR /app/server
EXPOSE 9000
CMD ["npm", "run", "start"]
