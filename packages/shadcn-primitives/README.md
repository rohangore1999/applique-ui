# Applique shadcn primitives

This workspace package builds the Applique custom shadcn registry and its
static component catalogue. The supported client delivery model is the
registry: the shadcn CLI copies TypeScript source and Applique tokens into the
consumer application.

It is not necessary for a dashboard to import this package at runtime.

## Release baseline

- Registry version: `v0.1.0`
- shadcn CLI: `4.16.0`
- Style: `base-nova`
- React: 18
- Tailwind CSS: 4
- Installer/update CLI Node.js: `>=20.18.1`
- Coverage: all 62 official UI entries, with 60 sourced and installable

The upstream Form entry is fileless and deprecated; use Field. Message
Scroller is listed for discovery but is not published in this baseline because
its upstream `@shadcn/react` primitive requires React 19.

The copied source itself adds no Node 20 runtime requirement. A client's
ongoing development and build Node version depends on its own toolchain.

## Install from the registry

```sh
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
```

The CLI installs the component source, exact npm dependencies, local registry
dependencies, the Applique theme, and the pinned Hanken Grotesk variable font.
Client code then imports its local copy:

```tsx
import { Button } from '@/components/ui/button'

export function SaveButton() {
  return <Button variant="default">Save</Button>
}
```

See [USAGE.md](./USAGE.md) for consumer setup and update behavior.

## Develop the registry

From this directory:

```sh
pnpm run build:pages
pnpm run validate:registry
pnpm run smoke:react18
pnpm run smoke:registry
```

Inspect the generated catalogue locally:

```sh
pnpm run serve:catalog
```

Then open:

```text
http://localhost:4173/catalog/
```

An upstream refresh is separate from a normal build:

```sh
pnpm run sync:shadcn -- --allow-network
```

The network flag is intentionally explicit because the upstream registry
endpoint is mutable. Verify the stable CLI version and upstream commit first.
The refresh rewrites the checked-in Base/Nova snapshot, normalized sources,
manifest, exports, and SHA-256 lock data. Review all diffs before accepting it.

## Important paths

| Path                           | Purpose                                      |
| ------------------------------ | -------------------------------------------- |
| `registry.json`                | Registry source manifest and release version |
| `src/tokens.css`               | Figma-backed Applique light tokens           |
| `src/<registry-name>.tsx`      | Normalized Base/Nova registry source         |
| `upstream/base-nova/`          | Checked-in official item JSON                |
| `shadcn-base-nova.lock.json`   | Exact dependency and content hashes          |
| `scripts/sync-shadcn.js`       | Intentional upstream refresh                 |
| `scripts/generate-registry.js` | Static registry generation                   |
| `catalog/`                     | Static component catalogue                   |
| `../../docs/registry/`         | Generated Pages registry                     |
| `../../docs/catalog/`          | Generated Pages catalogue                    |

See [REGISTRY.md](./REGISTRY.md) for release, validation, versioning, and manual
GitHub Pages instructions.
