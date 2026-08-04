# Applique prop-adapter toolkit — design

> **Status:** Proposed (revised after engineering review). Not yet approved for
> full rollout; the near-term commitment is the contract data + test kit +
> InputNumber pilot only.
> **Date:** 2026-08-04
> **Supersedes:** the earlier "universal engine + generators" draft of this doc,
> which was withdrawn after review (see §2).
> **Related:** [REGISTRY.md](../../REGISTRY.md) §8–§10,
> [REGISTRY-APPROACH.md](../../REGISTRY-APPROACH.md),
> [component-mappings.json](../../../packages/shadcn-primitives/catalog/component-mappings.json).

## 1. Goal

Legacy Applique components and the new shadcn primitives disagree on prop names,
event shapes, and behavior. Migrating a client should be **change the import,
keep your props** — the Applique prop contract wins, most props keep working, and
a small documented set is flagged for a manual tweak.

We want three things, and we are deliberate about which layer each lives in:

1. **One reviewed description of every prop's fate** — forward / map / constant /
   compose / unsupported / needs-review, with notes. This is **data**.
2. **A common "Applique wins" precedence rule** and consistent callback handling.
3. **Confidence that facades honor the contract** — coverage + precedence tests.

## 2. What changed from the previous draft, and why

The earlier draft proposed a **universal runtime engine** (`createFacade(spec)`)
that would build every "direct" component from a data spec, plus type/catalogue
generators. Engineering review rejected that as over-reach. The objections were
verified against the actual facade code and are correct:

| # | Objection | Evidence |
|---|---|---|
| 1 | "Direct" ≠ "props-only" | [input-checkbox.tsx](../../../packages/shadcn-primitives/src/facades/input-checkbox.tsx), [input-radio.tsx](../../../packages/shadcn-primitives/src/facades/input-radio.tsx), [avatar.tsx](../../../packages/shadcn-primitives/src/facades/avatar.tsx) render wrappers, generate children, and coordinate state — not expressible as `<Primitive {...props} />` |
| 2 | Callbacks need composition, not precedence | checkbox calls shadcn `onCheckedChange`, checks `details.isCanceled`, then Applique `onChange`; a per-prop map would overwrite the client's shadcn handler |
| 3 | Props interact | checkbox derives controlled/uncontrolled from `value`+`checked`+`defaultChecked`+`onChange`+`onCheckedChange` together |
| 4 | `compose` silently dropped | the engine's `applySpec` emitted nothing for `compose`, so e.g. Avatar initials would vanish |
| 5 | Behavior regression | engine skipped absent `value`, flipping InputNumber from controlled (`value=""`) to uncontrolled |
| 6 | Shared runtime versioning | a shared `_engine` file is overwritten on the next `shadcn add`, breaking older installed facades |
| 7 | Type-gen unsound | `appliqueType: "string \| number"` is a runtime string generics cannot reconstruct; `: FacadeSpec` widens `primitive` and loses exact props/ref |
| 8 | Framework risk | with no dedicated team, a bespoke engine + generators is maintenance we cannot staff, and it undermines the registry's "readable owned source" value |

**Empirical confirmation from the first-pass audit:** across 7 composition
components, 40 of 66 props were `composition-owned` and 0 were simple
forwards — an engine would have bought almost nothing. Even among "direct"
components, 5 props were `composition-owned` and several map single legacy
components onto multi-part primitives (Breadcrumb List/Item/Separator, Tabs
Trigger/Content).

## 3. Architecture — three layers, one shared thing

```
Adapter contract (DATA)      ← the durable, shared artifact
   component-mappings.json (extended)
        │
        ├─→ catalogue / docs        (generated from the data)
        └─→ shared TEST KIT         (build-time only; NEVER shipped to clients)

Runtime facades (CODE)       ← plain, self-contained; logic INLINED
   src/facades/*.tsx          (no shared runtime import)
```

The key decision: **there is no shared runtime module.** The precedence rule and
callback-composition logic are small (~5 lines) and are **inlined into each
facade**. Consequences:

- **Objection 6 disappears** — nothing shared is copied into client repos, so
  nothing can be overwritten or version-skewed.
- Each installed facade is fully readable on its own — the registry's core value.
- The only shared, durable thing is the **contract data**; the only other shared
  thing is the **test kit**, which runs in *our* repo and is never distributed.

The inlining trade-off (duplication / drift risk) is neutralized by the test kit
(§6), which enforces the convention without a shared runtime.

## 4. Two independent axes: category vs mode

The previous draft's central mistake was conflating these. They are orthogonal.

```
Migration category  (what is the shadcn target?)
   Direct / Composition / Ambiguous / No-equivalent

Implementation mode (how is the facade built?)
   Props-only  /  Handwritten
```

| Component | Category | Mode | Why |
|---|---|---|---|
| InputNumber | Direct | Props-only | one Input, value + event conversion |
| Basic InputText | Direct | Props-only | one Input, defaults + event conversion |
| Avatar | Direct | Handwritten | generates initials, renders fallback, merges styles |
| InputCheckbox | Direct | Handwritten | label wrapper, controlled-state rules, callback composition |
| InputRadio | Direct | Handwritten | generates items/labels/ids from `options` |
| Tabs, Accordion | Direct | Handwritten | compound children, index↔value state |
| Tooltip | Direct | Handwritten | trigger/content composition |
| Button, InputDate | Composition | Handwritten | multiple primitives + owned behavior |

"Props-only" is the rare case, not the default. We do **not** assume a component
is props-only because it is `Direct`.

## 5. The adapter contract (data)

Extend the existing `component-mappings.json` entries. Per-prop shape (already
close to what exists):

```jsonc
{
  "id": "value",
  "kind": "forwarded | mapped | constant | composition-owned | unsupported | needs-review",
  "from": ["value"],                       // legacy prop name(s)
  "targets": [{ "component": "input", "prop": "value" }],  // [] for unsupported/needs-review
  "valueMap": { "small": "sm" },           // optional, enum→enum only
  "callback": "compose | replace",          // optional, for event props (see §7)
  "summary": "one-line human reason"
}
```

Add two component-level fields the review's model requires:

```jsonc
{
  "id": "input-checkbox",
  "category": "direct",
  "mode": "handwritten",        // NEW: props-only | handwritten
  "callbackPolicy": "compose",  // NEW: default policy when both APIs present
  ...
}
```

This data is the single source of truth consumed by the catalogue and the tests.
It does **not** generate runtime code.

## 6. The shared test kit (build-time only)

A test helper in our repo (not a registry item) that every facade's test imports.
For each component it asserts, against the contract data:

1. **Coverage** — every legacy prop appears in the contract (nothing silently
   missing).
2. **No release-blockers** — zero `needs-review` for a component marked shippable.
3. **Precedence** — when a native/shadcn prop and an Applique-owned prop target
   the same primitive prop, the Applique value wins.
4. **Callback composition** — where `callbackPolicy: compose`, both the shadcn
   and Applique handlers fire, and the Applique one is skipped on
   `details.isCanceled` (the existing checkbox/radio behavior).
5. **Value/absent contract** — declared input→output cases hold, *including the
   absent-value case* (e.g. InputNumber stays controlled with `""`).

This kit is how we get consistency without a shared runtime module.

## 7. Rules to agree before writing code

The review is right that these must be settled first; here are the proposed
defaults.

| Rule | Proposed default |
|---|---|
| **Both Applique and shadcn callbacks provided** | Run shadcn handler first; if not `isCanceled`, run Applique handler. Never overwrite the client's shadcn callback. (Matches current checkbox/radio.) |
| **Authoritative legacy prop list** | The `Props` interface in `node_modules/@applique-ui/<c>/dist/*.d.ts`; where no dist exists, `src/*.tsx`. Recorded per component in the contract. |
| **Absent / default values** | Explicit per prop in the contract. A props-only facade must state its absent-value behavior (e.g. `value` absent → `""`, controlled). No implicit skipping. |
| **Release-blockers** | Any `needs-review` prop blocks that component from "shippable" (enforced by the test kit). |
| **Shared registry helper versioning** | N/A — decided: **no shared runtime module**. Logic is inlined per facade. |

## 8. Implementation plan (small, sequential — no big-bang)

1. **Contract + test kit first (additive, low-risk).**
   - Finalize the per-prop + component-level contract shape in
     `component-mappings.json` (add `mode`, `callbackPolicy`).
   - Build the build-time test kit (§6).
   - Fold in the completed first-pass audit (13 components already drafted) after
     human review. Neither step touches shipped runtime.

2. **Pilot InputNumber as the one props-only reference.**
   - Keep it handwritten but make it the canonical "props-only" example.
   - Its existing tests must pass unchanged; add the kit assertions (esp. the
     absent-value/controlled case, objection 5).

3. **Try basic InputText as the second props-only case.**
   - If InputNumber + InputText share a genuinely clear shape, *only then*
     consider extracting a tiny `createSimpleFacade` — the rule of three. Not
     before.

4. **Leave Avatar, Checkbox, Radio, and all composition facades handwritten.**
   - They already work. They adopt the contract + kit; no runtime refactor.

5. **Generators later.**
   - Catalogue generation from the contract, then optional `.d.ts` for JS
     consumers — only after two or three adapters prove the contract shape.

## 9. Explicitly dropped (from the previous draft)

- The universal `createFacade` runtime engine and `applySpec` pipeline.
- Any shared `_engine` / shared runtime helper copied into client repos.
- Runtime-string-based type generation and `: FacadeSpec` annotation.
- The assumption that `Direct` components collapse to data.

## 10. Acceptance criteria

- Contract data carries `category`, `mode`, `callbackPolicy`, and a classified
  entry for **every** legacy prop; catalogue renders from it.
- Test kit enforces coverage, precedence, callback composition, and the
  absent-value contract; `needs-review` blocks shippable.
- InputNumber pilot: existing tests pass unchanged, kit assertions added.
- No shared runtime module exists in the registry output; each facade is
  self-contained and readable.
- A `createSimpleFacade` is introduced **only** if a third genuine props-only
  component justifies it.
