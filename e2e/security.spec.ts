import { test, expect } from '@playwright/test'

test('serves the configured browser security headers', async ({ request }) => {
  const response = await request.get('/')
  expect(response.ok()).toBe(true)

  const headers = response.headers()
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['permissions-policy']).toBe('camera=(), geolocation=(), microphone=()')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['cross-origin-opener-policy']).toBe('same-origin-allow-popups')
  expect(headers['cross-origin-resource-policy']).toBe('cross-origin')
})
