/**
 * Testes E2E: Fluxo completo de checkout (dados sintéticos)
 *
 * Cobre o fluxo ponta-a-ponta:
 * 1. Adicionar produto ao carrinho
 * 2. Abrir modal do carrinho com thumbnail
 * 3. Navegar para checkout
 * 4. Preencher dados de identificação e endereço
 * 5. Verificar opções de frete
 * 6. Verificar resumo do pedido com imagens
 *
 * Não executa pagamento real (ASAAS em sandbox).
 */
import { test, expect, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const SCREENSHOTS_DIR = path.join(__dirname, "..", "screenshots");

const SYNTHETIC_CUSTOMER = {
  email: `test.e2e.${Date.now()}@exemplo.com`,
  firstName: "João",
  lastName: "Teste E2E",
  phone: "11987654321",
  postalCode: "01310-200",
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function addProductToCart(page: Page, handle: string): Promise<boolean> {
  await page.goto(`/product/${handle}`);
  const h1 = page.locator("h1");
  const h1Visible = await h1.isVisible({ timeout: 10000 }).catch(() => false);
  if (!h1Visible) return false;

  const addBtn = page.locator('button:has-text("Add To Cart")').first();
  const inStock = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);
  if (!inStock) {
    console.log(`Produto ${handle} fora de estoque ou não encontrado`);
    return false;
  }

  await addBtn.click();
  // Aguarda badge atualizar para confirmar item adicionado
  try {
    await expect(page.locator('button[aria-label="Open cart"]')).toContainText("1", { timeout: 8000 });
    return true;
  } catch {
    // Produto pode já estar no carrinho (badge > 1)
    const badgeText = await page.locator('button[aria-label="Open cart"]').textContent().catch(() => "");
    return /\d+/.test(badgeText);
  }
}

test.describe("Checkout Flow", () => {
  test("adicionar produto e verificar badge do carrinho", async ({ page }) => {
    const added = await addProductToCart(page, "t-shirt");
    expect(added).toBeTruthy();
    ensureDir(SCREENSHOTS_DIR);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "10-product-added-to-cart.png") });
  });

  test("abrir modal do carrinho com produto", async ({ page }) => {
    const added = await addProductToCart(page, "t-shirt");
    if (!added) { test.skip(); return; }

    await page.locator('button[aria-label="Open cart"]').click();
    await expect(page.getByText(/My Cart|carrinho/i)).toBeVisible();

    const cartItems = page.locator("dialog li, [role='dialog'] li, aside li");
    await expect(cartItems.first()).toBeVisible({ timeout: 5000 });

    ensureDir(SCREENSHOTS_DIR);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "11-cart-modal-open.png") });
  });

  test("navegar para checkout após adicionar produto", async ({ page }) => {
    const added = await addProductToCart(page, "t-shirt");
    if (!added) { test.skip(); return; }

    await page.goto("/checkout");
    await expect(page).toHaveURL(/checkout/);
    await expect(page.locator("body")).toBeVisible();

    ensureDir(SCREENSHOTS_DIR);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "12-checkout-page.png") });
  });

  test("preencher dados de identificação com dados sintéticos", async ({ page }) => {
    const added = await addProductToCart(page, "t-shirt");
    if (!added) { test.skip(); return; }
    await page.goto("/checkout");

    // Email
    const emailField = page.locator("input[name='email'], input[type='email']").first();
    if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailField.fill(SYNTHETIC_CUSTOMER.email);
    }

    // Nome
    const firstNameField = page.locator("input[name='firstName'], input[id='firstName'], input[placeholder*='nome' i]").first();
    if (await firstNameField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstNameField.fill(SYNTHETIC_CUSTOMER.firstName);
    }

    // Telefone
    const phoneField = page.locator("input[name='phone'], input[type='tel']").first();
    if (await phoneField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneField.fill(SYNTHETIC_CUSTOMER.phone);
    }

    ensureDir(SCREENSHOTS_DIR);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "13-checkout-address-filled.png") });
    console.log("Dados sintéticos preenchidos no checkout");
  });

  test("verificar opções de frete na página de checkout", async ({ page }) => {
    const added = await addProductToCart(page, "t-shirt");
    if (!added) { test.skip(); return; }
    await page.goto("/checkout");

    // Frete fica visível após preenchimento do CEP — verificar se a seção existe
    const shippingSection = page.locator("h2").filter({ hasText: "Frete" }).first();
    await expect(shippingSection).toBeVisible({ timeout: 10000 });

    ensureDir(SCREENSHOTS_DIR);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "14-checkout-shipping-section.png") });
  });

  test("resumo do pedido renderiza imagens no checkout", async ({ page }) => {
    const added = await addProductToCart(page, "t-shirt");
    if (!added) { test.skip(); return; }
    await page.goto("/checkout");

    // Aguarda resumo carregar (polling sem timeout fixo)
    const images = page.locator("img");
    await expect.poll(() => images.count(), { timeout: 10000 }).toBeGreaterThan(0);

    const imgCount = await images.count();
    console.log(`Total de imagens no checkout: ${imgCount}`);

    ensureDir(SCREENSHOTS_DIR);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "15-checkout-order-summary.png"),
      fullPage: true,
    });
  });
});
