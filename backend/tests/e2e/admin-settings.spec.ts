import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'gabrielw.dev@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0102G@briel'

let adminToken: string

test.beforeAll(async ({ request }) => {
  const loginResponse = await request.post('/auth/admin/emailpass', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })
  const body = await loginResponse.json()
  adminToken = body.token
  expect(adminToken).toBeTruthy()
})

test.describe('Admin Settings & Config', () => {
  test('should get store details', async ({ request }) => {
    const response = await request.get('/admin/stores', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('stores')
  })

  test('should list regions', async ({ request }) => {
    const response = await request.get('/admin/regions', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('regions')
  })

  test('should list currencies', async ({ request }) => {
    const response = await request.get('/admin/currencies', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('currencies')
  })

  test('should list payment providers', async ({ request }) => {
    const response = await request.get('/admin/payments/payment-providers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
  })

  test('should list product types', async ({ request }) => {
    const response = await request.get('/admin/product-types', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('product_types')
  })

  test('should list price lists', async ({ request }) => {
    const response = await request.get('/admin/price-lists', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('price_lists')
  })
})
