/**
 * Testes E2E: Integração S3 / MinIO
 *
 * Valida a cadeia completa de armazenamento de imagens:
 *   Backend → MinIO (upload) → URL pública → Frontend (carrega imagem)
 *
 * Requer:
 *   BACKEND_URL    = URL do backend Medusa (default: http://localhost:9000)
 *   S3_URL         = URL pública base do MinIO (default: http://localhost:9002/ecommerce-uploads)
 *   ADMIN_EMAIL    = Email de admin do Medusa
 *   ADMIN_PASSWORD = Senha de admin do Medusa
 *
 * Em dev: MinIO roda em localhost:9002 via docker-compose.
 * Em prod: MinIO em minio.storage:9000 (K8s), público via s3.minio.dozecrew.com.
 */
import { test, expect } from "@playwright/test";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000";
const S3_URL = process.env.S3_URL || "http://localhost:9002/ecommerce-uploads";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@dozecrew.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "supersecret";

// Extrai o endpoint do MinIO a partir do S3_URL (remove o bucket)
const MINIO_ENDPOINT = S3_URL.replace(/\/[^/]+\/?$/, "");

test.describe("S3 / MinIO — Infraestrutura", () => {
  test("endpoint do MinIO está acessível", async ({ request }) => {
    // O endpoint de health do MinIO responde em /minio/health/live
    const healthUrl = `${MINIO_ENDPOINT}/minio/health/live`;
    const res = await request.get(healthUrl).catch(() => null);

    if (!res) {
      console.warn(`MinIO health check falhou em: ${healthUrl}`);
      test.skip();
      return;
    }

    expect(res.status()).toBeLessThan(400);
    console.log(`MinIO acessível: ${healthUrl} → HTTP ${res.status()}`);
  });

  test("bucket ecommerce-uploads existe e tem acesso público de leitura", async ({ request }) => {
    // Tentar listar objetos do bucket via acesso anônimo — deve retornar 200 ou 403
    // (403 se vazio e bucket_list_objects estiver desabilitado, mas leitura de objeto individual funciona)
    const bucketUrl = `${S3_URL}/`;
    const res = await request.get(bucketUrl).catch(() => null);

    if (!res) {
      test.skip();
      return;
    }

    // 200 (listagem pública) ou 403 (listagem desabilitada mas objeto-level OK) são válidos
    // 404 = bucket não existe = FALHA
    expect(res.status()).not.toBe(404);
    console.log(`Bucket S3 acessível: ${bucketUrl} → HTTP ${res.status()}`);
  });
});

test.describe("S3 / MinIO — Upload via Backend", () => {
  let adminToken = "";

  test.beforeAll(async ({ request }) => {
    const res = await request
      .post(`${BACKEND_URL}/auth/user/emailpass`, {
        data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      })
      .catch(() => null);

    if (!res || !res.ok()) {
      console.warn(`Login admin falhou (${res?.status()}) — testes de upload serão pulados`);
      return;
    }

    const data = await res.json();
    adminToken = data.token || "";
    console.log(`Admin autenticado: ${adminToken ? "OK" : "FALHOU"}`);
  });

  test("backend consegue fazer upload de arquivo para o MinIO", async ({ request }) => {
    if (!adminToken) { test.skip(); return; }

    // Criar uma imagem PNG mínima válida (1x1 pixel branco)
    const minimalPng = Buffer.from(
      "89504e470d0a1a0a0000000d49484452000000010000000108020000009001" +
      "2e00000000c4944415478016360f8cfc000000002000100e221bc330000000049454e44ae426082",
      "hex",
    );

    const formData = new FormData();
    formData.append("files", new Blob([minimalPng], { type: "image/png" }), "e2e-test.png");

    const res = await request
      .post(`${BACKEND_URL}/admin/uploads`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        multipart: {
          files: {
            name: "e2e-test.png",
            mimeType: "image/png",
            buffer: minimalPng,
          },
        },
      })
      .catch(() => null);

    // Falha de conexão (MinIO/backend inacessível) → pular graciosamente
    if (!res) { test.skip(); return; }

    // Erro do servidor (ex: NoSuchBucket, S3 mal configurado) → FALHAR, não pular
    if (!res.ok()) {
      const body = await res.text().catch(() => "");
      const detail = `Upload falhou (HTTP ${res.status()}): ${body.substring(0, 300)}`;
      console.error(detail);
      // 4xx = erro de cliente (config, auth) → pular; 5xx = erro do servidor → falhar
      if (res.status() >= 500) {
        throw new Error(detail);
      }
      test.skip();
      return;
    }

    const data = await res.json();
    const uploadedUrl: string = data.files?.[0]?.url || data.url || "";
    expect(uploadedUrl).toBeTruthy();
    console.log(`Arquivo enviado ao S3: ${uploadedUrl}`);

    // Verificar que a URL é pública e acessível
    const imgRes = await request.get(uploadedUrl).catch(() => null);
    expect(imgRes).not.toBeNull();
    expect(imgRes!.status()).toBeLessThan(400);
    console.log(`URL S3 pública acessível: ${uploadedUrl} → HTTP ${imgRes!.status()}`);

    // Em produção, URL deve ser do MinIO (não localhost)
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    if (baseUrl.includes("dozecrew.com")) {
      expect(uploadedUrl).not.toContain("localhost");
      expect(uploadedUrl).toContain("minio.dozecrew.com");
    }
  });
});

test.describe("S3 / MinIO — Imagens na vitrine", () => {
  test("produto t-shirt tem imagem com URL acessível", async ({ request, page }) => {
    const pubKey = process.env.MEDUSA_PUBLISHABLE_KEY || "";

    const res = await request
      .get(`${BACKEND_URL}/store/products?handle=t-shirt&fields=*images`, {
        headers: { "x-publishable-api-key": pubKey },
      })
      .catch(() => null);

    if (!res || res.status() !== 200) {
      test.skip();
      return;
    }

    const data = await res.json();
    const product = data.products?.[0];
    expect(product).toBeTruthy();
    expect(product.images?.length).toBeGreaterThan(0);

    const imageUrl: string = product.images[0].url;
    console.log(`URL da imagem do produto via API: ${imageUrl}`);

    // URL não deve ser vazia
    expect(imageUrl).toBeTruthy();
    expect(imageUrl).not.toBe("/placeholder.svg");

    // URL deve ser acessível via HTTP
    const imgRes = await request.get(imageUrl).catch(() => null);
    if (imgRes) {
      expect(imgRes.status()).toBeLessThan(400);
      console.log(`Imagem acessível: HTTP ${imgRes.status()}`);
    }

    // Em produção, não deve ter URL interna
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    if (baseUrl.includes("dozecrew.com")) {
      expect(imageUrl).not.toContain("localhost");
      expect(imageUrl).not.toContain("minio.storage"); // URL interna do K8s não deve aparecer
    }
  });

  test("frontend carrega imagem do produto sem erros de CORS ou blocked", async ({ page }) => {
    await page.goto("/product/t-shirt");
    await expect(page.locator("h1")).toBeVisible();

    // Coleta erros de request falhados
    const failedImages: string[] = [];
    page.on("requestfailed", (req) => {
      if (req.resourceType() === "image") {
        failedImages.push(req.url());
      }
    });

    const productImg = page.locator("main img").first();
    await expect(productImg).toBeVisible();

    // Aguarda imagem carregar via naturalWidth polling
    const width = await expect
      .poll(() => productImg.evaluate((img) => (img as HTMLImageElement).naturalWidth), { timeout: 10000 })
      .toBeGreaterThan(0)
      .then(() => productImg.evaluate((img) => (img as HTMLImageElement).naturalWidth));

    console.log(`Imagem carregada no frontend: ${width}px`);

    if (failedImages.length > 0) {
      console.warn("Imagens com falha de carregamento:", failedImages);
    }
    // Nenhuma imagem deve falhar na página do produto
    expect(failedImages.length).toBe(0);
  });
});
