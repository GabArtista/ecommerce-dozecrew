import { test, expect, type Page } from '@playwright/test'

async function openFirstProduct(page: Page) {
  await page.goto('/')
  const firstProduct = page.locator('a[href^="/product/"]').first()
  await expect(firstProduct).toBeVisible()
  const href = await firstProduct.getAttribute('href')
  expect(href).toBeTruthy()
  await page.goto(href!)
}

test.describe('Storefront', () => {
  test('homepage carrega com produtos', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/.+/)
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible()
  })

  test('pagina de produto renderiza dados essenciais', async ({ page }) => {
    await openFirstProduct(page)
    await expect(page.locator('h1')).toBeVisible()
    await expect(
      page.locator('button:has-text("Add To Cart"), button:has-text("Out Of Stock")').first(),
    ).toBeVisible()
    const productImage = page.locator(
      'main img[src*="/_next/image"], main img[src*="localhost:9000/static/"]',
    ).first()
    await expect(productImage).toBeVisible()
    await expect
      .poll(() => productImage.evaluate((img) => img.naturalWidth))
      .toBeGreaterThan(0)
  })

  test('camiseta renderiza imagem principal carregada', async ({ page }) => {
    await page.goto('/product/t-shirt?cor=Preto&tamanho=P')
    await expect(page.locator('h1')).toBeVisible()
    const tShirtImage = page.locator('img[src*="localhost:9000/static/"]').first()
    await expect(tShirtImage).toBeVisible()
    await expect
      .poll(() => tShirtImage.evaluate((img) => img.naturalWidth))
      .toBeGreaterThan(0)
  })

  test('busca retorna resultados navegaveis', async ({ page }) => {
    await page.goto('/search')
    await expect(page).toHaveURL('/search')
    const firstProduct = page.locator('a[href^="/product/"]').first()
    await expect(firstProduct).toBeVisible()
  })

  test('carrinho abre ao clicar no icone', async ({ page }) => {
    await page.goto('/')
    await page.locator('button[aria-label="Open cart"]').click()
    await expect(page.getByText(/My Cart|carrinho/i)).toBeVisible()
  })

  test('adiciona produto ao carrinho e segue para checkout', async ({ page }) => {
    await page.goto('/product/t-shirt?cor=Preto&tamanho=P')
    await expect(page.locator('h1')).toBeVisible()
    await page.locator('button:has-text("Add To Cart")').click()
    await expect(page.locator('button[aria-label="Open cart"]')).toContainText('1')
    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByRole('heading', { name: /Finalizar Pedido/i })).toBeVisible()
  })

  test('mobile: homepage sem overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible()
  })
})
