import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'tests/e2e-results' }], ['list']],
  use: {
    baseURL: 'https://shop-back.dozecrew.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  timeout: 30000,
  projects: [
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
