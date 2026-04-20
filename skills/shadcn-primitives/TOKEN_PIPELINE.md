# Token Pipeline — how Figma tokens reach a rendered component

This document traces the path of an Applique design token from the Figma
export (`docs/Applique.tokens.json`) all the way to a pixel on screen.

It is written for engineers and AI agents who need to understand the full
theming system before editing tokens, components, or the build.

---

## TL;DR — the pipeline in one picture

```
┌──────────────────────────┐
│ docs/Applique.tokens.json│   Figma export (DTCG-ish JSON).
│   hex: "#5232D0"         │   Source of truth for brand values.
└────────────┬─────────────┘
             │ (manual: you copy values you want into tokens.css)
             ▼
┌──────────────────────────┐
│ src/tokens.css           │   CSS custom properties (:root).
│   --primary: 252 76% 51%;│   Format: H S% L% (HSL channels, no hsl() wrapper).
└────────────┬─────────────┘
             │ (manual: you map each var to a Tailwind utility)
             ▼
┌──────────────────────────┐
│ tailwind.config.js       │   Teaches Tailwind utilities about the vars.
│   bg-primary → hsl(var(  │   Enables opacity modifiers: bg-primary/80.
│     --primary) / <alpha>)│
└────────────┬─────────────┘
             │ (automatic: Tailwind CLI compiles at build time)
             ▼
┌──────────────────────────┐
│ src/button.tsx           │   Component references utility classes.
│   className="bg-primary" │
└────────────┬─────────────┘
             │ (automatic: Rollup → dist, consumer imports it)
             ▼
┌──────────────────────────┐
│ Consumer browser         │
│   <button class="bg-     │   Browser computes:
│     primary">Click</but> │   background-color: hsl(252 76% 51% / 1)
└──────────────────────────┘
```

**Three manual hops, two automatic.** The manual hops are why this doc
exists — understand them and you can add, change, or override any token.

---

## Stage 1 — the Figma export

**File:** `packages/shadcn-primitives/docs/Applique.tokens.json`

### Shape

Top-level keys group tokens by type:

```jsonc
{
  "colors":       { "accent-light": {...}, "primary-light": {...}, ... },
  "font":         { "font-sans": {...}, ... },
  "breakpoint":   { "sm": {...}, ... },
  "container":    { "xs": {...}, ... },
  "text":         { "xs": {...}, "sm": {...}, ... },
  "font-weight":  { "thin": {...}, ... },
  "radius":       { "xxs": {...}, "md": {...}, ... },
  "shadow":       { "sm": {...}, ... },
  "$extensions":  { ... Figma metadata ... }
}
```

### A single token entry

```jsonc
"accent-light": {
  "$type": "color",
  "$value": {
    "colorSpace": "srgb",
    "components": [0.941, 0.933, 1],       // normalized RGB 0..1
    "alpha": 1,
    "hex": "#F0EEFF"                        // ← the value we actually use
  },
  "$extensions": {
    "com.figma.variableId": "VariableID:4:4967",
    "com.figma.aliasData": {
      "targetVariableName": "Applique colors/✅ indigo/50",
      ...
    }
  }
}
```

**What matters to us:** `$value.hex` for colors, `$value` for numeric
tokens (radius, font-weight). Everything under `$extensions` is Figma
metadata we ignore at runtime — it's useful only for reasoning ("where
does this come from?").

### Naming convention

Each semantic role ships in **two flavors** — `*-light` and `*-dark`:

```
accent-light / accent-dark
background-light / background-dark
primary-light / primary-dark
...
```

We currently ship **light only** (see `SKILL.md` §2.5). Dark-mode support
is future work; the JSON is ready whenever we wire it up.

A few tokens have the `A-button-outline-*` prefix (Applique-specific
button-outline overrides). These get renamed during the hop to CSS:

- `A-button-outline-border-light` → `--outline-border`
- `A-button-outline-forground-light` → `--outline-foreground`

---

## Stage 2 — tokens.css (CSS custom properties)

**File:** `packages/shadcn-primitives/src/tokens.css`

### Why CSS variables at all?

Two reasons:
1. **Runtime theme overrides.** A consumer app can redefine
   `--primary` in its own stylesheet and every component picks it up
   instantly — no rebuild of our package needed.
2. **Opacity modifiers.** Tailwind's `bg-primary/80` requires the color
   to be parametrized — if we hardcoded hex in the utility, we couldn't
   apply alpha through Tailwind.

### HSL channel format (not `hsl(...)` wrapper)

We don't store `hsl(252, 76%, 51%)`. We store the **channels only**:

```css
:root {
  --primary: 252 76% 51%;  /* H, S%, L% — space-separated, NO hsl() */
}
```

Tailwind then wraps it with opacity:

```css
.bg-primary {
  background-color: hsl(var(--primary) / var(--tw-bg-opacity, 1));
}
```

If the variable stored `hsl(...)` directly, the `/ <alpha>` suffix
couldn't be injected. Keep channel format.

### Converting hex → HSL channels

The Figma JSON gives us `hex: "#5232D0"`. We convert once (manually, or
with any online tool / `chroma.js` / Python's `colorsys`) and write:

```css
--primary: 252 76% 51%;    /* #5232D0 (indigo/700) */
```

Always leave a `/* #HEX (name) */` comment — future editors should be
able to audit values without re-running a converter.

### What lives in `tokens.css`

- **Semantic color vars** — `--background`, `--foreground`, `--primary`,
  `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`,
  `--input`, `--ring`, `--card`, `--popover`, `--outline-border`,
  `--outline-foreground`, `--sidebar-*`, `--chart-1..5`.
- **Radii** — `--radius-xxs` through `--radius-4xl` (in **px**, not rem
  — see `SKILL.md` §2.3).
- **Shadows** — `--shadow-2xs` through `--shadow-2xl` (full CSS strings).
- **Font families** — `--font-sans`, `--font-serif`, `--font-mono`.
- **Font weights** — `--font-weight-thin` .. `--font-weight-black`.

### What does NOT live here

- Spacing scale (`0.5`, `1`, `2`, ...) → hard-coded in
  `tailwind.config.js` because they're just numbers, and a CSS var for
  every step would be noise.
- Text sizes (`xs`, `sm`, `base`, ...) → same reason. Hard-coded px
  pairs `[fontSize, lineHeight]` in the config.

---

## Stage 3 — tailwind.config.js (wiring vars → utilities)

**File:** `packages/shadcn-primitives/tailwind.config.js`

This is where `--primary` becomes `bg-primary`, `text-primary`, etc.

### Colors

```js
extend: {
  colors: {
    primary: {
      DEFAULT:     'hsl(var(--primary) / <alpha-value>)',
      foreground:  'hsl(var(--primary-foreground) / <alpha-value>)',
    },
    // …same shape for secondary, destructive, muted, accent, card, popover
    sidebar: {
      DEFAULT:     'hsl(var(--sidebar) / <alpha-value>)',
      foreground:  'hsl(var(--sidebar-foreground) / <alpha-value>)',
      primary:     'hsl(var(--sidebar-primary) / <alpha-value>)',
      // … etc
    },
    chart: {
      1: 'hsl(var(--chart-1) / <alpha-value>)',
      // … 2..5
    },
  },
}
```

`<alpha-value>` is Tailwind's placeholder that gets replaced with either
`1` (no modifier) or the modifier value (`0.8` for `bg-primary/80`).

### Border radius

```js
borderRadius: {
  xxs:     'var(--radius-xxs)',
  xs:      'var(--radius-xs)',
  sm:      'var(--radius-sm)',
  md:      'var(--radius-md)',
  DEFAULT: 'var(--radius)',
  lg:      'var(--radius-lg)',
  xl:      'var(--radius-xl)',
  '2xl':   'var(--radius-2xl)',
  '3xl':   'var(--radius-3xl)',
  '4xl':   'var(--radius-4xl)',
},
```

So `className="rounded-md"` → `border-radius: var(--radius-md)` → `8px`
at runtime.

### Shadows, font families, font weights

```js
boxShadow: {
  '2xs': 'var(--shadow-2xs)',
  xs:    'var(--shadow-xs)',
  // … up to 2xl
},
fontFamily: {
  sans:  'var(--font-sans)',
  serif: 'var(--font-serif)',
  mono:  'var(--font-mono)',
},
fontWeight: {
  thin:       'var(--font-weight-thin)',
  extralight: 'var(--font-weight-extralight)',
  // … up to black
},
```

### Spacing / fontSize (token-adjacent, but not var-backed)

```js
spacing: {
  0.5: '2px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', ...
},
fontSize: {
  xs:  ['12px', '16px'],  // [font-size, line-height]
  sm:  ['14px', '20px'],
  base:['16px', '24px'],
  // ...
},
```

These override Tailwind's rem defaults with **explicit px** (see
`SKILL.md` §2.3 for why).

---

## Stage 4 — components reference the utilities

**File:** any `packages/shadcn-primitives/src/*.tsx`

The components don't know about JSON, CSS variables, or colorspaces.
They just use Tailwind utilities:

```tsx
// src/button.tsx (default intent)
'bg-primary text-primary-foreground hover:bg-primary/90'
```

At Tailwind build time this compiles to:

```css
.bg-primary       { background-color: hsl(var(--primary) / 1); }
.text-primary-foreground { color: hsl(var(--primary-foreground) / 1); }
.hover\:bg-primary\/90:hover { background-color: hsl(var(--primary) / 0.9); }
```

At runtime the browser resolves `var(--primary)` to `252 76% 51%` and
renders `#5232D0`.

---

## Worked example — trace `primary` from Figma to pixel

You want to understand exactly why `<Button intent="default">Save</Button>`
renders with a purple background. Follow the trail:

### Step 1 — Figma JSON (`docs/Applique.tokens.json`)

```jsonc
"primary-light": {
  "$type": "color",
  "$value": { "hex": "#5232D0", ... }
}
```

### Step 2 — CSS variable (`src/tokens.css`)

```css
:root {
  /* #5232D0 → hsl(252, 76%, 51%) → HSL channel format */
  --primary: 252 76% 51%;
  --primary-foreground: 0 0% 100%;   /* #FFFFFF */
}
```

### Step 3 — Tailwind config (`tailwind.config.js`)

```js
primary: {
  DEFAULT:    'hsl(var(--primary) / <alpha-value>)',
  foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
},
```

Tailwind now knows: utility `bg-primary` → `hsl(var(--primary) / 1)`,
utility `bg-primary/90` → `hsl(var(--primary) / 0.9)`.

### Step 4 — component class (`src/button.tsx`)

```tsx
const buttonVariants = cva('…base…', {
  variants: {
    intent: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      // …
    },
  },
})
```

### Step 5 — compiled CSS (`dist/styles.css`)

```css
.bg-primary {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--primary) / var(--tw-bg-opacity, 1));
}
```

### Step 6 — runtime (consumer browser devtools)

```
<button class="bg-primary text-primary-foreground …">Save</button>

Computed styles:
  --primary: 252 76% 51%           (from our :root in tokens.css)
  background-color: rgb(82, 50, 208)    (= #5232D0)
```

Done. The purple you see on screen originated in a Figma variable, was
manually transcribed into a CSS custom property, wired to a Tailwind
utility, referenced by a CVA variant, and resolved by the browser's
style engine.

---

## How to add a new token (end-to-end recipe)

Let's say design added a new color `brand-purple` and it shows up in
Figma as `"brand-purple-light": { "$value": { "hex": "#7B3FF2" } }`.

### 1. Confirm it's in the JSON

Open `docs/Applique.tokens.json`, search for `"brand-purple-light"`.

### 2. Convert hex → HSL channels

```
#7B3FF2 → hsl(258, 87%, 60%) → "258 87% 60%"
```

(Use any converter. [HSL color picker](https://hslpicker.com/) is fine.)

### 3. Add a CSS variable (`src/tokens.css`)

```css
:root {
  /* existing tokens… */

  /* Brand — accent purple (from Figma: brand-purple-light) */
  --brand-purple: 258 87% 60%;            /* #7B3FF2 */
  --brand-purple-foreground: 0 0% 100%;   /* #FFFFFF, if needed */
}
```

Always include the `/* #HEX */` comment.

### 4. Wire into Tailwind (`tailwind.config.js`)

```js
extend: {
  colors: {
    // existing colors…
    'brand-purple': {
      DEFAULT:    'hsl(var(--brand-purple) / <alpha-value>)',
      foreground: 'hsl(var(--brand-purple-foreground) / <alpha-value>)',
    },
  },
}
```

### 5. Use it in a component

```tsx
<Button className="bg-brand-purple text-brand-purple-foreground">
  Launch
</Button>
```

Or add as a CVA variant:

```tsx
intent: {
  // existing…
  brand: 'bg-brand-purple text-brand-purple-foreground hover:bg-brand-purple/90',
}
```

### 6. Rebuild

```bash
cd applique-ui
FORCE=1 node scripts/build.js shadcn-primitives

cd packages/shadcn-primitives
npm run build:post
```

The new utility lives in `dist/styles.css` and is available to every
consumer after they upgrade.

---

## Why the multi-hop design

You might ask: *"Why not just import the JSON at build time and generate
the Tailwind config automatically?"*

Good instinct. We deliberately don't, and here's why.

### 1. Not every Figma token becomes a Tailwind utility

The JSON has `breakpoint`, `container`, raw `font.font-sans = 'Hanken
Grotesk'` — some map cleanly to Tailwind scales, others don't. The
manual hop lets us curate: we ship the subset consumers actually need.

### 2. Semantic naming lives at our boundary, not Figma's

Figma has `✅ indigo/50`. Shadcn wants `--accent`. Our JSON uses
`accent-light` (Figma's semantic override). The CSS var name in our
package is `--accent`. Each stage normalizes vocabulary toward the
consumer; auto-generation would couple their naming to Figma's.

### 3. Consumer overrides need stable var names

The primary theming escape hatch is: consumers redefine `--primary` in
their own CSS. If we auto-regenerated var names from Figma IDs, that
contract would break on every Figma re-export.

### 4. Build complexity tradeoff

Auto-generation = a build step + a watcher + debugging why the
generated file is stale. A manual hop = 30 seconds of copy-paste per
token and total control. Given the rate of token churn (~a few per
year), manual wins.

If token churn ever spikes, we can always add a `scripts/gen-tokens.js`
that reads the JSON and emits tokens.css + config snippets. The design
explicitly leaves that door open.

---

## FAQ / gotchas

### Why px-only for radii and spacing?

A legacy consumer convention (`html { font-size: 62.5% }` to make
`1rem = 10px`) would shrink every rem-based utility in our prebuilt
stylesheet. Px values are immune. See `SKILL.md` §2.3.

### Why don't component files reference tokens directly?

They reference Tailwind **utility classes** (`bg-primary`), not the
underlying var. This lets us re-wire utilities at the config layer
without editing every component.

### How do I override a single color in my consumer app?

In the consumer's own CSS (after importing our `styles.css`):

```css
:root {
  --primary: 262 83% 58%;            /* your brand color */
  --primary-foreground: 0 0% 100%;
}
```

All 50+ components that reference `--primary` pick it up automatically.

### Can I use these tokens in consumer code?

Yes:

```tsx
// your consumer code — use bare var() calls
<div style={{ color: 'hsl(var(--muted-foreground))' }}>Secondary text</div>
```

Our package's `styles.css` defines these variables at `:root`, so they
are available globally after the package's CSS is loaded.

### What about dark mode?

The JSON already has `-dark` variants for every color. When we wire dark
mode we'll:
1. Add a `.dark { --primary: …; }` block in `tokens.css` with the
   `-dark` values.
2. Add `darkMode: 'class'` to `tailwind.config.js`.
3. Let each consumer toggle a `.dark` class on `<html>` or a wrapper.

Components don't change — they already reference the CSS vars, which
will flip values based on the `.dark` ancestor. Shipping dark mode is
mostly a tokens.css edit.

### Where are the px-based text size tokens?

Not in `tokens.css` as CSS variables. They're hard-coded in
`tailwind.config.js` `fontSize` entries as `[px, line-height]` pairs.
If design wants to parameterize them, promote them to CSS vars:

```css
/* tokens.css */
--text-sm: 14px;
--text-sm-line-height: 20px;
```

```js
// tailwind.config.js
fontSize: {
  sm: ['var(--text-sm)', 'var(--text-sm-line-height)'],
}
```

### Why is there a `$extensions` blob in the JSON?

It's Figma's metadata — variable IDs, alias targets, collection IDs.
Useful for humans auditing "what Figma variable does this point to,"
but we never read it at build time.
