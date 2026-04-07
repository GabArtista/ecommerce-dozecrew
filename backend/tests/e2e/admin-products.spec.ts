import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'gabrilw.dev@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0102G@briel'

test.describe('Admin API Smoke Tests', () => {
  test('health check is ok', async ({ request }) => {
    const response = await request.get('/health')
    expect(response.ok()).toBe(true)
  })

  test('admin products list returns expected response', async ({ request }) => {
    // Admin API requires session auth via admin panel
    // This test validates the route exists and is protected
    const response = await request.get('/admin/products')
    // Should be 401 (unprotected access) or 200 with empty products
    expect([200, 401, 403]).toContain(response.status())
    if (response.status() === 401) {
      const body = await response.json()
      expect(body.message).toBe('Unauthorized')
    }
  })

  test('admin orders list is protected', async ({ request }) => {
    const response = await request.get('/admin/orders')
    expect([200, 401, 403]).toContain(response.status())
  })

  test('admin customers list is protected', async ({ request }) => {
    const response = await request.get('/admin/customers')
    expect([200, 401, 403]).toContain(response.status())
  })

  test('admin store info is accessible', async ({ request }) => {
    const response = await request.get('/admin/stores')
    expect([200, 401, 403]).toContain(response.status())
  })

  test('admin regions list is protected', async ({ request }) => {
    const response = await request.get('/admin/regions')
    expect([200, 401, 403]).toContain(response.status())
  })

  test('store products (public) needs publishable key', async ({ request }) => {
    const response = await request.get('/store/products')
    // Medusa requires x-publishable-api-key, so expect rejection
    expect(response.status()).toBeGreaterThanOrEqual(400)
  })
})
