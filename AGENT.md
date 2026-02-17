# AGENT.md: NumberRush Multi-Agent Orchestration (Map)

## Purpose
AGENT.md is a **navigation map** for the NumberRush project.  
Detailed agent reports live in `.agent/rules/` and serve as the **system of record**.  
This file provides a high-level overview and pointers to deeper documentation.

---

## Agents Overview

| Agent | Role | Docs Reference |
|-------|------|----------------|
| 👷 Coder | Senior Software Engineer | `.agent/rules/code.md` |
| 🧪 Tester | QA Automation Engineer | `.agent/rules/tester.md` |
| 🛡️ Security | Audit Researcher | `.agent/rules/security_engineer.md` |
| 🚀 Performance | Optimization Engineer | `.agent/rules/performance_engineer.md` |
| 🏛️ Reviewer | Principal Architect | `.agent/rules/reviewer.md` |

---

## Supporting Documentation

| Document | Purpose |
|----------|---------|
| `QUALITY_SCORE.md` | Quality metrics, scoring methodology, and evaluation criteria |
| `SECURITY.md` | Security policies, compliance notes, and audit references |
| `PERFORMANCE.md` | Performance targets, asset budgets, and optimization strategy |
| `ARCHITECTURE.md` | Tech stack overview, design patterns, and directory map |
| `ROADMAP.md` | Future features, backlog, and project milestones |

---

## Workflow
- Each agent contributes independently, with outputs stored in `.agent/rules/*.md`.
- Strategic and product-level documentation is maintained in root-level files (`QUALITY_SCORE.md`, `SECURITY.md`, etc.).
- AGENT.md summarizes contributions at a high level and points to deeper sources of truth.
- Infrastructure scripts (e.g., `infra/slack_notify.ps1`) automate reporting and status updates.

---

## Infrastructure & Automation
- **Slack Notifications**: Automated reporting of agent statuses and workflow completion.  
- **Script**: `infra/slack_notify.ps1`  
- **Security**: Webhook URL handled via environment variables.

---

## Current Status
- Modern stack (React 19 + Vite 7 + Tailwind 4) fully implemented.
- Multi-agent workflow established and automated via Slack notifications.
- PWA and offline support verified.
- Build validated and performance-optimized.
- For detailed findings, see individual agent reports in `.agent/rules/`.

---

## Directory Map
.agent/
└── rules/
├── code.md
├── performance_engineer.md
├── reviewer.md
├── security_engineer.md
└── tester.md
QUALITY_SCORE.md
SECURITY.md

---

**Note:**  
AGENT.md is intentionally concise (~100 lines).  
For technical details, metrics, and audit notes, consult `.agent/rules/` and root-level documentation.

