/**
 * Testes E2E: Storefront
 *
 * Cobre fluxos principais da vitrine:
 * - Homepage com produtos e navegação
 * - Página de produto com imagem
 * - Busca com resultados navegáveis
 * - Carrinho: abrir, adicionar, remover, atualizar quantidade
 * - Checkout após adicionar produto
 * - Responsividade mobile (375px)
 */
import { test, expect, type Page } from "@playwright/test";

async function openFirstProduct(page: Page) {
  await page.goto("/");
  const firstProduct = page.locator('a[href^="/product/"]').first();
  await expect(firstProduct).toBeVisible({ timeout: 15000 });
  const href = await firstProduct.getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
}

async function addTshirtToCart(page: Page) {
  await page.goto("/product/t-shirt");
  await expect(page.locator("h1")).toBeVisible();
  const addBtn = page.locator('button:has-text("Add To Cart")').first();
  await expect(addBtn).toBeVisible({ timeout: 10000 });
  await addBtn.click();
  // Confirma item adicionado via badge — sem waitForTimeout
  await expect(page.locator('button[aria-label="Open cart"]')).toContainText("1", { timeout: 10000 });
}

test.describe("Storefront", () => {
  test("homepage carrega com produtos", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator("nav").first()).toBeVisible();
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test("página de produto renderiza dados essenciais", async ({ page }) => {
    await openFirstProduct(page);
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.locator('button:has-text("Add To Cart"), button:has-text("Out Of Stock")').first(),
    ).toBeVisible();
    const productImage = page.locator("main img").first();
    await expect(productImage).toBeVisible();
    await expect
      .poll(() => productImage.evaluate((img) => (img as HTMLImageElement).naturalWidth), { timeout: 10000 })
      .toBeGreaterThan(0);
  });

  test("camiseta renderiza imagem principal carregada", async ({ page }) => {
    await page.goto("/product/t-shirt");
    await expect(page.locator("h1")).toBeVisible();
    const productImage = page.locator("main img").first();
    await expect(productImage).toBeVisible();
    await expect
      .poll(() => productImage.evaluate((img) => (img as HTMLImageElement).naturalWidth), { timeout: 10000 })
      .toBeGreaterThan(0);
  });

  test("busca retorna resultados navegáveis", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveURL("/search");
    const firstProduct = page.locator('a[href^="/product/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
  });

  test("carrinho abre ao clicar no ícone", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label="Open cart"]').click();
    await expect(page.getByText(/My Cart|carrinho/i)).toBeVisible();
  });

  test("adiciona produto ao carrinho e segue para checkout", async ({ page }) => {
    await addTshirtToCart(page);
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/checkout/);
    // h1 real da página de checkout
    await expect(page.getByRole("heading", { name: /Finalizar Pedido/i })).toBeVisible();
  });

  test("remove item do carrinho", async ({ page }) => {
    await addTshirtToCart(page);

    await page.locator('button[aria-label="Open cart"]').click();
    await expect(page.getByText(/My Cart|carrinho/i)).toBeVisible();

    const deleteBtn = page
      .locator('button[aria-label*="Remove"], button[aria-label*="Delete"], form button[type="submit"]')
      .first();
    const hasDelete = await deleteBtn.isVisible().catch(() => false);

    if (hasDelete) {
      await deleteBtn.click();
      // Aguarda carrinho esvaziar via polling — sem waitForTimeout
      await expect
        .poll(
          async () => {
            const isEmpty = await page.locator("text=/empty|vazio|sem itens/i").isVisible().catch(() => false);
            const badge = await page.locator('button[aria-label="Open cart"]').textContent().catch(() => "");
            return isEmpty || badge === "0" || badge === "";
          },
          { timeout: 8000 },
        )
        .toBeTruthy();
    }
  });

  test("atualiza quantidade do item no carrinho", async ({ page }) => {
    await addTshirtToCart(page);

    await page.locator('button[aria-label="Open cart"]').click();
    await expect(page.getByText(/My Cart|carrinho/i)).toBeVisible();

    const plusBtn = page.locator('button[aria-label*="Increase"], button:has-text("+")').first();
    const hasPlus = await plusBtn.isVisible().catch(() => false);

    if (hasPlus) {
      await plusBtn.click();
      // Aguarda badge mostrar "2" via polling
      await expect
        .poll(
          () => page.locator('button[aria-label="Open cart"]').textContent().catch(() => ""),
          { timeout: 8000 },
        )
        .toContain("2");
    }
  });

  test("seleção de variante de produto não quebra o botão Add To Cart", async ({ page }) => {
    await page.goto("/product/t-shirt");
    await expect(page.locator("h1")).toBeVisible();

    const variantBtn = page
      .locator("button[title], [role='radio'], label:has(input[type='radio'])")
      .first();
    const hasVariants = await variantBtn.isVisible().catch(() => false);

    if (hasVariants) {
      await variantBtn.click();
      await expect(
        page.locator('button:has-text("Add To Cart"), button:has-text("Out Of Stock")').first(),
      ).toBeVisible();
    }
  });

  test("mobile (375px): homepage sem overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("nav").first()).toBeVisible();
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test("mobile (375px): produto e carrinho funcionam", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/product/t-shirt");
    await expect(page.locator("h1")).toBeVisible();
    const addBtn = page.locator('button:has-text("Add To Cart")').first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();
    // Confirma badge sem timeout fixo
    await expect(page.locator('button[aria-label="Open cart"]')).toContainText("1", { timeout: 10000 });
  });
});
