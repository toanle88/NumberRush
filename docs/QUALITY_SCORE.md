# Quality score

This file defines the quality model. It does not turn unverified targets into
measured facts.

## Required checks

The repository's Pull Request Checks workflow currently provides these
repeatable checks:

- locked dependency installation and high/critical dependency audit;
- ESLint linting plus the explicitly named `lint:fix` repair command;
- one-shot Vitest tests;
- V8 coverage for utility and game-state/persistence modules with ratcheted
  minimum thresholds;
- TypeScript check plus Vite production build;
- Playwright desktop Chromium, mobile Chromium, and desktop Firefox E2E tests;
- axe-based accessibility checks alongside the custom accessibility audit;
- Terraform formatting and validation;
- CodeQL analysis;
- scheduled production performance/PWA/accessibility gates.

## Targets

These are goals, not current verified values unless a linked report says so:

- maintain zero lint, type-check, build, test, and coverage-threshold failures;
- keep bundle and browser measurements within [PERFORMANCE.md](PERFORMANCE.md);
- avoid high or critical dependency advisories in CI;
- add regression coverage for user-visible and persistence behavior;
- keep changes accessible by default and document intentional exceptions.

The coverage gate currently includes `src/utils/**/*.ts` and
`src/hooks/useGame.ts` with minimum lines, functions, and statements of 70%
and branches of 60%. These are deliberately modest starting thresholds that
can be raised as coverage improves. The repository does not publish a durable
weighted numeric quality score or a coverage percentage for a specific commit
without a retained report.

## Review expectations

Every pull request should explain the behavior changed, include focused tests
where practical, document manual verification for UI/PWA changes, and call out
any new browser, storage, deployment, or security assumptions. A green CI run
is evidence for that commit only; it is not evidence that a production URL is
available or that all real-world devices meet the performance targets.
