# NumberRush

NumberRush is a fast-paced math game for kids built with React + TypeScript + Vite.

Players solve arithmetic questions as quickly as possible, build streaks, and unlock badges over time.

## Features

- `Blitz` mode with countdown timer and score multiplier streaks.
- `Practice` mode with no visible timer pressure.
- Planet-based difficulty (`Moon`, `Mars`, `Space`).
- Optional `3-Number Chaos` questions.
- Persistent progress in local storage:
  - high score
  - best streak
  - unlocked badges
  - cumulative game stats
- Keyboard support (`0-9`, `Enter`, `Backspace`, `Escape`).

## Tech Stack

- React 19
- TypeScript
- Vite
- Vitest + Testing Library

## Getting Started

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Scripts

- `npm run dev`: Run development server.
- `npm run build`: Type-check and build.
- `npm run lint`: Run ESLint.
- `npm run test`: Run unit tests with Vitest.

## Gameplay Notes

- Correct answers increase score and streak.
- Streak milestone bonuses increase per-question points.
- In Blitz mode, each submitted answer resets the timer for the next question.
- Badges unlock automatically when conditions are met.

## Testing

Run tests:

```bash
npm run test
```

Current automated coverage includes:

- math question generation constraints and arithmetic correctness
- core game-state transitions in `useGame`

