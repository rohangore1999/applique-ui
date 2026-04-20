# Consumer Setup — `@rohangore1999/shadcn-primitives`

This is the agent-facing guide for integrating the shadcn-primitives package
into a downstream React app. Any AI agent assisting a consumer should follow
this document verbatim.

---

## 1. Required packages & versions

### Package to install
```
@rohangore1999/shadcn-primitives@^0.2.0
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

All **49 shadcn/ui components** are shipped. See
[COMPONENT_COVERAGE.md](./COMPONENT_COVERAGE.md) for the file-by-file map.

### Exports (grouped by category)

```ts
import {
  // ── Primitives ────────────────────────────────────────────
  Button,
  Checkbox,
  Label,
  Input,
  Textarea,
  Switch,
  RadioGroup, RadioGroupItem,
  Slider,
  Spinner,

  // ── Layout / surface ──────────────────────────────────────
  Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter,
  Separator,
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
  ScrollArea, ScrollBar,
  AspectRatio,

  // ── Overlays ──────────────────────────────────────────────
  Popover, PopoverTrigger, PopoverAnchor, PopoverContent,
  Tooltip, TooltipProvider, TooltipTrigger, TooltipContent,
  HoverCard, HoverCardTrigger, HoverCardContent,
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription, DialogClose, DialogOverlay, DialogPortal,
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel, AlertDialogOverlay, AlertDialogPortal,
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter,
  SheetTitle, SheetDescription, SheetClose, SheetOverlay, SheetPortal,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup,
  DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuRadioGroup,
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel,
  ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup,
  ContextMenuPortal, ContextMenuSub, ContextMenuSubContent,
  ContextMenuSubTrigger, ContextMenuRadioGroup,
  Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem,
  MenubarSeparator, MenubarLabel, MenubarCheckboxItem, MenubarRadioGroup,
  MenubarRadioItem, MenubarPortal, MenubarSubContent, MenubarSubTrigger,
  MenubarGroup, MenubarSub, MenubarShortcut,
  Command, CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandShortcut, CommandSeparator,

  // ── Data entry ────────────────────────────────────────────
  Select, SelectGroup, SelectValue, SelectTrigger, SelectContent,
  SelectLabel, SelectItem, SelectSeparator,
  SelectScrollUpButton, SelectScrollDownButton,
  Calendar,
  InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator,
  Form, FormField, FormItem, FormLabel, FormControl,
  FormDescription, FormMessage, useFormField,

  // ── Feedback / display ────────────────────────────────────
  Alert, AlertTitle, AlertDescription,
  Badge,
  Avatar, AvatarImage, AvatarFallback,
  Skeleton,
  Progress,
  Toaster, toast,
  Toggle,
  ToggleGroup, ToggleGroupItem,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis,
  Pagination, PaginationContent, PaginationLink, PaginationItem,
  PaginationPrevious, PaginationNext, PaginationEllipsis,

  // ── Nav / advanced ────────────────────────────────────────
  navigationMenuTriggerStyle,
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink,
  NavigationMenuIndicator, NavigationMenuViewport,
  Table, TableHeader, TableBody, TableFooter, TableHead,
  TableRow, TableCell, TableCaption,
  DataTable,
  Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext,
  ResizablePanelGroup, ResizablePanel, ResizableHandle,
  Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose,
  DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription,
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu,
  SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar,
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent, ChartStyle,

  // ── CVA variant builders (for extension) ──────────────────
  buttonVariants, checkboxVariants, labelVariants, badgeVariants,
  alertVariants, toggleVariants,

  // ── classname helper ──────────────────────────────────────
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
  BadgeProps,
  CalendarProps,
  CarouselApi,
  ChartConfig,
  DataTableProps,
} from '@rohangore1999/shadcn-primitives'
```

### Component prop quick reference

**Primitives**
- **Button** — `intent: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'`, `size: 'sm' | 'md' | 'lg' | 'icon'` (defaults `default`/`md`). Use `asChild` with Radix Slot to compose.
- **Checkbox** — `variant: 'default' | 'destructive'`. Controlled via `checked` + `onCheckedChange`.
- **Switch** — controlled via `checked` + `onCheckedChange`.
- **RadioGroup** — wraps `RadioGroupItem`s; controlled via `value` + `onValueChange`.
- **Slider** — controlled via `value: number[]` + `onValueChange`; `min`, `max`, `step`.
- **Input / Textarea / Label** — native HTML props passthrough. `Textarea` supports `field-sizing: content` for auto-grow.

**Overlays**
- **Tooltip** — **must be wrapped in `<TooltipProvider>`** (one at app root is enough).
- **Dialog / AlertDialog / Sheet** — `open` + `onOpenChange` for controlled. `Sheet` accepts `side: 'top' | 'right' | 'bottom' | 'left'` (default `right`).
- **DropdownMenu / ContextMenu / Menubar** — Items can be `DropdownMenuItem`, `DropdownMenuCheckboxItem` (with `checked` + `onCheckedChange`), `DropdownMenuRadioItem`, `DropdownMenuSub` for nested menus.
- **Command** — `cmdk`-based palette. Wrap in `CommandDialog` to make it a modal palette.

**Data entry**
- **Select** — `<Select value onValueChange>` + `<SelectTrigger><SelectValue placeholder /></SelectTrigger>` + `<SelectContent><SelectItem value>...</SelectItem></SelectContent>`.
- **Calendar** — react-day-picker v8 props: `mode: 'single' | 'multiple' | 'range'`, `selected`, `onSelect`, `disabled`.
- **InputOTP** — `maxLength`, controlled `value` + `onChange(v: string)`. Render `InputOTPSlot`s with `index` prop.
- **Form** — thin adapter over `react-hook-form`. Wrap with `<Form {...rhfForm}>` (= `FormProvider`), use `<FormField control name render={({ field }) => <FormItem><FormLabel/><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>}/>`.

**Feedback / display**
- **Alert** — `variant: 'default' | 'destructive'`. Place an icon (from `lucide-react`) as first child for auto-layout.
- **Badge** — `variant: 'default' | 'secondary' | 'destructive' | 'outline'`.
- **Avatar** — composition: `<Avatar><AvatarImage src/><AvatarFallback>CN</AvatarFallback></Avatar>`.
- **Progress** — `value: 0..100`.
- **Toaster / toast** — mount `<Toaster />` **once** at app root. Call `toast('msg', { description, action, duration })` imperatively from anywhere.
- **Toggle** — `pressed` + `onPressedChange`. Variants: `default`, `outline`. Sizes: `sm`, `md` (default), `lg`.
- **ToggleGroup** — `type: 'single' | 'multiple'`, controlled via `value` + `onValueChange`. Share variant/size through `ToggleGroupContext`.
- **Pagination** — purely presentational (renders `<a>` tags). Wire the active page + navigation yourself.

**Nav / advanced**
- **NavigationMenu** — Radix-based. `NavigationMenuTrigger` pairs with `NavigationMenuContent` panels; Viewport is rendered internally.
- **Table** — styled wrappers over HTML `<table>`. Compose directly for custom layouts.
- **DataTable** — `{ columns, data, filterColumn?, filterPlaceholder?, pageSize?, hidePagination? }`. Uses `@tanstack/react-table` internally. Supports row selection via `row.getIsSelected()` / `row.toggleSelected()` inside column `cell` renderers.
- **Carousel** — `<Carousel opts orientation="horizontal"><CarouselContent><CarouselItem>…</CarouselItem></CarouselContent><CarouselPrevious/><CarouselNext/></Carousel>`. Arrow keys wired. Parent needs horizontal padding (prev/next are absolutely positioned at `-left-12`/`-right-12`).
- **Resizable** — `ResizablePanelGroup direction="horizontal"|"vertical"` + `ResizablePanel defaultSize` + `ResizableHandle withHandle`. Can nest.
- **Drawer** — bottom sheet via `vaul`. Distinct from `Sheet` (side drawer). Built-in drag-to-dismiss.
- **Sidebar** — wrap **whole app** in `<SidebarProvider>`. Place `<Sidebar>` + `<SidebarInset>` as siblings; main content inside `SidebarInset`. Cmd/Ctrl+B toggles. State persists in `sidebar:state` cookie.
- **Chart** — `<ChartContainer config={{ foo: { label, color: 'hsl(var(--chart-1))' } }}>…recharts children…</ChartContainer>`. Reference colors in recharts as `stroke="var(--color-foo)"`.

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
# inside applique-ui root — positional arg, NOT TARGET= env
FORCE=1 node scripts/build.js shadcn-primitives

# inside packages/shadcn-primitives/
npm run build:post    # rebuilds CSS + re-injects import into dist
```

Consumer picks up changes on next dev-server reload (no reinstall needed
since it's a symlink).

### Switching from a symlink to the published version

When you've been developing against a symlink and want to switch the
consumer to the npm-registry version (e.g., after a publish):

```bash
cd <consumer-app>

# 1. tear down the symlink
npm unlink @rohangore1999/shadcn-primitives
#   or: yarn unlink @rohangore1999/shadcn-primitives

# 2. pin the registry version in package.json
#    (edit manually: "@rohangore1999/shadcn-primitives": "^0.2.0")

# 3. install from the registry
npm install
#   or: yarn install / pnpm install

# 4. verify it's a real directory, not a symlink
ls -la node_modules/@rohangore1999/shadcn-primitives
#    (should NOT show an arrow →; should show a regular directory)

cat node_modules/@rohangore1999/shadcn-primitives/package.json | grep version
#    should print the installed version

head -1 node_modules/@rohangore1999/shadcn-primitives/dist/shadcn-primitives.esm.js
#    should print: import './styles.css';

# 5. restart the dev server
```

---

## 7. Upgrading

For pre-1.0 versions (`0.x.x`), **minor bumps may include breaking
changes**. Check the package's release notes on
[npm](https://www.npmjs.com/package/@rohangore1999/shadcn-primitives)
or the repo's `CHANGELOG.md` (if present) before upgrading.

```bash
# check the installed vs latest version
npm ls @rohangore1999/shadcn-primitives
npm view @rohangore1999/shadcn-primitives version

# upgrade
npm install @rohangore1999/shadcn-primitives@latest
```

Typical breaking-change hotspots in 0.x:
- Renamed exports (e.g. `ShadcnButton` → `Button` in 0.2.0).
- Token additions/renames that affect `hsl(var(--x))` overrides.
- Peer-dep bumps (React 18 → 19 future).

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
