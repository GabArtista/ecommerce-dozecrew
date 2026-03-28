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
    // Use the first nav (header) specifically
    const headerNav = page.locator("header nav, nav").first();
    await expect(headerNav).toBeVisible();
  });

  test("search page loads", async ({ page }) => {
    await page.goto("/search");
    expect((await page.goto("/search"))?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
});
