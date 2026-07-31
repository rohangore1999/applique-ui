# Applique x shadcn registry strategy

## Decision

Applique distributes the new shadcn primitives through a custom registry.
Applications receive local component source while Applique supplies the common
starting point: a reviewed shadcn snapshot, exact dependencies, and the
Applique design tokens.

This balances the two requirements:

| Concern            | Registry result                                               |
| ------------------ | ------------------------------------------------------------- |
| UI consistency     | Every component starts with the same Applique semantic tokens |
| Team control       | The generated TypeScript lives in the client repository       |
| Runtime coupling   | No shared Applique component runtime is required              |
| Updates            | Clients choose when to reinstall and merge source changes     |
| Upstream stability | shadcn, Base UI, and other dependencies are exactly pinned    |

The registry does not make client source centrally managed. Once installed,
the client owns its copy; consistency comes from a governed baseline and an
explicit update process.

## Current release

The current release is `v0.1.0` and is based on:

- `shadcn@4.16.0`
- the official `base-nova` registry style
- React 18
- Tailwind CSS 4
- Node.js `>=20.18.1`

It represents all 62 official UI entries in the pinned Base/Nova index:

- 60 entries contain installable TypeScript source.
- Form is the one fileless upstream entry. It is deprecated and points to
  Field.
- Message Scroller is retained for discovery but is unavailable because its
  upstream `@shadcn/react` primitive requires React 19.

The version remains `v0.1.0` while there are no consumers. This lets the team
complete the initial baseline without creating meaningless pre-adoption
versions. After the first consumer adopts `v0.1.0`, its versioned URLs must be
immutable and subsequent changes must use a new registry version.

## What a client receives

Installing Button illustrates the dependency chain:

```text
button.json
  + applique-theme.json  -> Applique CSS variables
  + utils.json           -> local cn() helper
  + applique-react18-compat.json -> Applique-owned React 18 ref helpers
  + exact npm packages   -> Base UI and CVA
  + button.tsx           -> local component source
```

The CLI resolves registry dependencies first, writes files using the aliases in
the client's `components.json`, and merges theme variables into the configured
global CSS.

Typical generated files are:

```text
src/components/ui/button.tsx
src/lib/applique-react18-compat.ts
src/lib/utils.ts
```

If `src/lib/utils.ts` already exists, shadcn leaves that client-owned file in
place. The React 18 helpers use the separate Applique-owned path, so an existing
standard `cn()` utility does not need to be overwritten.

Client code imports the local component:

```tsx
import { Button } from '@/components/ui/button'

export function SaveAction() {
  return <Button variant="default">Save</Button>
}
```

These primitives retain the pinned shadcn Base/Nova API. Applique-specific
facade or legacy prop mappings are not silently applied to the primitive
surface.

## Design-token governance

`packages/shadcn-primitives/src/tokens.css` is the source of truth for the
light-mode Applique semantic tokens. Registry generation turns it into the
`applique-theme` item, and every installable UI item depends on that theme.

The theme currently publishes 76 light token values and 76 corresponding
Tailwind theme mappings. It covers semantic colors, typography, spacing,
radius, shadows, sidebar colors, and chart colors. It also installs the pinned
Hanken Grotesk variable font, so typography does not depend on an unstated
consumer asset.

This provides a consistent default without removing client ownership. Teams can
edit local source or override tokens for a valid product need, but that
divergence is visible in their repository and must be reconciled when they
update.

Dark mode is not inferred from the light palette. Upstream `dark:` branches are
published as the `applique-dark:` custom variant, scoped to
`data-applique-color-scheme="dark"`, so a dashboard's `.dark` class cannot
activate them accidentally. The theme also scopes Tailwind's built-in `dark`
variant to that attribute so shadcn plugin utilities cannot fall back to the
operating-system preference. Do not set that attribute until a reviewed
Figma-backed dark token set exists.

## Consumer installation

Running the pinned installer requires Node.js `>=20.18.1`. Installed component
source targets React 18 and Tailwind CSS 4 with a TypeScript shadcn
configuration using `style: "base-nova"`.

Existing shadcn applications keep their own aliases and CSS path. Applique does
not require a separate registry-specific `components.json`; the CLI uses the
client's normal configuration to decide where to copy files.

Install the current Button:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/button.json
```

Pin both the CLI and registry release for reproducibility:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
```

Install multiple components in one operation:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/checkbox.json
```

On a managed office network, a `self-signed certificate in certificate chain`
error means Node needs the approved corporate proxy CA for shadcn's public
metadata endpoint. Set `NODE_EXTRA_CA_CERTS` to the platform-provided PEM file;
do not disable TLS verification.

Do not install Form; use:

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/field.json
```

## Update model

Registry components do not update when Applique publishes new JSON. A client
updates deliberately:

1. Select the target registry version.
2. Run the same `shadcn@4.16.0 add` command for that version.
3. Inspect the source diff.
4. Keep the upstream change, retain the local customization, or merge both.
5. Run the client's tests and visual checks.

This source diff and acceptance step is the control that the registry model
gives to clients. It also means Applique cannot guarantee that an application
which never updates remains visually identical forever.

## Upstream snapshot and integrity

The official item JSON is checked in under
`packages/shadcn-primitives/upstream/base-nova`. The normalized source is
checked in under `packages/shadcn-primitives/src`.

`scripts/sync-shadcn.js` performs an intentional upstream refresh. Network
access requires `--allow-network` because the official registry endpoint is
mutable. It handles private upstream aliases and icon placeholders, scopes
dark utilities, pins all external dependencies to exact versions, and
regenerates the source manifest and exports. The reviewed upstream commit is
stored with the snapshot provenance.

`shadcn-base-nova.lock.json` records SHA-256 hashes for:

- every upstream item JSON;
- every normalized local source file;
- the `use-mobile` support hook;
- the fileless Form record;
- the excluded React-19-only Message Scroller record.

Normal registry and catalogue builds are offline. Validation compares the
checked-in upstream JSON and local source to these hashes, so unexpected source
drift fails before publishing.

## Catalogue

The static catalogue is published at:

```text
https://rohangore1999.github.io/applique-ui/catalog/
```

It has left-side navigation for all 62 official entries and an active component
page with:

- a lazy-loaded live preview for every sourced entry;
- source-derived exports and prop information;
- the install command and registry status;
- on-demand access to the raw registry JSON.

Form appears as deprecated and unavailable rather than advertising an empty
install. Message Scroller is marked as requiring React 19 and also has no
install command in this React 18 baseline.

## Manual GitHub Pages release

GitHub Pages is deployed manually from the `shadcn-components-integration`
branch and `/docs`; no workflow is required.

Build with the final public URL so generated dependency links do not point to a
different host:

```sh
cd packages/shadcn-primitives
APPLIQUE_REGISTRY_BASE_URL=https://rohangore1999.github.io/applique-ui/registry \
  pnpm run build:pages
pnpm run validate:registry
pnpm run smoke:react18
pnpm run smoke:registry
```

Commit the package snapshot and generated `docs` output, push the branch, and
select that branch plus `/docs` in GitHub **Settings -> Pages**.

Verify:

```text
https://rohangore1999.github.io/applique-ui/
https://rohangore1999.github.io/applique-ui/catalog/
https://rohangore1999.github.io/applique-ui/registry/registry.json
https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
```

## Source locations

| Resource                 | Location                                                  |
| ------------------------ | --------------------------------------------------------- |
| Registry manifest        | `packages/shadcn-primitives/registry.json`                |
| Applique token source    | `packages/shadcn-primitives/src/tokens.css`               |
| Pinned upstream JSON     | `packages/shadcn-primitives/upstream/base-nova/`          |
| Snapshot lock and hashes | `packages/shadcn-primitives/shadcn-base-nova.lock.json`   |
| Upstream sync            | `packages/shadcn-primitives/scripts/sync-shadcn.js`       |
| Registry generator       | `packages/shadcn-primitives/scripts/generate-registry.js` |
| Generated registry       | `docs/registry/`                                          |
| Generated catalogue      | `docs/catalog/`                                           |
