# Security policy

NumberRush is a client-side educational game. The app stores gameplay progress
and optional settings in browser storage; it does not provide an application
backend or a remote account system. This limits the server-side attack surface
but does not make the browser, hosting, dependencies, or deployment workflows
risk-free.

## Reporting a vulnerability privately

Please do not open a public issue, discussion, or pull request for a suspected
vulnerability. Use the repository's private
[GitHub Security Advisory form](../../security/advisories/new). Include:

- a concise description and affected file or workflow;
- reproducible steps or a minimal proof of concept;
- impact and any required browser, origin, permission, or deployment
  conditions;
- a suggested mitigation, if known.

If private advisories are not enabled for the hosting repository, contact the
repository maintainers through the private channel listed in the repository's
GitHub **Security** tab and do not publish exploit details. Maintainers aim to
acknowledge a report within five business days, will coordinate a fix and
disclosure timeline with the reporter, and will credit reporters who want to be
named.

## Scope and data handling

In scope are the application, generated PWA behavior, repository workflows,
Terraform configuration, dependency use, and deployment configuration. The
optional player name, progress records, and exported backup are user-controlled
browser data. Do not include real personal data in issue examples or exported
fixtures.

The app validates math inputs and imported progress, limits import size,
allowlists progress keys, rejects unsupported storage versions, and keeps
runtime state in memory when storage is unavailable. These controls reduce
damage from malformed local data; they are not a substitute for browser or
host security.

## Repository controls

- Pull Request Checks installs from the committed lockfile and fails on high/critical dependency
  advisories.
- Pull Request Checks runs formatting, ESLint, the build, and CodeQL.
- Dependabot monitors npm packages and GitHub Actions.
- GitHub Actions are pinned to commit SHAs in the committed workflows.
- Azure deployment uses protected environments and secrets; Terraform state is
  intended for an Azure remote backend and must not be committed.
- Repository administrators should enable secret scanning, push protection, and
  branch protection requiring the relevant checks. These are GitHub settings,
  not guarantees provided by a file in this repository.

## Security expectations for contributors

Never commit credentials, tokens, filled Terraform backend files, private
exports, or secrets in logs. Keep dependencies minimal, preserve the existing
content-security and permissions policies, validate data at trust boundaries,
and explain security-sensitive changes in the pull request.
