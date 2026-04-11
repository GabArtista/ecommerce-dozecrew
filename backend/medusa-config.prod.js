"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
(0, utils_1.loadEnv)(process.env.NODE_ENV || 'development', process.cwd());
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000";
const STORE_URL = process.env.STORE_URL || "http://localhost:3000";
module.exports = (0, utils_1.defineConfig)({
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
            resolve: "@medusajs/medusa/file",
            options: {
                providers: [
                    {
                        resolve: "@medusajs/file-s3",
                        id: "s3",
                        options: {
                            file_url: process.env.S3_URL || "https://s3.minio.dozecrew.com/ecommerce-uploads",
                            bucket: process.env.S3_BUCKET || "ecommerce-uploads",
                            region: process.env.S3_REGION || "us-east-1",
                            endpoint: process.env.S3_ENDPOINT || "http://minio.storage:9000",
                            access_key_id: process.env.S3_ACCESS_KEY_ID || "",
                            secret_access_key: process.env.S3_SECRET_ACCESS_KEY || "",
                            additional_client_config: { forcePathStyle: true },
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
});
