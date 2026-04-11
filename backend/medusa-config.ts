import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000"
const STORE_URL = process.env.STORE_URL || "http://localhost:3000"

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL || undefined, // Remove when Redis is not available
    http: {
      storeCors: process.env.STORE_CORS || STORE_URL,
      adminCors: process.env.ADMIN_CORS || `${BACKEND_URL},${STORE_URL}`,
      authCors: process.env.AUTH_CORS || `${BACKEND_URL},${STORE_URL}`,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "s3",
            options: {
              // file_url: URL pública base usada para gerar o endereço das imagens armazenadas.
              //   Dev  → http://localhost:9002/ecommerce-uploads  (MinIO via docker-compose)
              //   Prod → https://s3.minio.dozecrew.com/ecommerce-uploads (MinIO via K8s Ingress)
              file_url: process.env.S3_URL || "http://localhost:9002/ecommerce-uploads",
              bucket: process.env.S3_BUCKET || "ecommerce-uploads",
              region: process.env.S3_REGION || "us-east-1",
              // endpoint: URL interna usada pelo SDK S3 para operações de upload/download.
              //   Dev  → http://localhost:9002  (porta do MinIO no docker-compose)
              //   Prod → http://minio.storage:9000 (serviço K8s interno — definido via env var)
              endpoint: process.env.S3_ENDPOINT || "http://localhost:9002",
              access_key_id: process.env.S3_ACCESS_KEY_ID || "admin",
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY || "password",
              additional_client_config: {
                forcePathStyle: true,
              },
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/asaas",
            id: "asaas",
            options: {
              apiKey: process.env.ASAAS_API_KEY || "",
              sandbox: process.env.ASAAS_SANDBOX !== "false",
            },
          },
        ],
      },
    },
  ],
  plugins: [],
})
