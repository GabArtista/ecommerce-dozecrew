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

test.describe('Admin Customers', () => {
  test('should list customers', async ({ request }) => {
    const response = await request.get('/admin/customers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('customers')
    expect(Array.isArray(body.customers)).toBe(true)
  })

  test('should create a new customer', async ({ request }) => {
    const timestamp = Date.now()
    const response = await request.post('/admin/customers', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        first_name: 'Test',
        last_name: 'Customer',
        email: `test.customer.${timestamp}@example.com`,
      },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('customer')
    expect(body.customer.email).toBe(`test.customer.${timestamp}@example.com`)
    expect(body.customer.first_name).toBe('Test')

    // Cleanup - delete the created customer
    const deleteResponse = await request.delete(`/admin/customers/${body.customer.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    expect(deleteResponse.ok()).toBe(true)
  })

  test('should update an existing customer', async ({ request }) => {
    // First list customers
    const listResponse = await request.get('/admin/customers?limit=1', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const listBody = await listResponse.json()

    if (listBody.customers.length > 0) {
      const customerId = listBody.customers[0].id
      const response = await request.post(`/admin/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          first_name: 'Updated Name',
        },
      })

      expect(response.ok()).toBe(true)
      const body = await response.json()
      expect(body.customer.first_name).toBe('Updated Name')

      // Revert the change
      await request.post(`/admin/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          first_name: listBody.customers[0].first_name,
        },
      })
    }
  })

  test('should get customer groups', async ({ request }) => {
    const response = await request.get('/admin/customer-groups', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(response.ok()).toBe(true)
    const body = await response.json()
    expect(body).toHaveProperty('customer_groups')
  })
})
