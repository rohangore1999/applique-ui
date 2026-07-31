# Consumer setup

Applique components are installed as local source from the registry.

## Requirements

- Node.js `>=20.18.1`
- React and React DOM `19.2.8`
- Tailwind CSS `4.3.3`
- a valid shadcn `components.json`
- shadcn CLI `4.16.0`

The aliases in `components.json` determine where the CLI writes files. A
typical setup uses:

```json
{
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
    "ui": "@/components/ui",
    "lib": "@/lib",
    "utils": "@/lib/utils",
    "hooks": "@/hooks"
  }
}
```

The global CSS must import Tailwind 4:

```css
@import 'tailwindcss';
```

## Install

Use an immutable versioned item:

```bash
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
```

The component's graph automatically installs utilities, component
dependencies, the Applique theme, and Hanken Grotesk. Import the resulting
local file:

```tsx
import { Button } from '@/components/ui/button'
;<Button variant="outline">Cancel</Button>
```

Do not import the primitive from an Applique npm package in the registry
workflow.

## Install multiple components

```bash
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/checkbox.json \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/dialog.json
```

Form is the sole official fileless entry in this baseline. Install and use
Field instead:

```bash
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/field.json
```

## Update

When a later version is available:

1. rerun `shadcn add` with the new immutable URL;
2. review the source and dependency diff;
3. resolve any local customizations;
4. run the client test suite;
5. commit the accepted merge.

Updates are intentionally opt-in. Registry source does not change merely
because Applique publishes a new version.

## Theme behavior

The registry writes exact Applique light tokens and Tailwind 4 semantic
mappings into the client's CSS. It installs
`@fontsource-variable/hanken-grotesk@5.3.0` and its CSS import.

Components use `applique-dark:` rather than Tailwind's global `dark:` variant.
The theme also scopes Tailwind's built-in `dark` variant to the same explicit
selector. Those styles activate only below
`data-applique-color-scheme="dark"`. Do not set that attribute until Applique
publishes reviewed dark tokens.

The client can edit installed source, but changing shared tokens or base
component behavior creates deliberate divergence that must be reconciled on a
future update.
