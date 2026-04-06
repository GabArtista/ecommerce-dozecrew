import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000"
const STORE_URL = process.env.STORE_URL || "http://localhost:3000"

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
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
