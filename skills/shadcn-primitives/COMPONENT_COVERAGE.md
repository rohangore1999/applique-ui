# Component coverage

Registry `v0.1.0` mirrors all 62 official `registry:ui` entries in the
shadcn `4.16.0` Base UI `base-nova` index.

## Installable source entries (60)

Accordion, Alert, Alert Dialog, Aspect Ratio, Attachment, Avatar, Badge,
Breadcrumb, Bubble, Button, Button Group, Calendar, Card, Carousel, Chart,
Checkbox, Collapsible, Combobox, Command, Context Menu, Dialog, Direction,
Drawer, Dropdown Menu, Empty, Field, Hover Card, Input, Input Group, Input
OTP, Item, Kbd, Label, Marker, Menubar, Message, Native Select, Navigation
Menu, Pagination, Popover, Progress, Radio Group,
Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider,
Sonner, Spinner, Switch, Table, Tabs, Textarea, Toast, Toggle, Toggle Group,
and Tooltip.

Every installable entry has:

- a checked-in upstream JSON snapshot;
- transformed React 18-compatible TypeScript source;
- exact dependency pins;
- root and `v0.1.0` registry item JSON;
- a catalogue entry and lazy preview.

## Fileless official entry (1)

`Form` is present in the official index but contains no source in this Base UI
snapshot. It is published as deprecated metadata and points to `Field`.

## React 19-only official entry (1)

`Message Scroller` is retained in the coverage metadata but excluded from the
installable React 18 registry because its upstream `@shadcn/react` primitive
requires React 19.

## Supporting entry

`use-mobile` is a `registry:hook` used by Sidebar. It is installed through the
dependency graph and is not shown as a component in the catalogue.

## Outside this official primitive scope

Date Picker and Data Table are documented shadcn compositions rather than
official UI source entries in this index. Build them from Calendar/Popover and
Table primitives, or publish separate reviewed Applique compositions later.
The retained package-only `src/data-table.tsx` is not part of this registry
release.

The manifest is the machine-readable source of truth:

```bash
node -e '
const r = require("./packages/shadcn-primitives/registry.json")
const ui = r.items.filter((item) => item.type === "registry:ui")
console.log({
  official: ui.length,
  installable: ui.filter((item) => item.files?.length).length,
  deprecated: ui.filter((item) => item.meta?.status === "deprecated").map((item) => item.name),
  unsupported: ui.filter((item) => item.meta?.status === "unsupported").map((item) => item.name),
})
'
```
