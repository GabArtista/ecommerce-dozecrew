# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-login.spec.ts >> Admin Login >> should login with mixed case email
- Location: tests/e2e/admin-login.spec.ts:31:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | const ADMIN_EMAIL = 'gabrielw.dev@gmail.com'
  4  | const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0102G@briel'
  5  | 
  6  | test.describe('Admin Login', () => {
  7  |   test('should login with correct credentials', async ({ request }) => {
  8  |     const response = await request.post('/auth/admin/emailpass', {
  9  |       data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  10 |     })
  11 | 
  12 |     expect(response.ok()).toBe(true)
  13 | 
  14 |     const body = await response.json()
  15 |     expect(body).toHaveProperty('token')
  16 |     expect(typeof body.token).toBe('string')
  17 |     expect(body.token.length).toBeGreaterThan(20)
  18 |   })
  19 | 
  20 |   test('should login with uppercase email (case insensitive)', async ({ request }) => {
  21 |     const response = await request.post('/auth/admin/emailpass', {
  22 |       data: { email: 'GABRIELW.dev@gmail.com', password: ADMIN_PASSWORD },
  23 |     })
  24 | 
  25 |     expect(response.ok()).toBe(true)
  26 | 
  27 |     const body = await response.json()
  28 |     expect(body).toHaveProperty('token')
  29 |   })
  30 | 
  31 |   test('should login with mixed case email', async ({ request }) => {
  32 |     const response = await request.post('/auth/admin/emailpass', {
  33 |       data: { email: 'GabrielW.Dev@Gmail.Com', password: ADMIN_PASSWORD },
  34 |     })
  35 | 
> 36 |     expect(response.ok()).toBe(true)
     |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  37 |   })
  38 | 
  39 |   test('should reject login with wrong password', async ({ request }) => {
  40 |     const response = await request.post('/auth/admin/emailpass', {
  41 |       data: { email: ADMIN_EMAIL, password: 'wrongpassword' },
  42 |     })
  43 | 
  44 |     expect(response.status()).toBe(401)
  45 |     const body = await response.json()
  46 |     expect(body.message).toContain('Invalid email or password')
  47 |   })
  48 | 
  49 |   test('should reject login with non-existent email', async ({ request }) => {
  50 |     const response = await request.post('/auth/admin/emailpass', {
  51 |       data: { email: 'nonexistent@example.com', password: 'somepassword' },
  52 |     })
  53 | 
  54 |     expect(response.status()).toBe(401)
  55 |     const body = await response.json()
  56 |     expect(body.message).toContain('Invalid email or password')
  57 |   })
  58 | 
  59 |   test('should reject login with missing email', async ({ request }) => {
  60 |     const response = await request.post('/auth/admin/emailpass', {
  61 |       data: { password: ADMIN_PASSWORD },
  62 |     })
  63 | 
  64 |     expect(response.status()).toBe(400)
  65 |   })
  66 | 
  67 |   test('should reject login with missing password', async ({ request }) => {
  68 |     const response = await request.post('/auth/admin/emailpass', {
  69 |       data: { email: ADMIN_EMAIL },
  70 |     })
  71 | 
  72 |     expect(response.status()).toBe(400)
  73 |   })
  74 | })
  75 | 
```