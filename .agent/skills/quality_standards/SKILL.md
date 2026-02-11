---
name: Web Development Quality Standards
description: Guidelines and best practices for building high-quality Vite + React + TypeScript applications.
---

# Web Development Quality Standards

This skill defines the development standards for the **NumberRush** project to ensure maintainability, performance, and a premium user experience.

## 1. Project Structure
- **Components**: Standardize on functional components using the `const Component: React.FC<Props> = (...) =>` pattern.
- **Hooks**: Isolate side effects and complex state logic into custom hooks.
- **Utils**: Keep pure logic (like math generation) in `/src/utils` with unit tests in mind.
- **Assets**: Organize images, sounds, and constants into dedicated directories.

## 2. TypeScript Best Practices
- **Strict Mode**: `strict: true` in `tsconfig.json` is mandatory.
- **Interfaces**: Use `interface` for public APIs and `type` for internal unions/aliases.
- **No Any**: Avoid `any` at all costs. Use `unknown` or generics if the type is truly dynamic.

## 3. Component & UI Quality
- **Premium Aesthetics**: Follow the design rules in the system prompt:
    - Custom fonts (Inter/Outfit).
    - HSL-based color palettes.
    - Glassmorphism and subtle gradients.
    - Micro-animations for feedback (using CSS transitions).
- **Responsive Design**: Mobile-first approach. Ensure large tap targets (minimum 44x44px) for children.
- **Vanilla CSS**: Use CSS Variables for theme consistency. Avoid inline styles.

## 4. Performance
- **Memoization**: Use `useMemo` and `useCallback` for expensive calculations or stabilized props.
- **Asset Loading**: Lazy-load sounds and images where appropriate.
- **Optimized Assets**: Use modern formats (WebP for images, OGG/MP3 for audio).

## 5. Accessibility (A11y)
- **Contrast**: Maintain high contrast ratios for readability (WCAG AA minimum).
- **ARIA**: Use proper ARIA labels for non-text interactive elements (like icons buttons).
- **Focus States**: Clearly visible focus states for keyboard/numpad navigation.

## 6. Testing & Validation
- **Logic Tests**: Ensure math generation logic handles edge cases (e.g., no negative results in simple subtraction).
- **Linting**: Consistent `eslint` and `prettier` configurations.
