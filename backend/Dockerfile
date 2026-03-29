FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build with development mode so ts-node can load medusa-config.ts
ENV DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa_build
ENV JWT_SECRET=build_secret
ENV COOKIE_SECRET=build_secret
ENV STORE_CORS=http://localhost:3000
ENV ADMIN_CORS=http://localhost:9000
ENV AUTH_CORS=http://localhost:3000
ENV ASAAS_API_KEY=dummy_for_build

RUN npm run build

ENV NODE_ENV=production

EXPOSE 9000

# medusa start reads from .medusa/server/ at runtime
CMD ["npm", "run", "start"]
