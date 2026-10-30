# NumberRush Agent Guide

This file is the repository-level guide for coding agents and contributors.
Keep it aligned with the files that actually exist in the repository; do not
reintroduce references to removed orchestration, notification, or development
environment files.

## Project at a glance

NumberRush is a client-only arithmetic game for children. It is an installable
React single-page application with offline support. There is no application
server, account system, or remote progress database.

- Runtime: React 19 and TypeScript.
- Build tool: Vite 8 with `vite-plugin-pwa`.
- Styling: repository CSS plus the Tailwind/PostCSS pipeline.
- Package manager: pnpm 11.24.0.
- Supported development runtime: Node.js 24.x.
- Persistence: versioned browser `localStorage` records.
- Hosting: Azure Static Web Apps, deployed by protected GitHub workflows.
- Infrastructure: Terraform files under `infra/`.

## Repository map

- `src/App.tsx` — view coordination, round setup, input handling, settings,
  and import/export actions.
- `src/hooks/useGame.ts` — game state, scoring, timers, progression, badges,
  recurring challenges, and persistence orchestration.
- `src/components/` — game board, keypad, settings, progress, and feedback UI.
- `src/utils/` — math, progression, accessibility, sound, challenge, and
  storage helpers. Prefer pure functions here when practical.
- `src/**/*.test.*` — unit and component tests run by Vitest.
- `e2e/` — Playwright browser, mobile, PWA, offline, and performance tests.
- `public/` — static assets and Azure Static Web Apps configuration.
- `scripts/` — performance budget and report tooling.
- `infra/` — Terraform configuration. Never commit filled backend settings or
  state files.
- `.github/workflows/` — CI, quality, security, performance, preview,
  deployment, and infrastructure automation.

Read the relevant design and policy document before making a cross-cutting
change:

- `README.md` — setup, commands, supported behavior, and operations.
- `docs/ARCHITECTURE.md` — runtime flow, boundaries, persistence, and delivery.
- `CONTRIBUTING.md` — contribution and pull-request expectations.
- `docs/PERFORMANCE.md` — enforced bundle and browser budgets.
- `docs/QUALITY_SCORE.md` — repeatable quality checks and review expectations.
- `SECURITY.md` — vulnerability reporting and security requirements.
- `docs/ROADMAP.md` — planned and completed product work.

## Development workflow

Run commands from the repository root. Use the committed lockfile:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Before handing off a code change, run the checks relevant to its scope. The
normal full validation sequence is:

```bash
pnpm format:check
pnpm lint
pnpm test -- --run
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

For bundle, PWA, accessibility, or performance changes, also run:

```bash
pnpm run performance:budget
PERFORMANCE_E2E=1 PERFORMANCE_RESULTS_DIR=performance-results \
  pnpm exec playwright test --project=desktop-chromium
```

Run `pnpm build` before `pnpm run performance:budget`; the budget script reads
the generated `dist/` assets. Keep `dist/`, Playwright output, and performance
reports out of commits.

## Change guidelines

- Make focused changes and preserve existing user-visible behavior unless the
  request explicitly changes it.
- Add or update unit/component tests for logic and UI behavior.
- Add or update Playwright coverage for important browser, offline, input, or
  installation flows.
- Preserve keyboard and touch input, screen-reader labels and announcements,
  focus management, reduced-motion behavior, high-contrast behavior, and
  responsive layouts.
- Treat keyboard input, localStorage, imported JSON, and browser APIs as
  untrusted or unavailable. Validate data at trust boundaries and preserve
  safe fallbacks.
- Keep gameplay/domain logic out of presentational components when it belongs
  in `src/hooks/` or `src/utils/`.
- Do not add an application backend or remote progress synchronization without
  updating the architecture, privacy, security, and deployment documentation.
- Update documentation when commands, browser support, storage formats,
  deployment behavior, security controls, or performance budgets change.

## Security and data handling

Never commit credentials, tokens, private exports, real personal data,
Terraform state, a populated `infra/backend.hcl`, generated reports containing
secrets, or build artifacts. Deployment secrets belong in protected GitHub or
Azure configuration.

Progress backups are user-controlled JSON. Maintain the existing allowlist,
size limits, version checks, migration behavior, and rejection of malformed or
future records when changing storage code. Do not treat imported data as code.

For suspected vulnerabilities, follow `SECURITY.md` and use the private GitHub
Security Advisory process instead of opening a public issue.

## Deployment boundaries

The production artifact is `dist/`. CI validates the source and produces the
artifact; the production deployment workflow deploys the validated artifact
through the protected environment. Do not bypass this process with ad-hoc
production changes or commit deployment credentials.

Infrastructure changes require Terraform formatting and validation. Do not run
`terraform apply` without the required Azure identity, remote state backend,
and production approval.

## Agent handoff expectations

At the end of a task, report:

1. What changed and why.
2. Which files were changed.
3. Which validation commands passed, failed, or were not run.
4. Any known limitations, follow-up work, or user-visible caveats.

Do not claim that a check, deployment, performance target, or hosted demo was
verified unless it was actually run and the result is available. Preserve
unrelated working-tree changes and avoid destructive Git commands.

