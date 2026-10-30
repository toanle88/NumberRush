import { test, expect, type Page } from '@playwright/test'

type InputMethod = 'keyboard' | 'keypad'

const questionGroup = (page: Page) => page.getByRole('group', { name: /Your current answer is not entered/i })

const readAnswer = async (page: Page): Promise<number> => {
  const label = await questionGroup(page).getAttribute('aria-label')
  const match = label?.match(/(-?\d+) (plus|minus) (-?\d+) equals/)
  if (!match) throw new Error(`Could not read question from ${label ?? 'missing aria-label'}`)

  const left = Number(match[1])
  const right = Number(match[3])
  return match[2] === 'plus' ? left + right : left - right
}

const enterAnswer = async (page: Page, answer: number, method: InputMethod) => {
  const digits = String(answer)
  if (method === 'keyboard') {
    await page.keyboard.type(digits)
    await page.keyboard.press('Enter')
    return
  }

  for (const digit of digits) {
    await page.getByRole('button', { name: `Enter ${digit}` }).click()
  }
  await page.getByRole('button', { name: 'Submit answer' }).click()
}

const setTimer = async (page: Page, seconds: number) => {
  await page.getByRole('button', { name: 'Open settings' }).click()
  const settings = page.getByRole('region', { name: 'Settings' })
  await settings.getByRole('button', { name: new RegExp(`^${seconds}s`) }).click()
  await settings.getByRole('button', { name: 'Back to game' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.route('https://fonts.gstatic.com/**', route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'NumberRush' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('starts Blitz and submits correct and incorrect answers with keyboard and keypad input', async ({ page }) => {
  await page.getByRole('button', { name: /Start Blitz Rush/ }).click()
  await expect(page.getByRole('region', { name: 'Math game' })).toBeVisible()

  const correctAnswer = await readAnswer(page)
  await enterAnswer(page, correctAnswer, 'keyboard')
  await expect(page.locator('.feedback-inline')).toContainText('Correct')

  const nextAnswer = await readAnswer(page)
  const incorrectAnswer = nextAnswer === 0 ? 1 : 0
  await enterAnswer(page, incorrectAnswer, 'keypad')
  await expect(page.locator('.feedback-inline')).toContainText(`Correct answer: ${nextAnswer}`)
  await expect(questionGroup(page)).toBeVisible()
})

test('keeps the game stats inside the mobile game card', async ({ page }) => {
  await page.getByRole('button', { name: /Start Blitz Rush/ }).click()
  await enterAnswer(page, await readAnswer(page), 'keyboard')

  await expect(page.locator('.stats-header')).toBeVisible()
  expect(await page.locator('.stats-header').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  expect(await page.locator('body').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
})

test('starts Practice mode and completes a round', async ({ page }) => {
  await page.getByRole('button', { name: /Practice Mode/ }).click()
  await expect(page.getByRole('region', { name: 'Math game' })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'Time remaining' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Finish Practice Round' }).click()
  await expect(page.getByRole('heading', { name: 'Round Complete!' })).toBeVisible()
})

test('waits for Blitz timer expiration and shows the completed round', async ({ page }) => {
  await setTimer(page, 5)
  await page.getByRole('button', { name: /Start Blitz Rush/ }).click()

  const timer = page.getByRole('progressbar', { name: 'Time remaining' })
  await expect(timer).toHaveAttribute('aria-valuemax', '5')
  await expect(page.getByRole('heading', { name: "Time's Up!" })).toBeVisible({ timeout: 7_000 })
})

test('persists settings across a clean page reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Open settings' }).click()
  const settings = page.getByRole('region', { name: 'Settings' })
  await settings.getByLabel('Your name').fill('Browser Kid')
  await settings.getByLabel('Theme').selectOption('light')
  await settings.getByLabel('High contrast').check()
  await settings.getByRole('button', { name: /^5s/ }).click()
  await settings.getByRole('button', { name: 'Back to game' }).click()

  await page.reload()
  await expect(page.getByText('Hey Browser Kid!')).toBeVisible()
  await page.getByRole('button', { name: 'Open settings' }).click()
  const reloadedSettings = page.getByRole('region', { name: 'Settings' })
  await expect(reloadedSettings.getByLabel('Your name')).toHaveValue('Browser Kid')
  await expect(reloadedSettings.getByLabel('Theme')).toHaveValue('light')
  await expect(reloadedSettings.getByLabel('High contrast')).toBeChecked()
  await expect(reloadedSettings.getByRole('button', { name: /^5s/ })).toHaveAttribute('aria-pressed', 'true')
})

test('selects Vietnamese and restores the locale after reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Open settings' }).click()
  const settings = page.getByRole('region', { name: 'Settings' })
  await settings.getByLabel('Language').selectOption('vi')
  await expect(page.getByRole('region', { name: 'Cài đặt' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
  await expect(page.getByRole('button', { name: 'Bắt đầu Blitz Rush! ⚡' })).toHaveCount(0)

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
  await expect(page.getByRole('button', { name: 'Mở cài đặt' })).toBeVisible()
  await page.getByRole('button', { name: 'Mở cài đặt' }).click()
  await expect(page.getByRole('region', { name: 'Cài đặt' }).getByLabel('Ngôn ngữ')).toHaveValue('vi')
})

test('records progress history after completing a round', async ({ page }) => {
  await page.getByRole('button', { name: /Practice Mode/ }).click()
  const answer = await readAnswer(page)
  await enterAnswer(page, answer, 'keypad')
  await page.getByRole('button', { name: 'Finish Practice Round' }).click()
  await expect(page.getByRole('heading', { name: 'Round Complete!' })).toBeVisible()

  await page.getByRole('button', { name: 'Change Planet' }).click()
  await page.getByRole('button', { name: /View your progress/ }).click()
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible()
  await expect(page.getByText('Built from 1 completed round on this device.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent sessions' })).toBeVisible()
  await expect(page.getByText(/Practice · 1 attempted/)).toBeVisible()
})

test('practices a missed question from the completed round', async ({ page }) => {
  await setTimer(page, 5)
  await page.getByRole('button', { name: /Start Blitz Rush/ }).click()
  const answer = await readAnswer(page)
  await enterAnswer(page, answer === 0 ? 1 : 0, 'keypad')

  await expect(page.getByRole('heading', { name: "Time's Up!" })).toBeVisible({ timeout: 7_000 })
  await page.getByRole('button', { name: /Practice Missed Questions/ }).click()
  await expect(page.getByRole('region', { name: 'Math game' })).toBeVisible()

  const missedAnswer = await readAnswer(page)
  await enterAnswer(page, missedAnswer, 'keypad')
  await expect(page.getByRole('heading', { name: 'Missed Questions Reviewed!' })).toBeVisible()
})
