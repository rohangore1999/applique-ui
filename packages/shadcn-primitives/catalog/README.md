# Registry catalogue

The catalogue is a static React page for visually inspecting registry
components. Component previews are imported at build time; registry JSON is
linked for discovery but is never executed in the browser.

Build from the repository root:

```sh
node packages/shadcn-primitives/catalog/build.js
```

The isolated build output is written to `docs/catalog`. Existing files under
`docs/registry` are not changed.

Type-check the catalogue:

```sh
pnpm exec tsc --project packages/shadcn-primitives/catalog/tsconfig.json
```

To inspect the same paths used by GitHub Pages:

```sh
pnpm exec serve docs
```

Then open `/catalog/#/components/button`.

## Component page standard

A component remains `planned` until its catalogue page:

- renders the real checked-in component source;
- demonstrates every supported visual variant and size;
- demonstrates relevant disabled, loading, invalid, selected, and focus states;
- demonstrates important icon, link, composition, and directionality behavior;
- documents the complete current primitive prop surface;
- separates planned Applique facade props from props that work today; and
- passes the isolated catalogue type-check and production build.

Examples should reflect capabilities that are actually present in the registry
source. Related compositions, such as Button Group, stay separate until their
own registry items are ready.
