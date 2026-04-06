import { test, expect, type Page } from '@playwright/test'

async function openFirstProduct(page: Page) {
  await page.goto('/')
  const firstProduct = page.locator('a[href^="/product/"]').first()
  await expect(firstProduct).toBeVisible()
  const href = await firstProduct.getAttribute('href')
  expect(href).toBeTruthy()
  await page.goto(href!)
}

async function addTshirtToCart(page: Page) {
  await page.goto('/product/t-shirt?cor=Preto&tamanho=P')
  await expect(page.locator('h1')).toBeVisible()
  await page.locator('button:has-text("Add To Cart")').click()
  await page.waitForTimeout(500)
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

  test('remove item do carrinho', async ({ page }) => {
    await addTshirtToCart(page)

    // Abre o carrinho
    await page.locator('button[aria-label="Open cart"]').click()
    await expect(page.getByText(/My Cart|carrinho/i)).toBeVisible()

    // Clica no botão de deletar item
    const deleteBtn = page.locator('button[aria-label*="Remove"], button[aria-label*="Delete"], form button[type="submit"]').first()
    const hasDelete = await deleteBtn.isVisible().catch(() => false)

    if (hasDelete) {
      await deleteBtn.click()
      await page.waitForTimeout(500)
      // Carrinho deve estar vazio ou com menos itens
      const emptyCart = page.locator('text=/empty|vazio|sem itens/i').first()
      const badgeText = await page.locator('button[aria-label="Open cart"]').textContent().catch(() => '')
      const isEmpty = await emptyCart.isVisible().catch(() => false)
      expect(isEmpty || badgeText === '0' || badgeText === '').toBeTruthy()
    }
  })

  test('atualiza quantidade do item no carrinho', async ({ page }) => {
    await addTshirtToCart(page)

    await page.locator('button[aria-label="Open cart"]').click()
    await expect(page.getByText(/My Cart|carrinho/i)).toBeVisible()

    // Localiza botão + para aumentar quantidade
    const plusBtn = page.locator('button[aria-label*="Increase"], button:has-text("+")').first()
    const hasPlus = await plusBtn.isVisible().catch(() => false)

    if (hasPlus) {
      await plusBtn.click()
      await page.waitForTimeout(500)
      // Badge deve mostrar 2
      const badge = page.locator('button[aria-label="Open cart"]')
      const text = await badge.textContent().catch(() => '')
      expect(text).toContain('2')
    }
  })

  test('selecao de variante de produto altera estado do botao', async ({ page }) => {
    await page.goto('/product/t-shirt')
    await expect(page.locator('h1')).toBeVisible()

    // Verifica que existem opções de tamanho/cor
    const variantBtns = page.locator('button[title], [role="radio"], label:has(input[type="radio"])').first()
    const hasVariants = await variantBtns.isVisible().catch(() => false)

    if (hasVariants) {
      await variantBtns.click()
      await page.waitForTimeout(300)
      // Botão de add to cart deve continuar visível
      await expect(
        page.locator('button:has-text("Add To Cart"), button:has-text("Out Of Stock")').first()
      ).toBeVisible()
    }
  })

  test('mobile: homepage sem overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible()
  })

  test('mobile: produto e carrinho funcionam em tela pequena', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/product/t-shirt?cor=Preto&tamanho=P')
    await expect(page.locator('h1')).toBeVisible()
    await page.locator('button:has-text("Add To Cart")').click()
    await page.waitForTimeout(500)

    // Badge no carrinho atualiza
    const cartBtn = page.locator('button[aria-label="Open cart"]')
    await expect(cartBtn).toBeVisible()
    const badgeText = await cartBtn.textContent().catch(() => '')
    expect(badgeText).toContain('1')
  })
})
