import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const assertAccessibility = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  const blockingViolations = results.violations.filter(violation => violation.impact !== 'minor')
  expect(blockingViolations.map(violation => `${violation.impact}: ${violation.id}: ${violation.help} (${violation.nodes.map(node => node.target.join(' ')).join(', ')})`)).toEqual([])
}

const assertInteractiveNames = async (page: Page) => {
  const unnamedControls = await page.locator('button, input:not([type="hidden"]), select, textarea, a[href], summary, [role="button"], [role="link"], [role="checkbox"], [role="combobox"], [role="switch"], [role="tab"], [role="menuitem"], [role="option"], [role="radio"], [role="slider"], [role="spinbutton"]').evaluateAll(elements => elements
    .filter(element => {
      const ariaLabel = element.getAttribute('aria-label')
      const labelledBy = element.getAttribute('aria-labelledby')
        ?.split(/\s+/)
        .filter(Boolean)
        .map(id => document.getElementById(id)?.textContent || '')
        .join(' ')
      const labelledByLabel = 'labels' in element
        ? Array.from((element as HTMLInputElement).labels || []).map(label => label.textContent || '').join(' ')
        : ''
      const contentName = element.matches('button, a[href], summary, [role="button"], [role="link"], [role="checkbox"], [role="combobox"], [role="switch"], [role="tab"], [role="menuitem"], [role="option"], [role="radio"]') ? element.textContent || '' : ''
      const inputName = element instanceof HTMLInputElement && ['button', 'image', 'reset', 'submit'].includes(element.type)
        ? element.alt || element.value
        : ''
      const name = ariaLabel !== null
        ? ariaLabel
        : labelledBy !== undefined
          ? labelledBy
          : labelledByLabel || contentName || inputName
      return !name.trim()
    })
    .map(element => element.outerHTML))
  expect(unnamedControls).toEqual([])
}

const readAnimationDurationMs = async (page: Page): Promise<number> => page.locator('main').evaluate(element => {
  const duration = getComputedStyle(element).animationDuration
  const value = Number.parseFloat(duration)
  return duration.endsWith('ms') ? value : value * 1000
})

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.route('https://fonts.gstatic.com/**', route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'NumberRush' })).toBeVisible()
})

test('checks the home, settings, and empty progress views', async ({ page }) => {
  await assertAccessibility(page)
  await assertInteractiveNames(page)

  await page.getByRole('button', { name: /View your progress/ }).click()
  await expect(page.getByRole('heading', { name: 'Progress', exact: true })).toBeVisible()
  await assertAccessibility(page)
  await assertInteractiveNames(page)

  await page.getByRole('button', { name: /Back to home/ }).click()
  const settingsTrigger = page.getByRole('button', { name: 'Open settings' })
  await settingsTrigger.click()
  const dialog = page.getByRole('dialog', { name: 'Settings' })
  await expect(dialog.getByLabel('Your name')).toBeFocused()
  await assertAccessibility(page)
  await assertInteractiveNames(page)

  for (const label of [
    'Your name',
    'Theme',
    'High contrast',
    'Reduce motion and animation',
    'Sound effects',
    'Haptic feedback when supported',
  ]) {
    await expect(dialog.getByLabel(label)).toBeVisible()
  }

  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Close settings' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByLabel('Your name')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(settingsTrigger).toBeFocused()
})

test('checks active gameplay controls, live announcements, and results focus', async ({ page }) => {
  await page.getByRole('button', { name: /Start Blitz Rush/ }).click()
  const gameRegion = page.getByRole('region', { name: 'Math game' })
  const keypad = page.getByRole('group', { name: 'Answer keypad' })
  await expect(gameRegion).toBeVisible()
  await expect(gameRegion).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Exit game' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(keypad.getByRole('button', { name: 'Enter 1', exact: true })).toBeFocused()
  await gameRegion.focus()
  await assertAccessibility(page)
  await assertInteractiveNames(page)
  const timer = page.getByRole('progressbar', { name: 'Time remaining' })
  await expect(timer).toBeVisible()
  await expect(timer).toHaveAttribute('aria-valuetext', /seconds remaining/)
  const liveRegions = page.locator('[role="status"][aria-live]')
  await expect(liveRegions).toHaveCount(2)
  await expect(liveRegions.nth(0)).toHaveAttribute('aria-live', 'polite')
  await expect(liveRegions.nth(1)).toHaveAttribute('aria-live', 'polite')
  await expect(liveRegions.nth(1)).toHaveAttribute('aria-atomic', 'true')
  await expect(liveRegions.nth(0)).toContainText('Your current answer is not entered.')

  await expect(keypad.getByRole('button')).toHaveCount(12)
  for (const name of ['Clear answer', 'Submit answer', 'Enter 0', 'Enter 1', 'Enter 9']) {
    await expect(keypad.getByRole('button', { name, exact: true })).toBeVisible()
  }

  await gameRegion.focus()
  await page.keyboard.press('1')
  await expect(liveRegions.nth(0)).toContainText('Your current answer is 1.')
  for (let index = 0; index < 4; index += 1) await page.keyboard.press('9')
  await keypad.getByRole('button', { name: 'Submit answer', exact: true }).click()
  await expect(liveRegions.nth(1)).toContainText('Correct answer:')

  await gameRegion.focus()
  await page.keyboard.press('Escape')
  const blitzStart = page.getByRole('button', { name: /Start Blitz Rush/ })
  await expect(blitzStart).toBeFocused()

  await page.getByRole('button', { name: /Practice Mode/ }).click()
  await expect(page.getByRole('region', { name: 'Math game' })).toBeVisible()
  await assertAccessibility(page)
  await page.getByRole('button', { name: 'Finish Practice Round' }).click()
  const resultsHeading = page.getByRole('heading', { name: 'Round Complete!' })
  await expect(resultsHeading).toBeFocused()
  await assertAccessibility(page)
  await assertInteractiveNames(page)
})

test('checks populated progress and preference-driven accessibility modes', async ({ page }) => {
  await page.getByRole('button', { name: /Practice Mode/ }).click()
  await page.getByRole('button', { name: 'Finish Practice Round' }).click()
  await expect(page.getByRole('heading', { name: 'Round Complete!' })).toBeFocused()
  await assertAccessibility(page)

  await page.getByRole('button', { name: 'Change Planet' }).click()
  await page.getByRole('button', { name: /View your progress/ }).click()
  await expect(page.getByText(/Built from 1 completed round/)).toBeVisible()
  await assertAccessibility(page)
  await assertInteractiveNames(page)

  await page.getByRole('button', { name: /Back to home/ }).click()
  await page.getByRole('button', { name: 'Open settings' }).click()
  const dialog = page.getByRole('dialog', { name: 'Settings' })
  await dialog.getByLabel('Theme').selectOption('light')
  await dialog.getByLabel('High contrast').check()
  await dialog.getByLabel('Reduce motion and animation').check()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('html')).toHaveAttribute('data-high-contrast', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true')
  await expect(page.getByRole('button', { name: /Start Blitz Rush/ })).toHaveCSS('border-width', '2px')
  expect(await readAnimationDurationMs(page)).toBeLessThanOrEqual(0.01)
  await assertAccessibility(page)

  await dialog.getByLabel('Reduce motion and animation').uncheck()
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'false')
  await dialog.getByRole('button', { name: 'Close settings' }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'false')
  expect(await readAnimationDurationMs(page)).toBeLessThanOrEqual(0.01)
  await assertAccessibility(page)

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.reload()
  expect(await readAnimationDurationMs(page)).toBeGreaterThan(0.01)
})
