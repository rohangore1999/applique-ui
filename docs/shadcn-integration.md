# Applique shadcn registry

Applique distributes its shadcn layer as source through a registry, not as a
component runtime package. A client installs a versioned registry item, owns
the resulting source, and imports it from its normal local aliases.

## Release baseline

- Registry: `v0.1.0`
- shadcn CLI: `4.16.0`
- Style: `base-nova` (Base UI)
- React and React DOM: `18.3.1`
- Tailwind CSS: `4.3.3`
- Coverage: all 62 official shadcn UI entries
- Installable source: 60 UI entries
- Exceptions: upstream `Form` is fileless/deprecated; `Message Scroller`
  requires React 19 and is excluded from this React 18 baseline

The release also installs the Applique semantic theme, exact Figma-backed
tokens, and the pinned Hanken Grotesk variable font. Applique currently
publishes light tokens only. Upstream dark utilities are renamed to the
Applique-scoped `applique-dark:` variant, and Tailwind's built-in `dark`
variant is scoped to the same explicit data attribute. A client application's
`.dark` class or OS preference therefore cannot activate them accidentally.

## Install in a client

Run registry installation and updates with Node.js `>=20.18.1`, as required by
the pinned shadcn CLI. The copied component source itself adds no Node runtime
requirement; the client's ongoing development and build version depends on its
own toolchain.

The client needs a valid shadcn `components.json` with Tailwind 4 and local
aliases. Install a component from the immutable version:

```bash
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json
```

The CLI writes the component and its dependencies into the client repository.
React 18 ref helpers use the Applique-owned
`@/lib/applique-react18-compat` target, so a pre-existing shadcn `utils.ts` with
the normal `cn()` export remains client-owned and does not need to be replaced.
The client then imports its local copy:

```tsx
import { Button } from '@/components/ui/button'

export function SaveAction() {
  return <Button>Save</Button>
}
```

Install several entries in one command when useful:

```bash
npx shadcn@4.16.0 add \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/button.json \
  https://rohangore1999.github.io/applique-ui/registry/v0.1.0/dialog.json
```

## Updates and ownership

Registry installation is a source merge, not an automatic runtime upgrade.
When Applique publishes a later registry version, the client reruns `shadcn add` with the new versioned URL, reviews the source diff, resolves local
customizations, and accepts the change. Never mutate an already-adopted
version directory.

An Applique facade for legacy prop mapping can be added later as local registry
source. It is intentionally separate from the primitive rollout; the current
release preserves the official shadcn API.

## Source and operations

- Manifest: `packages/shadcn-primitives/registry.json`
- Checked-in sources: `packages/shadcn-primitives/src`
- Upstream snapshots: `packages/shadcn-primitives/upstream/base-nova`
- Snapshot lock: `packages/shadcn-primitives/shadcn-base-nova.lock.json`
- Generated Pages output: `docs/registry` and `docs/catalog`
- Detailed guide: `docs/REGISTRY.md`

Do not edit generated registry JSON by hand. Update the manifest, token source,
or pinned component source and rebuild the Pages output.
