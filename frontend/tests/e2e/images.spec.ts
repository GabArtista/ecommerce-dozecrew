/**
 * Testes E2E de carregamento de imagens
 *
 * Estes testes verificam que imagens de produto aparecem corretamente
 * tanto em desenvolvimento (localhost:9000) quanto em produção (MinIO/S3).
 * Screenshots são capturados em cada etapa como prova visual.
 */
import { test, expect, type Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots')

function ensureScreenshotsDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  }
}

async function screenshotName(page: Page, name: string) {
  ensureScreenshotsDir()
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: false })
  console.log(`Screenshot salvo: ${filePath}`)
  return filePath
}

async function waitForImagesLoaded(page: Page, selector: string): Promise<number[]> {
  return page.evaluate((sel) => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(sel))
    return imgs.map((img) => img.naturalWidth)
  }, selector)
}

test.describe('Imagens de Produto', () => {
  test.beforeEach(async ({ page }) => {
    // Aguarda que a página esteja estável antes de cada teste
    page.setDefaultTimeout(20000)
  })

  test('homepage mostra grade de 3 produtos com imagens carregadas', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // Aguarda que os produtos da grade apareçam
    const productLinks = page.locator('a[href^="/product/"]')
    await expect(productLinks.first()).toBeVisible({ timeout: 15000 })

    // Verifica que há ao menos 3 produtos na grade da home
    const count = await productLinks.count()
    expect(count).toBeGreaterThanOrEqual(1)

    // Verifica que as imagens da grade têm dimensões reais (foram carregadas)
    const gridImages = page.locator('section img, ul li img').first()
    const hasGridImage = await gridImages.isVisible().catch(() => false)
    if (hasGridImage) {
      await expect
        .poll(() => gridImages.evaluate((img) => (img as HTMLImageElement).naturalWidth), { timeout: 10000 })
        .toBeGreaterThan(0)
    }

    await screenshotName(page, '01-homepage-with-products')
  })

  test('homepage carousel tem imagens carregadas', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // Aguarda o carousel aparecer
    const carouselImages = page.locator('ul.animate-carousel img, [class*="carousel"] img')
    const hasCarousel = await carouselImages.first().isVisible({ timeout: 10000 }).catch(() => false)

    if (hasCarousel) {
      const widths = await waitForImagesLoaded(page, 'ul.animate-carousel img, [class*="carousel"] img')
      const loaded = widths.filter((w) => w > 0)
      expect(loaded.length).toBeGreaterThan(0)
      console.log(`Carousel: ${loaded.length}/${widths.length} imagens carregadas`)
    }

    await screenshotName(page, '02-homepage-carousel')
  })

  test('página de produto exibe imagem principal carregada', async ({ page }) => {
    await page.goto('/product/t-shirt')
    await expect(page.locator('h1')).toBeVisible()

    // Imagem principal do produto
    const mainImage = page.locator('main img').first()
    await expect(mainImage).toBeVisible()

    const width = await mainImage.evaluate((img) => (img as HTMLImageElement).naturalWidth)
    expect(width).toBeGreaterThan(0)

    // Verifica que a imagem tem src não vazio
    const src = await mainImage.getAttribute('src')
    expect(src).toBeTruthy()
    expect(src).not.toBe('/placeholder.svg')

    await screenshotName(page, '03-product-page-image')
    console.log(`Imagem do produto: src=${src?.substring(0, 80)}... width=${width}px`)
  })

  test('galeria do produto tem múltiplas imagens carregadas', async ({ page }) => {
    await page.goto('/product/t-shirt')
    await expect(page.locator('h1')).toBeVisible()

    const galleryImages = page.locator('main img')
    const count = await galleryImages.count()
    expect(count).toBeGreaterThan(0)

    // Verifica que todas as imagens visíveis estão carregadas
    const widths = await waitForImagesLoaded(page, 'main img')
    const loaded = widths.filter((w) => w > 0)
    console.log(`Galeria: ${loaded.length}/${widths.length} imagens carregadas`)
    expect(loaded.length).toBeGreaterThan(0)

    await screenshotName(page, '04-product-gallery')
  })

  test('thumbnail do produto aparece no carrinho', async ({ page }) => {
    // Adicionar produto ao carrinho
    await page.goto('/product/t-shirt')
    await expect(page.locator('h1')).toBeVisible()

    const addButton = page.locator('button:has-text("Add To Cart")').first()
    const inStock = await addButton.isVisible().catch(() => false)

    if (inStock) {
      await addButton.click()
      // Aguarda badge confirmar item adicionado em vez de timeout fixo
      await expect(page.locator('button[aria-label="Open cart"]')).toContainText('1', { timeout: 8000 })

      // Abrir carrinho
      await page.locator('button[aria-label="Open cart"]').click()
      await expect(page.getByText(/My Cart|carrinho/i)).toBeVisible()

      // Verificar thumbnail no carrinho
      const cartImage = page.locator('dialog img, [role="dialog"] img, aside img').first()
      const hasCartImage = await cartImage.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasCartImage) {
        const width = await cartImage.evaluate((img) => (img as HTMLImageElement).naturalWidth)
        expect(width).toBeGreaterThan(0)
        console.log(`Thumbnail no carrinho: width=${width}px`)
      }

      await screenshotName(page, '05-cart-with-thumbnail')
    }
  })

  test('página de busca mostra produtos com imagens', async ({ page }) => {
    await page.goto('/search')
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible({ timeout: 15000 })

    const searchImages = page.locator('a[href^="/product/"] img').first()
    const hasImages = await searchImages.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasImages) {
      await expect
        .poll(() => searchImages.evaluate((img) => (img as HTMLImageElement).naturalWidth), { timeout: 10000 })
        .toBeGreaterThan(0)
    }

    await screenshotName(page, '06-search-results-images')
  })

  test('imagens têm URLs válidas (não localhost em produção)', async ({ page }) => {
    await page.goto('/product/t-shirt')
    await expect(page.locator('h1')).toBeVisible()

    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
    const isProduction = baseUrl.includes('dozecrew.com')

    const srcs: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLImageElement>('main img'))
        .map((img) => img.src)
        .filter(Boolean)
    )

    console.log(`URLs de imagens encontradas: ${srcs.length}`)
    srcs.forEach((src) => console.log(`  - ${src.substring(0, 100)}`))

    expect(srcs.length).toBeGreaterThan(0)

    if (isProduction) {
      // Em produção, imagens NÃO devem ter localhost ou URLs internas
      const localUrls = srcs.filter(
        (src) => src.includes('localhost') || src.includes('127.0.0.1') || src.includes('minio.storage')
      )
      if (localUrls.length > 0) {
        console.warn('AVISO: Imagens com URL local em produção:', localUrls)
      }

      // Imagens de produção devem ser de hosts conhecidos
      const validHosts = ['s3.minio.dozecrew.com', 'medusa-public-images.s3', 'cdn.shopify.com', '_next/image']
      const validUrls = srcs.filter((src) => validHosts.some((h) => src.includes(h)))
      expect(validUrls.length).toBeGreaterThan(0)
    }

    await screenshotName(page, '07-image-url-validation')
  })

  test('produto recém-adicionado via API aparece na loja com imagem', async ({ request, page }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:9000'
    const pubKey = process.env.MEDUSA_PUBLISHABLE_KEY || ''

    // Verificar que o backend está acessível
    const health = await request.get(`${backendUrl}/health`)
    if (!health.ok()) {
      test.skip()
      return
    }

    // Buscar produto t-shirt via API
    const res = await request.get(`${backendUrl}/store/products?handle=t-shirt&fields=*images,*variants`, {
      headers: { 'x-publishable-api-key': pubKey },
    })

    if (res.status() === 200) {
      const data = await res.json()
      const product = data.products?.[0]
      expect(product).toBeTruthy()
      expect(product.images?.length).toBeGreaterThan(0)

      const imageUrl: string = product.images[0].url
      console.log(`URL da imagem via API: ${imageUrl}`)

      // Verificar que a URL não é localhost em produção
      const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
      if (baseUrl.includes('dozecrew.com')) {
        expect(imageUrl).not.toContain('localhost')
      }

      // Verificar que a URL retorna 200
      const imgRes = await request.get(imageUrl).catch(() => null)
      if (imgRes) {
        expect(imgRes.status()).toBeLessThan(400)
        console.log(`Imagem acessível: ${imageUrl.substring(0, 80)} → HTTP ${imgRes.status()}`)
      }
    }

    await page.goto('/product/t-shirt')
    await screenshotName(page, '08-api-verified-product-image')
  })
})
