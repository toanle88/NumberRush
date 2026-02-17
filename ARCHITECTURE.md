# ARCHITECTURE.md: Technical Design & Patterns

## Purpose
Documents the high-level architecture and technical decisions of the NumberRush project.

## Tech Stack
- **Framework**: React 19 (Hooks-heavy approach)
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 (Modern utility-first CSS)
- **Deployment**: PWA-first (Vite Plugin PWA)
- **State Management**: Local React context and custom hooks (`useGame`).

## Core Patterns
- **Functional Components**: Zero class components.
- **Custom Hooks**: Business logic (math, timer, state) isolated from the UI.
- **Modular Actions**: Game actions are handled via functional state updates to ensure predictability.
- **Responsive Design**: Mobile-first layout emphasizing touch targets for the numpad.

## Directory Structure
- `src/components/`: Pure UI components and layout wrappers.
- `src/hooks/`: Reusable game logic and state management.
- `src/utils/`: Pure helper functions (e.g., math generators).
- `infra/`: Internal automation scripts and infrastructure config.

## Decision Log
- **2026-02-17**: Migrated to Tailwind 4 for improved build performance and modern CSS features.
- **2026-02-17**: Implemented multi-agent orchestration for high-velocity quality assurance.
