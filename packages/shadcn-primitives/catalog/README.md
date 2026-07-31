# Registry catalogue

The catalogue is a static React page for inspecting the pinned shadcn
Base/Nova registry through Applique semantic tokens. It lists all 62 upstream
component entries:

- 60 installable entries have lazy-loaded live previews and source-derived API
  metadata.
- `Form` is retained as a deprecated discovery entry and points consumers to
  `Field`; no install command is advertised for it.
- `Message Scroller` is retained for discovery but is unavailable because its
  upstream primitive requires React 19.

Most previews are vendored from the pinned upstream commit. `Direction` and
`Message` use local minimal previews because Direction has no upstream example
and Message depends on private shadcn docs helpers. Registry JSON is fetched
only when someone asks to view source.

## Build and inspect

From the repository root:

```sh
pnpm exec tsc --project packages/shadcn-primitives/catalog/tsconfig.json
node packages/shadcn-primitives/catalog/build.js
pnpm exec serve docs
```

Open `/catalog/#/components/button`. The isolated build is written to
`docs/catalog`; it does not rewrite `docs/registry`.

Open `/catalog/#/migration` for the Applique-to-shadcn migration map. The map
keeps four relationship strategies separate from the functional component
categories:

- `direct`: one shadcn component family covers the primary interaction;
- `composition`: multiple families and Applique-owned glue are required;
- `no-equivalent`: a capability exists on only one side;
- `ambiguous`: the correct target depends on how the component is used.

Mappings are curated in `component-mappings.json`; they are not inferred from
similar component names. `no-equivalent` records must identify their direction
by leaving either the Applique or shadcn side empty. Keep a mapping at
`proposed` until UX and real client usage have been reviewed, then mark it
`approved`.

Selected relationships also contain a curated `propMappings` audit. Expand
**Prop migration** on a row to distinguish:

- `forwarded`: the same prop name and behavior passes through unchanged;
- `mapped`: the facade renames the prop or converts values/events;
- `composition-owned`: the facade consumes the prop and builds the behavior;
- `unsupported`: the prop is deliberately excluded from the new contract;
- `needs-review`: usage or UX intent is unresolved.

An absent prop audit is displayed as pending; it never means that a component
has no props or that all props are automatically compatible. A component
mapping cannot be marked `approved` while its audit still contains
`needs-review` entries.

## Refresh generated catalogue files

Regenerate API metadata and preview-loader mappings from the checked-in source
and pinned lock:

```sh
node packages/shadcn-primitives/scripts/generate-catalog-metadata.js --metadata-only
```

To refresh the vendored official examples from a prepared snapshot directory:

```sh
node packages/shadcn-primitives/scripts/generate-catalog-metadata.js \
  --examples-dir /private/tmp/shadcn-examples-base
```

Add `--fetch-missing` only when intentionally refreshing missing files from the
pinned upstream commit. Normal type-checks and builds never require network
access.

API metadata describes exact checked-in exports, locally declared props, and
the inherited or forwarded type surfaces. It does not pretend to flatten
third-party primitive types into Applique-owned props.

The generator also validates component and prop mapping IDs, strategies,
referenced component slugs, prop targets, direction, and coverage of every
checked-in legacy Applique component.
