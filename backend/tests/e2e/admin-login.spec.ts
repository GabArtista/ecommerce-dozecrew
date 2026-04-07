import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'gabrielw.dev@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0102G@briel'

test.describe('Admin Login', () => {
  test('should login with correct credentials', async ({ request }) => {
    const response = await request.post('/auth/admin/emailpass', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })

    expect(response.ok()).toBe(true)

    const body = await response.json()
    expect(body).toHaveProperty('token')
    expect(typeof body.token).toBe('string')
    expect(body.token.length).toBeGreaterThan(20)
  })

  test('should login with uppercase email (case insensitive)', async ({ request }) => {
    const response = await request.post('/auth/admin/emailpass', {
      data: { email: 'GABRIELW.dev@gmail.com', password: ADMIN_PASSWORD },
    })

    expect(response.ok()).toBe(true)

    const body = await response.json()
    expect(body).toHaveProperty('token')
  })

  test('should login with mixed case email', async ({ request }) => {
    const response = await request.post('/auth/admin/emailpass', {
      data: { email: 'GabrielW.Dev@Gmail.Com', password: ADMIN_PASSWORD },
    })

    expect(response.ok()).toBe(true)
  })

  test('should reject login with wrong password', async ({ request }) => {
    const response = await request.post('/auth/admin/emailpass', {
      data: { email: ADMIN_EMAIL, password: 'wrongpassword' },
    })

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.message).toContain('Invalid email or password')
  })

  test('should reject login with non-existent email', async ({ request }) => {
    const response = await request.post('/auth/admin/emailpass', {
      data: { email: 'nonexistent@example.com', password: 'somepassword' },
    })

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.message).toContain('Invalid email or password')
  })

  test('should reject login with missing email', async ({ request }) => {
    const response = await request.post('/auth/admin/emailpass', {
      data: { password: ADMIN_PASSWORD },
    })

    // emailpass returns 401 for missing email (not 400)
    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.message).toContain('Invalid email or password')
  })

  test('should reject login with missing password', async ({ request }) => {
    const response = await request.post('/auth/admin/emailpass', {
      data: { email: ADMIN_EMAIL },
    })

    // emailpass returns 401 for missing password (not 400)
    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.message).toContain('Invalid email or password')
  })
})
