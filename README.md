# NumberRush 🚀

> **Speed Math for Super Kids!**

NumberRush is a fast-paced, interactive arithmetic game designed to help kids improve their mental math skills through fun gameplay, visual rewards, and progressive difficulty levels. Built with modern web technologies, it offers a smooth, app-like experience on any device.

## ✨ Features

### 🎮 Game Modes
- **Blitz Mode ⚡**: Race against the clock! Solve questions before time runs out to build your streak and score massive points.
- **Practice Mode 🧠**: Zen-like training with no timers. Perfect for learning at your own pace.

### 🌍 Starting Planet & Progression
Choose a starting planet before each round. This sets the first difficulty, while score advances the journey with dynamic visual themes:
- **Moon Base 🌙**: Level 1 (Beginner)
- **Mars Outpost 🔴**: Level 2 (Intermediate, from 100 points)
- **Deep Space 🌌**: Level 3 (Advanced, from 200 points)

Starting on Mars or Deep Space keeps the game at that difficulty; progression never moves backward. The game shows a transition when a score threshold is reached, and results list every planet played.

### 🔥 Challenge & Rewards
- **Streak System**: Build combos to multiply your score.
- **Badges**: Unlock 10 unique achievements like *Streak King*, *Math Marathon*, and *Galaxy Guide*.
- **Chaos Mode**: Toggle "3-Number Chaos" for advanced arithmetic challenges (e.g., `5 + 3 - 2`).
- **High Scores**: Local storage saves your personal bests, total solved questions, and unlocked badges.

### 📱 Modern Experience
- **PWA Support**: Installable as a native app on mobile and desktop. Works offline!
- **Interactive Feedback**: Satisfying sound effects, screen shake animations, and confetti explosions for big achievements.
- **Keyboard Support**: Full numpad and keyboard control for desktop users.

## 🛠️ Tech Stack

- **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/), React Testing Library
- **Styling**: Modern CSS3 (Variables, Animations, Responsive Design)
- **Effects**: [canvas-confetti](https://github.com/catdad/canvas-confetti)
- **Infrastructure**: Azure Static Web Apps (IaC with Terraform)
- **Deployment**: Azure Static Web Apps with Terraform-managed infrastructure

## 🚀 Getting Started

### Prerequisites
- Node.js 24 or newer
- pnpm 11 (included with Corepack)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/number-rush.git
    cd number-rush
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install --frozen-lockfile
    ```

3.  **Start the development server:**
    ```bash
    pnpm dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📜 Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the development server with HMR. |
| `pnpm build` | Type-checks and builds the production-ready app. |
| `pnpm preview` | Previews the production build locally. |
| `pnpm test` | Runs unit tests with Vitest. |
| `pnpm lint` | Runs ESLint to check for code quality issues. |
| `pnpm format` | Fixes TypeScript and JavaScript formatting with ESLint. |
| `pnpm format:check` | Checks formatting without changing files. |

## ☁️ Deployment

This project can be deployed to **Azure Static Web Apps**.

- **Infrastructure**: Managed via Terraform in the `infra/` directory.
- **Continuous integration**: Pull requests and pushes to `main` run the locked pnpm install, lint, non-watch tests, production build, and Terraform checks.
- **Production deployment**: The `main` deployment runs only after the CI workflow succeeds. Configure the protected `production` GitHub environment with the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret. PR previews are separate and optional; enable them with a protected `preview` environment and the `AZURE_STATIC_WEB_APPS_PREVIEW_TOKEN` secret.
- **Terraform backend**: Copy `infra/backend.hcl.example` to a local `backend.hcl`, fill in the approved state-storage coordinates, and run `terraform init -backend-config=backend.hcl`. Keep the filled-in file out of version control.
- **Build**: Run `pnpm build`, then deploy the generated `dist/` directory with your Azure Static Web Apps deployment tooling.

## 🧹 Formatting

ESLint is the canonical formatter for JavaScript and TypeScript. Run `pnpm format` before opening a pull request, or use `pnpm format:check` to verify that a checkout is already normalized. Repository text files use LF line endings through `.gitattributes`; the included `.editorconfig` mirrors those settings for supported editors.
- **Configuration**: `public/staticwebapp.config.json` supplies the static-host security headers and SPA fallback.
- **Secrets**: Terraform state contains provider-managed resource attributes, including the Static Web App deployment key. Use the protected remote backend configured in `infra/providers.tf`; never commit state or expose the key in outputs or logs.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
