# Applique shadcn architecture, registry, and migration guide

This is the canonical document for the Applique shadcn initiative. It covers
the architectural decision, registry lifecycle, design-token delivery,
component migration model, prop strategy, client integration, maintenance,
testing, versioning, and manual GitHub Pages publishing.

The most important distinction is:

- the **registry primitive layer is implemented**;
- the **Applique facade and legacy prop mappings are proposed**, not yet
  implemented;
- existing Applique package imports are not migrated automatically.

## Contents

1. [Decision](#1-decision)
2. [Current release baseline](#2-current-release-baseline)
3. [Architecture](#3-architecture)
4. [Why registry plus facade](#4-why-registry-plus-facade)
5. [Registry contents and dependency graph](#5-registry-contents-and-dependency-graph)
6. [Upstream sync and registry generation](#6-upstream-sync-and-registry-generation)
7. [Tokens, typography, and theming](#7-tokens-typography-and-theming)
8. [Component migration classification](#8-component-migration-classification)
9. [Prop migration and facade design](#9-prop-migration-and-facade-design)
10. [Button facade example](#10-button-facade-example)
11. [Client requirements and installation](#11-client-requirements-and-installation)
12. [Client ownership, customization, and updates](#12-client-ownership-customization-and-updates)
13. [Adoption and migration plan](#13-adoption-and-migration-plan)
14. [Catalogue](#14-catalogue)
15. [Maintainer workflows](#15-maintainer-workflows)
16. [Validation and testing](#16-validation-and-testing)
17. [Manual GitHub Pages publishing](#17-manual-github-pages-publishing)
18. [Governance and UX decisions](#18-governance-and-ux-decisions)
19. [Risks and trade-offs](#19-risks-and-trade-offs)
20. [Troubleshooting](#20-troubleshooting)
21. [Pending action items and what to pick next](#21-pending-action-items-and-what-to-pick-next)
22. [Checklists](#22-checklists)
23. [Glossary](#23-glossary)

## 1. Decision

### Chosen approach

Use a **versioned shadcn source registry with Applique tokens**, and add
**Applique-owned facade components only where migration requires them**.

The architecture has two product-facing layers:

1. **Registry primitives**
   - pinned shadcn Base/Nova source;
   - Applique design tokens;
   - copied into each client repository;
   - normal shadcn API;
   - implemented today.
2. **Applique facades**
   - stable Applique-owned API;
   - imports local registry primitives;
   - forwards, maps, composes, or rejects props;
   - added component by component after UX and usage review;
   - proposed, not implemented today.

This preserves the main benefit of shadcn: clients own the installed source.
It also gives Applique a place to preserve intentional contracts without
forcing every primitive through a large centrally maintained package.

### What this architecture is

- A consistent, reviewed starting point for dashboard UI.
- A source-distribution system rather than a runtime component dependency.
- A pinned snapshot of shadcn, Base UI, npm dependencies, tokens, and fonts.
- An opt-in update model based on source diffs.
- A phased migration path that leaves existing Applique components untouched.

### What this architecture is not

- It is not an npm package that centrally controls every rendered component.
- It is not an automatic update mechanism.
- It is not a promise that all legacy props already work on registry
  primitives.
- It is not a guarantee that local client modifications remain consistent with
  Applique.
- It is not a way to swap shadcn for another library with zero client impact.
  Applique-owned facade props can remain stable, but clients using primitive
  APIs or implementation-specific extension props may need changes.

### Current implementation status

| Capability                     | Status             | Notes                                                   |
| ------------------------------ | ------------------ | ------------------------------------------------------- |
| Versioned shadcn registry      | Implemented        | Current release is `v0.1.0`                             |
| Applique light tokens and font | Implemented        | Installed through `applique-theme`                      |
| React 18 compatibility         | Implemented        | Separate Applique-owned compatibility helper            |
| Static component catalogue     | Implemented        | Component previews, API, install URLs, migration view   |
| Installable primitive maturity | Experimental       | All 60 source-bearing UI items have experimental status |
| Base/Nova animation delivery   | Known gap          | Registry clients do not yet receive all animation CSS   |
| Component relationship mapping | Proposed           | All current records require review                      |
| Prop audit                     | Partially proposed | Four relationships audited                              |
| Applique facade components     | Not implemented    | Must be handwritten and tested                          |
| Automatic legacy migration     | Not implemented    | Migration is explicit and component-by-component        |

## 2. Current release baseline

| Contract                   | Pinned value                                     |
| -------------------------- | ------------------------------------------------ |
| Registry release           | `v0.1.0`                                         |
| Workspace package version  | `@rohangore1999/shadcn-primitives@0.2.0`         |
| Distribution contract      | Registry URLs, not the workspace package version |
| shadcn CLI                 | `4.16.0`                                         |
| shadcn style               | `base-nova`                                      |
| Recorded upstream commit   | `705ce5961080264830471ddd885c01b907706068`       |
| Installer/update Node.js   | `>=20.18.1`                                      |
| React peer range           | `^18.0.0`                                        |
| Tested React / React DOM   | `18.3.1`                                         |
| Tailwind CSS               | `4`, tested with `4.3.3`                         |
| Typography                 | `@fontsource-variable/hanken-grotesk@5.3.0`      |
| Official shadcn UI entries | 62                                               |
| Installable UI entries     | 60                                               |
| Support hooks              | 1                                                |
| Registry foundations       | 3                                                |
| Total manifest items       | 66                                               |

The registry version and workspace package version are intentionally separate.
Clients install `v0.1.0` registry URLs; they do not depend on the workspace
package's `0.2.0` version.

All 60 installable UI items are currently marked `experimental`. Installable
means the source graph passes the technical registry gates; it does not mean a
primitive or migration facade is UX-approved for production use.

The current `rohangore1999.github.io` Pages domain is an evaluation host. An
organization-owned durable host and owner must be agreed before production
adoption because absolute host URLs are embedded in registry dependencies.

### UI coverage

The 60 installable UI entries are:

> accordion, alert, alert-dialog, aspect-ratio, attachment, avatar, badge,
> breadcrumb, bubble, button, button-group, calendar, card, carousel, chart,
> checkbox, collapsible, combobox, command, context-menu, dialog, direction,
> drawer, dropdown-menu, empty, field, hover-card, input, input-group,
> input-otp, item, kbd, label, marker, menubar, message, native-select,
> navigation-menu, pagination, popover, progress, radio-group, resizable,
> scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner,
> spinner, switch, table, tabs, textarea, toast, toggle, toggle-group, tooltip.

Two official entries are retained for complete discovery but are not
installable:

- **Form** is fileless and deprecated in the pinned Base/Nova snapshot. Use
  Field.
- **Message Scroller** depends on an upstream `@shadcn/react` primitive that
  requires React 19. It is excluded from the React 18 baseline.

Date Picker and Data Table are shadcn recipes/compositions, not official source
items in this registry index. The package-only
`packages/shadcn-primitives/src/data-table.tsx` is not part of registry
`v0.1.0`.

## 3. Architecture

### End-to-end architecture

```mermaid
flowchart LR
  subgraph Inputs["Reviewed inputs"]
    UX["UX and Figma"] --> Tokens["src/tokens.css"]
    Upstream["shadcn base-nova registry"] --> Snapshots["upstream/base-nova JSON snapshots"]
  end

  subgraph Applique["Applique repository"]
    Snapshots --> Sync["sync-shadcn.js"]
    Sync --> Sources["normalized TS and TSX source"]
    Sync --> Lock["snapshot lock and SHA-256 hashes"]
    Tokens --> Generator["generate-registry.js"]
    Sources --> Generator
    Lock --> Validator["validate-registry.js"]
    Manifest["registry.json"] --> Generator
    Manifest --> Validator
    Mappings["component-mappings.json"] --> Metadata["generate-catalog-metadata.js"]
    Sources --> Metadata
    Metadata --> Catalog["catalog/build.js"]
    Generator --> PublicRegistry["docs/registry current and versioned JSON"]
    PublicRegistry --> Validator
    Validator --> ReleaseGate["release gate"]
  end

  subgraph Hosting["Static hosting"]
    PublicRegistry --> Pages["GitHub Pages"]
    Catalog --> Pages
  end

  subgraph Client["Client repository"]
    Pages --> CLI["shadcn 4.16.0 CLI"]
    CLI --> LocalPrimitives["client-owned primitive source"]
    CLI --> ClientCSS["client global CSS and Applique tokens"]
    LocalPrimitives --> Facade["optional Applique facade"]
    LocalPrimitives --> App["dashboard code"]
    Facade --> App
  end
```

### Layer responsibilities

| Layer              | Owns                                                                        | Does not own                   |
| ------------------ | --------------------------------------------------------------------------- | ------------------------------ |
| UX/Figma           | visual intent, tokens, states, interaction decisions                        | registry mechanics             |
| Upstream shadcn    | primitive starting source and API                                           | Applique compatibility         |
| Applique registry  | reviewed snapshot, transforms, tokens, dependency pins, versions, catalogue | client-local modifications     |
| Registry primitive | shadcn API plus Applique theme                                              | legacy Applique prop contract  |
| Applique facade    | stable mapped/composed Applique contract                                    | arbitrary application behavior |
| Client             | installed source, application composition, accepted updates, local testing  | shared registry release        |

### Source-of-truth and generated files

| Resource                              | Path                                                         | Edit directly?                   |
| ------------------------------------- | ------------------------------------------------------------ | -------------------------------- |
| Canonical architecture guide          | `docs/REGISTRY.md`                                           | Yes                              |
| Release manifest and dependency graph | `packages/shadcn-primitives/registry.json`                   | Yes, through reviewed changes    |
| Token source                          | `packages/shadcn-primitives/src/tokens.css`                  | Yes                              |
| Lock/manifest-listed component source | `packages/shadcn-primitives/src/<item>.tsx`                  | Normally generated by sync       |
| React 18 helper                       | `packages/shadcn-primitives/src/applique-react18-compat.ts`  | Yes, with tests                  |
| Shared `cn()` helper                  | `packages/shadcn-primitives/src/utils.ts`                    | Yes, with tests                  |
| Support hook                          | `packages/shadcn-primitives/src/use-mobile.ts`               | Normally generated by sync       |
| Raw upstream snapshots                | `packages/shadcn-primitives/upstream/base-nova/*.json`       | Only through intentional refresh |
| Version and content lock              | `packages/shadcn-primitives/shadcn-base-nova.lock.json`      | Generated by sync                |
| Migration metadata                    | `packages/shadcn-primitives/catalog/component-mappings.json` | Yes, curated                     |
| Catalogue generated metadata          | `packages/shadcn-primitives/catalog/generated/*`             | No                               |
| Public registry                       | `docs/registry/**`                                           | No                               |
| Public catalogue bundle               | `docs/catalog/**`                                            | No                               |

Generated registry JSON, generated catalogue metadata, bundled catalogue
assets, and the sync-generated `src/index.ts` must not be hand-edited.

## 4. Why registry plus facade

### Options evaluated

| Approach                                       | Advantages                                                                                                    | Disadvantages                                                                                                                                 | Decision                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Central npm package containing every component | One runtime version; central fixes; familiar package import                                                   | Requires a maintaining team; maps every prop centrally; clients have less source control; package upgrades are still opt-in; runtime coupling | Not the primary delivery model               |
| Raw upstream shadcn per client                 | Maximum client control; lowest central code                                                                   | No shared Applique tokens, pins, review, provenance, or migration guidance                                                                    | Insufficient for cross-dashboard consistency |
| Applique registry only                         | Shared reviewed baseline; source ownership; no runtime Applique package; easy access to new shadcn primitives | Clients can diverge; updates require diff/merge; primitive API does not preserve legacy props                                                 | Implemented foundation                       |
| Applique registry plus selective facades       | Registry benefits plus stable Applique contracts where valuable; supports phased migration                    | Facades still need handwritten mapping, composition, tests, and ownership                                                                     | Recommended target                           |

### Why an npm package alone does not solve updates

A package change also requires every client to:

1. update the package version;
2. resolve dependency and API changes;
3. test the dashboard;
4. deploy the dashboard.

The package gives central runtime ownership, but it does not eliminate client
work. With no dedicated Applique maintenance team and a strong need for local
customization, forcing every component through a package would create a large
central bottleneck.

### Why source duplication is acceptable

Every client receives its own copy of a component. This is normal shadcn
behavior, not a build anti-pattern:

- a dashboard bundles its own installed component once;
- the registry itself is not shipped to the browser;
- unused registry items are not installed;
- normal bundler tree-shaking and code-splitting still apply.

The trade-off is operational, not primarily bundle size: multiple repositories
must review and accept later source updates. That trade-off is intentional
because it gives clients control.

### Consistency boundary

The registry guarantees a consistent **starting baseline** through:

- exact source snapshots;
- exact dependency pins;
- common semantic tokens;
- common typography;
- common primitive behavior;
- reviewed previews and validation.

It cannot guarantee permanent consistency after clients edit source or skip
updates. Teams that intentionally diverge own the future merge cost.

## 5. Registry contents and dependency graph

The manifest contains 66 items:

- 62 `registry:ui` entries;
- 1 `registry:hook` entry;
- 2 `registry:lib` entries;
- 1 `registry:theme` entry.

### Foundation items

| Item                      | Target                            | Purpose                                                                        |
| ------------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `applique-theme`          | Client's configured global CSS    | Applique variables, Tailwind mappings, scoped color-mode variants, font        |
| `utils`                   | `@lib/utils.ts`                   | Standard `cn()` helper using exact `clsx` and `tailwind-merge` pins            |
| `applique-react18-compat` | `@lib/applique-react18-compat.ts` | `withReact18Ref` and `mergeRefs` without taking ownership of client `utils.ts` |
| `use-mobile`              | `@hooks/use-mobile.ts`            | Support hook installed recursively by Sidebar                                  |

The validator calls the theme and two library items the three registry
foundations. The hook is counted separately.

### Example: Button dependency graph

```mermaid
flowchart TD
  Client["Install button.json"] --> Button["Button source"]
  Client --> Theme["applique-theme"]
  Client --> Utils["utils"]
  Client --> Compat["applique-react18-compat"]
  Button --> BaseUI["@base-ui/react 1.6.0"]
  Button --> CVA["class-variance-authority 0.7.1"]
  Theme --> Font["@fontsource-variable/hanken-grotesk 5.3.0"]
  Utils --> Clsx["clsx 2.1.1"]
  Utils --> Merge["tailwind-merge 3.6.0"]
```

Registry dependencies are recursive. A complex item such as Sidebar also pulls
its component dependencies and `use-mobile` automatically. Clients do not
preinstall the registry's exact npm dependency set one package at a time; the
pinned CLI installs what each requested item declares.

### Exact declared registry dependency universe

Only declared dependencies reached by the selected component graph are
installed. Installing all supported components can introduce these exact pins:

| Dependency                                  | Used for                                                       |
| ------------------------------------------- | -------------------------------------------------------------- |
| `@base-ui/react@1.6.0`                      | Accessible primitives used by the Base/Nova component families |
| `@fontsource-variable/hanken-grotesk@5.3.0` | Applique typography                                            |
| `class-variance-authority@0.7.1`            | Typed visual variants                                          |
| `clsx@2.1.1`                                | Conditional class composition in `cn()`                        |
| `cmdk@1.1.1`                                | Command                                                        |
| `date-fns@4.4.0`                            | Calendar date utilities                                        |
| `embla-carousel-react@8.6.0`                | Carousel behavior                                              |
| `input-otp@1.4.2`                           | Input OTP behavior                                             |
| `lucide-react@1.28.0`                       | Icons used by registry primitives                              |
| `next-themes@0.4.6`                         | Sonner theme integration                                       |
| `react-day-picker@10.0.1`                   | Calendar primitive                                             |
| `react-is@18.3.1`                           | Chart child inspection on React 18                             |
| `react-resizable-panels@4.12.2`             | Resizable panels                                               |
| `recharts@3.8.0`                            | Charts                                                         |
| `sonner@2.0.7`                              | Sonner notifications                                           |
| `tailwind-merge@3.6.0`                      | Tailwind-aware class merging in `cn()`                         |

These are registry-item dependencies, not packages every client must add
manually. React, React DOM, TypeScript, Tailwind, and the installer Node/CLI
requirements remain client prerequisites rather than transitive substitutes.

### Known animation-delivery gap

The declared set above is not yet the complete functional styling dependency
set. These 11 normalized components use Base/Nova entry/exit animation
utilities:

> alert-dialog, combobox, context-menu, dialog, dropdown-menu, hover-card,
> menubar, navigation-menu, popover, select, tooltip.

Those utilities normally come from `shadcn/tailwind.css` and
`tw-animate-css`. The workspace package build imports both, but the current
`applique-theme` registry item does not install or import them, and the registry
smoke test does not assert that those utilities are emitted. A copied component
can therefore compile while silently missing part of its motion styling.

Treat this as a release gap, not as a client customization task. Before
production adoption, deliver the required animation CSS through the registry
theme/dependency graph and add a smoke assertion for representative compiled
animation utilities.

### Why the compatibility helper is separate

Most shadcn clients already have `@/lib/utils.ts`. If Applique placed React 18
helpers in that file, the CLI could skip the existing client file and installed
components would fail to import the helpers.

The registry therefore keeps:

- standard `cn()` in the normal client-owned `utils.ts`;
- Applique-specific ref behavior in
  `applique-react18-compat.ts`.

The full smoke test creates an existing `utils.ts`, declines the overwrite
prompt, verifies it remains byte-for-byte unchanged, and then type-checks all
installed components.

## 6. Upstream sync and registry generation

### Upstream refresh flow

Normal builds are offline. An upstream refresh is explicit because the public
shadcn item endpoint is mutable.

```mermaid
flowchart TD
  Start["Select shadcn CLI and style; record reviewed commit context"]
  Start --> Fetch["Fetch 62 UI items and use-mobile, or use audited local JSON"]
  Fetch --> ReviewRaw["Review raw snapshot changes"]
  ReviewRaw --> Transform["Normalize source"]
  Transform --> Pin["Resolve exact dependency pins"]
  Pin --> Hash["Record upstream and source SHA-256 hashes"]
  Hash --> SyncOutput["Update snapshots, source, index, manifest, and lock"]
  SyncOutput --> RegistryBuild["Generate registry JSON"]
  SyncOutput --> Metadata["Regenerate catalogue metadata when its inputs changed"]
  RegistryBuild --> Test["Run validation, type checks, runtime smoke, registry smoke, and visual review"]
  Metadata --> CatalogBuild["Build static catalogue"]
  CatalogBuild --> Test
  Test -->|pass| Publish["Publish a new immutable registry version"]
  Test -->|fail| Fix["Fix or reject the refresh"]
  Fix --> Transform
```

From `packages/shadcn-primitives`:

```sh
# Intentional network refresh
pnpm run sync:shadcn -- --allow-network

# Refresh from an already reviewed local set
pnpm run sync:shadcn -- --from /absolute/path/to/base-nova-items

# Compare without writing
pnpm run sync:shadcn -- --from /absolute/path/to/base-nova-items --check
```

### Normalization performed by sync

The sync process:

1. reads 62 official Base/Nova UI entries and `use-mobile`;
2. checks the expected upstream item types;
3. rewrites upstream-private aliases to local dependencies;
4. replaces documentation-only icon placeholders with pinned Lucide icons;
5. changes unscoped `dark:` utilities to `applique-dark:`;
6. adds React 18 ref wrappers to exported function components;
7. preserves Calendar's internal focus ref while merging a consumer ref;
8. forwards Chart content refs;
9. pins every external dependency exactly;
10. updates normalized source, `registry.json`, `src/index.ts`, and the lock;
11. records hashes for raw upstream JSON and normalized local source.

Form and Message Scroller follow the documented exception paths rather than
publishing unsafe or empty source.

The component endpoint used by network sync is mutable. The recorded Git
commit provides reviewed provenance context, but it does not address or
cryptographically verify that endpoint. Reproducibility comes from the
checked-in raw JSON plus its recorded SHA-256 hashes. Catalogue preview fetching
is separately commit-addressed.

### Registry generation

`generate-registry.js` reads:

- `registry.json`;
- normalized source files;
- `src/tokens.css`;
- the configured registry base URL and version.

It writes both:

```text
docs/registry/button.json
docs/registry/v0.1.0/button.json
```

The root file is the mutable current-release alias. The versioned file is the
reproducible client contract. Internal registry dependencies use absolute,
versioned URLs.

Low-level generator options include:

- `APPLIQUE_REGISTRY_BASE_URL`;
- `APPLIQUE_REGISTRY_VERSION`;
- `APPLIQUE_REGISTRY_OUTPUT_DIR`.

For a real release, change `registry.json.meta.version`; an environment-only
version override is not the complete release workflow and will not satisfy the
normal validator reconciliation by itself. An alternate output directory also
requires validating that directory explicitly. Always generate with the final
host URL because dependency URLs are embedded in the output.

### Version rule

The current `v0.1.0` may change only while it truly has no consumers. As soon
as the first client adopts it:

1. mark `v0.1.0` immutable;
2. never rewrite `docs/registry/v0.1.0`;
3. publish later changes under a new version such as `v0.2.0`;
4. move only the root current alias to the new release;
5. retain older version directories.

This immutability rule is currently procedural. The generator can rewrite the
active version directory, and the validator has no historical golden-hash
ledger. Until that protection exists, enforce immutability through Git review
and ownership checks.

## 7. Tokens, typography, and theming

### Token pipeline

```mermaid
flowchart LR
  Figma["Reviewed Figma values"] --> CSS["src/tokens.css"]
  CSS --> Generator["generate-registry.js"]
  Generator --> Theme["applique-theme.json"]
  Theme --> CLI["shadcn add"]
  CLI --> ClientCSS["client global CSS"]
  ClientCSS --> Components["local registry components"]
```

`src/tokens.css` is the reviewed runtime source. It currently contains the
light theme's semantic colors, radii, typography, weights, spacing, shadows,
sidebar values, and chart values.

Example:

```css
:root {
  --primary: #5232d0;
  --primary-foreground: #ffffff;
  --radius-md: 8px;
}

@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}
```

Complete color values must not be wrapped in the obsolete
`hsl(var(--token))` form.

### Typography

The theme:

- installs `@fontsource-variable/hanken-grotesk@5.3.0`;
- adds its CSS import;
- maps `--font-sans` to Hanken Grotesk with system fallbacks.

The font is therefore part of the reviewed registry graph, not an undocumented
assumption about the host dashboard.

### Light-only behavior

Applique does not yet have a reviewed dark token collection. Upstream dark
branches are scoped to:

```css
[data-applique-color-scheme='dark']
```

Both `dark` and `applique-dark` use that explicit scope. A dashboard's global
`.dark` class or OS preference cannot accidentally activate upstream dark
styles against the light-only token set.

Do not set `data-applique-color-scheme="dark"` until UX publishes and approves
a complete dark theme.

### Changing tokens

1. Confirm the value and semantics with UX/Figma.
2. Edit `packages/shadcn-primitives/src/tokens.css`.
3. Build registry and catalogue output.
4. Run registry validation and both smoke tests.
5. Review current and versioned JSON diffs.
6. Publish under the correct registry version.

Never edit token values directly inside `docs/registry/*.json`.

## 8. Component migration classification

These classifications describe **migration relationships**, not permanent
labels on a primitive. One registry component can participate in many
relationships.

| Classification    | Current count | Simple meaning                                                                                   | Example                                               |
| ----------------- | ------------: | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| **Direct**        |            11 | One Applique component maps to one shadcn component family. Prop adaptation may still be needed. | InputText → Input                                     |
| **Composition**   |            18 | Multiple shadcn primitives plus Applique-owned behavior are required.                            | InputDate → Calendar + Popover + Input + Button       |
| **No equivalent** |            38 | The capability exists only on one side.                                                          | VirtualList is Applique-only; Carousel is shadcn-only |
| **Ambiguous**     |             6 | Real usage must be checked before choosing the replacement.                                      | Dropdown → Select, DropdownMenu, or Popover           |

The catalogue tabs show 73 classified capabilities/display entries:
`11 + 18 + 38 + 6 = 73`. The source metadata contains 37 records because the
38 no-equivalent components are grouped into two directional records.

All 37 records are currently `proposed`. None is UX-approved yet.

### Classification decision

```mermaid
flowchart TD
  Start["Review legacy component intent and real usage"]
  Start --> Same{"Does one registry family provide the same capability?"}
  Same -->|yes| Direct["Direct"]
  Same -->|no| Many{"Does one agreed replacement require several primitives together?"}
  Many -->|yes| Composition["Composition"]
  Many -->|no| Choices{"Are multiple targets valid depending on intent?"}
  Choices -->|yes| Ambiguous["Ambiguous: audit usage first"]
  Choices -->|no| OneSide{"Does the capability exist on only one side?"}
  OneSide -->|yes| NoEquivalent["No equivalent"]
  OneSide -->|no| Research["Research UX intent or external primitive"]
```

### Direct mappings

| Applique      | Registry family |
| ------------- | --------------- |
| Accordion     | Accordion       |
| Avatar        | Avatar          |
| Badge         | Badge           |
| BreadCrumb    | Breadcrumb      |
| InputCheckbox | Checkbox        |
| InputNumber   | Input           |
| InputRadio    | RadioGroup      |
| InputText     | Input           |
| InputTextArea | Textarea        |
| Tabs          | Tabs            |
| Tooltip       | Tooltip         |

Direct does not mean identical props. For example, InputText's legacy
`onChange(value)` must adapt the registry Input's DOM event.

### Composition mappings

| Applique    | Registry primitives and owned behavior         |
| ----------- | ---------------------------------------------- |
| Banner      | Alert + Button                                 |
| Button      | Button + Spinner + Badge                       |
| ButtonGroup | ButtonGroup + DropdownMenu                     |
| FAB         | Button + DropdownMenu + Popover                |
| Field       | Field + Label                                  |
| Form        | Field + Input + Select + Checkbox + RadioGroup |
| Image       | native image + AspectRatio + Skeleton          |
| Input       | Input + InputGroup                             |
| InputDate   | Calendar + Popover + Input + Button            |
| InputFile   | Input + Button + Attachment                    |
| InputMonth  | Calendar + Popover + Input                     |
| NavBar      | Sidebar + Sheet + NavigationMenu               |
| Page        | Sidebar + Breadcrumb + NavigationMenu          |
| Pagination  | Pagination + Select + Input                    |
| Section     | Card + Separator                               |
| Table       | Table + Input + DropdownMenu + Pagination      |
| TopBar      | Breadcrumb + Avatar + DropdownMenu             |
| TopNav      | NavigationMenu + Sheet + Sidebar               |

Composition means the facade renders several primitives and owns their
coordination, state, accessibility, formatting, or router integration.

### Ambiguous mappings

| Applique    | Candidate targets                      | Selection rule                                         |
| ----------- | -------------------------------------- | ------------------------------------------------------ |
| Dropdown    | Select / DropdownMenu / Popover        | stored value / actions / arbitrary interactive content |
| InputSelect | Select / Combobox / NativeSelect       | simple / searchable or multiple / native               |
| List        | Item / Command / Checkbox / RadioGroup | display / command / multi-select / single-select       |
| Loader      | Spinner / Progress                     | indeterminate / measurable                             |
| Modal       | Dialog / AlertDialog / Drawer / Sheet  | general / confirmation / mobile-bottom / side-panel    |
| Progress    | Progress / Spinner                     | bar or known value / circular or indeterminate         |

An ambiguous facade must not be selected by component name alone. Audit actual
usage, accessibility semantics, controlled state, content shape, and
responsive behavior first.

### No equivalent

Applique-only capabilities:

> click-away, error-boundary, grid, icon, input-masked, layout, measure,
> portal, schema-form, stepper, text, virtual-grid, virtual-list.

Keep these Applique-owned until a reviewed custom registry implementation or
external primitive is selected.

Currently identified shadcn-only capabilities:

> aspect-ratio, bubble, carousel, chart, command, context-menu, direction,
> empty, hover-card, input-otp, kbd, marker, menubar, message,
> message-scroller, resizable, scroll-area, separator, skeleton, slider,
> sonner, switch, toast, toggle, toggle-group.

An installable shadcn-only component needs no legacy facade. Install and use
its primitive API directly unless UX later defines an Applique-specific
contract. Message Scroller is the exception: it is discoverable but not
installable in the React 18 baseline.

Current mapping metadata has one known coverage follow-up: Collapsible exists
in the registry but is not yet classified, while the deprecated Form registry
entry is handled separately. Do not interpret the migration view as approval
or complete compatibility.

## 9. Prop migration and facade design

### Two API references are intentional

The catalogue exposes two different kinds of information:

1. **Registry primitive API**
   - generated from checked-in TypeScript source;
   - tells new code what the installed shadcn primitive accepts.
2. **Migration prop audit**
   - curated in `component-mappings.json`;
   - tells teams how a legacy Applique contract could move to primitives.

They answer different questions. A shared prop name does not prove shared
behavior.

### Prop audit categories

| JSON kind           | Catalogue label      | Meaning                                                      |
| ------------------- | -------------------- | ------------------------------------------------------------ |
| `forwarded`         | Direct / forwarded   | Same name and behavior; pass through unchanged               |
| `mapped`            | Mapped by facade     | Rename the prop or convert values/events                     |
| `composition-owned` | Owned by composition | Consume the prop and build behavior from multiple primitives |
| `unsupported`       | Unsupported          | Deliberately exclude it from the new facade                  |
| `needs-review`      | Needs review         | Usage or UX intent is unresolved                             |

Current audit coverage:

- 4 relationships: InputText, Button, InputDate, Dropdown;
- 52 mapping rules assessing 58 source-prop occurrences (49 distinct names);
- 10 forwarded;
- 20 mapped;
- 14 composition-owned;
- 1 unsupported;
- 7 needing review.

Every other mapping correctly says **Prop audit pending**. That message means
the contract has not been audited. It does not mean the component has no props,
and it does not mean all props are compatible.

### Same name can still require mapping

`InputText.value → Input.value` is mapped, not directly forwarded, because the
legacy controlled component normalizes missing or non-string values to an
empty string.

`InputText.onChange → Input.onChange` is mapped because:

```text
registry Input: onChange(event)
legacy Applique: onChange(value)
```

Names match; contracts do not.

### Recommended facade type pattern

Expose:

1. stable Applique-owned props;
2. non-conflicting registry primitive props as an extension surface;
3. explicit mappings for collisions;
4. composition-owned behavior where a primitive is insufficient.

Conceptually:

```ts
type PrimitiveProps = React.ComponentProps<typeof RegistryComponent>

type AppliqueProps = Omit<PrimitiveProps, ConflictingPrimitiveProps> &
  AppliqueOwnedProps
```

This allows clients to use useful primitive features without mapping every
single shadcn prop. However, the two surfaces have different guarantees:

| Surface                         | Compatibility promise                                                             |
| ------------------------------- | --------------------------------------------------------------------------------- |
| Applique-owned props            | Stable facade contract; adapter must preserve or deliberately version it          |
| Non-conflicting primitive props | Implementation extension; may require migration if the underlying library changes |
| Direct primitive imports        | shadcn contract; not insulated by the facade                                      |

### Prop precedence rule

Primitive extension props are spread first. Applique-controlled values come
after the spread:

```tsx
<RegistryButton
  {...primitiveProps}
  variant={mappedVariant}
  size={mappedSize}
  disabled={disabled || loading}
/>
```

This prevents a conflicting extension prop from bypassing an Applique
invariant.

### Why not blindly spread a future library's props

If Applique later replaces shadcn, it can map the stable Applique-owned props
inside the facade. It must not assume another library's props have equivalent
meaning merely because their names match.

Clients using shadcn-specific extension props accept a smaller migration cost.
That is still better than hiding all primitive capabilities, but it must be an
explicit contract boundary.

### Facade acceptance rules

A facade should not be marked approved until:

- every owned prop is forwarded, mapped, composition-owned, unsupported, or
  deliberately deprecated;
- all `needs-review` entries are resolved;
- defaults and value conversions are specified;
- event payloads are specified;
- accessibility and keyboard behavior are tested;
- responsive and router behavior are tested where relevant;
- UX approves visual equivalence or intentional change;
- real client usage has been sampled.

Automatic full prop mapping for every component is not safe. Direct mapping is
highly feasible; composition is feasible with handwritten code and tests;
ambiguous contracts require usage review.

## 10. Button facade example

### Why Button is composition

The registry Button provides the basic interactive primitive and variants.
Legacy Applique Button also owns:

- loading UI and click suppression;
- notification count;
- named leading and trailing icons;
- large captioned layout;
- anchor and router rendering;
- legacy defaults and transforms.

Those behaviors must be rebuilt around Button, Spinner, and Badge.

### Proposed Button prop audit

| Legacy prop        | Strategy                 | Registry target or behavior                     |
| ------------------ | ------------------------ | ----------------------------------------------- |
| `children`         | Forwarded                | `Button.children`                               |
| `onClick`          | Forwarded with guard     | `Button.onClick`; loading/disabled still blocks |
| `disabled`         | Forwarded with invariant | `Button.disabled`; loading also forces disabled |
| `className`        | Forwarded                | Merge with registry classes                     |
| visual `type`      | Mapped                   | `Button.variant`                                |
| `htmlType`         | Mapped                   | native `Button.type`                            |
| `size`             | Mapped                   | registry size or owned large recipe             |
| `transform`        | Mapped                   | `style.textTransform`                           |
| `inheritTextColor` | Mapped                   | owned compatibility class                       |
| `icon`             | Composition-owned        | resolve icon and render before label            |
| `secondaryIcon`    | Composition-owned        | render after label                              |
| `loading`          | Composition-owned        | Spinner, disabled, click guard, `aria-busy`     |
| `notifications`    | Composition-owned        | bell/count Badge and `99+` behavior             |
| `href`             | Composition-owned        | polymorphic anchor rendering                    |
| `to`               | Composition-owned        | agreed client-router integration                |
| `caption`          | Composition-owned        | secondary text in large recipe                  |
| runtime `label`    | Composition-owned        | fallback when children is absent                |
| `color`            | Needs review             | UX must define semantic tones                   |
| runtime `state`    | Unsupported              | remove arbitrary-state CSS escape hatch         |

Proposed visual value mapping:

| Legacy `type` | Registry `variant`                            |
| ------------- | --------------------------------------------- |
| `primary`     | `default`                                     |
| `secondary`   | `outline`                                     |
| `tertiary`    | `ghost`                                       |
| `link`        | `link`                                        |
| `text`        | `link` plus a reviewed compatibility modifier |

The omitted legacy type must map to `outline` because the old default is
`secondary`. UX must approve the visual equivalence.

Proposed size mapping:

| Legacy `size` | Registry behavior                          |
| ------------- | ------------------------------------------ |
| `xs`          | `icon-xs`                                  |
| `small`       | `sm`                                       |
| `regular`     | `default`                                  |
| `large`       | Applique-owned full-width captioned recipe |

### Illustrative facade code

This is a core mapping sketch, not source currently shipped by `v0.1.0`. The
production implementation must also cover the remaining audited behaviors.
The illustrative `icon-adapter` import represents an Applique-owned resolver
that must be designed and published before this facade can ship.

```tsx
import * as React from 'react'

import { Badge } from '@/components/applique-shadcn/badge'
import { Button as RegistryButton } from '@/components/applique-shadcn/button'
import { Spinner } from '@/components/applique-shadcn/spinner'
import {
  AppliqueIcon,
  notificationBellIcon,
  type IconName,
} from '@/components/applique-facades/icon-adapter'
import { cn } from '@/lib/utils'

type RegistryButtonProps = React.ComponentProps<typeof RegistryButton>

type AppliqueOwnedButtonProps = {
  type?: 'primary' | 'secondary' | 'tertiary' | 'link' | 'text'
  htmlType?: 'button' | 'submit' | 'reset'
  size?: 'xs' | 'small' | 'regular' | 'large'
  loading?: boolean
  notifications?: number
  icon?: IconName
  secondaryIcon?: IconName
  caption?: string
  transform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase'
  inheritTextColor?: boolean
  children?: React.ReactNode
  label?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: RegistryButtonProps['onClick']
}

export type AppliqueButtonProps = Omit<
  RegistryButtonProps,
  | 'variant'
  | 'size'
  | 'type'
  | 'disabled'
  | 'children'
  | 'className'
  | 'style'
  | 'onClick'
  | 'render'
  | 'nativeButton'
  | 'ref'
> &
  AppliqueOwnedButtonProps & {
    disabled?: boolean
  }

const variantMap = {
  primary: 'default',
  secondary: 'outline',
  tertiary: 'ghost',
  link: 'link',
  text: 'link',
} as const

const sizeMap = {
  xs: 'icon-xs',
  small: 'sm',
  regular: 'default',
} as const

export const AppliqueButton = React.forwardRef<
  HTMLButtonElement,
  AppliqueButtonProps
>(function AppliqueButton(
  {
    type = 'secondary',
    htmlType = 'button',
    size = 'regular',
    loading = false,
    disabled = false,
    notifications,
    children,
    label,
    icon,
    secondaryIcon,
    caption,
    transform = 'none',
    inheritTextColor = false,
    className,
    style,
    onClick,
    ...primitiveProps
  },
  ref
) {
  if (size === 'xs' && !icon) {
    throw new Error("'icon' is required when size is 'xs'")
  }
  if (size === 'xs' && (children || label)) {
    throw new Error("'children' and 'label' are not allowed with size 'xs'")
  }

  const isNotificationButton = typeof notifications === 'number'
  const notificationsActive = isNotificationButton && notifications > 0
  const content = children || label
  const isIconButton = !content || isNotificationButton
  const leadingIcon = isIconButton ? icon ?? notificationBellIcon : icon

  return (
    <RegistryButton
      {...primitiveProps}
      ref={ref}
      variant={notificationsActive ? 'default' : variantMap[type]}
      size={size === 'large' ? 'default' : sizeMap[size]}
      type={htmlType}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={
        primitiveProps['aria-label'] ??
        (isNotificationButton ? `${notifications} notifications` : undefined)
      }
      className={cn(
        size === 'large' && 'applique-large-button',
        type === 'text' && 'applique-text-button',
        inheritTextColor && 'text-inherit',
        className
      )}
      style={{ ...style, textTransform: transform }}
      onClick={loading || disabled ? undefined : onClick}
    >
      {loading ? (
        <Spinner data-icon="inline-start" aria-hidden="true" />
      ) : leadingIcon ? (
        <span data-icon="inline-start" aria-hidden="true">
          <AppliqueIcon name={leadingIcon} />
        </span>
      ) : null}
      {!isIconButton ? <span>{content}</span> : null}
      {!isIconButton && secondaryIcon ? (
        <span data-icon="inline-end" aria-hidden="true">
          <AppliqueIcon name={secondaryIcon} />
        </span>
      ) : null}
      {notificationsActive ? (
        <Badge title={notifications.toString()}>
          {notifications > 99 ? '99+' : notifications}
        </Badge>
      ) : null}
      {size === 'large' && caption ? <small>{caption}</small> : null}
    </RegistryButton>
  )
})
```

The production facade would also need:

- concrete Applique icon resolution;
- accessible labels for icon-only/loading states;
- `href` anchor rendering;
- `to` router integration selected with client teams;
- conflict validation for `href` and `to`;
- final CSS for the large, `text`, notification, and interaction-state
  inherited-color compatibility recipes;
- the legacy 100 ms click-cooldown decision;
- validation that `xs` has an icon and no label content;
- a decision on whether `onClick` preserves the legacy declared DOM event type,
  preserves its actual React-event runtime behavior, or adopts the registry
  event type as an approved correction;
- polymorphic `render`, callback `className`/`style`, and non-button refs only
  after the facade handles them explicitly;
- unit, interaction, accessibility, and visual tests.

### Import paths during phased migration

Both existing import forms remain unchanged:

```tsx
import { Button } from '@applique-ui/uikit'
import Button from '@applique-ui/button'
```

New primitive code can use a separate client alias:

```tsx
import { Button } from '@/components/applique-shadcn/button'
```

When a facade is implemented, give it another explicit path:

```tsx
import { AppliqueButton } from '@/components/applique-facades/button'
```

This prevents existing screens from migrating merely because a registry is
installed.

## 11. Client requirements and installation

### Hard requirements

| Requirement                                    | Where needed                                    | Why                                                                              |
| ---------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Node.js `>=20.18.1`                            | Install/update command and registry maintenance | Required by the pinned CLI/tooling                                               |
| `shadcn@4.16.0`                                | Install/update command                          | Reproducible registry interpretation                                             |
| React and React DOM 18                         | Application                                     | Registry source baseline; tested at `18.3.1`                                     |
| Tailwind CSS 4                                 | Application build/styling                       | Copied source uses Tailwind utilities and the theme uses Tailwind 4 features     |
| TypeScript/TSX                                 | Application build                               | Current release publishes TypeScript source only                                 |
| Compatible `components.json`                   | Install/update command                          | Uses `base-nova`, TSX, CSS variables, and valid `ui`, `lib`, and `hooks` aliases |
| Matching TS/bundler aliases                    | Application build                               | Resolves generated local imports                                                 |
| Loaded global CSS with `@import 'tailwindcss'` | Application                                     | Receives and compiles the installed theme                                        |
| Network access to registry and npm metadata    | Install/update command                          | Fetches JSON and exact dependencies                                              |

Node 20 is an installation-tool requirement. The copied component source adds
no Node 20 runtime requirement. A client can keep Node 18 for its normal
development/build workflow only if its own framework and dependencies support
it.

Tailwind is not an Applique npm runtime dependency, but Tailwind 4 **is a hard
consumer styling/build prerequisite** for the current source registry. A
non-Tailwind client needs a separately designed compiled-CSS distribution.

Tailwind 4 plus `@import 'tailwindcss'` is not yet sufficient for all motion
styles; see the known animation-delivery gap in section 5.

The exact alias paths and CSS filename remain client-owned; only the compatible
configuration characteristics are required.

### What clients do not need

- no runtime import from `@rohangore1999/shadcn-primitives`;
- no Applique registry npm package;
- no separate token package;
- no separate Tailwind preset;
- no requirement to copy Applique's sample `components.json` paths;
- no manual installation of every transitive dependency.

### Client-owned `components.json`

Applique does not own the client's config. The CLI reads it to determine where
to copy files and which global CSS file to update.

A recommended new namespace that avoids collision with legacy components is:

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
    "ui": "@/components/applique-shadcn",
    "utils": "@/lib/utils",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

These exact paths are a recommendation, not a registry contract. An existing
shadcn application can keep its own aliases. The aliases must also resolve in
TypeScript and the bundler, for example:

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

The current full-registry smoke test uses the conventional
`@/components/ui` destination. The separate
`@/components/applique-shadcn` namespace is recommended to prevent legacy
collisions, but it still needs an explicit complex-component pilot or an added
custom-alias smoke case before organization-wide adoption.

The configured CSS entry must be loaded by the application and contain:

```css
@import 'tailwindcss';
```

### Install Button

For evaluation, use both the pinned CLI and versioned registry path:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
```

With the recommended aliases, the result is typically:

```text
src/components/applique-shadcn/button.tsx
src/lib/applique-react18-compat.ts
src/lib/utils.ts
src/index.css
```

If `src/lib/utils.ts` already exists with the normal `cn()` export, keep it.
The Applique compatibility helper is installed separately.

Then import the local source:

```tsx
import { Button } from '@/components/applique-shadcn/button'

export function Actions() {
  return (
    <div className="flex gap-2">
      <Button variant="default">Save</Button>
      <Button variant="outline">Cancel</Button>
    </div>
  )
}
```

The primitive exposes the pinned shadcn variants:
`default`, `secondary`, `outline`, `ghost`, `destructive`, and `link`.

It exposes sizes:
`xs`, `sm`, `default`, `lg`, `icon`, `icon-xs`, `icon-sm`, and `icon-lg`.

### Install multiple components

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/checkbox.json \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/dialog.json
```

### Install a new shadcn-only capability

No legacy facade is needed:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/carousel.json
```

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/applique-shadcn/carousel'
```

Use the primitive API until UX identifies an Applique-specific contract worth
owning.

### Form and Message Scroller

Use Field instead of the fileless Form item:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/field.json
```

Message Scroller has no install command in the React 18 baseline.

### Current alias versus versioned URL

This mutable URL is useful for exploration:

```text
https://rohangore1999.github.io/applique-ui/registry/button.json
```

During evaluation, prefer the versioned path:

```text
https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
```

Before production adoption, replace the personal domain with the approved
durable organization host, regenerate the release so all embedded dependencies
use it, and then keep that versioned URL available permanently.

### Managed office TLS

If the CLI reports `self-signed certificate in certificate chain`, Node does
not trust the corporate proxy CA used while reaching public metadata.

Use the approved platform PEM:

```sh
NODE_EXTRA_CA_CERTS=/approved/path/corporate-ca.pem \
  npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
```

Never disable TLS verification.

## 12. Client ownership, customization, and updates

### Ownership after installation

Files copied into the client repository belong to that client. The team may:

- inspect them;
- compose them;
- add application-specific variants;
- make reviewed local changes;
- keep a pre-existing compatible `utils.ts`.

Local modifications create an intentional fork. The client owns future merge
work and consistency risk.

### Update flow

```mermaid
sequenceDiagram
  participant A as Applique
  participant R as Versioned registry
  participant C as Client developer
  participant G as Client Git

  A->>R: Publish v0.2.0 button source
  C->>G: Create clean update branch
  C->>R: Run shadcn 4.16.0 add with v0.2.0 URL
  R-->>C: Copy proposed source and dependencies
  C->>G: Inspect source and dependency diff
  alt No local conflict
    C->>G: Accept and test update
  else Client customized source
    C->>G: Merge Applique change with local behavior
  end
  C->>C: Type, interaction, accessibility, and visual tests
  C->>G: Commit accepted update
```

An installed component does not change merely because Applique publishes a
new registry version.

Recommended client procedure:

1. Start from a clean branch.
2. Choose the target immutable registry version.
3. Run `shadcn add` for the item.
4. If prompted about an existing file, overwrite only on the isolated branch
   when deliberately producing the proposed diff.
5. Review source, CSS, and dependency changes.
6. Merge local customizations.
7. Run client tests and visual checks.
8. Commit the accepted source.

Example future update:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.2.0/button.json
```

### What “source diff/merge” and “client must accept” mean

Suppose the client changed Button spacing locally and `v0.2.0` changes focus
behavior:

```diff
- className="h-8 px-4 focus:ring-2"
+ className="h-9 px-4 focus-visible:ring-3"
```

Git shows the proposed registry change against the client-owned file. The
client decides whether to:

- take the new source;
- keep the local behavior;
- combine both;
- defer the update.

That decision is the acceptance step. The registry does not silently overwrite
production code.

## 13. Adoption and migration plan

### Keep legacy and new paths separate

Installing registry source must not alter existing imports. Migrate one
component or screen at a time:

```text
Existing screen
  @applique-ui/uikit
  remains unchanged

New or migrated screen
  local registry primitive
  or reviewed local Applique facade
```

### Recommended phased rollout

1. **Adopt primitives for new capabilities**
   - install shadcn-only components directly;
   - use Applique tokens;
   - avoid creating a facade without an owned contract.
2. **Pilot direct migrations**
   - start with low-risk Direct mappings;
   - audit props and real usage;
   - get UX approval;
   - build and test a facade only if compatibility is valuable.
3. **Implement selected compositions**
   - Button, Banner, InputDate, and similar components;
   - write explicit state and accessibility behavior;
   - test interactions rather than only types.
4. **Audit ambiguous components**
   - classify each real usage before selecting a target;
   - split a legacy component into multiple clearer facades if necessary.
5. **Retain Applique-only no-equivalent capabilities**
   - keep Applique implementations;
   - introduce a custom registry item only after design and technical review.
6. **Measure adoption**
   - record registry versions per client;
   - track intentional forks;
   - retire a legacy component only after usage reaches zero.

### Per-component migration workflow

```mermaid
flowchart TD
  Inventory["Inventory real client usage"] --> Classify["Choose migration classification"]
  Classify --> UX["Resolve UX defaults, states, spacing, and semantics"]
  UX --> Props["Audit every legacy prop"]
  Props --> Design{"Primitive alone sufficient?"}
  Design -->|yes| Primitive["Install and use primitive"]
  Design -->|no| Facade["Write facade or composition"]
  Facade --> Tests["Unit, interaction, a11y, visual, and client tests"]
  Primitive --> Tests
  Tests --> Approval["UX and engineering approval"]
  Approval --> Pilot["Pilot in one dashboard"]
  Pilot --> Rollout["Migrate incrementally"]
```

## 14. Catalogue

Public catalogue:

```text
https://rohangore1999.github.io/applique-ui/catalog/
```

The canonical guide itself is repository Markdown at `docs/REGISTRY.md`; the
current static catalogue does not render it as a catalogue route.

Useful routes:

```text
/catalog/#/components/button
/catalog/#/migration
```

The catalogue provides:

- left-side component navigation;
- lazy live previews for source-bearing components;
- source-derived exports and owned props;
- inherited/forwarded primitive type surfaces;
- current-alias install commands for exploration;
- raw registry JSON on demand;
- unavailable states for Form and Message Scroller;
- Direct, Composition, No equivalent, and Ambiguous migration tabs;
- curated prop audits where available.

Most previews are vendored from the pinned upstream commit. Direction and
Message have local minimal previews because the upstream examples are missing
or depend on private documentation helpers.

### Catalogue data ownership

- API metadata comes from normalized checked-in source.
- Migration classifications and prop audits come from
  `catalog/component-mappings.json`.
- Metadata generation validates mapping IDs, strategies, directions,
  component/prop references, and legacy component coverage.
- Similar names are never used to infer compatibility automatically.
- A mapping remains `proposed` until UX and real usage are reviewed.

The catalogue currently copies the mutable root item URL. For a reproducible
client adoption, replace it with the approved host's versioned path before
running the command.

### Regenerate catalogue metadata

From the repository root:

```sh
node packages/shadcn-primitives/scripts/generate-catalog-metadata.js \
  --metadata-only
```

To refresh examples from a prepared snapshot:

```sh
node packages/shadcn-primitives/scripts/generate-catalog-metadata.js \
  --examples-dir /private/tmp/shadcn-examples-base
```

Use `--fetch-missing` only during an intentional upstream example refresh.
Normal builds and type checks are offline.

## 15. Maintainer workflows

Run package commands from:

```sh
cd packages/shadcn-primitives
```

### Build registry and catalogue

```sh
pnpm run build:pages
```

This:

1. generates current and versioned registry JSON;
2. checks and validates the generated registry;
3. builds the static catalogue under `docs/catalog` from the metadata already
   checked in.

`build:pages` does not regenerate catalogue metadata. When normalized component
source or mapping metadata changes, run this first from the repository root:

```sh
node packages/shadcn-primitives/scripts/generate-catalog-metadata.js \
  --metadata-only
```

`--metadata-only` does not vendor examples. Use `--examples-dir` or the
intentional `--fetch-missing` workflow from section 14 when refreshing upstream
examples. Editing an already vendored preview directly requires only the normal
catalogue build.

### Add or update an official shadcn component

The current registry already tracks all 62 official UI entries. For a future
upstream addition or change:

1. confirm a stable shadcn CLI version and Base/Nova upstream commit;
2. fetch or prepare the reviewed item JSON;
3. update the sync item list and exact pins if required;
4. run the explicit sync;
5. review raw snapshot, transformed source, dependency, and hash changes;
6. add or update a preview;
7. update migration metadata if the capability relates to Applique;
8. build and run all release gates;
9. publish under a new registry version after adoption.

### Enable and add the first Applique facade or custom composition

The current implementation accepts only the fixed foundation, hook, and 62
official UI entries. A facade cannot safely be added to the manifest yet. Before
the first facade, extend the infrastructure to:

1. preserve Applique-owned facade items when upstream sync reconstructs the
   manifest;
2. teach validation about custom item types/counts without weakening official
   62-item coverage checks;
3. generate catalogue metadata and previews for facade entries;
4. install and test facade entries in the isolated registry consumer smoke;
5. add a complex-item test for the recommended custom `ui` alias.

After that infrastructure exists:

1. approve the component relationship and prop audit;
2. add handwritten source under a clearly owned facade/composition path;
3. import registry primitives rather than the workspace package;
4. add a separate manifest item with explicit dependencies;
5. keep its import path distinct from legacy package imports and raw
   primitives;
6. add catalogue documentation and examples;
7. add unit, interaction, accessibility, and visual tests;
8. run the full isolated registry consumer smoke test;
9. version the registry.

Do not silently replace the primitive item with facade behavior. Clients must
be able to choose the normal shadcn primitive or the Applique-owned facade.

### Change a dependency

1. Verify React 18 and Tailwind 4 compatibility.
2. Use an exact version, never `latest` or a range.
3. Update the sync dependency pin.
4. Regenerate the lock and manifest.
5. Review transitive runtime impact.
6. Run the full client installation smoke test.

## 16. Validation and testing

### Required commands

From `packages/shadcn-primitives`:

```sh
pnpm run validate:registry
pnpm exec tsc --noEmit -p tsconfig.json
pnpm exec tsc --noEmit -p catalog/tsconfig.json
pnpm run smoke:react18
pnpm run smoke:registry
```

### What each gate protects

| Gate                 | Protects                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate:registry`  | generated parity, schemas, path safety, exact pins, source hashes, counts, statuses, dependency graph, current/versioned parity, theme contract |
| package TypeScript   | normalized source and public exports                                                                                                            |
| catalogue TypeScript | catalogue source, previews, and metadata use                                                                                                    |
| `smoke:react18`      | real React 18 Button/Input/Calendar refs and Calendar focus behavior                                                                            |
| `smoke:registry`     | actual CLI install of all 60 UI entries into an isolated React 18/Tailwind 4 client                                                             |

The full registry smoke also verifies:

- TypeScript compilation;
- Tailwind CSS compilation;
- exact npm dependencies;
- token and font installation;
- scoped dark behavior;
- component dependency resolution;
- aliases and paths;
- preservation of a pre-existing client `utils.ts`;
- installation of the separate compatibility helper.

`smoke:registry` requires network access because it runs the real pinned shadcn
CLI and installs dependencies.

### Local catalogue

```sh
pnpm run build:pages
pnpm run serve:catalog
```

Open:

```text
http://localhost:4173/catalog/#/components/button
http://localhost:4173/catalog/#/migration
```

## 17. Manual GitHub Pages publishing

The registry and catalogue require only static HTTPS hosting. There is no
database, application server, or package registry requirement.

The current evaluation setup uses GitHub Pages and intentionally has no custom
publishing workflow. Production adoption first requires an approved durable
organization host.

### Hosting layout

```text
docs/
  .nojekyll
  index.html                    -> redirects to catalogue
  catalog/                      -> static catalogue bundle
  registry/
    registry.json               -> current catalogue
    button.json                 -> current Button alias
    v0.1.0/
      registry.json             -> versioned catalogue
      button.json               -> immutable Button item
```

### Publish

1. Use Node.js `>=20.18.1` and install locked workspace dependencies.
2. If normalized source or mapping inputs changed, regenerate catalogue
   metadata from the repository root:

   ```sh
   node packages/shadcn-primitives/scripts/generate-catalog-metadata.js \
     --metadata-only
   ```

   For upstream example refreshes, use the separate `--examples-dir` or
   `--fetch-missing` flow in section 14. A direct edit to an existing preview
   needs a catalogue rebuild, not `--metadata-only`.

3. On `shadcn-components-integration`, generate with the final evaluation URL:

   ```sh
   cd packages/shadcn-primitives
   APPLIQUE_REGISTRY_BASE_URL=https://rohangore1999.github.io/applique-ui/registry \
     pnpm run build:pages
   ```

4. Run:

   ```sh
   pnpm run validate:registry
   pnpm exec tsc --noEmit -p tsconfig.json
   pnpm exec tsc --noEmit -p catalog/tsconfig.json
   pnpm run smoke:react18
   pnpm run smoke:registry
   ```

5. Inspect the catalogue locally.
6. Commit source plus all generated `docs/registry` and `docs/catalog` changes.
7. Push `shadcn-components-integration`.
8. In GitHub **Settings → Pages**, choose:
   - **Deploy from a branch**;
   - branch `shadcn-components-integration`;
   - folder `/docs`.
9. Verify:

   ```text
   https://rohangore1999.github.io/applique-ui/
   https://rohangore1999.github.io/applique-ui/catalog/
   https://rohangore1999.github.io/applique-ui/registry/registry.json
   https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
   ```

If the host changes before adoption, update `registry.json` (`homepage` and
`meta.registryBaseUrl`) and rebuild with the final URL before publishing. Do
not relocate an adopted version unless the old URLs remain available through
stable hosting or redirects.

### Static-host requirements

Any future host must:

- serve registry JSON and catalogue assets over HTTPS;
- preserve paths and case;
- expose versioned directories indefinitely;
- allow the CLI environment to fetch item URLs;
- avoid rewriting JSON responses to HTML;
- publish with the exact base URL embedded in dependency links.

## 18. Governance and UX decisions

### Ownership

| Decision                           | Primary owner        | Required collaborators        |
| ---------------------------------- | -------------------- | ----------------------------- |
| Tokens and visual semantics        | UX/design system     | Applique maintainers          |
| Upstream pin and source transforms | Applique maintainers | security/platform when needed |
| Facade prop contract               | Applique + UX        | representative client teams   |
| Client-specific composition        | Client team          | UX for deliberate divergence  |
| Accepting a registry update        | Client team          | Applique for breaking changes |
| Version immutability               | Applique maintainers | all known consumers           |

### Questions for UX before approving a facade

1. Is the goal pixel equivalence with legacy Applique, or adoption of the new
   Base/Nova visual?
2. What are the semantic variants and their names?
3. What are the exact default variant and size?
4. Which padding, margin, height, radius, type, and icon values are tokens?
5. Are component-level margins allowed, or should layout own spacing?
6. Which loading, disabled, error, success, selected, active, and destructive
   states exist?
7. What is the intended responsive behavior?
8. What keyboard, focus, screen-reader, and reduced-motion behavior is
   required?
9. Which props are safe customization points?
10. Which existing escape hatches should be removed?
11. How should links and client routers behave?
12. Is dark mode in scope? If so, where is the complete reviewed token set?
13. For ambiguous components, what user intent distinguishes each target?
14. Can UX approve value mappings and intentional visual differences?
15. What evidence is required before the mapping changes from `proposed` to
    `approved`?

### Engineering approval criteria

- At least one representative client usage inventory exists.
- No unresolved `needs-review` props remain.
- Defaults and events are documented.
- The facade does not break primitive imports.
- Dependencies are exact and React 18 compatible.
- Automated interaction and accessibility tests exist.
- UX has reviewed all states, not only the default screenshot.
- The registry versioning impact is decided before publishing.

## 19. Risks and trade-offs

| Risk                                                   | Impact                                         | Mitigation                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Clients fork installed source                          | UI can diverge                                 | semantic tokens, documented boundaries, opt-in update cadence, catalogue comparison                  |
| Clients never update                                   | fixes do not propagate                         | release notes, ownership tracking, periodic audits                                                   |
| Versioned URL is mutated                               | reproducibility breaks                         | immutable-version policy and Git review; historical immutability is not yet validator-enforced       |
| Facade tries to map everything automatically           | silent semantic bugs                           | per-component audits and handwritten tests                                                           |
| Primitive props leak through facade                    | future library swap affects clients            | distinguish stable owned props from implementation extensions                                        |
| Central team lacks capacity                            | registry/facade becomes stale                  | keep primitives close to pinned upstream; require contributing teams to include tests and docs       |
| Existing `utils.ts` collision                          | installed source cannot compile                | separate `applique-react18-compat` item; no-overwrite smoke                                          |
| Tailwind assumed to be optional                        | UI installs without styling                    | state Tailwind 4 as build prerequisite; consider another distribution only as a separate project     |
| Animation utility CSS is absent from registry delivery | 11 interactive components lose intended motion | add `shadcn/tailwind.css` and `tw-animate-css` through the theme graph and verify compiled utilities |
| React 19-only upstream feature enters graph            | React 18 client breaks                         | compatibility audit, exact pins, explicit unsupported status                                         |
| Ambiguous mapping selected by name                     | incorrect semantics                            | inventory real usage before choosing target                                                          |
| Local arbitrary colors/spacing                         | consistency erodes                             | semantic tokens and UX-approved extension points                                                     |

### If Applique later leaves shadcn

The facade provides a migration boundary:

```text
Applique-owned props
  -> existing facade contract
  -> new internal adapter
  -> replacement primitive
```

Clients using only the stable facade contract should see minimal change.
Clients importing raw registry primitives or using shadcn-specific extension
props may need migration. The facade reduces coupling; it cannot erase
implementation-specific usage.

## 20. Troubleshooting

### The CLI asks whether to overwrite `utils.ts`

Keep a standard client-owned `utils.ts` that exports `cn()`. The Applique React
18 helpers install to a separate file. Do not use global overwrite without
reviewing local files.

### An `@/` import does not resolve

Align:

- `components.json` aliases;
- TypeScript `paths`;
- bundler aliases;
- actual source directories.

### A component has no styling

Confirm:

- `components.json` points to the CSS file the app loads;
- that file imports Tailwind 4;
- Applique theme variables were merged;
- the Tailwind build scans the installed source path;
- the font dependency and import were installed.

### The install fails on Node 18

Run only the shadcn install/update command with Node `>=20.18.1`. This does not
automatically require changing the application's normal runtime/build Node
version.

### The install fails with a certificate-chain error

Use the approved corporate PEM through `NODE_EXTRA_CA_CERTS`. Do not set
`NODE_TLS_REJECT_UNAUTHORIZED=0`.

### A JavaScript-only client cannot compile the source

The current registry is TypeScript-only. A JavaScript client needs a separately
reviewed conversion/build path.

### A prop has the same name but behaves differently

Treat it as `mapped`, not `forwarded`. Document the value/event conversion and
test it.

### The catalogue says “Prop audit pending”

No audited migration contract exists for that relationship yet. Use the
primitive API for new code or complete the usage/UX/prop audit before building
a facade.

### Form cannot be installed

Install Field. Form is intentionally fileless and deprecated.

### Message Scroller cannot be installed

It requires React 19 upstream and is intentionally excluded from the React 18
release.

## 21. Pending action items and what to pick next

The recommended next action is **P0.1: complete animation CSS delivery**. It is
the only confirmed functional styling gap in the current registry and affects
11 interactive components. Complete it before asking a client team to evaluate
the registry.

Do not start bulk facade implementation or attempt to map every component next.
First make the primitive delivery path complete, select its durable host, and
prove it in one client.

### Recommended execution order

1. Complete and test the primitive styling/dependency graph.
2. Finalize the distribution contract: host, version policy, and install URLs.
3. Run an end-to-end pilot in one representative React 18 dashboard.
4. Choose and implement one low-risk Direct facade.
5. Use that learning before implementing Button or other compositions.
6. Establish the ongoing ownership and client-update process.

### Prioritized decision queue

| ID   | Priority             | Pending action or decision                                                                                | Suggested owner               | Done when                                                                                                                                               |
| ---- | -------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0.1 | Before pilot         | Deliver `shadcn/tailwind.css` and `tw-animate-css` through the registry theme/dependency graph            | Applique engineering          | A clean client receives the required CSS automatically and smoke tests assert representative animation utilities                                        |
| P0.2 | Before pilot         | Test the recommended `@/components/applique-shadcn` alias with a complex recursive component              | Applique engineering          | The smoke fixture installs and type-checks a component such as Dialog or Sidebar under the custom alias                                                 |
| P0.3 | Before adoption      | Choose an organization-owned durable HTTPS host                                                           | Applique owner + platform     | Host, owner, retention policy, and support route are recorded; generated dependency URLs use that host                                                  |
| P0.4 | Before adoption      | Make catalogue install commands versioned                                                                 | Applique engineering          | Copying an install command uses the approved host and immutable release path rather than the root alias                                                 |
| P0.5 | Before adoption      | Decide when `v0.1.0` becomes immutable and record its consumers                                           | Applique owner + pilot team   | First adoption is recorded and later changes require a new version                                                                                      |
| P0.6 | Before adoption      | Select one pilot dashboard and named engineering/UX owners                                                | Product team + UX             | One team accepts source ownership, update responsibility, and success criteria                                                                          |
| P0.7 | Before adoption      | Review the experimental primitive baseline with UX                                                        | UX + Applique                 | Tokens, typography, default states, and intentional Base/Nova differences are approved for the pilot                                                    |
| P1.1 | Before first facade  | Extend sync, validation, catalogue generation, and registry smoke to support Applique-owned facade items  | Applique engineering          | A sample custom facade survives sync, validates, appears in the catalogue, installs, and is tested                                                      |
| P1.2 | First facade         | Choose the first facade                                                                                   | UX + pilot team               | A real usage inventory selects one contract; `InputText → Input` is the recommended low-risk Direct pilot                                               |
| P1.3 | First facade         | Complete and approve that component's prop audit                                                          | Applique engineering + UX     | Every prop is classified and no `needs-review` entries remain                                                                                           |
| P1.4 | Before Button facade | Resolve Button-specific open decisions                                                                    | UX + client teams             | Icon adapter, color semantics, event contract, router integration, notification layout, caption layout, inherited color, and click cooldown are decided |
| P1.5 | Mapping completeness | Classify Collapsible and reconcile deprecated Form coverage                                               | Applique engineering + UX     | Every registry capability has an intentional migration classification or explicit exception                                                             |
| P2.1 | Operating model      | Define registry release notes, contribution ownership, client update cadence, and intentional-fork policy | Applique owner + client teams | Each release has an owner and clients know how and when to review updates                                                                               |
| P2.2 | Hardening            | Automate historical version immutability                                                                  | Applique engineering          | CI rejects changes to adopted version directories using a release ledger or trusted hashes                                                              |
| P2.3 | Later scope          | Decide whether dark mode or non-Tailwind/JavaScript distribution is needed                                | UX + architecture             | Demand and ownership justify a separately designed contract; do not infer it from the current release                                                   |

### Recommended pilot scope

Use one client dashboard and install a deliberately small set:

- **Button** to verify variants, sizes, tokens, font, and React 18 refs;
- **Checkbox** to verify a simple controlled primitive;
- **Dialog** to verify recursive dependencies, portals, focus behavior, and the
  repaired animation pipeline.

For this first pilot, use primitive APIs only. Existing
`@applique-ui/uikit` and `@applique-ui/button` imports remain untouched. The
pilot should validate the registry mechanism before adding facade complexity.

### Pilot exit criteria

- [ ] The approved versioned URL works from the client's real network.
- [ ] The custom alias installs all nested files in the intended locations.
- [ ] Existing client `utils.ts` remains intact.
- [ ] Tailwind, Applique tokens, Hanken Grotesk, and animation utilities compile.
- [ ] Button, Checkbox, and Dialog pass type, interaction, accessibility, and visual checks.
- [ ] Existing Applique imports and screens remain unchanged.
- [ ] The team records any local source customization and who owns future merges.
- [ ] UX and the client engineering owner approve or document every observed difference.

### Next-selection record

Update this table when the team chooses the next milestone:

| Decision                | Current selection                      |
| ----------------------- | -------------------------------------- |
| Next action             | P0.1 — complete animation CSS delivery |
| Engineering owner       | TBD                                    |
| UX owner                | TBD                                    |
| Pilot dashboard/team    | TBD                                    |
| Durable registry host   | TBD                                    |
| First immutable release | TBD                                    |
| First facade candidate  | InputText, pending usage audit         |

## 22. Checklists

### Client onboarding

- [ ] Client accepts source ownership and opt-in updates.
- [ ] Install/update environment can run Node `>=20.18.1`.
- [ ] Application uses React 18.
- [ ] Application supports TypeScript/TSX.
- [ ] Application build supports Tailwind CSS 4.
- [ ] `components.json` points to the correct loaded CSS file.
- [ ] Client selects a non-conflicting UI alias.
- [ ] TypeScript and bundler aliases match.
- [ ] Team chooses immutable versioned URLs.
- [ ] Team uses an approved durable host, not the personal evaluation domain.
- [ ] Team accepts that the current primitive release is experimental.
- [ ] Team defines local customization and update ownership.
- [ ] One component is installed and tested in a pilot branch.

### Component facade

- [ ] Real usages inventoried.
- [ ] Direct, Composition, No equivalent, or Ambiguous selected.
- [ ] UX intent and defaults approved.
- [ ] Every legacy prop classified.
- [ ] All `needs-review` items resolved.
- [ ] Non-conflicting primitive extension props identified.
- [ ] Applique-controlled props override spread props.
- [ ] Accessible behavior tested.
- [ ] Responsive and router behavior tested.
- [ ] Visual regression coverage added.
- [ ] Catalogue mapping and example updated.

### Registry release

- [ ] Correct registry version selected.
- [ ] Adopted version directories unchanged.
- [ ] Exact dependency pins reviewed.
- [ ] Upstream/source hashes regenerated intentionally.
- [ ] Tokens reviewed with UX.
- [ ] Base/Nova animation CSS delivery and smoke coverage completed before production.
- [ ] Catalogue metadata regenerated when its inputs changed.
- [ ] Registry and catalogue built with final base URL.
- [ ] Registry validation passed.
- [ ] Package TypeScript passed.
- [ ] Catalogue TypeScript passed.
- [ ] React 18 runtime smoke passed.
- [ ] Full registry install smoke passed.
- [ ] Local catalogue reviewed.
- [ ] Generated `docs/registry` and `docs/catalog` committed.
- [ ] Published URLs verified.

## 23. Glossary

| Term                   | Meaning                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Registry primitive     | Pinned shadcn source with Applique tokens, copied into a client                            |
| Facade                 | Applique-owned public component contract presented to client code                          |
| Adapter                | Internal facade logic translating Applique props/events to primitives                      |
| Composition            | A component built from multiple primitives plus owned behavior                             |
| Forwarded prop         | Same name and semantics passed through                                                     |
| Mapped prop            | Renamed or converted prop/event                                                            |
| Composition-owned prop | Prop consumed to build behavior across primitives                                          |
| Extension prop         | Non-conflicting primitive prop exposed through a facade with weaker portability guarantees |
| Source diff/merge      | Client review and reconciliation of a newly installed registry version                     |
| Current alias          | Mutable root item URL pointing to the newest release                                       |
| Versioned item         | Immutable reproducible registry URL after adoption                                         |
| Foundation item        | Theme or shared library item automatically installed through the registry graph            |
| Client-owned source    | Files copied by shadcn into the consuming repository                                       |

The architectural rule to remember is:

> **Use registry primitives as the shared, client-owned foundation. Add
> Applique facades only for contracts the organization is willing to own,
> review, and test.**
