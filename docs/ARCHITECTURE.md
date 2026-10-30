# Architecture

This document describes the implementation currently in the repository. It is
an implementation guide, not a promise about future features.

## System shape

NumberRush is a client-only React 19 + TypeScript single-page application. Vite
8 builds the app, and `vite-plugin-pwa` generates the manifest and service
worker. There is no application server or remote database: gameplay state is
managed in React and persisted to the browser's localStorage when available.

The UI is written with React components and custom CSS in `src/App.css` and
`src/index.css`. Tailwind/PostCSS is present in the build pipeline through
`src/index.css`, but the application layout is not based on a separate Tailwind
component library.

## Runtime flow

1. `src/main.tsx` mounts `App` inside `ErrorBoundary`.
2. `src/App.tsx` selects the home, game, results, progress, and settings views;
   translates keypad/keyboard input into actions; and renders feedback.
   `usePlayerSettings` owns settings state, while `useProgressTransfer` owns
   export/import browser-file behavior.
3. `src/hooks/useGame.ts` owns the round state machine, timer, adaptive
   difficulty, progression, badges, recurring challenges, and persistence
   retries. Pure score transitions live in `src/utils/gameScoring.ts`.
4. Focused hooks in `src/hooks/` isolate browser lifecycle concerns: media
   queries, document preferences, focus management, keyboard input, timers,
   intervals, and streak/audio effects.
5. `src/utils/mathLogic.ts` generates valid questions for the selected
   operations and difficulty. Other utility modules calculate progression,
   accessibility preferences, sound/haptic feedback, and progress metrics.
6. `src/utils/storage.ts` reads/writes the versioned localStorage envelope and
   handles migrations, unavailable storage, and progress backups.

## Key boundaries

- `src/components/`: presentational UI and interaction surfaces.
- `src/hooks/`: stateful application behavior reusable by the UI.
- `src/utils/`: deterministic or isolated domain helpers.
- `public/`: static host configuration and public assets.
- `e2e/`: Playwright tests for user-visible behavior, PWA behavior, and the
  production preview.
- `infra/`: Terraform configuration for Azure resources and remote state.
- `.github/workflows/`: validation, security analysis, performance, preview,
  and production deployment automation.

## Persistence model

JSON records are stored as `{ version: 2, data: ... }`. Version 0 unwrapped
records and the version-1 marker format are migrated defensively. Unsupported
future versions are not overwritten. Progress export/import only handles the
allowlisted gameplay keys and validates imported data before writing it.

## Delivery and security boundaries

The production artifact is the `dist/` directory. Azure Static Web Apps uses
`public/staticwebapp.config.json` for SPA fallback and response headers. The
production workflow deploys only the artifact produced by a successful Pull Request Checks run;
it does not rebuild unreviewed source during deployment. Terraform manages
infrastructure and uses an Azure remote backend configured outside version
control.

## Design references

- [README.md](../README.md) — setup, supported behavior, and operational guide.
- [PERFORMANCE.md](PERFORMANCE.md) — budgets, measurement method, and evidence.
- [QUALITY_SCORE.md](QUALITY_SCORE.md) — quality targets versus verified checks.
- [ROADMAP.md](ROADMAP.md) — completed, active, and planned work.
- [SECURITY.md](../SECURITY.md) — reporting process and repository controls.
- [SECURITY_MODEL.md](SECURITY_MODEL.md) — storage threat and data-flow model.
