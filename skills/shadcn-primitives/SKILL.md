# Maintaining the Applique shadcn registry

Read this before changing `packages/shadcn-primitives`.

## Architecture

The public product is a shadcn source registry plus a static catalogue.
Clients run the pinned shadcn CLI against an immutable item URL, receive local
TypeScript source, and import that local source. Do not document package
imports as the standard integration path.

Current baseline:

- Registry `v0.1.0`
- shadcn CLI `4.16.0`
- official style `base-nova`
- upstream commit `705ce5961080264830471ddd885c01b907706068`
- React `19.2.8`
- Tailwind CSS `4.3.3`
- all 62 official UI entries; 61 source-bearing plus fileless Form

## Sources of truth

- `registry.json`: registry manifest and release version
- `src/tokens.css`: exact Applique light tokens
- `upstream/base-nova/*.json`: reviewed official snapshots
- `shadcn-base-nova.lock.json`: versions and SHA-256 provenance
- `scripts/sync-shadcn.js`: deterministic source transformation
- `scripts/generate-registry.js`: generated item/catalog builder
- `docs/registry`: generated public registry
- `catalog`: source for the static catalogue

Never edit `docs/registry/*.json`, generated catalogue metadata, or generated
catalogue bundles as source.

## Non-negotiable rules

1. Keep registry dependencies exact; do not publish `latest` or ranges.
2. Keep adopted version directories immutable. The current `v0.1.0` can
   change only while it has no consumers.
3. Preserve official component APIs in the primitive layer. Put future
   Applique prop mapping in separate facade components.
4. Use semantic utilities and Applique tokens. Do not add arbitrary brand
   colors to component source.
5. Applique is light-only today. `sync-shadcn.js` rewrites upstream `dark:`
   utilities to `applique-dark:`. Do not restore unscoped `dark:` utilities.
6. Keep Hanken Grotesk pinned and delivered by the theme; naming a font in a
   token without loading it is insufficient.
7. Preserve `data-slot` attributes and upstream accessibility behavior.
8. Treat Form as upstream fileless/deprecated and direct clients to Field.

## Refreshing upstream

Normal builds are offline. Prefer an audited directory:

```bash
cd packages/shadcn-primitives
node scripts/sync-shadcn.js --from upstream/base-nova --check
```

A network refresh is deliberately explicit because the official registry
endpoint is mutable:

```bash
node scripts/sync-shadcn.js --allow-network
```

Before accepting a network refresh, verify the stable shadcn CLI version and
upstream commit, update the constants and exact dependency pins together, and
review every snapshot/source/hash diff.

## Build and verification

From the repository root:

```bash
pnpm --filter @rohangore1999/shadcn-primitives run build:pages
pnpm --filter @rohangore1999/shadcn-primitives run validate:registry
pnpm --filter @rohangore1999/shadcn-primitives run smoke:registry
pnpm --filter @rohangore1999/shadcn-primitives exec \
  tsc --noEmit -p tsconfig.json
pnpm --filter @rohangore1999/shadcn-primitives exec \
  tsc --noEmit -p catalog/tsconfig.json
```

The smoke test must install all 61 source-bearing entries into a blank
consumer, type-check them, compile Tailwind, and verify the theme, scoped dark
variant, and font.

## Publishing

GitHub Pages serves the checked-in `docs` directory. Build with the public
base URL, commit all related source and generated output, push the configured
Pages branch, then verify the catalogue, catalog JSON, theme JSON, and at least
one component URL over HTTPS.
