# Consumer Setup — `@rohangore1999/shadcn-primitives`

This is the agent-facing guide for integrating the shadcn-primitives package
into a downstream React app. Any AI agent assisting a consumer should follow
this document verbatim.

---

## 1. Required packages & versions

### Package to install
```
@rohangore1999/shadcn-primitives@^0.1.1
```

### Peer dependencies (consumer must have)
| Package | Version |
|---|---|
| `react` | `^18.0.0` |
| `react-dom` | `^18.0.0` |

### Transitive dependencies (auto-installed — do NOT install manually)
These come with the package; they are listed only so agents know what ends
up in `node_modules`:

| Package | Version |
|---|---|
| `@radix-ui/react-accordion` | `^1.2.0` |
| `@radix-ui/react-alert-dialog` | `^1.1.0` |
| `@radix-ui/react-aspect-ratio` | `^1.1.0` |
| `@radix-ui/react-avatar` | `^1.1.0` |
| `@radix-ui/react-checkbox` | `^1.1.0` |
| `@radix-ui/react-collapsible` | `^1.1.0` |
| `@radix-ui/react-context-menu` | `^2.2.0` |
| `@radix-ui/react-dialog` | `^1.1.0` |
| `@radix-ui/react-dropdown-menu` | `^2.1.0` |
| `@radix-ui/react-hover-card` | `^1.1.0` |
| `@radix-ui/react-label` | `^2.1.0` |
| `@radix-ui/react-menubar` | `^1.1.0` |
| `@radix-ui/react-navigation-menu` | `^1.2.0` |
| `@radix-ui/react-popover` | `^1.1.0` |
| `@radix-ui/react-progress` | `^1.1.0` |
| `@radix-ui/react-radio-group` | `^1.2.0` |
| `@radix-ui/react-scroll-area` | `^1.2.0` |
| `@radix-ui/react-select` | `^2.1.0` |
| `@radix-ui/react-separator` | `^1.1.0` |
| `@radix-ui/react-slider` | `^1.2.0` |
| `@radix-ui/react-slot` | `^1.1.0` |
| `@radix-ui/react-switch` | `^1.1.0` |
| `@radix-ui/react-tabs` | `^1.1.0` |
| `@radix-ui/react-toggle` | `^1.1.0` |
| `@radix-ui/react-toggle-group` | `^1.1.0` |
| `@radix-ui/react-tooltip` | `^1.1.0` |
| `@tanstack/react-table` | `^8.20.0` |
| `class-variance-authority` | `^0.7.1` |
| `clsx` | `^2.1.1` |
| `cmdk` | `^1.0.0` |
| `date-fns` | `^3.0.0` |
| `embla-carousel-react` | `^8.3.0` |
| `input-otp` | `^1.4.0` |
| `lucide-react` | `^0.460.0` |
| `react-day-picker` | `^8.10.0` |
| `react-hook-form` | `^7.53.0` |
| `react-resizable-panels` | `^2.1.0` |
| `recharts` | `^2.13.0` |
| `sonner` | `^1.7.0` |
| `tailwind-merge` | `^2.6.1` |
| `tailwindcss-animate` | `^1.0.7` |
| `vaul` | `^1.1.0` |

### Install command (npm / yarn / pnpm)
```bash
npm install @rohangore1999/shadcn-primitives
# or
yarn add @rohangore1999/shadcn-primitives
# or
pnpm add @rohangore1999/shadcn-primitives
```

---

## 2. Consumer bundler requirements

Required to resolve the **side-effect CSS import** from node_modules:

- **Webpack:** needs `css-loader` + `style-loader` (or `mini-css-extract-plugin`)
  configured for `.css` files from `node_modules`. Default Create React App,
  Next.js, and most boilerplates already support this.
- **Vite / Rspack / Parcel / Turbopack:** work out of the box.
- **Rollup:** needs `@rollup/plugin-css-only` or `rollup-plugin-postcss`.

If the consumer's bundler is configured to ignore CSS imports from
`node_modules`, the auto-import will silently fail and styles will be missing.
In that case, manually add:
```js
import '@rohangore1999/shadcn-primitives/styles.css'
```
once at the app root (as a fallback).

---

## 3. Minimal usage

```jsx
import { Button, Input, Label } from '@rohangore1999/shadcn-primitives'

function SignInForm() {
  return (
    <form>
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
      <Button intent="default">Sign in</Button>
    </form>
  )
}
```

**No CSS import is required** — styles are bundled via a side-effect import
in the package itself. If the bundler strips side-effect imports, see §2.

---

## 4. Available components

All exports from the package:

```ts
import {
  // Primitives
  Button,
  Checkbox,
  Label,
  Input,
  Textarea,
  Switch,
  RadioGroup,
  RadioGroupItem,
  Slider,
  Spinner,

  // Layout / surface
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  Separator,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ScrollArea,
  ScrollBar,
  AspectRatio,

  // CVA variant builders (for extension)
  buttonVariants,
  checkboxVariants,
  labelVariants,

  // classname helper
  cn,
} from '@rohangore1999/shadcn-primitives'

// types
import type {
  ButtonProps,
  CheckboxProps,
  LabelProps,
  InputProps,
  TextareaProps,
  SwitchProps,
} from '@rohangore1999/shadcn-primitives'
```

### Component prop quick reference

**Button** — `intent: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'`, `size: 'sm' | 'md' | 'lg' | 'icon'` (defaults `default`/`md`).
**Checkbox** — `variant: 'default' | 'destructive'`. Controlled via `checked` + `onCheckedChange`.
**Switch** — controlled via `checked` + `onCheckedChange`.
**RadioGroup** — wraps `RadioGroupItem`s; controlled via `value` + `onValueChange`.
**Slider** — controlled via `value: number[]` + `onValueChange`; `min`, `max`, `step`.
**Input / Textarea / Label** — native HTML props passthrough.

All components forward refs.

---

## 5. Common integration pitfalls (agents MUST check for these)

### 5.1 Consumer's Tailwind overrides our utilities
If the consumer project **also** uses Tailwind and extends `borderRadius`
or `fontSize` with different values, the consumer's compiled utilities
**collide** with our prebuilt ones (same class name, different value).

**Symptom:** a component renders with wrong radii or font sizes only in the
consumer app, correctly in the shadcn-primitives showcase.

**Fix:** audit the consumer's `tailwind.config.js`. Either
(a) remove their conflicting extensions for class names we use, or
(b) scope the consumer's Tailwind to their own source files and not extend
utilities we ship.

### 5.2 Consumer's `html { font-size: 62.5% }` legacy convention
Some legacy consumers (e.g., apps using the `psg-theme-default` stylesheet)
set `html.psg-theme { font-size: 62.5% }` to make `1rem = 10px`.

Our package ships **pure px** utilities, so it is immune to this. If a
consumer reports "sizes look half of what they should be," the issue is on
their side — they have a rem-based stylesheet that's being downscaled.

### 5.3 Missing styles entirely
If no styles apply at all:
1. Check the bundler is picking up CSS from `node_modules` (§2).
2. Manually add `import '@rohangore1999/shadcn-primitives/styles.css'` at app root as a fallback.
3. Verify the installed package's `dist/shadcn-primitives.esm.js` starts with `import './styles.css';`.

### 5.4 Consumer expects to override a color
Do **not** edit the package's `dist/styles.css`. Instead, override CSS
variables at the root of the consumer app:

```css
:root {
  --primary: 262 83% 58%;           /* consumer's own primary */
  --primary-foreground: 0 0% 100%;
}
```

All shadcn-primitives components pick up the override because they reference
the CSS variables, not the hex values.

---

## 6. Dev loop when the package is linked (not from npm)

If the consumer has `yarn link` / `pnpm link` to the local monorepo
(`packages/shadcn-primitives/`), changes in source require rebuild:

```bash
# inside applique-ui root
FORCE=1 TARGET=shadcn-primitives node scripts/build.js

# inside packages/shadcn-primitives/
npm run build:post    # rebuilds CSS + re-injects import into dist
```

Consumer picks up changes on next dev-server reload (no reinstall needed
since it's a symlink).

---

## 7. Upgrading

Check the package's `CHANGELOG.md` (if present) before upgrading. Breaking
changes will be documented. For pre-1.0 versions (`0.x.x`), **minor bumps
may include breaking changes**.

---

## 8. Opinionated do/don't for agents assisting consumers

**Do:**
- Import only from `@rohangore1999/shadcn-primitives` top level.
- Use the shipped CSS variables for theming overrides.
- Trust the default variants — they match Applique design.

**Don't:**
- Don't patch `node_modules/@rohangore1999/shadcn-primitives/dist/styles.css`.
- Don't import internal paths like `.../dist/button.js` — only top-level imports are stable.
- Don't wrap components in extra `<button>`/`<input>` — pass props directly.
- Don't add `dark:` classes to components rendered in consumer JSX expecting them to work; the package is light-only for now.
