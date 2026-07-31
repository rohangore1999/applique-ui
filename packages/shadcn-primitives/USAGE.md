# Applique registry consumer guide

The Applique registry uses the shadcn source-distribution model. Installing an
item copies its TypeScript into your application and applies the shared
Applique token baseline.

## Requirements

The complete `v0.1.0` component set targets:

- Node.js `>=20.18.1`
- React 19
- Tailwind CSS 4
- TypeScript component output
- `shadcn@4.16.0`
- the `base-nova` style

## Configure shadcn

Use a `components.json` compatible with the registry:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

The path aliases must also resolve in the application's TypeScript and bundler
configuration. A typical `tsconfig.json` mapping is:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Your Tailwind entry file must load Tailwind 4:

```css
@import 'tailwindcss';
```

## Install a component

Use both the pinned CLI and immutable registry URL:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
```

The root URL is an alias for the current release and is useful while exploring:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/button.json
```

Multiple components can be installed together:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/checkbox.json \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/dialog.json
```

The CLI follows each item's dependency graph. For Button, it also installs:

- `applique-theme`, which merges the Applique variables into the configured CSS;
- `utils`, which writes the local `cn()` helper;
- `@fontsource-variable/hanken-grotesk@5.3.0`, which loads the tokenized
  variable font;
- the exact reviewed Base UI and CVA npm versions.

There is no separate Applique Tailwind preset or token package to install.
Upstream dark utility branches use the Applique-scoped `applique-dark:`
variant, so a host application's `.dark` class cannot apply them to the
light-only token set.

## Import the installed source

With the aliases above:

```tsx
import { Button } from '@/components/ui/button'

export function Actions() {
  return (
    <div className="flex gap-2">
      <Button variant="default">Save</Button>
      <Button variant="outline">Cancel</Button>
    </div>
  )
}
```

Button exposes the pinned Base/Nova variants:

```tsx
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>
```

Its sizes are:

```tsx
<Button size="xs">Extra small</Button>
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon" aria-label="Save">{/* icon */}</Button>
<Button size="icon-xs" aria-label="Save">{/* icon */}</Button>
<Button size="icon-sm" aria-label="Save">{/* icon */}</Button>
<Button size="icon-lg" aria-label="Save">{/* icon */}</Button>
```

Use the live catalogue for the exact exports, local prop declarations, inherited
primitive surfaces, and examples for every component:

```text
https://rohangore1999.github.io/applique-ui/catalog/
```

## Form and Field

The official Base/Nova Form registry entry is fileless and deprecated. It has
no install command. Use Field:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/field.json
```

## Customize locally

The files written under `src/components/ui`, `src/lib`, and `src/hooks` belong
to the consuming application. Teams may compose them, edit them, or add
application-specific variants.

Keep semantic token names and accessible behavior intact unless a reviewed
product requirement calls for a change. Local edits create an intentional fork
that must be considered during future registry updates.

## Update an installed component

An installed component does not change automatically when the registry changes.

1. Choose the target versioned item URL.
2. Run `shadcn add` again for that item.
3. Inspect the Git diff before accepting an overwrite.
4. Merge registry changes with any local changes.
5. Run type checks, tests, and visual checks in the application.

For example, when a future version exists:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.2.0/button.json
```

The source diff is the update mechanism. There is no package version whose
installation silently changes all dashboards.

## Troubleshooting

### The CLI asks about an existing file

That file is client-owned. Compare it with the registry source and decide
whether to keep, replace, or merge it. Do not use overwrite without reviewing
local customizations.

### An `@/` import does not resolve

Keep `components.json`, TypeScript paths, and bundler aliases aligned. The
examples above map `@/*` to `src/*`.

### A component is missing styling

Confirm that:

- `components.json` points to the CSS file actually loaded by the app;
- that CSS imports Tailwind 4;
- the Applique variables were merged when the component was installed;
- the app is scanning its local component source.

### A JavaScript-only project cannot install the source

This release publishes reviewed TypeScript source only. A JavaScript-only
consumer needs a separate compiler-backed conversion path.
