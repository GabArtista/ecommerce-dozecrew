import { test, expect } from "@playwright/test";

const BACKEND = "http://localhost:9000";

test.describe("Backend (Medusa) Health", () => {
  test("store products endpoint responds", async ({ request }) => {
    const res = await request.get(`${BACKEND}/store/products`, {
      headers: { "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_KEY || "" },
    });
    // 200 or 401 (key not configured yet) — both mean the server is up
    expect([200, 401, 400]).toContain(res.status());
  });

  test("health endpoint responds", async ({ request }) => {
    const res = await request.get(`${BACKEND}/health`);
    expect(res.ok()).toBeTruthy();
  });
});
