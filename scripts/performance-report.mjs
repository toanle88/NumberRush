import { readFile, writeFile } from 'node:fs/promises'

const reportDirectory = process.env.PERFORMANCE_RESULTS_DIR ?? 'performance-results'
const bundlePath = `${reportDirectory}/bundle-report.json`
const browserPath = `${reportDirectory}/browser-performance.json`
const outputPath = process.env.PERFORMANCE_MARKDOWN_PATH ?? `${reportDirectory}/PERFORMANCE.md`

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const formatKiB = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`
const formatMetric = (value, unit) => `${value}${unit}`

const bundle = await readJson(bundlePath)
const browser = await readJson(browserPath)
const generatedAt = browser.generatedAt ?? bundle.generatedAt

const markdown = `# Performance benchmark

Generated: ${generatedAt}

- Commit: ${browser.commit ?? bundle.commit}
- Node: ${browser.node ?? bundle.node}
- Browser: ${browser.browser ?? 'Not measured'}

## Bundle sizes

| Measure | Actual | Threshold |
| --- | ---: | ---: |
| Total generated assets (gzip) | ${formatKiB(bundle.measured.totalGzippedBytes)} | ${formatKiB(bundle.thresholds.totalGzippedBytes)} |
| JavaScript assets (gzip) | ${formatKiB(bundle.measured.firstLoadJsBytes)} | ${formatKiB(bundle.thresholds.firstLoadJsBytes)} |
| CSS assets (gzip) | ${formatKiB(bundle.measured.cssBytes)} | ${formatKiB(bundle.thresholds.cssBytes)} |

## Browser checks

- LCP measurement source: ${browser.coreWebVitals.measured.lcpSource ?? 'largest-contentful-paint'}

| Measure | Actual | Threshold |
| --- | ---: | ---: |
| LCP | ${formatMetric(browser.coreWebVitals.measured.lcp, ' ms')} | ${formatMetric(browser.coreWebVitals.thresholds.lcpMs, ' ms')} |
| CLS | ${browser.coreWebVitals.measured.cls} | ${browser.coreWebVitals.thresholds.cls} |
| INP | ${formatMetric(browser.coreWebVitals.measured.inp, ' ms')} | ${formatMetric(browser.coreWebVitals.thresholds.inpMs, ' ms')} |
| Core Web Vitals score | ${browser.coreWebVitals.score}/100 | 100/100 |
| PWA score | ${browser.pwa.score}/100 | 100/100 |
| Accessibility score | ${browser.accessibility.score}/100 | 100/100 |

This file is generated from the retained JSON reports and is the measured result for this run.
`

await writeFile(outputPath, markdown)
console.log(`Performance summary: ${outputPath}`)
