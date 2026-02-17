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

## Current Security Status
- **Status**: Secure
- **Last Review**: 2026-02-17
