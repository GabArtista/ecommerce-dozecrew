import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads successfully with 200 status", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("has a title set", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("navbar header is visible", async ({ page }) => {
    await page.goto("/");
    const headerNav = page.locator("header nav, nav").first();
    await expect(headerNav).toBeVisible();
  });

  test("shows storefront products on home", async ({ page }) => {
    await page.goto("/");
    const productLinks = page.locator('a[href^="/product/"]');
    await expect(productLinks.first()).toBeVisible();
    expect(await productLinks.count()).toBeGreaterThan(0);
  });

  test("search page shows product results", async ({ page }) => {
    await page.goto("/search");
    const productLinks = page.locator('a[href^="/product/"]');
    await expect(productLinks.first()).toBeVisible();
  });
});
