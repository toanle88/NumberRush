import { mkdir, writeFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'

const reportDirectory = 'performance-results'
const reportPath = `${reportDirectory}/browser-performance.json`

type BrowserPerformance = {
  lcp: number
  cls: number
  inp: number
  fcp: number
  lcpSource?: string
}

type ManifestIcon = {
  src?: string
  sizes?: string
}

type AccessibilityAudit = {
  name: string
  passed: boolean
  detail: string
}

test('measures PWA readiness, offline behavior, web vitals, and accessibility', async ({ page, context, browser }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.route('https://fonts.gstatic.com/**', route => route.abort())

  await page.addInitScript(() => {
    const metrics = { lcp: 0, cls: 0, inp: 0, fcp: 0 }
    Object.assign(window, { __numberRushPerformance: metrics })

    try {
      new PerformanceObserver((list) => {
        const lastEntry = list.getEntries().at(-1)
        if (lastEntry) metrics.lcp = lastEntry.startTime
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {
      // Older browsers can omit a metric; the supported Chromium CI target reports it.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
            metrics.cls += (entry as PerformanceEntry & { value?: number }).value ?? 0
          }
        }
      }).observe({ type: 'layout-shift', buffered: true })
    } catch {
      // See the LCP note above.
    }

    try {
      new PerformanceObserver((list) => {
        const firstContentfulPaint = list.getEntries().find(entry => entry.name === 'first-contentful-paint')
        if (firstContentfulPaint) metrics.fcp = firstContentfulPaint.startTime
      }).observe({ type: 'paint', buffered: true })
    } catch {
      // See the LCP note above.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) metrics.inp = Math.max(metrics.inp, entry.duration)
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 })
    } catch {
      // See the LCP note above.
    }
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'NumberRush' })).toBeVisible()
  await page.waitForTimeout(250)
  const initialLcp = await page.evaluate(() => {
    const metrics = (window as Window & { __numberRushPerformance?: BrowserPerformance }).__numberRushPerformance
    const lcpEntry = performance.getEntriesByType('largest-contentful-paint').at(-1)
    const fcpEntry = performance.getEntriesByName('first-contentful-paint').at(-1)
    const lcp = metrics?.lcp || lcpEntry?.startTime
    return {
      value: lcp || metrics?.fcp || fcpEntry?.startTime || performance.now(),
      source: lcp
        ? 'largest-contentful-paint'
        : metrics?.fcp || fcpEntry?.startTime
          ? 'first-contentful-paint fallback'
          : 'heading-visible fallback',
    }
  })

  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest')
    return response.json() as Promise<{
      name?: string
      short_name?: string
      start_url?: string
      scope?: string
      display?: string
      icons?: ManifestIcon[]
    }>
  })
  const manifestIconChecks = await page.evaluate(async (icons) => {
    const requiredSizes = ['192x192', '512x512']
    return Promise.all(requiredSizes.map(async (size) => {
      const icon = icons?.find(candidate => candidate.sizes?.split(/\s+/).includes(size))
      if (!icon?.src) return false
      const response = await fetch(new URL(icon.src, window.location.origin))
      return response.ok
    }))
  }, manifest.icons)
  const manifestChecks = [
    Boolean(manifest.name),
    Boolean(manifest.short_name),
    manifest.start_url === '/',
    manifest.scope === '/',
    manifest.display === 'standalone',
    manifestIconChecks.every(Boolean),
  ]

  await page.evaluate(async () => {
    await navigator.serviceWorker?.ready
  })
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller))

  const cacheNamesBeforeOffline = await page.evaluate(() => caches.keys())
  const serviceWorkerControlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller))
  const cachedPwaResources = await page.evaluate(async () => ({
    appShell: Boolean(
      await caches.match(new URL('/', window.location.origin).href, { ignoreSearch: true })
      || await caches.match(new URL('/index.html', window.location.origin).href, { ignoreSearch: true }),
    ),
    manifest: Boolean(
      await caches.match(new URL('/manifest.webmanifest', window.location.origin).href, { ignoreSearch: true }),
    ),
  }))
  await context.setOffline(true)
  await page.reload()
  const offlineAppWorks = await page.getByRole('heading', { name: 'NumberRush' }).isVisible()
  await context.setOffline(false)
  await page.waitForTimeout(250)

  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByRole('button', { name: 'Close settings' }).click()
  await page.waitForTimeout(100)

  const browserMetrics = await page.evaluate((fallbackLcp) => {
    const metrics = (window as Window & { __numberRushPerformance?: BrowserPerformance }).__numberRushPerformance
    const lcpEntry = performance.getEntriesByType('largest-contentful-paint').at(-1)
    const lcp = metrics?.lcp || lcpEntry?.startTime
    return {
      lcp: lcp || fallbackLcp.value,
      lcpSource: lcp ? 'largest-contentful-paint' : fallbackLcp.source,
      cls: metrics?.cls ?? 0,
      inp: metrics?.inp ?? 0,
    }
  }, initialLcp)

  const accessibilityAudit = await page.evaluate((): AccessibilityAudit[] => {
    const accessibleName = (element: Element) => Boolean(
      element.getAttribute('aria-label')?.trim()
      || element.getAttribute('aria-labelledby')?.trim()
      || element.textContent?.trim()
      || element.getAttribute('title')?.trim(),
    )
    const formControlHasLabel = (element: Element) => Boolean(
      element.getAttribute('aria-label')?.trim()
      || element.getAttribute('aria-labelledby')?.trim()
      || element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`),
    )
    const imagesMissingAlt = [...document.images].filter(image => !image.hasAttribute('alt'))
    const unnamedControls = [...document.querySelectorAll('button, [role="button"], input, select, textarea')]
      .filter(element => !accessibleName(element) && !formControlHasLabel(element))

    return [
      { name: 'document language', passed: Boolean(document.documentElement.lang), detail: document.documentElement.lang || 'missing lang' },
      { name: 'page title', passed: Boolean(document.title.trim()), detail: document.title || 'missing title' },
      { name: 'image alternative text', passed: imagesMissingAlt.length === 0, detail: `${imagesMissingAlt.length} images missing alt text` },
      { name: 'named interactive controls', passed: unnamedControls.length === 0, detail: `${unnamedControls.length} unnamed controls` },
    ]
  })
  const accessibilityScore = Math.round(
    accessibilityAudit.filter(check => check.passed).length / accessibilityAudit.length * 100,
  )
  const pwaScore = Math.round(
    [...manifestChecks, serviceWorkerControlled, ...Object.values(cachedPwaResources), offlineAppWorks]
      .filter(Boolean).length / (manifestChecks.length + 4) * 100,
  )
  const performanceScore = Math.round([
    browserMetrics.lcp > 0 && browserMetrics.lcp <= 1200,
    browserMetrics.cls <= 0.1,
    browserMetrics.inp === 0 || browserMetrics.inp <= 200,
  ].filter(Boolean).length / 3 * 100)

  const report = {
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? 'local',
    node: process.version,
    browser: `Chromium ${browser.version()} via Playwright`,
    pwa: {
      manifestChecks,
      manifestIconChecks,
      serviceWorkerControlled,
      cacheNames: cacheNamesBeforeOffline,
      cachedPwaResources,
      offlineAppWorks,
      score: pwaScore,
    },
    coreWebVitals: {
      measured: browserMetrics,
      thresholds: { lcpMs: 1200, cls: 0.1, inpMs: 200 },
      score: performanceScore,
    },
    accessibility: { checks: accessibilityAudit, score: accessibilityScore },
  }
  await mkdir(reportDirectory, { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)

  expect(pwaScore).toBe(100)
  expect(cachedPwaResources.appShell).toBe(true)
  expect(cachedPwaResources.manifest).toBe(true)
  expect(browserMetrics.lcp).toBeGreaterThan(0)
  expect(browserMetrics.lcp).toBeLessThanOrEqual(1200)
  expect(browserMetrics.cls).toBeLessThanOrEqual(0.1)
  expect(browserMetrics.inp === 0 || browserMetrics.inp <= 200).toBe(true)
  expect(accessibilityScore).toBe(100)
})
