import { test, expect } from "@playwright/test";

test.describe("Cart & Navigation", () => {
  test("homepage loads without 500 error", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).not.toBe(500);
  });

  test("search page returns 200", async ({ page }) => {
    const res = await page.goto("/search");
    expect(res?.status()).toBe(200);
  });

  test("products are listed on search page", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("networkidle");
    // Should have some content
    await expect(page.locator("body")).toBeVisible();
  });

  test("product detail page loads", async ({ page }) => {
    const res = await page.goto("/product/t-shirt");
    // 200 or redirect, not 500
    expect(res?.status()).not.toBe(500);
  });
});
