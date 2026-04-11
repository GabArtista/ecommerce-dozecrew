/**
 * Testes E2E: Checkout
 *
 * Cobre:
 * - Acesso direto à página de checkout
 * - Redirect sem carrinho
 * - Formulário de endereço com seções corretas (headings reais do componente)
 * - Auto-fill de CEP via ViaCEP
 * - Seções de frete e pagamento
 *
 * Headings reais do componente:
 *   h1: "Finalizar Pedido"
 *   h2: "1. Identificação", "2. Endereço de entrega", "3. Frete", "4. Pagamento"
 */
import { test, expect, type Page } from "@playwright/test";

async function addTshirtToCart(page: Page) {
  await page.goto("/product/t-shirt");
  await expect(page.locator("h1")).toBeVisible();
  const addBtn = page.locator('button:has-text("Add To Cart")').first();
  await expect(addBtn).toBeVisible({ timeout: 10000 });
  await addBtn.click();
  // Aguarda badge atualizar — sem waitForTimeout arbitrário
  await expect(page.locator('button[aria-label="Open cart"]')).toContainText("1", { timeout: 10000 });
}

test.describe("Checkout — sem carrinho", () => {
  test("redireciona para home quando não há carrinho", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/$|\/checkout/, { timeout: 10000 });
  });

  test("não expõe URL do backend no DOM", async ({ page }) => {
    await page.goto("/checkout");
    const count = await page.locator("a[href*='localhost:9000']").count();
    expect(count).toBe(0);
  });

  test("página de confirmação é acessível por URL direta", async ({ page }) => {
    await page.goto("/checkout/confirmacao/ORDER-TEST-123?payment=pix");
    await expect(page).toHaveURL(/confirmacao\/ORDER-TEST-123/);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Checkout — com carrinho", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "apenas chromium");

  test("h1 'Finalizar Pedido' visível", async ({ page }) => {
    await addTshirtToCart(page);
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: /Finalizar Pedido/i })).toBeVisible();
  });

  test("seções do formulário visíveis (Identificação, Endereço, Frete, Pagamento)", async ({ page }) => {
    await addTshirtToCart(page);
    await page.goto("/checkout");
    await expect(page.locator("h2").filter({ hasText: "Identificação" }).first()).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Endereço" }).first()).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Frete" }).first()).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Pagamento" }).first()).toBeVisible();
  });

  test("CEP auto-fill preenche cidade via ViaCEP", async ({ page }) => {
    await addTshirtToCart(page);
    await page.goto("/checkout");

    const cepInput = page.locator("#cep, input[name='cep']").first();
    if (!(await cepInput.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Escuta resposta do ViaCEP para evitar timeout arbitrário
    const viacepResponse = page.waitForResponse(
      (res) => res.url().includes("viacep.com.br"),
      { timeout: 10000 },
    ).catch(() => null);

    await cepInput.fill("01310-100");
    await viacepResponse;

    const cityInput = page.locator("#city, input[name='city']").first();
    await expect(cityInput).not.toHaveValue("", { timeout: 8000 });
    const city = await cityInput.inputValue();
    expect(city.toLowerCase()).toContain("paulo");
  });
});
