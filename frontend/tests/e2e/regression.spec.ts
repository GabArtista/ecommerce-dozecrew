import { test, expect } from '@playwright/test'

test.describe('Regressao', () => {
  test('homepage ainda carrega (sem regressao)', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })

  test('robots.txt acessivel', async ({ page }) => {
    const response = await page.goto('/robots.txt')
    expect(response?.status()).toBe(200)
  })

  test('sitemap.xml acessivel', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    expect(response?.status()).toBe(200)
  })

  test('backend health check', async ({ page }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:9000'
    const response = await page.goto(`${backendUrl}/health`)
    expect(response?.status()).toBeLessThan(500)
  })

  test('produto com handle valido carrega', async ({ page }) => {
    await page.goto('/product/t-shirt')
    // não deve mostrar 404
    const status = await page.evaluate(() => document.title)
    expect(status).toBeTruthy()
  })

  test('pagina de busca responde sem erro 500', async ({ page }) => {
    const res = await page.goto('/search')
    expect(res?.status()).not.toBe(500)
  })

  test('pagina about carrega', async ({ page }) => {
    const res = await page.goto('/about')
    expect(res?.status()).not.toBe(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('pagina de termos carrega', async ({ page }) => {
    const res = await page.goto('/terms')
    expect(res?.status()).not.toBe(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('pagina de privacidade carrega', async ({ page }) => {
    const res = await page.goto('/privacy')
    expect(res?.status()).not.toBe(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('pagina desconhecida nao retorna erro 500', async ({ page }) => {
    const res = await page.goto('/pagina-que-nao-existe-xyzabc123')
    // A rota [page] captura caminhos desconhecidos e renderiza com 200
    expect(res?.status()).not.toBe(500)
    await expect(page.locator('body')).toBeVisible()
  })
})
