# PERFORMANCE.md: Performance Budget & Targets

## Purpose
Defines the performance standards and monitoring criteria for the NumberRush PWA.

## Core Web Vitals (Targets)

The production Chromium check measures the lab equivalents available to a browser
test. LCP and CLS are collected with `PerformanceObserver`; INP is collected from
interaction event entries after opening and closing Settings. When headless
Chromium exposes no LCP or FCP entry, the report labels the measured time at which
the primary heading became visible as `heading-visible fallback`. FID is a
field-only metric and is represented by the INP check for this repeatable lab gate.

- **Largest Contentful Paint (LCP)**: <= 1.2s
- **Cumulative Layout Shift (CLS)**: <= 0.1
- **Interaction to Next Paint (INP)**: <= 200ms

## Asset Budgets

The budget script gzips every generated `dist` file and reports the JavaScript
and CSS under `dist/assets` separately. A check fails when any limit is exceeded:

- **Total generated assets (gzipped)**: <= 150 KiB
- **First-load JavaScript assets (gzipped)**: <= 100 KiB
- **CSS assets (gzipped)**: <= 25 KiB
- **PWA installability**: The manifest must be standalone, scoped to `/`, expose
  192x192 and 512x512 icons, and serve both icon resources successfully.
- **Image/asset cache**: The generated service worker must control the page and
  cache the app shell (`/` or `/index.html`) and `/manifest.webmanifest` before
  the offline reload check.

## Checks and reports

`pnpm run performance:budget` performs the deterministic bundle check. The
production browser check is in `e2e/performance.spec.ts`; it validates manifest
installability fields, service-worker control, cached assets, offline reload,
Core Web Vitals, and a 100-point accessibility audit covering document language,
title, image alternatives, and names for interactive controls.

`.github/workflows/performance.yml` runs on every pull request, weekly, and by
manual dispatch. It builds the production preview, runs the budget and browser
checks, and retains `bundle-report.json` and `browser-performance.json` for 14
days. It also generates `performance-results/PERFORMANCE.md`, a Markdown summary
containing the actual measured values, test date, commit, Node version, and
browser for that run.

The browser gate blocks remote web-font requests so repeated LCP measurements
exercise the application bundle under the same local-only conditions.

## Baseline measurements

The first local benchmark completed on 2026-10-29 after restoring the locked
dependencies from the existing offline pnpm content store. The browser run used
the stable fallback above because this headless Chromium did not expose an LCP
entry; it still records a real navigation-relative render time rather than an
invented LCP value.

| Date | Environment | Bundle gzip | LCP / CLS / INP | PWA | Accessibility | Report |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-10-29 | Local checkout; Node 24.14.0 / pnpm 11.24.0; Chromium 156.0.8078.4 | 101.9 KiB total; 87.2 KiB JS; 6.8 KiB CSS | 529.7 ms (heading-visible fallback) / 0 / 120 ms | 100/100 | 100/100 | Generated JSON and Markdown are retained as the `performance-reports` artifact |

The generated Markdown and JSON files are retained as the authoritative measured
result for each workflow run. Thresholds remain explicit guardrails and are
compared with the measured baseline above; future runs should be added here when
the baseline materially changes.
