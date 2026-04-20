# shadcn-primitives — AI Agent Skill

This document is the single source of truth for any AI agent (Claude, Cursor,
Copilot, Cody, etc.) working on or with `@rohangore1999/shadcn-primitives`.
Read this first before adding components, modifying tokens, or helping a
consumer integrate the package.

---

## 1. What this package is

A small runtime-agnostic React UI package built on shadcn/ui (new-york style)
primitives, strictly bound to **Applique design tokens**. It wraps Radix UI
components + Tailwind CSS v3 utilities.

- **Package name (npm):** `@rohangore1999/shadcn-primitives`
- **Source location:** `packages/shadcn-primitives/` in the `applique-ui` monorepo
- **Current version:** `0.1.1`
- **Distribution:** ESM + CJS bundles, single prebuilt Tailwind stylesheet
- **Token source of truth:** `packages/shadcn-primitives/docs/Applique.tokens.json`

Components currently exported:

**Batch 1 — Primitives**

| Component | Radix under the hood | Notes |
|---|---|---|
| `Button` | none (native `<button>`) | CVA variants: intent × size |
| `Checkbox` | `@radix-ui/react-checkbox` | CVA variants: default, destructive |
| `Label` | `@radix-ui/react-label` | |
| `Input` | native `<input>` | |
| `Textarea` | native `<textarea>` | |
| `Switch` | `@radix-ui/react-switch` | |
| `RadioGroup` / `RadioGroupItem` | `@radix-ui/react-radio-group` | |
| `Slider` | `@radix-ui/react-slider` | |
| `Spinner` | none | |

**Batch 2 — Layout / surface**

| Component | Radix under the hood | Notes |
|---|---|---|
| `Card` + `CardHeader` / `CardTitle` / `CardDescription` / `CardAction` / `CardContent` / `CardFooter` | none | Composition only |
| `Separator` | `@radix-ui/react-separator` | Horizontal + vertical |
| `Accordion` + `AccordionItem` / `AccordionTrigger` / `AccordionContent` | `@radix-ui/react-accordion` | Chevron + accordion-down/up animations wired in `tailwind.config.js` |
| `Collapsible` + `CollapsibleTrigger` / `CollapsibleContent` | `@radix-ui/react-collapsible` | |
| `Tabs` + `TabsList` / `TabsTrigger` / `TabsContent` | `@radix-ui/react-tabs` | |
| `ScrollArea` + `ScrollBar` | `@radix-ui/react-scroll-area` | |
| `AspectRatio` | `@radix-ui/react-aspect-ratio` | |

**Batch 3 — Overlays**

| Component | Radix / lib | Notes |
|---|---|---|
| `Popover` + `PopoverTrigger` / `PopoverAnchor` / `PopoverContent` | `@radix-ui/react-popover` | Portalled, fade+zoom animation |
| `Tooltip` + `TooltipProvider` / `TooltipTrigger` / `TooltipContent` | `@radix-ui/react-tooltip` | Must be wrapped in `TooltipProvider` |
| `HoverCard` + `HoverCardTrigger` / `HoverCardContent` | `@radix-ui/react-hover-card` | |
| `Dialog` + `DialogTrigger` / `DialogContent` / `DialogHeader` / `DialogFooter` / `DialogTitle` / `DialogDescription` / `DialogClose` / `DialogOverlay` / `DialogPortal` | `@radix-ui/react-dialog` | Modal with backdrop + X close button |
| `AlertDialog` + 10 sub-parts (Action, Cancel, …) | `@radix-ui/react-alert-dialog` | Action/Cancel use `buttonVariants` |
| `Sheet` + 9 sub-parts | `@radix-ui/react-dialog` | `side: 'top' \| 'right' \| 'bottom' \| 'left'` (default right) |
| `DropdownMenu` + 14 sub-parts (Item, CheckboxItem, RadioItem, Label, Separator, Shortcut, Sub*) | `@radix-ui/react-dropdown-menu` | Full menu + submenu support |
| `ContextMenu` + 14 sub-parts | `@radix-ui/react-context-menu` | Right-click menu |
| `Menubar` + 15 sub-parts | `@radix-ui/react-menubar` | Horizontal app menus |
| `Command` + `CommandDialog` / `CommandInput` / `CommandList` / `CommandEmpty` / `CommandGroup` / `CommandItem` / `CommandSeparator` / `CommandShortcut` | `cmdk` (not Radix) | Command palette; `CommandDialog` wraps it in a `Dialog` |

### Notes for Batch 3
- Animations (`animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`) come from the **`tailwindcss-animate`** plugin wired in `tailwind.config.js`. Do not remove the plugin.
- All overlay content portals to `document.body`. The scoped preflight uses `data-slot`, and the `:where([data-slot], [data-slot] *)` rule handles descendants — so portalled content still gets the reset.
- `Tooltip` needs a `<TooltipProvider>` ancestor. In apps with many tooltips, render one provider at the app root.
- `Command` is from **`cmdk`**, not Radix. It exposes `[cmdk-*]` attribute hooks instead of `data-state`.

**Batch 4 — Data entry**

| Component | Library | Notes |
|---|---|---|
| `Select` + `SelectTrigger` / `SelectValue` / `SelectContent` / `SelectGroup` / `SelectLabel` / `SelectItem` / `SelectSeparator` / `SelectScrollUpButton` / `SelectScrollDownButton` | `@radix-ui/react-select` | Native-like dropdown with groups, scroll buttons |
| `Calendar` | `react-day-picker` v8 | All day-picker `classNames` overridden with tokens — no upstream CSS needed |
| `InputOTP` + `InputOTPGroup` / `InputOTPSlot` / `InputOTPSeparator` | `input-otp` | Uses `animate-caret-blink` keyframe defined in `tailwind.config.js` |
| `Form` + `FormField` / `FormItem` / `FormLabel` / `FormControl` / `FormDescription` / `FormMessage` + `useFormField` | `react-hook-form` | Thin adapter over RHF; `Form = FormProvider`; `FormField` wraps RHF `Controller` |

### Notes for Batch 4
- **Composition patterns (no separate component):**
  - **Combobox** = `Popover` + `Command` (see shadcn docs).
  - **DatePicker** = `Popover` + `Calendar` (see shadcn docs).
- `Calendar` uses `react-day-picker@^8`. Do NOT upgrade to v9 without re-writing the `classNames` map — the API changed significantly.
- `InputOTP` relies on `animate-caret-blink` keyframe. Removing the keyframe breaks the blinking cursor in OTP slots.
- `Form` components must live inside a `<Form>` (= RHF `FormProvider`). `useFormField` throws if called outside a `<FormField>` context.

**Batch 5 — Feedback / display**

| Component | Library | Notes |
|---|---|---|
| `Alert` + `AlertTitle` / `AlertDescription` | none | Variants: `default`, `destructive` |
| `Badge` | none | Variants: `default`, `secondary`, `destructive`, `outline` |
| `Avatar` + `AvatarImage` / `AvatarFallback` | `@radix-ui/react-avatar` | |
| `Skeleton` | none | `animate-pulse` on `bg-accent` |
| `Progress` | `@radix-ui/react-progress` | Controlled via `value` (0–100) |
| `Toaster` + `toast` | `sonner` | Mount `<Toaster />` once at app root; call `toast('msg')` imperatively |
| `Toggle` | `@radix-ui/react-toggle` | Variants: `default`, `outline`; sizes: `sm`, `md`, `lg` |
| `ToggleGroup` + `ToggleGroupItem` | `@radix-ui/react-toggle-group` | Inherits variant/size from group via context |
| `Breadcrumb` + `BreadcrumbList` / `BreadcrumbItem` / `BreadcrumbLink` / `BreadcrumbPage` / `BreadcrumbSeparator` / `BreadcrumbEllipsis` | none | Pure nav/ol/li markup |
| `Pagination` + `PaginationContent` / `PaginationItem` / `PaginationLink` / `PaginationPrevious` / `PaginationNext` / `PaginationEllipsis` | none | Styled via `buttonVariants` |

### Notes for Batch 5
- `Toaster` renders as a portal from `sonner`. Import it once at your app root (after `Providers`). All `toast(...)` calls route to the mounted toaster.
- `Badge` renders as `<span>` by default. Use `asChild` to wrap an `<a>` if needed.
- `Pagination` uses `<a>` with `buttonVariants` — swap for a router `<Link>` in apps with client-side routing.

**Batch 6 — Nav / advanced**

| Component | Library | Notes |
|---|---|---|
| `NavigationMenu` + List / Item / Trigger / Content / Link / Indicator / Viewport + `navigationMenuTriggerStyle` | `@radix-ui/react-navigation-menu` | Complex menu with nested content panels |
| `Table` + Header / Body / Footer / Row / Head / Cell / Caption | none | Styled wrappers over `<table>` markup |
| `DataTable` | `@tanstack/react-table` | Generic: `{ columns, data, filterColumn?, filterPlaceholder?, pageSize?, hidePagination? }`. Client-side sorting + filtering + pagination. Renders via `Table` primitives |
| `Carousel` + Content / Item / Previous / Next | `embla-carousel-react` | Keyboard-navigable (←/→), supports `orientation` + `opts`/`plugins` |
| `ResizablePanelGroup` / `ResizablePanel` / `ResizableHandle` | `react-resizable-panels` | Pass `withHandle` to render the grip icon |
| `Drawer` + 9 sub-parts | `vaul` | Bottom-sheet with drag-to-dismiss. Distinct from `Sheet` (side drawer) |
| `Sidebar` + 22 sub-parts + `useSidebar` + `SidebarProvider` | none (internal context + Sheet on mobile) | Full app-shell with collapsible/icon/offcanvas modes; keyboard shortcut `Cmd/Ctrl+B`; persists state in `sidebar:state` cookie |
| `ChartContainer` + `ChartTooltip` / `ChartTooltipContent` / `ChartLegend` / `ChartLegendContent` / `ChartStyle` | `recharts` | Thin wrappers with theme-aware CSS-var colors via `config` |

### Notes for Batch 6
- `NavigationMenu` must render its `<Viewport>` — already handled internally; callers don't need to wire it.
- `Sidebar` is deliberately heavy (~500 lines). Wrap the **whole app** in `<SidebarProvider>`, place `<Sidebar>` + `<SidebarInset>` as siblings, and put main content inside `SidebarInset`. Keyboard shortcut `Cmd/Ctrl+B` toggles it.
- `Carousel` requires consumer to pass `width` (or have constrained parent) because `embla` needs a sized container. Previous/Next buttons are positioned absolutely at `-left-12`/`-right-12`, so parent needs horizontal padding or overflow-visible.
- `Chart` component color config uses CSS variables injected via `<style>` per-chart-id. Access colors in `recharts` props as `stroke="var(--color-visitors)"` (for a config key named `visitors`).
- `Drawer` (vaul) is portalled to `body`. Unlike the Radix-based overlays, it uses **transform-based** gestures and has its own animation system — don't try to add `tailwindcss-animate` classes.
- `DataTable` is a thin convenience wrapper. For advanced use (column visibility toggles, row selection, server-side data), compose directly with `useReactTable` + our `Table` primitives instead — the primitives are what shadcn normally ships.

Also exported: `cn` (class merge), `buttonVariants`, `checkboxVariants`,
`labelVariants`, and TypeScript types (`ButtonProps`, `CheckboxProps`, etc.).

---

## 2. Non-negotiable constraints (read before editing)

These are the rules that keep the package behaving correctly in consumer apps
that have their own styling. Violating any of these will break things that
already work.

### 2.1 Tailwind `preflight` is disabled
`corePlugins.preflight: false` in `tailwind.config.js`. We do **not** ship a
global CSS reset because consumers have their own base styles. This means
native elements (`<button>`, `<input>`, `<textarea>`, `<select>`) keep browser
defaults — system fonts, 3D outset button borders, default 1px/6px button
padding, etc.

### 2.2 Scoped preflight via `data-slot` (the workaround for 2.1)
In `src/design.css` there is a narrow reset block that targets **only** elements
tagged with `data-slot`. Every new component that renders a native element
**must** set `data-slot="<kebab-name>"` on it, otherwise the browser defaults
leak through.

```css
button[data-slot],
input[data-slot],
textarea[data-slot],
select[data-slot] {
  appearance: none;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0 solid;
  background: transparent;
  font: inherit;
  color: inherit;
  /* ... */
}
```

**Rule for new components:** on the outermost rendered native element, set
`data-slot="<component-kebab-case>"`. shadcn's new-york sources already do
this — keep it.

### 2.3 All sizes in **px**, never **rem**
`tokens.css` radii and `tailwind.config.js` spacing/fontSize scales are
px-based. Why: consumer apps may have `html { font-size: 62.5% }` (a legacy
PSG-theme convention that makes `1rem = 10px`), which would shrink every
rem-based utility in our prebuilt stylesheet.

**Rule:** when adding tokens or utilities, write `12px` not `0.75rem`.

### 2.4 Tokens only — no raw hex/rgb/px-radius in components
All colors reference CSS variables via Tailwind's semantic utilities:
`bg-primary`, `text-foreground`, `border-input`, `ring-ring`, etc. All radii:
`rounded-sm`, `rounded-md`, `rounded-full` etc. No ad-hoc values.

If a needed token is missing, add it to `src/tokens.css` first (checking
`docs/Applique.tokens.json` for the Figma-sourced value), wire it into
`tailwind.config.js`, then use it.

### 2.5 Light-mode only (for now)
`.dark` class variants have been intentionally stripped. Do not add `dark:`
utilities. If dark mode is needed later, we'll plan it as a separate phase.

### 2.6 CSS auto-imports with the package
`dist/shadcn-primitives.esm.js` and `.cjs.js` prepend `import './styles.css'`
(done by `scripts/inject-css-import.js`). Consumers do **not** need to
manually `import '@rohangore1999/shadcn-primitives/styles.css'`. This is set
up via the `build:inject-css` npm script — must be run after every JS rebuild.

---

## 3. Build pipeline

```
src/*.tsx, src/*.ts              ← source
src/tokens.css                   ← design tokens (CSS variables)
src/design.css                   ← @import tokens.css; @tailwind base/components/utilities
tailwind.config.js               ← maps vars → Tailwind utilities

    │ rollup (TARGET=shadcn-primitives)      │ tailwindcss CLI
    ▼                                         ▼
dist/shadcn-primitives.esm.js              dist/styles.css
dist/shadcn-primitives.cjs.js

    │ scripts/inject-css-import.js  (prepends `import './styles.css'`)
    ▼
dist/shadcn-primitives.esm.js (with CSS auto-import)
dist/shadcn-primitives.cjs.js (with CSS auto-import)
```

### Commands (run from repo root unless noted)

```bash
# Rebuild JS bundle (ESM + CJS + .d.ts)
# NOTE: package name is a POSITIONAL arg, not TARGET=... env
FORCE=1 node scripts/build.js shadcn-primitives

# Rebuild CSS bundle (from packages/shadcn-primitives/)
npm run build:css

# Prepend CSS import to dist bundles (from packages/shadcn-primitives/)
npm run build:inject-css

# Shortcut: CSS + inject (from packages/shadcn-primitives/)
npm run build:post
```

**Always run all three** after edits. The `FORCE=1` env wipes `dist/` to avoid
stale artifacts.

### Publishing to npm

Publishes to `@rohangore1999` scope on **public npm** (`registry.npmjs.org`).
Requires that `npm whoami --registry=https://registry.npmjs.org/` returns
`rohangore1999` (or a user with publish access to that scope).

```bash
# 1. bump the version in packages/shadcn-primitives/package.json
#    (semver: minor for new components, patch for fixes — we're in 0.x so
#    minor bumps may include breaking changes)

# 2. wipe dist and rebuild JS for shadcn-primitives only
cd <applique-ui-root>
rm -rf packages/shadcn-primitives/dist/
FORCE=1 node scripts/build.js shadcn-primitives

# 3. build CSS + inject side-effect import into the JS bundles
cd packages/shadcn-primitives
npm run build:post

# 4. verify dist has all three shipped artifacts
ls dist/ | grep -E "esm\.js$|cjs\.js$|styles\.css$"
# expected: shadcn-primitives.cjs.js, shadcn-primitives.esm.js, styles.css
head -1 dist/shadcn-primitives.esm.js
# expected: import './styles.css';

# 5. dry-run to review what will be packed
npm publish --access public --registry https://registry.npmjs.org/ --dry-run

# 6. publish for real
npm publish --access public --registry https://registry.npmjs.org/
```

**Why each step matters:**
- Step 2 alone ships a package **without `styles.css`** — consumers get no visual output.
- Step 3 alone ships a package that **requires manual CSS import** — breaks the "one import" contract documented in CONSUMER_SETUP.md §3.
- Skipping step 5 risks shipping stale dist or unintended files. Always dry-run.

**After a successful publish:**
- Commit the `version:` bump in `package.json`.
- Tag the release in git: `git tag shadcn-primitives-v0.X.Y && git push --tags`.
- Optionally verify on the registry: `npm view @rohangore1999/shadcn-primitives@0.X.Y`.

---

## 4. How to add a new component (checklist for agents)

1. **Copy** the shadcn/ui new-york source for the component from
   https://ui.shadcn.com/docs/components/&lt;name&gt; into `src/<name>.tsx`.
2. **Strip** all `dark:` utility classes (§2.5).
3. **Set `data-slot="<name>"`** on the outermost rendered native element (§2.2).
4. **Audit** every className for:
   - `rem`-based values → convert to px tokens.
   - Raw hex / rgb / oklch → replace with `bg-*`, `text-*`, `border-*` token utilities.
   - Missing tokens → add to `src/tokens.css` + `tailwind.config.js` first.
5. **Export** from `src/index.ts` (both the component and its types).
6. **Add Radix dep** (if any) to `packages/shadcn-primitives/package.json`
   under `dependencies`, then run `pnpm install` at repo root.
7. **Rebuild** per §3.
8. **Verify** in the consumer app.

### What "default shadcn interactions" means
Preserve these behaviors untouched:
- `focus-visible:ring-ring/50 focus-visible:ring-[3px]` focus outline
- `disabled:pointer-events-none disabled:opacity-50`
- `data-[state=*]:...` state transitions (checked/unchecked, open/closed, etc.)
- `aria-invalid:border-destructive aria-invalid:ring-destructive/20`
- `transition-all` or `transition-[color,box-shadow]` where shadcn has them
- Radix composition patterns (Root + Indicator + Thumb, etc.)

---

## 5. How to add/modify a design token

1. Find the token in `docs/Applique.tokens.json`. Colors use `$value.hex`;
   convert to `H S% L%` format for CSS variables (tokens.css uses HSL channel
   format so Tailwind can apply opacity modifiers like `bg-primary/80`).
2. Add to `src/tokens.css` under `:root`.
3. Wire into `tailwind.config.js` (`theme.extend.colors` / `borderRadius` /
   `boxShadow` / `fontWeight` / `fontFamily`). Colors use
   `hsl(var(--x) / <alpha-value>)`.
4. Rebuild (§3).

### Already-wired tokens (don't re-add)

**Colors:** background, foreground, card, card-foreground, popover,
popover-foreground, primary, primary-foreground, secondary, secondary-foreground,
muted, muted-foreground, accent, accent-foreground, destructive,
destructive-foreground, border, input, ring, outline-border, outline-foreground,
sidebar (+ -foreground, -primary, -primary-foreground, -accent, -accent-foreground,
-border, -ring), chart-1..5.

**Radii:** xxs (2px), xs (4px), sm (6px), md / default (8px), lg (10px),
xl (14px), 2xl (18px), 3xl (22px), 4xl (26px).

**Shadows:** 2xs, xs, sm, md, lg, xl, 2xl.

**Font-weight:** thin (100) through black (900).

**Font-family:** sans (Hanken Grotesk), serif (Georgia), mono (Geist Mono).

---

## 6. Common pitfalls (stuff that has already bitten us)

| Symptom | Root cause | Fix |
|---|---|---|
| Button has 3D outset border, system font, wrong padding | preflight off + missing `data-slot` | set `data-slot` on the element; never remove `data-slot` from shadcn sources |
| Button padding is 6px wide when config says 10px | Consumer Tailwind has conflicting `rounded-sm`/`text-sm` overrides | consumer must not override our utilities — remove their conflicting `borderRadius`/`fontSize` extensions |
| Radii render as fractions of their spec (e.g. 4px instead of 8px) | Consumer has `html { font-size: 62.5% }`; our package used rem | all our tokens are px (§2.3). Keep it that way |
| Switch thumb sits outside the track | Preflight off → browser's default `<button>` padding | `data-slot` on the Root (the scoped preflight handles it) |
| Consumer app is missing styles | Consumer bundler didn't pick up side-effect CSS import | verify `scripts/inject-css-import.js` ran and dist bundles start with `import './styles.css'` |
| New Tailwind utility class produces no CSS | Forgot to wire the token in `tailwind.config.js` | tokens.css alone is raw ingredients; config maps them to utilities |

---

## 7. File map

```
packages/shadcn-primitives/
├── package.json                        ← version, deps, build scripts
├── tailwind.config.js                  ← preflight: false; token-wired utilities
├── src/
│   ├── index.ts                        ← public exports
│   ├── tokens.css                      ← CSS variables from Applique.tokens.json
│   ├── design.css                      ← tokens.css + @tailwind + scoped preflight
│   ├── utils.ts                        ← cn (clsx + twMerge)
│   ├── button.tsx
│   ├── checkbox.tsx
│   ├── label.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── switch.tsx
│   ├── radio-group.tsx
│   ├── slider.tsx
│   └── spinner.tsx
├── docs/
│   ├── Applique.tokens.json            ← Figma-exported tokens (source of truth)
│   ├── *.mdx                           ← component docs
│   └── *Showcase.tsx
├── scripts/
│   └── inject-css-import.js            ← post-build CSS auto-import
└── dist/                               ← build output (gitignored, shipped to npm)
```

---

## 8. When user says "add X component"

Follow §4 checklist. Never skip:
- `data-slot` attribute (breaks everything)
- Stripping `dark:` variants
- Adding new tokens to `tokens.css` + `tailwind.config.js` before using them
- Rebuild all three (JS + CSS + inject)

---

## 9. See also

- [CONSUMER_SETUP.md](./CONSUMER_SETUP.md) — how a downstream app installs and uses this package
- `docs/Applique.tokens.json` — canonical token definitions
- shadcn/ui source: https://ui.shadcn.com/docs/components (new-york style)
