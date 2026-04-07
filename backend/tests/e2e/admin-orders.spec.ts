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

test.describe('Admin Orders', () => {
  test('should list orders', async ({ request }) => {
    const response = await request.get('/admin/orders', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('orders')
    expect(Array.isArray(body.orders)).toBe(true)
  })

  test('should access order details', async ({ request }) => {
    // First get an order ID from the list
    const listResponse = await request.get('/admin/orders?limit=1', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const listBody = await listResponse.json()

    if (listBody.orders.length > 0) {
      const orderId = listBody.orders[0].id
      const response = await request.get(`/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      expect(response.ok()).toBe(true)
      const body = await response.json()
      expect(body).toHaveProperty('order')
    }
  })
})
