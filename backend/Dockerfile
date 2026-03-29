FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Set build environment (dummy DB for medusa build step)
ENV DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa_build
ENV JWT_SECRET=build_secret
ENV COOKIE_SECRET=build_secret
ENV STORE_CORS=http://localhost:3000
ENV ADMIN_CORS=http://localhost:9000
ENV AUTH_CORS=http://localhost:3000
ENV NODE_ENV=production
ENV ASAAS_API_KEY=dummy_for_build

# Build Medusa
RUN npm run build

EXPOSE 9000

# Start Medusa (will use real env vars from k8s at runtime)
CMD ["npm", "run", "start"]
