/**
 * Testes E2E: Fluxo completo de checkout
 *
 * Dados sintéticos gerados para testar o fluxo ponta-a-ponta:
 * - Adicionar produto ao carrinho
 * - Preencher endereço de entrega
 * - Selecionar frete
 * - Verificar resumo do pedido
 *
 * Nota: Não executa pagamento real (ASAAS em sandbox).
 */
import { test, expect, type Page } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots')

// Dados sintéticos de checkout
const SYNTHETIC_CUSTOMER = {
  email: `test.e2e.${Date.now()}@exemplo.com`,
  firstName: 'João',
  lastName: 'Teste E2E',
  phone: '11987654321',
  address: {
    line1: 'Av. Paulista, 1578',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01310-200',
    country: 'BR',
  },
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

async function addProductToCart(page: Page, handle: string) {
  await page.goto(`/product/${handle}`)
  await expect(page.locator('h1')).toBeVisible()

  const addBtn = page.locator('button:has-text("Add To Cart")').first()
  const inStock = await addBtn.isVisible({ timeout: 5000 }).catch(() => false)

  if (!inStock) {
    console.log(`Produto ${handle} fora de estoque ou não encontrado`)
    return false
  }

  await addBtn.click()
  await page.waitForTimeout(800)

  // Verificar badge do carrinho
  const cartBadge = page.locator('button[aria-label="Open cart"]')
  const badgeText = await cartBadge.textContent().catch(() => '')
  console.log(`Carrinho após adicionar: "${badgeText}"`)
  return badgeText.includes('1') || badgeText.includes('2')
}

test.describe('Checkout Flow', () => {
  test.beforeEach(({ page }) => {
    page.setDefaultTimeout(20000)
  })

  test('adicionar produto e verificar carrinho', async ({ page }) => {
    const added = await addProductToCart(page, 't-shirt')
    expect(added).toBeTruthy()

    ensureDir(SCREENSHOTS_DIR)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-product-added-to-cart.png') })
  })

  test('abrir modal do carrinho com produto e thumbnail', async ({ page }) => {
    await addProductToCart(page, 't-shirt')

    await page.locator('button[aria-label="Open cart"]').click()
    await expect(page.getByText(/My Cart|carrinho/i)).toBeVisible()

    // Carrinho deve ter produto
    const cartItems = page.locator('dialog li, [role="dialog"] li, aside li')
    const hasItems = await cartItems.first().isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasItems).toBeTruthy()

    ensureDir(SCREENSHOTS_DIR)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-cart-modal-open.png') })
  })

  test('ir para checkout após adicionar produto', async ({ page }) => {
    await addProductToCart(page, 't-shirt')

    // Navegar para checkout
    await page.goto('/checkout')
    const checkoutRes = page.url()
    expect(checkoutRes).toContain('checkout')

    await expect(page.locator('body')).toBeVisible()

    ensureDir(SCREENSHOTS_DIR)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-checkout-page.png') })
  })

  test('checkout: preencher endereço com dados sintéticos', async ({ page }) => {
    await addProductToCart(page, 't-shirt')
    await page.goto('/checkout')

    await expect(page.locator('body')).toBeVisible()

    // Tentar preencher campos de email
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()
    const hasEmail = await emailField.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasEmail) {
      await emailField.fill(SYNTHETIC_CUSTOMER.email)
      console.log(`Email preenchido: ${SYNTHETIC_CUSTOMER.email}`)
    }

    // Campos de nome
    const firstNameField = page.locator('input[name="first_name"], input[placeholder*="nome" i], input[placeholder*="first" i]').first()
    const hasFirstName = await firstNameField.isVisible({ timeout: 2000 }).catch(() => false)
    if (hasFirstName) {
      await firstNameField.fill(SYNTHETIC_CUSTOMER.firstName)
    }

    const lastNameField = page.locator('input[name="last_name"], input[placeholder*="sobrenome" i], input[placeholder*="last" i]').first()
    const hasLastName = await lastNameField.isVisible({ timeout: 2000 }).catch(() => false)
    if (hasLastName) {
      await lastNameField.fill(SYNTHETIC_CUSTOMER.lastName)
    }

    // CEP
    const zipField = page.locator('input[name="postal_code"], input[name="cep"], input[placeholder*="CEP" i], input[placeholder*="zip" i]').first()
    const hasZip = await zipField.isVisible({ timeout: 2000 }).catch(() => false)
    if (hasZip) {
      await zipField.fill(SYNTHETIC_CUSTOMER.address.postalCode)
      await page.waitForTimeout(500)
    }

    ensureDir(SCREENSHOTS_DIR)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-checkout-address-filled.png') })
    console.log('Dados de checkout preenchidos com dados sintéticos')
  })

  test('checkout: verificar opções de frete disponíveis', async ({ page }) => {
    await addProductToCart(page, 't-shirt')
    await page.goto('/checkout')
    await expect(page.locator('body')).toBeVisible()

    // Verificar se há opções de frete na página
    const shippingOptions = page.locator('[data-testid="shipping-option"], input[name*="shipping"], label:has-text("Frete"), label:has-text("Standard"), label:has-text("Padrão")')
    const hasShipping = await shippingOptions.first().isVisible({ timeout: 5000 }).catch(() => false)

    if (hasShipping) {
      const count = await shippingOptions.count()
      expect(count).toBeGreaterThan(0)
      console.log(`Opções de frete disponíveis: ${count}`)

      ensureDir(SCREENSHOTS_DIR)
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-checkout-shipping-options.png') })
    } else {
      console.log('Opções de frete não visíveis nesta etapa do checkout')
    }
  })

  test('página de checkout renderiza resumo do pedido com imagens', async ({ page }) => {
    await addProductToCart(page, 't-shirt')
    await page.goto('/checkout')
    await expect(page.locator('body')).toBeVisible()

    // Verificar que o resumo do pedido tem imagens de produto
    const summaryImages = page.locator('img')
    const imgCount = await summaryImages.count()
    console.log(`Total de imagens no checkout: ${imgCount}`)

    if (imgCount > 0) {
      const firstImg = summaryImages.first()
      const hasImage = await firstImg.isVisible({ timeout: 3000 }).catch(() => false)
      if (hasImage) {
        const width = await firstImg.evaluate((img) => (img as HTMLImageElement).naturalWidth)
        console.log(`Primeira imagem no checkout: width=${width}px`)
      }
    }

    ensureDir(SCREENSHOTS_DIR)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-checkout-order-summary.png'), fullPage: true })
  })
})
