---
name: Web Development Quality Standards
description: Guidelines and best practices for building high-quality Vite + React + TypeScript + Tailwind CSS applications.
---

# Web Development Quality Standards

This skill defines the development standards for high-quality web applications built with **Vite**, **React**, **TypeScript**, and **Tailwind CSS**.

## 1. Project Structure
- **Components** (`/src/components`): Functional components using `React.FC<Props>` or the plain function pattern. Keep components focused, small, and reusable.
- **Hooks** (`/src/hooks`): Isolate logic, data-fetching, and side effects into custom hooks to keep components clean.
- **Pages/Views** (`/src/pages` or `/src/views`): Main page components that compose multiple lower-level components.
- **Utils** (`/src/utils`): Pure, side-effect-free utility functions that are easy to test.
- **Services** (`/src/services`): Logic for external API calls or complex business logic.
- **Context/Store** (`/src/context` or `/src/store`): Global state management (React Context, Zustand, etc.).
- **Styles** (`/src/index.css`): Root Tailwind directives and global CSS variable definitions.

## 2. TypeScript Best Practices
- **Strict Mode**: `strict: true` in `tsconfig.json` is mandatory.
- **Interfaces vs Types**: Use `interface` for public APIs and component props. Use `type` for unions, aliases, and internal utility types.
- **No `any`**: Avoid `any`. Use `unknown`, generics, or specific narrowing.
- **Explicit Return Types**: Prefer explicit return types on exported functions, hooks, and API services.

## 3. Tailwind CSS & Styling
- **Utility-First**: Leverage Tailwind utility classes for the majority of styling needs.
- **Configuration**: Use `tailwind.config.js` for theme extensions (colors, spacing, fonts) to ensure consistency.
- **Custom CSS Variables**: Define theme colors (HSL/RGB) as CSS variables in `index.css` and map them in Tailwind's config for dynamic switching (e.g., light/dark mode).
- **Organization**: Use `clsx` or `tailwind-merge` for conditional class logic and to avoid class conflicts.
- **Consistency**: Avoid "magic numbers" in arbitrary values (e.g., `h-[123px]`). Use the design system scale where possible.

## 4. UI & UX Quality
- **Design System**: Follow a consistent design language. Use custom fonts (e.g., via Google Fonts) and a cohesive color palette.
- **Transitions & Animations**: Use smooth transitions for interactive states (hover, focus) and subtle entrance animations to feel premium.
- **Theming**: Support system-balanced light and dark modes. Never hard-code colors in components.
- **Responsiveness**: Implement mobile-first or desktop-first responsive layouts using Tailwind's breakpoint prefixes (`sm:`, `md:`, `lg:`, etc.).

## 5. Performance
- **Memoization**: Optimize expensive computations with `useMemo` and stable function references with `useCallback`.
- **Code Splitting**: Use `React.lazy` and `Suspense` for large route-level components.
- **Asset Optimization**: Optimize images and use modern formats (WebP/SVG). Use tree-shakeable iconography (e.g., `lucide-react`).
- **Build Sizes**: Monitor bundle sizes and avoid importing large, unused libraries.

## 6. Accessibility (A11y)
- **Semantic HTML**: Use proper HTML5 elements (`<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`).
- **Contrast**: Ensure text colors meet WCAG AA contrast standards.
- **Keyboard Interactivity**: All interactive elements must be focusable and operable via keyboard.
- **ARIA**: Use `aria-label`, `role`, and other ARIA attributes where semantic HTML is insufficient.

## 7. Testing & Maintenance
- **Unit Testing**: Focus on testing complex logic in custom hooks and utility functions (e.g., Vitest + React Testing Library).
- **Code Quality**: Maintain clean code via ESLint and Prettier.
- **Build Verification**: Ensure `tsc -b && vite build` runs without errors before merging changes.
- **Documentation**: Comment complex logic and maintain a clear README.
