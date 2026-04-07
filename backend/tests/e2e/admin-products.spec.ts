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
})

test.describe('Admin Products', () => {
  test('should list products', async ({ request }) => {
    const response = await request.get('/admin/products', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('products')
    expect(Array.isArray(body.products)).toBe(true)
  })

  test('should list products with filters', async ({ request }) => {
    const response = await request.get('/admin/products?q=test&limit=10', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('products')
  })

  test('should get product by ID', async ({ request }) => {
    // First get a product ID from the list
    const listResponse = await request.get('/admin/products?limit=1', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const listBody = await listResponse.json()

    if (listBody.products.length > 0) {
      const productId = listBody.products[0].id
      const response = await request.get(`/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBe(true)
      const body = await response.json()
      expect(body).toHaveProperty('product')
    }
  })

  test('should access product collections', async ({ request }) => {
    const response = await request.get('/admin/collections', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('collections')
  })

  test('should access product categories', async ({ request }) => {
    const response = await request.get('/admin/product-categories', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('product_categories')
  })
})
