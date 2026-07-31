# Applique shadcn registry

This package owns the source snapshot, design tokens, registry generator, and
static catalogue for the Applique custom shadcn registry. Consumer applications
install source from the registry; they do not need to depend on this workspace
package at runtime.

## Current baseline

| Item                               | Pinned value |
| ---------------------------------- | ------------ |
| Registry release                   | `v0.1.0`     |
| shadcn CLI                         | `4.16.0`     |
| shadcn style                       | `base-nova`  |
| Node.js                            | `>=20.18.1`  |
| React                              | `19`         |
| Tailwind CSS                       | `4`          |
| Official UI entries                | `62`         |
| Sourced and installable UI entries | `61`         |

The official Base/Nova `form` entry is fileless and deprecated. It remains in
the registry and catalogue for accurate discovery, but consumers should install
`field` instead.

The registry remains at `v0.1.0` during this pre-adoption rollout because there
are no consumers to preserve. Once a team consumes a published version, treat
that version as immutable and publish changes under a new version.

## Delivery model

The release follows the normal shadcn source-ownership model:

```text
official Base/Nova item JSON
  -> checked-in upstream snapshot
  -> normalized TypeScript source
  -> Applique registry JSON + exact token theme
  -> source copied into the consumer application
```

Every installable component depends on `applique-theme`; component-specific
registry dependencies such as `button`, `utils`, or `use-mobile` are installed
automatically. `applique-theme` is generated from `src/tokens.css`, the
Figma-backed Applique token source.

The installed TypeScript belongs to the consumer. Teams can inspect and edit
it locally. Registry changes are not pushed into applications automatically:
updating is an explicit reinstall followed by a normal source diff and merge.

The primitive API remains the pinned shadcn Base/Nova API. For example, Button
uses `variant` and `size`. Applique-specific facade or legacy prop mapping is
not part of these primitive items.

## Consumer prerequisites

A consumer using the complete registry baseline needs:

- Node.js `>=20.18.1` for the pinned CLI and toolchain.
- React 19.
- Tailwind CSS 4.
- A shadcn `components.json` using TypeScript and the Base/Nova style.

A minimal compatible configuration is:

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
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

The Tailwind entry CSS must include Tailwind 4:

```css
@import 'tailwindcss';
```

## Installing components

Use the pinned CLI version. During evaluation, the root URL points to the
current release:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/button.json
```

For a reproducible install, pin the registry item too:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
```

Multiple items may be installed together:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/checkbox.json
```

The CLI writes source to the aliases configured by the consumer, for example:

```text
src/components/ui/button.tsx
src/lib/utils.ts
```

It also merges the Applique theme variables into the configured global CSS.
There is no separate token package or Tailwind preset to install.

To update an already installed component, run `shadcn add` with the desired
registry version, inspect the Git diff, and merge any local customizations.
Use overwrite only when replacing the local file is intentional.

## Build and validation

Run commands from `packages/shadcn-primitives`:

```sh
pnpm run build:pages
```

This command:

1. Generates current aliases and `v0.1.0` items under `../../docs/registry`.
2. Confirms generated output matches `registry.json`.
3. Validates paths, payloads, dependency URLs, and pinned source hashes.
4. Builds the static catalogue under `../../docs/catalog`.

Useful focused checks are:

```sh
pnpm run validate:registry
pnpm run smoke:registry
```

`smoke:registry` installs every sourced UI item into an isolated React 19 and
Tailwind 4 application with `shadcn@4.16.0`, then type-checks the source and
compiles its CSS.

## Local catalogue

```sh
pnpm run build:pages
pnpm run serve:catalog
```

Open:

```text
http://localhost:4173/catalog/#/components/button
```

The catalogue lists all 62 official entries. The 61 sourced entries have
lazy-loaded live previews and source-derived API information. Form is shown as
deprecated and directs consumers to Field.

## Refreshing the pinned shadcn snapshot

Normal builds are offline and use the checked-in snapshot under
`upstream/base-nova`. Refreshing upstream is a separate, intentional operation:

```sh
pnpm run sync:shadcn -- --allow-network
```

The network flag is deliberate because the official item endpoint is mutable.
Verify the stable CLI version and upstream commit before using it.

For a previously downloaded set of `<item>.json` files:

```sh
pnpm run sync:shadcn -- --from /absolute/path/to/base-nova-items
```

To compare without writing:

```sh
pnpm run sync:shadcn -- --from /absolute/path/to/base-nova-items --check
```

The sync process:

1. Reads all 62 official UI entries plus the `use-mobile` support hook.
2. Normalizes upstream-only aliases and icon placeholders and renames
   unscoped `dark:` utilities to the Applique-owned `applique-dark:` variant.
3. Pins every external dependency to an exact reviewed version.
4. Regenerates `src`, `registry.json`, and `src/index.ts`.
5. Records upstream JSON and normalized source SHA-256 hashes in
   `shadcn-base-nova.lock.json`.

Review source, dependency, token, preview, and accessibility diffs before
accepting a refreshed snapshot. `validate:registry` verifies the checked-in
files against the lock hashes so unreviewed source drift fails validation.

## Registry URLs and versioning

The manifest defaults to:

```text
https://rohangore1999.github.io/applique-ui/registry
```

Override it when publishing to a different host because component dependency
links are absolute:

```sh
APPLIQUE_REGISTRY_BASE_URL=https://rohangore1999.github.io/applique-ui/registry \
  pnpm run build:pages
```

For each item, generation creates:

```text
docs/registry/button.json
docs/registry/v0.1.0/button.json
```

The root item is the current-release alias. The versioned item is the stable
install target, and component-to-component dependencies point to versioned
URLs.

## Manual GitHub Pages publishing

There is intentionally no publishing workflow at this stage.

1. Use Node.js `>=20.18.1` and install the locked workspace dependencies.
2. On `shadcn-components-integration`, generate the site with its final URL:

   ```sh
   cd packages/shadcn-primitives
   APPLIQUE_REGISTRY_BASE_URL=https://rohangore1999.github.io/applique-ui/registry \
     pnpm run build:pages
   ```

3. Validate before publishing:

   ```sh
   pnpm run validate:registry
   pnpm run smoke:registry
   ```

4. Inspect the catalogue locally with `pnpm run serve:catalog`.
5. Commit the package source and generated `docs/registry` and `docs/catalog`
   output, then push `shadcn-components-integration` to the personal fork.
6. In GitHub **Settings -> Pages**, choose **Deploy from a branch**, select
   `shadcn-components-integration`, and select `/docs`.
7. Verify:

   ```text
   https://rohangore1999.github.io/applique-ui/
   https://rohangore1999.github.io/applique-ui/catalog/
   https://rohangore1999.github.io/applique-ui/registry/registry.json
   https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
   ```

If the final host changes, rebuild with that host's registry URL before
publishing.
