# NumberRush 🚀

> Speed math for kids, delivered as an installable web app.

NumberRush is an open-source arithmetic game for short, repeatable practice
sessions. Players can use Blitz or Practice mode, select operations and
difficulty, build streaks, review progress, and continue offline after the app
shell has been cached.

[![Pull Request Checks](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

## Project status

NumberRush is version `1.0.3` (`package.json`). The repository contains the
source, tests, PWA configuration, and Azure deployment workflows. Try the
[deployed demo](https://proud-mud-0ba6f4400.6.azurestaticapps.net), or after
starting the dev server, use the [local demo](http://localhost:5173).

## Features

- Blitz and untimed Practice modes.
- Addition, subtraction, multiplication, and division, including optional
  multi-step “Chaos” questions.
- Easy, Medium, and Hard difficulty with optional automatic or fixed progression.
- Planet progression, streaks, daily challenges, badges, and a progress
  dashboard.
- Keyboard and touch input, sound effects, and haptics where the device
  supports them.
- Installable PWA behavior with a cached app shell for offline play after the
  first successful load.
- Local progress export/import from Settings.

## Quick start

### Prerequisites

- Node.js 24.x. This is the version used by CI; other major versions are not
  part of the supported test matrix.
- pnpm 11.24.0. This exact version is declared in `package.json` and the
  workflows. Enable Corepack if pnpm is not already available:

  ```bash
  corepack enable
  corepack prepare pnpm@11.24.0 --activate
  ```

### Install and run

```bash
git clone https://github.com/toanle88/NumberRush.git
cd NumberRush
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:5173>. The committed `pnpm-lock.yaml` is authoritative;
keep `--frozen-lockfile` for reproducible installs.

## Commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start Vite development mode with HMR. |
| `pnpm test -- --run` | Run the one-shot Vitest unit/component suite. Use `pnpm test` for watch mode. |
| `pnpm exec playwright install chromium firefox` | Install the browsers needed by local E2E tests. On CI, use `--with-deps`. |
| `pnpm test:e2e` | Run the desktop and mobile Playwright suite against the dev server. |
| `pnpm lint` | Run ESLint. |
| `pnpm lint:fix` | Apply ESLint's configured fixes. |
| `pnpm build` | Type-check and create `dist/`. |
| `pnpm test:coverage` | Run tests with the ratcheted V8 coverage thresholds. |
| `pnpm preview` | Serve the built `dist/` directory locally. Run `pnpm build` first. |
| `pnpm run performance:budget` | Check generated JavaScript/CSS gzip budgets; run after `pnpm build`. |
| `pnpm run benchmark` | Build and run the bundle budget check. |

The browser tests use the dev server by default. The performance workflow uses
`PERFORMANCE_E2E=1` and a production preview so that PWA and offline checks run
against the built app.

## Configuration and environment variables

There are no application-specific `VITE_*` variables. The app works without a
`.env` file. The following variables affect tests, reports, or CI metadata:

| Variable | Required? | Secret? | Use |
| --- | --- | --- | --- |
| `CI` | Optional locally; set by CI | No | Makes Playwright fail on `.only`, use one worker, retry once, and use CI reporters. |
| `PERFORMANCE_E2E` | Optional | No | When truthy, selects `e2e/performance.spec.ts` and starts `pnpm preview`. |
| `GITHUB_SHA` | Optional | No | Commit metadata in generated performance reports; GitHub supplies it in Actions. |

Deployment and infrastructure credentials are GitHub secrets, not browser
runtime configuration. The workflows expect `AZURE_STATIC_WEB_APPS_API_TOKEN`
for production, and `AZURE_CLIENT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`, and
`STORAGE_ACCOUNT_NAME` for the Terraform workflow. Never commit these values,
Terraform state, `infra/backend.hcl`, or generated reports containing secrets.

## Architecture

The implementation is a React 19 + TypeScript application built by Vite 8 and
styled through the repository's CSS files and Tailwind/PostCSS entry point.
There is no server-side application or remote progress database.

- `src/main.tsx` mounts the application and error boundary.
- `src/App.tsx` coordinates views, round setup, keyboard handling, settings,
  and import/export actions.
- `src/hooks/useGame.ts` owns round state, scoring, timers, progression,
  badges, and persistence orchestration.
- `src/components/` contains the game board, keypad, settings, progress, and
  feedback UI.
- `src/utils/` contains pure math, progression, accessibility, sound,
  recurring-challenge, and storage modules.
- `vite.config.ts` configures the build and `vite-plugin-pwa` service worker.
- `public/staticwebapp.config.json` provides Azure Static Web Apps SPA routing
  and security headers.
- `infra/` contains Terraform configuration for Azure resources.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
[docs/PERFORMANCE.md](docs/PERFORMANCE.md),
[docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md), and
[docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md),
[docs/TERRAFORM.md](docs/TERRAFORM.md), and
[docs/ROADMAP.md](docs/ROADMAP.md) for the design, measurement, quality, and
planning records.

## PWA, browsers, and offline behavior

The production build generates a manifest and service worker. After one
successful online load and service-worker activation, the app shell and
manifest are cached and the game can reload offline. Updates use the service
worker's auto-update registration.

Known limitations:

- The first visit still needs network access so the app can be downloaded and
  cached.
- Service workers require HTTPS in deployed environments; `localhost` is the
  normal local-development exception.
- Install prompts and standalone behavior vary by browser, operating system,
  and iOS/iPadOS version.
- Browser storage can be disabled, cleared, quota-limited, or partitioned.
  NumberRush keeps the current session in memory when persistence is
  unavailable, but it cannot recover data the browser has removed.
- Sound requires browser permission/user interaction, haptics are optional,
  and background tabs can throttle timer callbacks. Blitz does not pause while
  hidden: its deadline is based on elapsed time and is reconciled when the page
  becomes visible or focused again.
- External Google Fonts are a presentation enhancement; the app remains
  usable when they are blocked or unavailable.

## Accessibility and input support

The app provides a labeled on-screen keypad for touch and pointer input. While
a round is active, desktop keyboards can enter the top-row digits or numpad
digits, submit with Enter, clear with Backspace, and exit with Escape. Controls
inside settings retain their normal browser behavior.

The UI includes semantic labels, live status announcements, a labeled timer
progress bar, visible focus handling, a dedicated settings view with focus
handoff, reduced-motion and high-contrast preferences, and responsive layouts.
Screen readers and browser zoom are supported to the extent provided by the
browser and the current CSS.

## Data storage and privacy

Progress is stored in the browser's `localStorage` on the current origin. It
includes scores, streaks, badges, challenge/session history, completed planet
counters, and related gameplay settings. The optional player name and
accessibility preferences are also local settings. No application backend is
used to sync this data.

Stored JSON records use a versioned envelope. Current records are version 2;
legacy unwrapped records and the version-1 marker format are migrated
defensively. Future or malformed records are rejected. Settings can export an
allowlisted progress backup as JSON and import it with size and schema checks.
Imported data is treated as data, not executable code.

Clearing site data, using private browsing, changing origin, or browser storage
policy can remove or prevent access to progress. Do not put secrets or other
sensitive information into the player-name field or exported backup.

## Deployment

Production deployment is workflow-driven:

1. A push to `main` runs [Pull Request Checks](.github/workflows/ci.yml).
2. After a GitHub Release is published, open the **Deploy production** workflow
   under the GitHub Actions tab, choose **Run workflow**, and enter its release
   tag, such as `v1.0.0`.
3. The workflow downloads and verifies the matching release ZIP and deploys it
   to the protected `production` environment. It does not rebuild source code.

For a local production check:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm preview
```

Infrastructure changes are handled separately by the Azure Infrastructure workflow. See
[docs/TERRAFORM.md](docs/TERRAFORM.md) for the reviewed-plan and rollback process. To work with the
remote backend, copy `infra/backend.hcl.example` to the ignored
`infra/backend.hcl`, fill in approved Azure state-storage coordinates, then use
the Terraform commands in `.github/workflows/infrastructure.yml`. Do not run
`terraform apply` without the required Azure identity, state backend, and
production approval.

## Release management

NumberRush uses Semantic Versioning. Stable release tags are `vMAJOR.MINOR.PATCH`;
prereleases use a SemVer suffix such as `v1.2.0-rc.1`. Build metadata is allowed
by the release checker but is not used for deployment decisions. Application
release versions are independent of browser storage schema versions.

The repository maintainers own releases. The release owner prepares the version
and changelog pull request, a second maintainer reviews it, and the maintainer
with access to the protected `production` environment approves deployment. The
release owner remains responsible for the smoke test and rollback decision.

### Creating a release

1. Add all user-visible changes to `CHANGELOG.md` under `[Unreleased]`.
2. In a pull request, set the root `package.json` `version` to the intended
   SemVer value and move the entries into `## [VERSION] - YYYY-MM-DD`.
3. Run `pnpm release:check -- vVERSION`, `pnpm lint`, `pnpm test -- --run`,
   `pnpm test:coverage`, and `pnpm build`. Merge only after Pull Request Checks is green.
4. From the merged `main` commit, open the **Release** workflow under the
   GitHub Actions tab, choose **Run workflow**, and select `main`. The workflow
   captures that exact commit SHA, requires a successful Pull Request Checks
   run for the same SHA (application validation, browser E2E, Terraform, and
   CodeQL), then reads the version from `package.json`, runs the release checks,
   creates and pushes the annotated `vVERSION` tag, and publishes the GitHub Release. The
   tag-push trigger remains available for maintainers who prefer to create the
   tag locally:

   ```bash
   git tag -a vVERSION -m "NumberRush vVERSION"
   git push origin vVERSION
   ```

   The Release workflow validates the tag against `package.json` and the
   changelog, builds the exact CI-validated source, creates a GitHub Release with changelog
   notes, and attaches `numberrush-vVERSION.zip` plus its
   `numberrush-vVERSION.zip.sha256` checksum.

5. After the Release workflow is green, run **Deploy production** manually with
   the same `vVERSION` tag. Approve the protected production environment, then
   open the environment URL, confirm the displayed version, and run one short
   round. For a PWA update, reload once after the service worker activates and
   repeat the version check in a fresh tab.

6. Confirm the GitHub Release contains the ZIP, checksum, and notes. Verify the
   downloaded archive with `sha256sum -c numberrush-vVERSION.zip.sha256`.
   Record any failed verification in the release discussion before announcing
   the release.

### Rollback

Do not move or overwrite a published tag. If production verification fails,
run **Deploy production** with the tag of a known-good published release and
verify the production environment URL again. Keep the failed release available
for investigation rather than replacing its tag.

Because the app uses a service worker with automatic updates, already-open PWA
clients can retain an older shell briefly. A rollback is complete only after a
fresh tab and a reload have fetched the expected version; do not change storage
schema versions as part of an application release rollback.

## Troubleshooting and FAQ

**`pnpm install --frozen-lockfile` fails.** Confirm Node.js 24.x and pnpm
11.24.0, then make sure the lockfile was not edited independently of
`package.json`. Do not switch to npm or yarn for the repository workflow.

**The browser tests cannot launch.** Run `pnpm exec playwright install chromium`.
On Ubuntu CI or a fresh Linux machine, use
`pnpm exec playwright install --with-deps chromium`.

**Offline mode does not work on the first load.** Load the production build once
while online, wait for the service worker to become active, then reload before
disconnecting. Development mode is not the offline acceptance environment.

**My progress disappeared.** Check that you are using the same browser origin
and have not cleared site data or switched to private browsing. Use Settings →
Progress data to restore a valid NumberRush export.

**Why is there no `pnpm deploy` command?** Deployment is intentionally handled
by the protected GitHub/Azure workflows. Local commands build and preview the
artifact; they do not bypass deployment approvals.

## Contributing and support

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Pull requests
should include focused tests or a written reason tests are not applicable and
must pass the same checks described above. Use the
[bug report](.github/ISSUE_TEMPLATE/bug_report.md) or
[feature request](.github/ISSUE_TEMPLATE/feature_request.md) template for
public issues. For general questions or support, open a public
[support issue](../../issues/new/choose) with reproducible details.

Please also follow the [Code of Conduct](CODE_OF_CONDUCT.md) when participating
in the project.

Please do not disclose security vulnerabilities in public issues. Follow
[SECURITY.md](SECURITY.md) and use the private GitHub Security Advisory form.

## Quality and automation expectations

Pull Request Checks is the single application gate. It runs locked installation,
formatting, dependency audit, lint, unit tests, the production build, browser
end-to-end tests, Terraform syntax validation, CodeQL, and pull-request,
scheduled, and manual performance checks. Production deployment consumes the validated build artifact;
Azure Infrastructure manages Terraform resources separately. A green local run
does not by itself prove a hosted deployment is live.

See [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md) for the distinction between
targets and verified metrics, and [docs/PERFORMANCE.md](docs/PERFORMANCE.md)
for measurement provenance.

## License and security

NumberRush is available under the [MIT License](LICENSE). Security reports
should be submitted privately through
[GitHub Security Advisories](../../security/advisories/new), as described in
[SECURITY.md](SECURITY.md).
