# Component Coverage

This file is the source of truth for "what's shipped" in
`@rohangore1999/shadcn-primitives`. All **49 shadcn/ui components** are
covered. The two marked "pattern" are compositions, not standalone files —
shadcn itself does not ship them as separate components either.

## Full coverage table

| # | Component | Shipped as | Batch |
|---|---|---|---|
| 1 | Accordion | `src/accordion.tsx` | 2 |
| 2 | Alert | `src/alert.tsx` | 5 |
| 3 | AlertDialog | `src/alert-dialog.tsx` | 3 |
| 4 | AspectRatio | `src/aspect-ratio.tsx` | 2 |
| 5 | Avatar | `src/avatar.tsx` | 5 |
| 6 | Badge | `src/badge.tsx` | 5 |
| 7 | Breadcrumb | `src/breadcrumb.tsx` | 5 |
| 8 | Button | `src/button.tsx` | 1 |
| 9 | Calendar | `src/calendar.tsx` | 4 |
| 10 | Card | `src/card.tsx` | 2 |
| 11 | Carousel | `src/carousel.tsx` | 6 |
| 12 | Chart | `src/chart.tsx` | 6 |
| 13 | Checkbox | `src/checkbox.tsx` | 1 |
| 14 | Collapsible | `src/collapsible.tsx` | 2 |
| 15 | Combobox | pattern: `Popover` + `Command` | 3 |
| 16 | Command | `src/command.tsx` | 3 |
| 17 | ContextMenu | `src/context-menu.tsx` | 3 |
| 18 | DataTable | `src/data-table.tsx` | 6 |
| 19 | DatePicker | pattern: `Popover` + `Calendar` | 4 |
| 20 | Dialog | `src/dialog.tsx` | 3 |
| 21 | Drawer | `src/drawer.tsx` | 6 |
| 22 | DropdownMenu | `src/dropdown-menu.tsx` | 3 |
| 23 | Form | `src/form.tsx` | 4 |
| 24 | HoverCard | `src/hover-card.tsx` | 3 |
| 25 | Input | `src/input.tsx` | 1 |
| 26 | InputOTP | `src/input-otp.tsx` | 4 |
| 27 | Label | `src/label.tsx` | 1 |
| 28 | Menubar | `src/menubar.tsx` | 3 |
| 29 | NavigationMenu | `src/navigation-menu.tsx` | 6 |
| 30 | Pagination | `src/pagination.tsx` | 5 |
| 31 | Popover | `src/popover.tsx` | 3 |
| 32 | Progress | `src/progress.tsx` | 5 |
| 33 | RadioGroup | `src/radio-group.tsx` | 1 |
| 34 | Resizable | `src/resizable.tsx` | 6 |
| 35 | ScrollArea | `src/scroll-area.tsx` | 2 |
| 36 | Select | `src/select.tsx` | 4 |
| 37 | Separator | `src/separator.tsx` | 2 |
| 38 | Sheet | `src/sheet.tsx` | 3 |
| 39 | Sidebar | `src/sidebar.tsx` | 6 |
| 40 | Skeleton | `src/skeleton.tsx` | 5 |
| 41 | Slider | `src/slider.tsx` | 1 |
| 42 | Sonner (Toaster / toast) | `src/sonner.tsx` | 5 |
| 43 | Switch | `src/switch.tsx` | 1 |
| 44 | Table | `src/table.tsx` | 6 |
| 45 | Tabs | `src/tabs.tsx` | 2 |
| 46 | Textarea | `src/textarea.tsx` | 1 |
| 47 | Toggle | `src/toggle.tsx` | 5 |
| 48 | ToggleGroup | `src/toggle-group.tsx` | 5 |
| 49 | Tooltip | `src/tooltip.tsx` | 3 |

**Applique additions beyond shadcn:**

| Component | Shipped as | Notes |
|---|---|---|
| Spinner | `src/spinner.tsx` | Small custom loader primitive |

## Not shipped, and why

| Upstream name | Reason |
|---|---|
| **Toast** | Deprecated upstream in favor of **Sonner**. We ship Sonner (`Toaster` + `toast`). |
| **Typography** | Not a component — shadcn just documents Tailwind utilities like `text-4xl font-bold`. Nothing to ship. |

## Rollout batches (historical)

| Batch | Components | Theme |
|---|---|---|
| 1 | Button, Checkbox, Label, Input, Textarea, Switch, RadioGroup, Slider, Spinner | Primitives |
| 2 | Card, Separator, Accordion, Collapsible, Tabs, ScrollArea, AspectRatio | Layout / surface |
| 3 | Popover, Tooltip, HoverCard, Dialog, AlertDialog, Sheet, DropdownMenu, ContextMenu, Menubar, Command | Overlays |
| 4 | Select, Calendar, InputOTP, Form (+ Combobox/DatePicker patterns) | Data entry |
| 5 | Alert, Badge, Avatar, Skeleton, Progress, Sonner, Toggle, ToggleGroup, Breadcrumb, Pagination | Feedback / display |
| 6 | NavigationMenu, Table, DataTable, Carousel, Resizable, Drawer, Sidebar, Chart | Nav / advanced |

## How to confirm coverage yourself

```bash
# list all component exports in the built bundle
grep -oE '^export \{[^}]*\}' packages/shadcn-primitives/dist/shadcn-primitives.esm.js
```
