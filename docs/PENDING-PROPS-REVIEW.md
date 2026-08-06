# Pending props & components — review / discussion queue

> **The tables are auto-derived** from [`component-mappings.json`](../packages/shadcn-primitives/catalog/component-mappings.json).
> These are the props the facade layer has **not** finalized: either deliberately
> `unsupported` (a documented "tweak this" for migrating clients) or `needs-review`
> (the right shadcn target/behaviour is still an open decision). Everything here is
> surfaced on purpose — nothing is dropped silently. See buckets 4-5 in
> [REGISTRY-APPROACH.md §9](./REGISTRY-APPROACH.md).
>
> Regenerate the tables rather than hand-editing their rows. Last generated: 2026-08-05.

**Totals:** 67 items — 63 `needs-review`, 4 `unsupported`, across 24 components (7 already have a facade built).


## How to read a pending item

### Example 1: a prop on an existing facade

The queue lists Button `color` as `needs-review`. Existing client code may contain:

```tsx
<Button color="red">Delete</Button>
```

shadcn Button does not accept an arbitrary `color`; it exposes semantic variants:

```tsx
<InternalButton variant="destructive">Delete</InternalButton>
```

The facade should not automatically assume that every `color="red"` means a
destructive action. It may instead be a brand colour or a client customization.
The pending decision is therefore whether UX approves a rule such as
`color="red"` → `variant="destructive"`, which legacy colours are supported, and
what happens for every other string. Until that decision is made, the facade does
not claim that `color` is compatible.

By contrast, Button `state` is marked `unsupported`. That means the escape hatch
is deliberately excluded rather than waiting for an automatic mapping. A client
still using it must replace it with an explicit `className` or a client-owned
wrapper during migration.

### Example 2: a component whose target depends on usage

The queue lists Dropdown `children` as `needs-review` because the name
`Dropdown` does not identify one interaction:

```tsx
// A stored form value should become Select.
<Dropdown trigger={source} isOpen={isSourceOpen}>
  {sources.map((option) => (
    <button key={option} type="button" onClick={() => setSource(option)}>
      {option}
    </button>
  ))}
</Dropdown>

// A list of commands should become DropdownMenu.
<Dropdown trigger="Actions" isOpen={isActionsOpen}>
  <button type="button" onClick={archive}>Archive</button>
</Dropdown>

// Arbitrary interactive content should become Popover.
<Dropdown trigger="Filters" isOpen={isFilterOpen}>
  <AdvancedFilters />
</Dropdown>
```

Choosing one shadcn target globally would break at least two of these usages.
The action is to inspect real call sites first, then select or compose the correct
facade behavior.


## A. On already-migrated facades (actionable now)

A client using one of these props today gets a documented tweak, not a surprise.
These are what stand between the listed facades and "production-ready".

| Component | Prop | Kind | Note |
|---|---|---|---|
| `accordion` | `active` | needs-review | Documentation defines an expanded-item index, but the legacy active getter is unused and each Accordion.Item keeps in… |
| `banner` | `actionable-icon-null` | needs-review | The regular Banner treats null as an icon opt-out, but the legacy Actionable renders an empty icon shell. The test fa… |
| `banner` | `actionable-overlay-semantics` | needs-review | Actionable is a fixed full-screen takeover. Decide whether to preserve the legacy Alert-only behavior or adopt Dialog… |
| `button` | `color` | needs-review | Do not map arbitrary color strings automatically. UX must define semantic tone variants for the supported legacy colors. |
| `button` | `state` | unsupported | Drop the undocumented arbitrary-state CSS class escape hatch; clients should use className while remaining usage is r… |
| `button` | `to` | needs-review | Use an explicit client router render integration when supplied. Otherwise derive a browser href for string or locatio… |
| `input-number` | `legacy-input-escape-hatches` | unsupported | These undocumented InputNumber escape hatches require separate usage and UX review before entering the facade contract. |
| `input-text` | `advanced-input-features` | unsupported | The Basic InputText pilot intentionally defers composition, validation context, and legacy wrapper styling. |
| `input-text` | `class-name` | needs-review | Legacy Input can apply this to a wrapper while the registry Input applies it to the input element; approve the target… |
| `tabs` | `documented-is-active` | needs-review | The generated root documentation exposes this child-internal prop, but the Tabs runtime overwrites it from the select… |
| `tabs` | `type` | needs-review | The legacy primary and secondary styles do not exactly match shadcn line and default variants, so the visual mapping … |
| `tooltip` | `trigger-on` | needs-review | Hover and focus match tooltip behavior, but the active legacy click mode would require a different interaction such a… |


## B. On not-yet-migrated components (decide when building)

Open questions captured during the prop audit; resolved as each component is built.

| Component | Prop | Kind | Note |
|---|---|---|---|
| `dropdown` | `children` | needs-review | Inspect usage: stored values become Select items, actions become DropdownMenu items, and arbitrary interactive conten… |
| `dropdown` | `container` | needs-review | The current registry wrappers do not expose the legacy custom portal container contract. |
| `dropdown` | `trigger-on` | needs-review | Click is broadly supported, but hover and focus semantics are not uniform across all three candidate targets. |
| `fab` | `class-name` | needs-review | The current runtime ignores className; choose whether it belongs on the floating wrapper or trigger. |
| `fab` | `disabled` | needs-review | Docs promise a disabled trigger, but the current Fab destructures and ignores disabled; decide whether to restore the… |
| `fab` | `icon` | needs-review | The current trigger always renders an ellipsis and ignores the documented primary icon; decide whether to restore the… |
| `fab` | `on-click` | needs-review | Docs promise a trigger callback, but the current runtime ignores it; decide whether to restore it while composing ope… |
| `fab` | `secondary-icon` | needs-review | The documented open/closed icon toggle is not implemented by the current runtime and needs an explicit compatibility … |
| `field` | `info` | needs-review | The prop is documented as an info-icon toggle, but the legacy Field implementation never reads or renders it and only… |
| `image` | `class-name` | needs-review | Current runtime applies className only to the loaded img, not the placeholder; decide whether the facade preserves th… |
| `image` | `lazy` | needs-review | This is the documented replacement, but defaulted lazyLoad currently shadows it. Define normalized precedence and tre… |
| `image` | `lazy-load` | needs-review | This deprecated prop is active, defaults to true, and takes precedence over lazy. Preserve the transparent placeholde… |
| `input` | `field-context` | needs-review | Runtime uses this internal Field prop to override disabled and error; decide whether the new Field facade supplies it… |
| `input-date` | `class-name` | needs-review | Keep this on an Applique facade wrapper; approve its DOM target before clients depend on selector placement. |
| `input-date` | `disabled-time` | needs-review | This runtime-only time constraint needs a documented facade type and UX behavior before the time recipe is considered… |
| `input-file` | `class-name` | needs-review | BaseProps accepts className, but the current hidden input overwrites it; choose a facade root or hidden-input target … |
| `input-file` | `variant` | needs-review | The legacy bordered/standard preview styles need an explicit Attachment recipe; there is no equivalent primitive vari… |
| `input-month` | `class-name` | needs-review | BaseProps accepts className, but InputMonth overwrites the picker class and does not forward it to the trigger; choos… |
| `input-select` | `class-name` | needs-review | BaseProps permits className, but the current InputSelect implementation does not forward it; choose an intentional fa… |
| `input-select` | `id` | needs-review | The current InputSelect drops a client id and generates internal ids; define whether the facade id belongs on the inp… |
| `input-select` | `render-option` | needs-review | This is documented, but the current InputSelect runtime never calls it and always renders item[labelKey]; decide whet… |
| `input-select` | `required` | needs-review | Legacy required suppresses the reset control but is not forwarded to the input; decide whether the facade preserves t… |
| `input-select` | `searchable` | needs-review | The runtime toggles an editable search input; for migration it also decides whether Select or Combobox is the appropr… |
| `input-select` | `style` | needs-review | The current InputSelect drops style; choose whether to preserve that no-op or apply it to the composed field root. |
| `input-select` | `variant` | needs-review | The runtime defaults this nominally required prop to bordered and applies bordered/standard classes; approve the regi… |
| `list` | `class-name` | needs-review | The chosen display, command, or selection root determines where the legacy list class belongs. |
| `list` | `id` | needs-review | The legacy id lands on the listbox, but the chosen registry target determines whether it belongs on ItemGroup, Comman… |
| `list` | `multiple` | needs-review | This changes value shape, enables select-all, and usually decides between RadioGroup and a Checkbox composition. |
| `list` | `on-change` | needs-review | Adapt to RadioGroup onValueChange, Checkbox onCheckedChange, or CommandItem onSelect only after the selection intent … |
| `list` | `style` | needs-review | The legacy renderContainer overwrites a caller style with its layout style; decide whether the facade preserves that … |
| `list` | `value` | needs-review | The target depends on usage: RadioGroup owns a scalar value, while multiple selection needs individually controlled C… |
| `list` | `virtualized` | needs-review | VirtualList is active legacy behavior; none of the shortlisted registry wrappers replaces it directly, so retain a vi… |
| `loader` | `children` | unsupported | Loader explicitly declares children as never; use text for the supported visible label. |
| `loader` | `current-color` | needs-review | The prop is documented but ignored by the current Loader runtime; decide whether the facade should restore the intend… |
| `loader` | `id` | needs-review | BaseProps permits id, but the current Loader drops it; decide whether the facade applies it to the outer wrapper. |
| `loader` | `is-loading` | needs-review | Legacy bar animation stops when false, but legacy spinner animation does not; choose whether compatibility preserves … |
| `loader` | `style` | needs-review | BaseProps permits style, but the current Loader drops it; decide whether the facade applies it to the outer wrapper. |
| `loader` | `text-position` | needs-review | This is documented but ignored by the current runtime, and its TypeScript declaration is one combined string literal … |
| `loader` | `type` | needs-review | inline, small, and large control both size and surrounding layout; map them only after choosing Spinner or Progress a… |
| `nav-bar` | `id` | needs-review | The legacy NavBar replaces a caller id with its generated navigation id; decide whether the facade preserves that beh… |
| `nav-bar` | `nav-group-style` | needs-review | Nested legacy groups pass style to their trigger item, while the depth-zero group ignores it; choose an explicit faca… |
| `nav-bar` | `nav-item-on-click` | needs-review | A legacy BaseProps onClick overrides the item's internal navigation handler because of spread order; decide whether t… |
| `nav-bar` | `on-header-click` | needs-review | The public type exposes this callback, but the current header handler never invokes it; decide whether compatibility … |
| `nav-bar` | `title` | needs-review | The prop is documented, but the depth-zero legacy NavBar.Group never renders it; decide whether the facade preserves … |
| `page` | `always-open` | needs-review | This undocumented-but-active prop applies a legacy layout class; choose whether the registry equivalent is collapsibl… |
| `pagination` | `class-name` | needs-review | The prop is declared private and passed to Pages, but Pages ignores it at runtime; define a new root target before pr… |
| `progress` | `appearance` | needs-review | success, info, warning, and danger are active semantic colors; approve their token classes on ProgressIndicator and t… |
| `progress` | `size` | needs-review | small, medium, and large change bar height or circle diameter by different legacy scales; approve separate mappings b… |
| `progress` | `type` | needs-review | bar maps to Progress and circle needs a custom determinate SVG; use Spinner only after a call-site audit confirms the… |
| `table` | `appearance` | needs-review | The default/striped type is documented, but current renderers do not implement it; approve the visual recipe before e… |
| `table` | `class-name` | needs-review | Legacy renderers apply className to an outer wrapper, while shadcn Table applies it to the table element; preserve th… |
| `table` | `display-columns` | needs-review | The prop is documented but current Table does not use it and may leak it to the DOM; define intended visibility behav… |
| `top-nav` | `class-name` | needs-review | BaseProps permits className, but TopNav currently drops it; decide whether the facade preserves that no-op or adds an… |
| `top-nav` | `id` | needs-review | BaseProps permits id, but TopNav currently drops it; decide whether the facade applies it to the outer shell. |
| `top-nav` | `style` | needs-review | BaseProps permits style, but TopNav currently drops it; decide whether the facade preserves that no-op or applies it … |
