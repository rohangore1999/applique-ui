# Applique shadcn registry

This package is the source for the Applique custom shadcn registry and its
static component catalogue.

The Phase 0 registry publishes:

- `applique-theme`
- `utils`
- `button`
- `checkbox`

The remaining checked-in primitives are listed in the catalogue as planned and
are not advertised as installable yet.

## Build and validate

Run from this package:

```sh
pnpm run build:pages
```

This:

1. Generates registry aliases and immutable `v0.1.0` items under
   `../../docs/registry`.
2. Verifies that the generated files match `registry.json`.
3. Validates registry paths, dependencies, payloads, and catalogues.
4. Builds the static React catalogue under `../../docs/catalog`.

To check generated registry files without changing them:

```sh
pnpm run validate:registry
```

## Local catalogue

```sh
pnpm run build:pages
pnpm run serve:catalog
```

Open:

```text
http://localhost:4173/catalog/#/components/button
```

The left navigation lists all current primitive sources. Button and Checkbox
have live previews; other components remain marked as planned.

## Registry URL

The default public base URL is:

```text
https://applique.myntra.com/registry
```

Override it for another GitHub Pages host:

```sh
APPLIQUE_REGISTRY_BASE_URL=https://OWNER.github.io/REPOSITORY/registry \
  pnpm run build:pages
```

Always build with the final public URL before publishing. Registry items contain
absolute URLs for their immutable theme and utility dependencies.

## Manual GitHub Pages publishing

1. In the repository GitHub settings, open **Pages**.
2. Select **Deploy from a branch** as the source.
3. Select the branch you want to publish and the `/docs` folder.
4. Build locally using the final Pages URL:

   ```sh
   APPLIQUE_REGISTRY_BASE_URL=https://OWNER.github.io/REPOSITORY/registry \
     pnpm run build:pages
   ```

5. Test the generated registry and catalogue:

   ```sh
   pnpm run validate:registry
   pnpm run smoke:registry
   pnpm run serve:catalog
   ```

6. Commit the registry source, catalogue source, and generated `docs` files, then
   push the selected Pages branch.
7. Verify these published endpoints:

   ```text
   https://OWNER.github.io/REPOSITORY/catalog/
   https://OWNER.github.io/REPOSITORY/registry/button.json
   https://OWNER.github.io/REPOSITORY/registry/v0.1.0/button.json
   ```

For a custom domain, use its actual registry URL when building, for example
`https://applique.myntra.com/registry`.

## Consumer installation

Use the pinned CLI version shown by the catalogue:

```sh
npx shadcn@4.16.0 add https://HOST/registry/button.json
npx shadcn@4.16.0 add https://HOST/registry/checkbox.json
```

The component item installs its immutable theme and utils dependencies before
writing TypeScript source into the consumer's configured `ui` directory.

Phase 0 publishes TSX only. JavaScript-only consumers need a separate,
compiler-based output strategy; the previous regex TSX-to-JSX conversion is not
used.

## Versioning

`registry.json` contains the current registry version. Generation produces:

```text
docs/registry/button.json
docs/registry/v0.1.0/button.json
```

The root item is a discovery alias. Component-to-component dependencies use the
immutable versioned URLs. Never replace the contents of an already published
version; increment the registry version instead.

## Adding the next component

1. Add the source item and dependency metadata to `registry.json`.
2. Add an explicit import map only when package-relative imports must become
   consumer aliases.
3. Add a statically compiled preview to `catalog/previews` covering every
   supported variant, size, relevant state, and important composition.
4. Run `pnpm run build:pages`.
5. Install the generated item into an isolated consumer and type-check/build
   that consumer before changing the catalogue status to ready.

Facades and Applique prop mapping are intentionally deferred. They should be
separate registry items that depend on these themed primitives.
