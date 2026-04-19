# @applique-ui/shadcn-primitives

shadcn/ui-style primitive components for Applique design system using Tailwind CSS and Figma design tokens.

## Installation

```bash
pnpm add @applique-ui/shadcn-primitives
```

## Usage

### With Tailwind CSS (Recommended)

If your app has Tailwind configured:

```tsx
import { Button } from '@applique-ui/shadcn-primitives'
import '@applique-ui/shadcn-primitives/dist/tokens.css'

function App() {
  return (
    <Button intent="default" size="md">
      Save
    </Button>
  )
}
```

### Without Tailwind CSS

Use pre-compiled CSS bundle:

```tsx
import { Button } from '@applique-ui/shadcn-primitives'
import '@applique-ui/shadcn-primitives/dist/design.css'

function App() {
  return (
    <Button intent="default" size="md">
      Save
    </Button>
  )
}
```

## Components

### Button

```tsx
<Button intent="default" size="md">
  Button
</Button>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `intent` | `'default' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive' \| 'link'` | `'default'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | `'md'` | Button size |
| `className` | `string` | - | Additional classes (merged with tailwind-merge) |

**All button variants:**

```tsx
// Default variants
<Button intent="default">Default</Button>
<Button intent="secondary">Secondary</Button>
<Button intent="outline">Outline</Button>
<Button intent="ghost">Ghost</Button>
<Button intent="destructive">Destructive</Button>
<Button intent="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔔</Button>

// With icons (using lucide-react or any icon library)
<Button intent="outline">
  <Icon className="w-4 h-4" />
  Button with icon
</Button>

// Disabled
<Button disabled>Disabled</Button>

// Custom classes
<Button className="rounded-full">Rounded</Button>
```

**Using buttonVariants directly:**

```tsx
import { buttonVariants, cn } from '@applique-ui/shadcn-primitives'

<a href="/home" className={cn(buttonVariants({ intent: 'outline' }))}>
  Link Button
</a>
```

## Design Tokens

All colors use CSS custom properties from Figma Applique design tokens:
- `--primary`: #5232D0 (indigo/700)
- `--secondary`: #F0EEFF (indigo/50)
- `--destructive`: #BF3823 (Cherry/700)
- `--border`: #E5E7EB (gray/200)
- `--ring`: #5232D0 (indigo/700)

See the Applique.tokens.json file for full token reference.

## Utilities

### cn()

Merges class names using `clsx` and `tailwind-merge`:

```tsx
import { cn } from '@applique-ui/shadcn-primitives'

<button className={cn('base-class', someCondition && 'conditional-class', className)}>
  Button
</button>
```

## Coexistence with Legacy Components

This package is completely separate from existing `@applique-ui/button`. Both can be used in the same app:

```tsx
// Old SCSS-based button
import Button from '@applique-ui/button'
<Button type="primary" color="blue">Save</Button>

// New shadcn-based button
import { Button } from '@applique-ui/shadcn-primitives'
<Button intent="default">Save</Button>
```

No conflicts - they use different class naming strategies.
