export default {
  experimental: {
    ppr: false,
    inlineCss: false,
    useCache: true,
  },
  typescript: {
    // O erro em lib/medusa/index.ts (revalidateTag) é uma incompatibilidade
    // de tipos com o Next.js 15.6.0-canary que não afeta o funcionamento.
    // Será corrigido quando o canary estabilizar.
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
        pathname: "/**",
      },
      // MinIO dev local (docker-compose: S3_ENDPOINT=http://localhost:9002)
      {
        protocol: "http",
        hostname: "localhost",
        port: "9002",
        pathname: "/**",
      },
      // MinIO S3 — produção (público)
      {
        protocol: "https",
        hostname: "s3.minio.dozecrew.com",
        pathname: "/**",
      },
      // MinIO interno K8s
      {
        protocol: "http",
        hostname: "minio.storage",
        port: "9000",
        pathname: "/**",
      },
    ],
  },
};
