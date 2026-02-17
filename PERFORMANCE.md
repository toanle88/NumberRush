# PERFORMANCE.md: Performance Budget & Targets

## Purpose
Defines the performance standards and monitoring criteria for the NumberRush PWA.

## Core Web Vitals (Targets)
- **Largest Contentful Paint (LCP)**: < 1.2s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Interaction to Next Paint (INP)**: < 200ms

## Asset Budgets
- **Total Bundle Size (Gzipped)**: < 150KB
- **First Load JS**: < 100KB
- **Image/Asset Cache**: Managed via Service Worker for offline instant-loading.

## Optimization Strategy
- **Vite 7**: Optimized build pipeline using Rollup.
- **Tailwind 4**: CSS-in-JS minimal overhead.
- **PWA**: Assets cached for sub-100ms repeat loads.

## Current Performance Status
- **Lighthouse Score**: [Insert Score]
- **Last Benchmarking**: 2026-02-17
