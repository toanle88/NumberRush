# Quality score

This file defines the quality model. It does not turn unverified targets into
measured facts.

## Required checks

The repository's Pull Request Checks workflow currently provides these
repeatable checks:

- locked dependency installation and high/critical dependency audit;
- ESLint and the repository formatting check;
- one-shot Vitest tests;
- TypeScript check plus Vite production build;
- Playwright desktop and mobile E2E tests;
- Terraform formatting and validation;
- CodeQL analysis;
- scheduled production performance/PWA/accessibility gates.

## Targets

These are goals, not current verified values unless a linked report says so:

- maintain zero lint, formatting, type-check, build, and test failures;
- keep bundle and browser measurements within [PERFORMANCE.md](PERFORMANCE.md);
- avoid high or critical dependency advisories in CI;
- add regression coverage for user-visible and persistence behavior;
- keep changes accessible by default and document intentional exceptions.

The repository does not currently publish a coverage threshold or a durable
weighted numeric quality score. Coverage and a letter grade must not be
reported as facts without a retained report and methodology.

## Review expectations

Every pull request should explain the behavior changed, include focused tests
where practical, document manual verification for UI/PWA changes, and call out
any new browser, storage, deployment, or security assumptions. A green CI run
is evidence for that commit only; it is not evidence that a production URL is
available or that all real-world devices meet the performance targets.
