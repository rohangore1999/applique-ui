# Token pipeline

Applique tokens reach a client through the registry theme:

```text
Figma-backed values
        ↓
src/tokens.css
        ↓
scripts/generate-registry.js
        ↓
applique-theme.json: cssVars.theme + cssVars.light + CSS additions
        ↓
shadcn add
        ↓
client global CSS + local component source
```

## Token source

`src/tokens.css` is the reviewed runtime source. Colors are complete exact CSS
values such as:

```css
:root {
  --primary: #5232d0;
  --primary-foreground: #ffffff;
  --radius-md: 8px;
}
```

Do not wrap these values in `hsl(var(...))`. Tailwind 4 supports complete
colors and opacity modifiers through semantic `@theme inline` mappings.

## Generated Tailwind 4 mappings

The registry generator reads the `:root` block and creates:

```css
@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}

:root {
  --primary: #5232d0;
  --primary-foreground: #ffffff;
}
```

Radii, fonts, weights, spacing, and shadows are promoted as exact theme
values. Semantic component classes such as `bg-primary`,
`text-primary-foreground`, and `rounded-md` therefore resolve through
Applique tokens.

## Typography

The theme pins and installs
`@fontsource-variable/hanken-grotesk@5.3.0`, adds its CSS import, and maps:

```css
--font-sans: 'Hanken Grotesk Variable', 'Hanken Grotesk', ui-sans-serif,
  system-ui, sans-serif;
```

Both the catalogue and registry consumers receive the font; the token does not
depend on an unstated host application font.

## Light-only behavior

Applique has no reviewed dark palette in this release. The upstream source
transform changes `dark:` to `applique-dark:` and the theme installs:

```css
@custom-variant applique-dark (
  &:where(
    [data-applique-color-scheme='dark'],
    [data-applique-color-scheme='dark'] *
  )
);
```

The theme installs the same selector for Tailwind's built-in `dark` variant.
This prevents a host dashboard's `.dark` class or OS preference from applying
dark utility branches to light tokens. Do not set the Applique dark attribute
until a real dark token collection is added and tested.

## Changing a token

1. verify the value with UX/Figma;
2. edit `src/tokens.css`;
3. rebuild the registry and catalogue;
4. run registry validation;
5. run the full isolated consumer smoke test;
6. review generated root and versioned item diffs.

Never edit token values directly in `docs/registry/*.json`.
