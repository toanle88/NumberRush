# Security and data-flow model

NumberRush is client-only. The browser is both the runtime and the storage
boundary; there is no account service, application API, or remote progress
database.

## Data flow

1. React state is initialized from versioned `localStorage` records on the
   current origin.
2. Gameplay counters, badges, daily challenges, accessibility preferences,
   and bounded session history are written back to `localStorage` when a round
   changes them. Storage failures leave the in-memory game state usable and are
   retried where possible.
3. Settings can export an allowlisted snapshot of progress records. The JSON
   export is user-controlled and may contain scores, streaks, badges, challenge
   history, session answers, and timestamps; it must be treated as sensitive
   personal data even though it contains no account credentials.
4. Import validates the file size, application marker, schema version, allowed
   keys, record shapes, and field bounds before writing. Import replaces the
   allowlisted progress keys and attempts to restore the prior values if a
   storage failure interrupts the write sequence.

## Retention and deletion

Data remains in browser storage until the user resets progress, clears site
data, changes origin, uses a private browsing profile, or the browser removes
storage. Export files are outside the app's control and should be deleted by
the user when no longer needed. Reset progress removes the app's persisted
gameplay records but does not delete files exported elsewhere.

## Threat boundaries

- Treat `localStorage`, imported JSON, files, keyboard input, and browser APIs
  as untrusted or unavailable.
- React renders the player name as text; imported values are never evaluated as
  code.
- The host sends CSP, permissions, referrer, frame, transport, and cross-origin
  response policies. `COOP: same-origin-allow-popups` preserves compatibility
  with browser/PWA flows, while `CORP: cross-origin` keeps the configured web
  fonts usable. HSTS is appropriate for the HTTPS Azure host.
- The e2e security-header test validates the Vite dev/preview equivalent. The
  Azure Static Web Apps configuration remains the deployment source of truth.

## Browser support

CI runs unit tests plus Playwright desktop Chromium, mobile Chromium, and
desktop Firefox projects. The browser suite includes an axe scan of the home
view, custom accessibility assertions, PWA/offline checks, and performance
checks on production preview. Browser-specific behavior remains subject to the
support matrix documented in [README.md](../README.md).
