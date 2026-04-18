# @applique-ui/shadcn-primitives Usage Examples

## Installation

```bash
# From npm (after publishing)
pnpm add @applique-ui/shadcn-primitives

# For local development (from monorepo)
# The package is automatically linked via pnpm workspace
```

## Approach 1: With Tailwind CSS (Recommended)

If your consumer app already has Tailwind CSS configured:

### 1. Install the package

```bash
pnpm add @applique-ui/shadcn-primitives
```

### 2. Import tokens.css and components

```tsx
// In your main App.tsx or entry file
import '@applique-ui/shadcn-primitives/dist/tokens.css'

// In your component files
import { ShadcnButton } from '@applique-ui/shadcn-primitives'

function MyComponent() {
  return (
    <div>
      <ShadcnButton intent="default">Save</ShadcnButton>
      <ShadcnButton intent="outline">Cancel</ShadcnButton>
      <ShadcnButton intent="destructive" size="sm">Delete</ShadcnButton>
    </div>
  )
}
```

### 3. Configure Tailwind (optional)

If you want to extend the design tokens in your app's `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@applique-ui/shadcn-primitives/dist/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        // These are already defined via CSS custom properties in tokens.css
        // You can override them here if needed
      },
    },
  },
}
```

## Approach 2: Without Tailwind CSS (Standalone)

If your consumer app does NOT have Tailwind CSS:

### 1. Import design.css instead

```tsx
// In your main App.tsx or entry file
import '@applique-ui/shadcn-primitives/dist/design.css'

// In your component files
import { ShadcnButton } from '@applique-ui/shadcn-primitives'

function MyComponent() {
  return (
    <div>
      <ShadcnButton intent="default">Save</ShadcnButton>
      <ShadcnButton intent="outline">Cancel</ShadcnButton>
    </div>
  )
}
```

**Note:** `design.css` includes all necessary Tailwind utilities pre-compiled. Your app doesn't need Tailwind CSS installed.

## Complete Component Examples

### Basic Button Usage

```tsx
import { ShadcnButton } from '@applique-ui/shadcn-primitives'

// All button intents
<ShadcnButton intent="default">Default</ShadcnButton>
<ShadcnButton intent="secondary">Secondary</ShadcnButton>
<ShadcnButton intent="outline">Outline</ShadcnButton>
<ShadcnButton intent="ghost">Ghost</ShadcnButton>
<ShadcnButton intent="destructive">Destructive</ShadcnButton>
<ShadcnButton intent="link">Link</ShadcnButton>

// All button sizes
<ShadcnButton size="sm">Small</ShadcnButton>
<ShadcnButton size="md">Medium (default)</ShadcnButton>
<ShadcnButton size="lg">Large</ShadcnButton>
<ShadcnButton size="icon">🔔</ShadcnButton>

// Disabled state
<ShadcnButton disabled>Disabled</ShadcnButton>

// Custom className (merged with tailwind-merge)
<ShadcnButton className="rounded-full">Custom Rounded</ShadcnButton>
```

### Using buttonVariants with Other Elements

You can use `buttonVariants` to style non-button elements like links:

```tsx
import { buttonVariants, cn } from '@applique-ui/shadcn-primitives'

<a 
  href="/home" 
  className={cn(buttonVariants({ intent: 'outline', size: 'sm' }))}
>
  Link styled as Button
</a>

<div className={cn(buttonVariants({ intent: 'ghost' }))}>
  Div styled as Button
</div>
```

### Using cn() Utility

The `cn()` utility combines `clsx` and `tailwind-merge` for better className handling:

```tsx
import { ShadcnButton, cn } from '@applique-ui/shadcn-primitives'

function MyButton({ isActive, className }) {
  return (
    <ShadcnButton
      intent="default"
      className={cn(
        'transition-all duration-200',
        isActive && 'ring-2 ring-offset-2',
        className
      )}
    >
      Click me
    </ShadcnButton>
  )
}
```

### TypeScript Support

All components have full TypeScript support:

```tsx
import { ShadcnButton, ButtonProps } from '@applique-ui/shadcn-primitives'

const MyButton: React.FC<ButtonProps> = (props) => {
  return <ShadcnButton {...props} />
}

// Type-safe props
<ShadcnButton 
  intent="default"  // ✓ Autocomplete: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link"
  size="md"         // ✓ Autocomplete: "sm" | "md" | "lg" | "icon"
  onClick={(e) => console.log(e)} // ✓ Full event typing
/>
```

## Customizing Design Tokens

The design tokens are defined as CSS custom properties in `tokens.css`. You can override them:

```css
/* In your app's global CSS */
:root {
  /* Override primary color from Applique indigo/700 to your brand color */
  --primary: 220 90% 56%; /* New HSL value */
  --primary-foreground: 0 0% 100%;
  
  /* Override border radius */
  --radius: 0.25rem; /* 4px instead of default 8px */
}
```

**Available design tokens:**

- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--destructive`, `--destructive-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--border`, `--input`
- `--outline-border`, `--outline-foreground`
- `--ring`
- `--radius`

All color values use HSL format (e.g., `252 76% 51%`) to support Tailwind's opacity modifiers like `bg-primary/90`.

## Building from Source

If you're developing the package:

```bash
# From repo root
cd /path/to/applique-ui

# Build shadcn-primitives package
TARGET=shadcn-primitives npm run build

# Build all packages
npm run build
```

## Package Structure

```
packages/shadcn-primitives/
├── dist/
│   ├── shadcn-primitives.esm.js   # ES module
│   ├── shadcn-primitives.cjs.js   # CommonJS
│   ├── index.d.ts                 # TypeScript declarations
│   ├── button.d.ts                # Button types
│   ├── utils.d.ts                 # Utility types
│   ├── tokens.css                 # Design tokens (CSS custom properties)
│   └── design.css                 # Pre-compiled Tailwind + tokens
├── src/
│   ├── index.ts                   # Main exports
│   ├── button.tsx                 # ShadcnButton component
│   ├── utils.ts                   # cn() utility
│   ├── tokens.css                 # Design tokens source
│   └── design.css                 # Tailwind source
├── package.json
├── README.md
├── tsconfig.json
├── postcss.config.js
└── tailwind.config.js
```

## Coexistence with Legacy Components

This package is completely standalone and can coexist with existing `@applique-ui` components:

```tsx
// You can use both in the same app
import Button from '@applique-ui/button'  // Old SCSS-based button
import { ShadcnButton } from '@applique-ui/shadcn-primitives'  // New Tailwind-based button

function MyApp() {
  return (
    <div>
      {/* Legacy component */}
      <Button type="primary" color="blue">Old Button</Button>
      
      {/* New shadcn-style component */}
      <ShadcnButton intent="default">New Button</ShadcnButton>
    </div>
  )
}
```

No conflicts because:
- Legacy components use SCSS modules with `aui-*` prefixed classes
- shadcn-primitives uses Tailwind utility classes or pre-compiled CSS

## Testing

To test the package locally before publishing:

```bash
# 1. Build the package
cd /path/to/applique-ui
TARGET=shadcn-primitives npm run build

# 2. In your test app, install via file reference
cd /path/to/your-test-app
pnpm add file:../applique-ui/packages/shadcn-primitives

# 3. Import and use
import { ShadcnButton } from '@applique-ui/shadcn-primitives'
import '@applique-ui/shadcn-primitives/dist/tokens.css'
```

## Next Steps

To add more shadcn-style components:

1. Create new component file (e.g., `src/card.tsx`)
2. Use `cva` for variants and `cn` for className merging
3. Export from `src/index.ts`
4. Update README with usage examples
5. Rebuild with `TARGET=shadcn-primitives npm run build`

Example for adding a Card component:

```tsx
// src/card.tsx
import * as React from 'react'
import { cn } from './utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

export { Card }
```

Then export in `src/index.ts`:

```typescript
export { Card } from './card'
```
