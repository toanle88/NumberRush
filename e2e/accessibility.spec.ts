import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const expectAccessible = async (page: Page, view: string) => {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations, `${view} view has accessibility violations`).toEqual([])
}

test('has no axe accessibility violations across the major views', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'NumberRush' })).toBeVisible()
  await expectAccessible(page, 'home')

  const settingsButton = page.getByRole('button', { name: 'Open settings' })
  await settingsButton.focus()
  await settingsButton.click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeFocused()
  await expectAccessible(page, 'settings')
  await page.getByRole('button', { name: 'Back to game' }).click()
  await expect(settingsButton).toBeFocused()

  await page.getByRole('button', { name: /Practice Mode/ }).click()
  await expect(page.getByRole('region', { name: 'Math game' })).toBeVisible()
  await expectAccessible(page, 'active gameplay')

  await page.getByRole('button', { name: 'Finish Practice Round' }).click()
  await expect(page.getByRole('heading', { name: 'Round Complete!' })).toBeFocused()
  await expectAccessible(page, 'results')

  await page.getByRole('button', { name: 'Change Planet' }).click()
  await page.getByRole('button', { name: /View your progress/ }).click()
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible()
  await expectAccessible(page, 'progress')
})
