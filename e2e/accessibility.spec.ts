import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('has no axe accessibility violations on the home view', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()

  expect(results.violations).toEqual([])
})
