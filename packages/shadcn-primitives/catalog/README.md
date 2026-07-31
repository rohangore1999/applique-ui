# Registry catalogue

The catalogue is a static React page for inspecting the pinned shadcn
Base/Nova registry through Applique semantic tokens. It lists all 62 upstream
component entries:

- 61 installable entries have lazy-loaded live previews and source-derived API
  metadata.
- `Form` is retained as a deprecated discovery entry and points consumers to
  `Field`; no install command is advertised for it.

Most previews are vendored from the pinned upstream commit. `Direction`,
`Message`, and `Message Scroller` use local minimal previews because Direction
has no upstream example and the two message examples depend on private shadcn
docs helpers. Registry JSON is fetched only when someone asks to view source.

## Build and inspect

From the repository root:

```sh
pnpm exec tsc --project packages/shadcn-primitives/catalog/tsconfig.json
node packages/shadcn-primitives/catalog/build.js
pnpm exec serve docs
```

Open `/catalog/#/components/button`. The isolated build is written to
`docs/catalog`; it does not rewrite `docs/registry`.

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
