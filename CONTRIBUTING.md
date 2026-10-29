# Contributing to NumberRush

Thanks for helping improve NumberRush. The project is a client-side React app,
so small, focused changes with clear browser behavior are especially valuable.

## Before you start

1. Read [README.md](README.md) and [SECURITY.md](SECURITY.md).
2. Open an issue for a substantial feature, behavior change, or architectural
   decision so the scope can be discussed before implementation.
3. For a vulnerability, use the private process in `SECURITY.md`; do not open a
   public issue.

## Development setup

Use Node.js 24.x and pnpm 11.24.0:

```bash
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Run the main checks before opening a pull request:

```bash
pnpm format:check
pnpm lint
pnpm test -- --run
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

For PWA/performance changes, also run the production performance commands in
[PERFORMANCE.md](PERFORMANCE.md). Keep generated `dist/`, Playwright reports,
and performance output out of commits.

## Making changes

- Keep the change focused and explain the user-visible behavior.
- Add or update unit/component tests for logic and UI behavior.
- Add or update Playwright coverage for critical browser, offline, or input
  flows.
- Preserve keyboard, touch, screen-reader, reduced-motion, and high-contrast
  behavior when changing UI.
- Treat localStorage and imported files as untrusted input.
- Update relevant documentation when commands, storage, deployment, security,
  or browser support changes.
- Do not commit secrets, real user data, Terraform state, or generated build
  artifacts.

## Pull requests

Use the pull-request template. A reviewable PR has a clear title, a concise
description, tests that actually ran, screenshots or recordings for meaningful
visual changes, and explicit notes for known limitations. CI must pass before
merge; maintainers may require additional evidence for security, performance,
or deployment changes.

## Issues and support

Use the supplied bug and feature templates. Include the browser/device,
reproduction steps, expected and actual behavior, and relevant logs without
secrets. General questions belong in a support issue or discussion rather than
an unstructured feature request.

## License

By contributing, you agree that your contribution is provided under the
repository's [MIT License](LICENSE).
