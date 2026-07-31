# Applique x shadcn — Registry Strategy

## Background

Applique is Myntra's enterprise design system, publishing ~50 React components as npm packages under `@applique-ui`. Teams consume components by installing the package and importing from it.

As shadcn/ui gained adoption across the org, teams started requesting to use shadcn directly. The primary reason: **shadcn gives you the source code** in your own project — full ownership, no black box, no upgrade dependency.

This created a tension:

| | Applique package model | shadcn direct |
|---|---|---|
| Component source | Applique owns | Team owns |
| Tokens / theming | Managed | Each team defines their own |
| Consistency | High | Fragmented over time |
| Flexibility | Low | High |

The risk with teams using shadcn directly: **token drift**. Each team initializes shadcn with their own CSS variables, maintains them independently, and gradually diverges from the Applique design language.

---

## Decision: Registry-Based Approach

Instead of forcing teams to choose between Applique packages or vanilla shadcn, we use **shadcn's custom registry** feature.

A custom registry is a set of JSON files hosted at a public URL. Teams run one command:

```bash
npx shadcn add https://rohangore1999.github.io/applique-ui/registry/button.json
```

They get:
- The component **source code** in their project (shadcn model, team owns it)
- The component starts from **Applique's baseline** — correct tokens, Myntra conventions, Applique prop names
- **Design tokens are written automatically** into their CSS — no separate import needed

This gives teams source ownership without fragmenting the design language.

---

## How It Works

### Registry JSON files

Each component is a JSON file with three things:

```
name        → component identifier
files       → source code to copy into the consumer's project
cssVars     → design tokens to write into consumer's CSS (via applique-theme.json)
registryDependencies → other registry items to install first
```

### The dependency chain

Every component depends on two base items:

```
npx shadcn add registry/button.json
        │
        ├── registryDependencies
        │       ├── registry/applique-theme.json  → writes all 76 tokens into consumer's CSS
        │       └── registry/utils.json           → writes lib/utils.js (cn() helper)
        │
        └── files
                └── components/ui/button.jsx      → Applique button with intent prop
```

One command installs everything. The consumer does not import tokens separately.

---

## Token Strategy

All design tokens live in one source of truth: `packages/shadcn-primitives/src/tokens.css`.

This file is the Figma-sourced token set — colors, spacing, radius, shadows, typography — all as CSS custom properties in HSL format.

```
tokens.css  →  generate-registry.js  →  applique-theme.json (cssVars)
                                              ↓
                              shadcn CLI writes into consumer's CSS
```

When a consumer runs `npx shadcn add` for any Applique component, the CLI automatically writes all token vars into their configured CSS file under `@layer base`.

**Updating tokens:** change `tokens.css` → run `generate-registry.js` → push to `deploy` → GitHub Pages updates → consumers re-run `npx shadcn add` to pick up the new tokens.

---

## Component Conventions

Applique's shadcn components differ from vanilla shadcn in key ways:

| | Vanilla shadcn | Applique registry |
|---|---|---|
| Button variant prop | `variant` | `intent` |
| Sizes | `default`, `sm`, `lg`, `icon` | `md`, `sm`, `lg`, `icon` |
| Focus ring | `ring-offset` pattern | `focus-visible:ring-[3px] focus-visible:ring-ring/50` |
| Press animation | None | `active:scale-[0.98]` |
| Slot / asChild | Yes (`@radix-ui/react-slot`) | No (simple button element) |
| data-slot attribute | No | `data-slot="button"` (scoped preflight hook) |

These conventions come from `packages/shadcn-primitives/src/` which is the master source. Registry files are always generated from this source — never hand-edited.

---

## Current Implementation

### What's built

| File | Purpose |
|---|---|
| `packages/shadcn-primitives/src/tokens.css` | Single source of truth for all design tokens |
| `packages/shadcn-primitives/scripts/generate-registry.js` | Generates registry JSON from source files |
| `docs/registry/applique-theme.json` | All 76 tokens as registry:theme item |
| `docs/registry/utils.json` | `cn()` utility as registry:lib item |
| `docs/registry/button.json` | Applique button as registry:ui item |

### Registry hosting

Hosted on GitHub Pages from the `deploy` branch, `/docs` folder.

**Base URL:** `https://rohangore1999.github.io/applique-ui/registry/`

No CI/CD needed. Update flow:
1. Change source files in `packages/shadcn-primitives/src/`
2. Run `node packages/shadcn-primitives/scripts/generate-registry.js`
3. Commit `docs/registry/` changes and push to `deploy`
4. GitHub Pages serves updated files within ~1 min

### Consumer onboarding

**One-time setup** (needed before using any registry component):

```js
// tailwind.config.js — extend with Applique's token mapping
module.exports = {
  presets: [require('@applique-ui/tailwind-preset')],  // TODO: publish this package
  content: ['./components/**/*.{js,jsx}', './apps/**/*.{js,jsx}'],
}
```

**Per component** (as many times as needed):

```bash
npx shadcn add https://rohangore1999.github.io/applique-ui/registry/button.json
```

---

## Technical Notes

### Why `target` field is required

shadcn CLI v4 resolves file content from its own official registry for any component whose `name` matches a known shadcn component (`button`, `input`, `checkbox`, etc.). This means our custom `content` field gets ignored and the vanilla shadcn component gets installed instead.

Adding `"target": "components/ui/button.jsx"` to the file entry forces the CLI to write our content to that exact path, bypassing the official registry lookup.

All Applique registry components must include the `target` field.

### Why JSX not TSX in the registry

The consumer app has `"tsx": false` in `components.json`. Without the JSX conversion, the CLI falls back to fetching the official shadcn JSX version. The `generate-registry.js` script strips TypeScript type annotations from source files before writing them to the registry JSON.

---

## Roadmap

### Phase 1 — Foundation (done)
- [x] `tokens.css` as single source of truth
- [x] `generate-registry.js` script
- [x] `applique-theme.json` registry item (all 76 tokens)
- [x] `utils.json` registry item
- [x] `button.json` registry item (Applique conventions)
- [x] GitHub Pages hosting

### Phase 2 — Expand component coverage
- [ ] Add remaining `packages/shadcn-primitives/src/` components to registry
- [ ] Add TSX→JSX conversion for each component in the generate script
- [ ] Publish `@applique-ui/tailwind-preset` package (eliminates the one-time manual Tailwind setup)

### Phase 3 — Token governance
- [ ] Remove hardcoded token blocks from consumer apps (replace with Applique registry tokens)
- [ ] Establish token review process: Figma → `tokens.css` → registry

### Phase 4 — Registry discoverability
- [ ] Registry index page (`registry/index.json`) listing all available components
- [ ] Documentation page at `uikit.myntra.com/registry`

---

## Links

| Resource | URL |
|---|---|
| Registry base URL | `https://rohangore1999.github.io/applique-ui/registry/` |
| Button JSON | `https://rohangore1999.github.io/applique-ui/registry/button.json` |
| Theme JSON | `https://rohangore1999.github.io/applique-ui/registry/applique-theme.json` |
| Source repo | `https://github.com/rohangore1999/applique-ui` |
| shadcn-primitives source | `packages/shadcn-primitives/src/` |
| Generate script | `packages/shadcn-primitives/scripts/generate-registry.js` |
