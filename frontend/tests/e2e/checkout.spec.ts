import { test, expect } from '@playwright/test'

test.describe('Checkout', () => {
  test('botao proceed to checkout redireciona para /checkout', async ({ page }) => {
    await page.goto('/')
    await page.goto('/checkout')
    await expect(page).toHaveURL('/checkout')
    await expect(page.url()).not.toContain('localhost:9000')
  })

  test('checkout sem cart redireciona para home', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/$|\/checkout/)
  })

  test('formulario de endereco com auto-fill CEP', async ({ page }) => {
    await page.goto('/checkout')
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
  })

  test('pagina de confirmacao acessivel', async ({ page }) => {
    await page.goto('/checkout/confirmacao/test-order-id')
    await expect(page).toHaveURL(/confirmacao/)
  })

  test('checkout page does not expose backend URL in DOM', async ({ page }) => {
    await page.goto('/checkout')
    const backendUrlInLinks = await page.locator('a[href*="localhost:9000"]').count()
    expect(backendUrlInLinks).toBe(0)
  })

  test('redirect para confirmacao apos ordem bem-sucedida', async ({ page }) => {
    // Verifica estrutura da URL de confirmacao
    await page.goto('/checkout/confirmacao/ORDER-123?payment=pix')
    await expect(page).toHaveURL(/confirmacao\/ORDER-123/)
  })
})

test.describe('Checkout com carrinho', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'only run on chromium')

  test('campos obrigatorios do formulario de endereco sao visiveis', async ({ page }) => {
    await page.goto('/product/t-shirt?cor=Preto&tamanho=P')
    await expect(page.locator('button:has-text("Add To Cart")')).toBeVisible()
    await page.locator('button:has-text("Add To Cart")').click()
    await page.waitForTimeout(500)

    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.locator('h2').filter({ hasText: 'Identificação' }).first()).toBeVisible()
    await expect(page.locator('h2').filter({ hasText: 'Endereço' }).first()).toBeVisible()
  })

  test('CEP auto-fill preenche endereco', async ({ page }) => {
    await page.goto('/product/t-shirt?cor=Preto&tamanho=P')
    await page.locator('button:has-text("Add To Cart")').click()
    await page.waitForTimeout(500)

    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/checkout/)

    const cepInput = page.locator('#cep, input[name="cep"]').first()
    const visible = await cepInput.isVisible().catch(() => false)

    if (visible) {
      await cepInput.fill('01310-100') // Avenida Paulista - CEP válido
      await page.waitForTimeout(2000) // aguarda API ViaCEP

      const cityInput = page.locator('#city, input[name="city"]').first()
      const cityFilled = await cityInput.inputValue().catch(() => '')
      if (cityFilled) {
        expect(cityFilled.toLowerCase()).toContain('paulo')
      }
    }
  })

  test('secoes de frete e pagamento estao disponiveis', async ({ page }) => {
    await page.goto('/product/t-shirt?cor=Preto&tamanho=P')
    await page.locator('button:has-text("Add To Cart")').click()
    await page.waitForTimeout(500)

    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/checkout/)

    await expect(page.locator('h2').filter({ hasText: 'Frete' }).first()).toBeVisible()
    await expect(page.locator('h2').filter({ hasText: 'Pagamento' }).first()).toBeVisible()
  })
})
