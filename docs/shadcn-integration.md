# Applique UI — shadcn Integration

## Overview

Applique UI has been modernised internally across three dimensions:

- **React 16 → 18** and **TypeScript 3.9 → 5.4** — required baseline for modern tooling
- **Tailwind CSS 3.x** added as a styling layer alongside the existing SCSS + CSS Modules system
- **`packages/shadcn-primitives`** created — an internal package holding `cva`-based variant definitions and the `cn()` utility

Two approaches are supported in parallel. There is no forced migration — existing screens continue to work without any changes.

---

## Approach 1 — Applique contract (existing screens)

Use this for existing screens or when you don't want to change anything.

The public API is identical to before. Internally, props are normalised and passed through `cva` + Tailwind — but this is invisible to consumers.

```tsx
import Button from '@applique-ui/button'

// Nothing changes — same props, same behaviour
<Button type="primary" color="blue" size="medium">
  Save
</Button>
```

All 50+ components are available. No Tailwind setup required in the consumer app.

---

## Approach 2 — shadcn contract (new screens)

Use this for new screens. Import directly from `@applique-ui/shadcn-primitives` and use the new prop API (`intent`, `tone`, `size`).

### Installation

```bash
pnpm add @applique-ui/shadcn-primitives
```

### Option A — With Tailwind (recommended)

If your consumer app already has Tailwind set up, import the tokens and use the component:

```tsx
import { ShadcnButton } from '@applique-ui/shadcn-primitives'
import '@applique-ui/shadcn-primitives/dist/tokens.css'

<ShadcnButton intent="primary" tone="blue" size="md">
  Save
</ShadcnButton>
```

### Option B — Without Tailwind

If your app does not use Tailwind, import the pre-generated CSS bundle instead. No PostCSS or Tailwind config needed.

```tsx
import { ShadcnButton } from '@applique-ui/shadcn-primitives'
import '@applique-ui/shadcn-primitives/dist/design.css'

<ShadcnButton intent="primary" tone="blue" size="md">
  Save
</ShadcnButton>
```

### Prop API

| Prop | Values | Description |
|---|---|---|
| `intent` | `primary` `secondary` `tertiary` `text` | Visual style |
| `tone` | `blue` `red` `yellow` `green` `gray` `pink` | Colour |
| `size` | `sm` `md` `lg` | Size |
| `className` | any | Appended last — overrides defaults via `tailwind-merge` |

### Using `buttonVariants` directly

If you need the class string without the component (e.g. for a custom element):

```tsx
import { buttonVariants, cn } from '@applique-ui/shadcn-primitives'

<a
  href="/somewhere"
  className={cn(buttonVariants({ intent: 'primary', tone: 'blue' }), 'my-custom-class')}
>
  Go
</a>
```

### Available components

Currently available in `@applique-ui/shadcn-primitives`:

- `ShadcnButton` — Button

More components will be added progressively.
