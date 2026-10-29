# Performance

This document separates enforceable budgets from measurements. A target is not
evidence that the target has been met. Generated workflow artifacts are the
authoritative result for a particular commit.

## Enforced budgets and thresholds

`pnpm run performance:budget` measures gzip sizes of the generated `dist/`
files and fails when any limit is exceeded:

- Total generated assets: 150 KiB gzip.
- JavaScript assets under `dist/assets`: 100 KiB gzip.
- CSS assets under `dist/assets`: 25 KiB gzip.

The production Playwright check in `e2e/performance.spec.ts` also requires:

- LCP or its documented fallback: at most 1,200 ms.
- CLS: at most 0.1.
- INP proxy: at most 200 ms.
- PWA manifest, service-worker control, cached app shell/manifest, and offline
  reload checks: 100%.
- The test's four-item accessibility audit: 100%.

These are repository gates, not a guarantee of performance on every device,
browser, network, or assistive technology.

## How to measure

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm run performance:budget
pnpm exec playwright install chromium
PERFORMANCE_E2E=1 \
  pnpm exec playwright test --project=desktop-chromium
```

The scheduled `.github/workflows/performance.yml` runs the same production
checks, generates JSON and Markdown reports, and retains them as the
`performance-reports` artifact for 14 days. Reports are written to the ignored
`performance-results/` directory.

## Baseline evidence

This fresh local run was completed on 2026-10-29 after installing the committed
lockfile from the existing offline pnpm store. The JSON reports were generated
under the ignored `performance-results/` directory and are not committed or
retained as a workflow artifact by this checkout.

| Date | Environment | Measured result | Evidence status |
| --- | --- | --- | --- |
| 2026-10-29 | Node 24.14.0, pnpm 11.24.0, Chromium 156.0.8078.4 | 101.8 KiB total gzip; 87.2 KiB JS; 6.7 KiB CSS; 436 ms heading-visible fallback; CLS 0; INP 80 ms; PWA 100/100; accessibility 100/100 | Fresh local run; JSON generated but not committed |

The heading-visible value is the documented fallback because this headless
Chromium run did not expose an LCP entry. Do not describe this table as a live
service-level guarantee. Future baseline rows should include the workflow
artifact or linked JSON/Markdown reports from a reproducible run.
