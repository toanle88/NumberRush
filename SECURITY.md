# SECURITY.md: Security Policies & Audit Notes

## Purpose
Defines security practices, compliance requirements, and audit findings.

## Policies
- **Input Validation**: Strict sanitization of numpad inputs and game configuration parameters to prevent unexpected state mutations.
- **Data Protection**: Secure handling of user progress and high scores in `LocalStorage`.
- **PWA Security**: Service Workers require HTTPS; caching strategies are scoped to project assets only.
- **Workflow Security**: Slack webhook URLs and other secrets are managed via environment variables, never hardcoded.

## Compliance
- **OWASP Top 10**: Regularly audited during agent reviews.
- **GDPR**: No personally identifiable information (PII) is collected or stored.

## Audit Findings
- Recent audit of `useGame` hook showed robust state management.
- Slack notification script refactored for secret isolation.

## Automated Security Controls

- Dependabot checks npm dependencies and GitHub Actions weekly and opens grouped pull requests. Workflow references are pinned to full commit SHAs; Dependabot is configured to keep those pins current.
- The `CI` workflow runs on pull requests targeting `main` and pushes to `main`. It performs a locked pnpm install, fails on high- or critical-severity advisories with `pnpm audit --audit-level high`, and runs lint, tests, and the production build.
- The `Static Analysis` workflow runs CodeQL, ESLint, formatting checks, and the TypeScript/Vite production build on pull requests targeting `main` and pushes to `main`. CodeQL uploads findings with only the `security-events: write` permission required by the analysis job; the remaining workflow permissions are read-only.
- Repository administrators must enable **Secret scanning** and **Push protection** under GitHub **Settings → Code security and analysis** (or at the organization level when the repository is covered by GitHub Advanced Security). Push protection should remain enabled for all supported secret types. Findings must be revoked and rotated rather than copied into issues, pull requests, logs, or documentation.

These repository settings cannot be enabled from a committed file. Confirm them when the repository is connected to GitHub, and protect the `main` branch by requiring the `CI` and `Static Analysis` checks before merging.

## Current Security Status
- **Status**: Automated baseline configured; GitHub secret scanning and push protection require repository settings confirmation
- **Last Review**: 2026-10-28
