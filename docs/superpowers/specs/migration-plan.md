# Applique facade migration plan

> **Source of truth:** [component-mappings.json](../../../packages/shadcn-primitives/catalog/component-mappings.json), produced from the corrected [prop audit](./prop-audit-draft.json). The adapter-engine design remains in [2026-08-04-applique-prop-adapter-engine-design.md](./2026-08-04-applique-prop-adapter-engine-design.md).

This is a living execution plan. A component is **registry-installable** only
after its source, prop contract, tests, catalogue preview, registry item,
TypeScript/JavaScript installation, and React 18 runtime checks pass. It is
**migration-ready** only when its active legacy behavior is also mapped or an
intentional breaking decision has been approved.

Every implemented facade owns the normal public registry name, such as
`button.json`, and installs to `@/components/applique/button`. A same-named raw
shadcn primitive is installed only as an internal dependency under
`@/components/applique/internal`; it is not a second client API or catalogue
entry.

## Current status

### Migration-ready registry facades

| Batch               | Components                                                      | Notes                                                                                                  |
| ------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Initial pilots      | Avatar, InputNumber, InputCheckbox, InputRadio, basic InputText | Existing pilot registry items remain installable. Full InputText compatibility is still separate work. |
| Direct facade batch | Accordion, Badge, BreadCrumb, InputTextArea                     | Audited, integrated, previewed, and tested in TSX and JSX clients.                                      |

`Accordion.active` remains accepted but behavior-neutral because the verified
legacy runtime never applied it. This is a compatibility decision, not a
silently dropped behavior.

### Installable test facades

| Component | What works | Why it is not migration-ready |
| --------- | ---------- | ----------------------------- |
| Tabs | Index-based selection, disabled tabs, child transformation, callbacks, and shadcn/native extensions | Legacy `type` changes the visual treatment and `Tab.isActive` affects state. Both still need an approved mapping. |
| Tooltip | Content, position, light/dark appearance, delays, hover/focus behavior, and shadcn/native extensions | Legacy `triggerOn="click"` is active behavior and needs a Tooltip-versus-Popover decision. |
| Button | Visual type and size mapping, icons, loading, notifications, captions, anchors, native props, and shadcn extensions | Arbitrary legacy `color` values need semantic mappings. `to` requires an explicit client RouterLink through `render` until a shared router integration exists. |
| ButtonGroup | Legacy action sequencing, hierarchy promotion, structured groups, and overflow composition | Its behavior depends on the test-only Button contract, so it cannot be approved before Button's `color` and router gaps are resolved. |
| Banner | Regular semantic banners, icons, title/body layout, links, dismissal, and the complete `Banner.Actionable` content composition | Actionable intentionally corrects a legacy color bug and null-icon behavior; its full-screen Alert also needs an Alert-versus-Dialog accessibility decision. |
| Section | Semantic section root, native attributes, title, padding, Card layout, and direct Applique Button actions | Its own audited contract is complete, but it depends on the test-only Button facade and inherits that facade's `color` and router gaps. |

These six facades remain in the registry so teams can test the implemented
surface. The catalogue must label them **Testing**, and production migration
must wait until the active legacy behavior is mapped or deliberately removed.

## Migration rules

1. **Do not silently drop props.** A `needs-review` prop stays visible in the
   audit and API reference. It may be accepted as behavior-neutral only when
   verified legacy runtime behavior was also neutral. Otherwise the facade is
   test-only until the behavior is mapped or an explicit breaking decision is
   approved.
2. **Applique props win on conflicts.** Matching shadcn/native props are
   forwarded; mapped or composed Applique values are applied last.
3. **Compound APIs are audited as a unit.** For example, `Tabs.Tab.title` is
   owned by the child marker even though `Tabs` performs the transformation.
4. **Source-complete is not registry-installable.** Every release also needs a
   registry item, preview, generated API metadata, immutable output, and real
   TSX/JSX installation checks.
5. **No shared adapter runtime.** Each facade keeps its precedence, callback,
   and composition logic locally so copied registry source remains readable.
6. **Ambiguous components require usage evidence first.** A name such as
   Dropdown does not identify whether the correct target is Select,
   DropdownMenu, or Popover.

## Remaining implementation order

The effort proxy is the number of `composition-owned` prop rules. It is useful
for sequencing, but dependencies and unresolved behavior can outweigh the raw
number.

| Priority | Component | Kind | Composition-owned | Needs review | Total rules | Next action |
|---:|---|---|---:|---:|---:|---|
| 1 | Input | composition | 3 | 1 | 14 | Use audited wrapper/adornment behavior; decide `__fieldContext`. |
| 2 | Image | composition | 3 | 3 | 6 | Resolve load/error callback and fallback behavior first. |
| 3 | FAB | composition | 4 | 5 | 9 | Review positioning, icon, accessibility, and sizing decisions. |
| 4 | InputDate | composition | 5 | 2 | Treat as a dedicated date-picker project, not a simple prop mapper. |
| 5 | InputMonth | composition | 6 | 1 | 8 | Follow the approved date contract after InputDate. |
| 6 | InputFile | composition | 6 | 2 | 10 | Define file validation and error behavior before implementation. |
| 7 | Pagination | composition | 6 | 1 | 8 | Approve page-index and callback semantics. |
| 8 | Page | composition | 7 | 1 | 8 | Build only after layout ownership is agreed. |
| 9 | Field | composition | 8 | 1 | 11 | Coordinate the replacement for the private child field context. |
| 10 | TopNav | composition | 8 | 3 | 11 | Review navigation state and child transformation. |
| 11 | Form | composition | 9 | 0 | 9 | Implement as Applique-owned form behavior; the checked-in shadcn Form is not a full replacement by itself. |
| 12 | Table | composition | 10 | 3 | 13 | Treat as a dedicated data-table migration with real client examples. |
| 13 | TopBar | composition | 15 | 0 | 15 | No unresolved rules, but the complete 15-rule composition is large. |
| 14 | NavBar | composition | 27 | 5 | 34 | Last among known-target components due to breadth and navigation behavior. |

## Usage-first queue

| Component   | Composition-owned | Needs review | Why it is parked                                                                            |
| ----------- | ----------------: | -----------: | ------------------------------------------------------------------------------------------- |
| Dropdown    |                 1 |            3 | Could mean Select, DropdownMenu, or Popover.                                                |
| InputSelect |                18 |            7 | Native/select/combobox behavior depends on actual usage.                                    |
| List        |                 4 |            7 | Could be static Item composition, Command, or menu behavior.                                |
| Loader      |                 2 |            6 | Spinner and determinate/progress use cases are mixed.                                       |
| Modal       |                12 |            0 | Target can be Dialog, AlertDialog, Sheet, or Drawer despite having no unresolved prop rows. |
| Progress    |                 9 |            3 | Spinner, bar, and circular progress need separate target decisions.                         |

## Next implementation slice

1. Install the six test-only facades on a client branch without changing
   existing `@applique-ui/uikit` imports.
2. Exercise real Button/ButtonGroup color and router usage, Banner.Actionable,
   and Section actions in one representative dashboard.
3. Close or explicitly reject each documented gap: Button semantic colors and
   RouterLink integration, Banner.Actionable compatibility/accessibility, and
   the inherited Section dependency.
4. Promote a facade only after its updated contract, visual checks, and client
   tests pass.
5. Start Input as the next implementation item while the test-only facades are
   evaluated.

## Release gate for every component

- Audited legacy and shadcn prop surface is current.
- Mapped, forwarded, composition-owned, and needs-review behavior is explicit.
- No active legacy behavior remains unresolved; otherwise the item is labelled
  test-only and is not approved for production migration.
- Conflict precedence and callback cancellation are tested.
- Ref and accessibility behavior are tested.
- Catalogue preview and one combined API table render correctly.
- Registry imports install under `@/components/applique/*`; same-named raw
  primitives remain private implementation files under `applique/internal`.
- React 18, TypeScript/TSX, and JavaScript/JSX smoke checks pass.
- Generated `v0.1.0` registry output remains immutable for this pre-adoption
  phase; a new version is required once clients adopt it.
