# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Applique is Myntra's enterprise design system — a pnpm monorepo containing ~50 React UI components and ~19 utility packages, all published under the `@applique-ui` npm scope.

- **Main consumer package**: `packages/uikit` (re-exports all components)
- **Icons**: separate `@applique-ui/uikit-icons` package
- **Primitives**: `packages/shadcn-primitives` wraps shadcn/ui components
- **Design tokens/theme**: `packages/uikit-design`

## Commands

```bash
# Install dependencies
pnpm install

# Development server
npm run start

# Build all packages
npm run build

# Build a single package (set TARGET env var)
TARGET=button npm run build

# Run tests
npm run test

# Run a single test file
npx jest path/to/file.spec.js

# Generate coverage
npm run coverage

# Release (standard-version)
npm run release

# Clean all dist and node_modules
npm run clean
```

## Architecture

### Monorepo Layout

```
components/<name>/       # Each UI component
  src/                   # Source (TSX + SCSS)
  docs/                  # MDX documentation + Api.mdx
  package.json           # Published as @applique-ui/<name>
packages/<name>/         # Utility packages (uikit, uikit-utils, etc.)
scripts/                 # Build orchestration scripts
test/unit/               # Jest setup files, shared test utilities
tools/                   # Dev server and documentation tools
```

### Build System

- **Rollup** builds each component/package individually to `dist/` in both ESM and CJS formats.
- SCSS is compiled via `@applique-ui/rollup-plugin-scss` with CSS modules; class names follow the pattern `aui-{component}-{name}`.
- TypeScript declarations are emitted alongside JS.
- The `TARGET` environment variable selects which package to build.

### Testing

- **Jest** with **Enzyme** for React component tests.
- Test files: `**/*.spec.js` pattern.
- Setup files: `test/unit/setup-jest.js`, `test/unit/setup-enzyme.js`, `test/unit/setup-window.js`.
- Coverage thresholds: 30% branches/functions, 50% lines.

### Styling

- SCSS modules per component.
- Tailwind CSS 3 is integrated via PostCSS (alongside component SCSS, not replacing it).
- Prettier formats with single quotes, no semicolons, 80-char print width, LF line endings.

### CI/CD

- **build.yml**: Runs `npm run coverage` + SonarCloud on push to `deploy` and on PRs.
- **release.yml**: Publishes all packages via `pnpm publish -r` when release-please merges a release PR into `deploy`.
- Main/production branch is **`deploy`** (not `main`).

### Key Conventions

- Each component's `package.json` sets `"sideEffects": false` for tree-shaking.
- Pre-commit hooks (Husky + lint-staged) run ESLint/Prettier/Stylelint on staged files.
- Pre-push hook runs Jest on changed files.
- ESLint extends `@applique-ui/standard` (from `packages/eslint-config-standard`).
