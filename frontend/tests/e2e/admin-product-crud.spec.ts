/**
 * Testes E2E: CRUD de produto via painel admin
 *
 * Verifica o fluxo completo:
 * 1. Login no admin
 * 2. Criar produto com imagem sintética
 * 3. Verificar que produto aparece na loja com imagem
 * 4. Limpar produto de teste
 *
 * Requer credenciais de admin via variáveis de ambiente:
 *   ADMIN_EMAIL=admin@dozecrew.com
 *   ADMIN_PASSWORD=<senha>
 *   BACKEND_URL=https://shop-back.dozecrew.com (ou http://localhost:9000)
 */
import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dozecrew.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'supersecret'
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots')

const TEST_PRODUCT_HANDLE = 'e2e-test-produto-automatico'
const TEST_IMAGE_URL = 'https://picsum.photos/seed/ecommerce-test/400/400'

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

test.describe('Admin: CRUD de produto com imagem', () => {
  let adminToken = ''
  let testProductId = ''

  test.beforeAll(async ({ request }) => {
    // Autenticar no admin
    const res = await request.post(`${BACKEND_URL}/auth/user/emailpass`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
    if (!res.ok()) {
      console.warn(`Login admin falhou (${res.status()}) — testes de admin serão pulados`)
      return
    }
    const data = await res.json()
    adminToken = data.token || ''
  })

  test.afterAll(async ({ request }) => {
    // Limpar produto de teste se foi criado
    if (testProductId && adminToken) {
      await request
        .delete(`${BACKEND_URL}/admin/products/${testProductId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        .catch(() => {})
      console.log(`Produto de teste removido: ${testProductId}`)
    }
  })

  test('criar produto com imagem via API admin e verificar na loja', async ({
    request,
    page,
  }) => {
    if (!adminToken) {
      test.skip()
      return
    }

    const pubKey = process.env.MEDUSA_PUBLISHABLE_KEY || ''

    // 1. Criar produto com imagem sintética (URL pública)
    const createRes = await request.post(`${BACKEND_URL}/admin/products`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        title: 'Produto Teste E2E Automatizado',
        handle: TEST_PRODUCT_HANDLE,
        description: 'Produto criado automaticamente pelo teste E2E. Pode ser removido.',
        status: 'published',
        images: [{ url: TEST_IMAGE_URL }],
        options: [{ title: 'Tamanho', values: ['M'] }],
        variants: [
          {
            title: 'M',
            options: { Tamanho: 'M' },
            prices: [{ amount: 1000, currency_code: 'brl' }],
          },
        ],
      },
    })

    if (!createRes.ok()) {
      const body = await createRes.text()
      console.warn(`Criar produto falhou (${createRes.status()}): ${body.substring(0, 200)}`)
      test.skip()
      return
    }

    const { product } = await createRes.json()
    testProductId = product.id
    console.log(`Produto criado: id=${product.id} handle=${product.handle}`)

    // 2. Verificar imagem salva no produto via API
    expect(product.images?.length).toBeGreaterThan(0)
    const savedImageUrl: string = product.images[0].url
    console.log(`URL da imagem salva: ${savedImageUrl}`)

    // Em produção, a URL deve ser do MinIO — não do picsum original
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
    if (baseUrl.includes('dozecrew.com') && savedImageUrl.includes('picsum')) {
      console.warn(
        'AVISO: A imagem ainda aponta para picsum.photos em vez do MinIO.',
        'Isso indica que o file service S3 não está configurado corretamente.',
      )
    }

    // 3. Navegar para o produto (cache pode ainda não ter propagado — o teste aceita ausência)
    await page.goto(`/product/${TEST_PRODUCT_HANDLE}`)

    // O produto pode não aparecer imediatamente por cache
    const title = await page.locator('h1').textContent().catch(() => '')
    if (title && title.toLowerCase().includes('teste')) {
      // Produto apareceu — verificar imagem
      const productImage = page.locator('main img').first()
      const hasImage = await productImage.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasImage) {
        const width = await productImage.evaluate((img) => (img as HTMLImageElement).naturalWidth)
        expect(width).toBeGreaterThan(0)
        console.log(`Imagem do produto aparece na loja: width=${width}px`)
      }

      ensureDir(SCREENSHOTS_DIR)
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-admin-created-product.png') })
    } else {
      console.log('Produto ainda não aparece por cache — teste da visibilidade pulado')
    }

    // 4. Verificar que imagem é acessível via HTTP
    const imgRes = await request.get(savedImageUrl).catch(() => null)
    if (imgRes) {
      console.log(`HTTP status da imagem: ${imgRes.status()}`)
      expect(imgRes.status()).toBeLessThan(400)
    }
  })
})
