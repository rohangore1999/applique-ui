# Prop-migration audit — first-pass draft (for review)

> **Status:** Machine-generated first pass from parallel audits on 2026-08-04. NOT reviewed, NOT merged into `component-mappings.json`. Every `needs-review` item and flagged row below needs a human/UX decision before any facade ships.

> **Method:** legacy props read from `@applique-ui/<c>/dist/*.d.ts`; shadcn props from `packages/shadcn-primitives/src/*.tsx`; each legacy prop classified into one strategy. See the toolkit design doc for the model.

## Summary

- **27 components**, **250 props** classified.
- forwarded **63**, mapped **40**, composition-owned **117**, unsupported **19**, needs-review **11**.

## Decisions needed first (the 11 `needs-review` props)

These block their component from shipping until resolved. Most are **target-selector** props (they decide *which* shadcn primitive to use) or color/theme semantics UX must define.

| Component | Prop | Why it needs a decision |
|---|---|---|
| badge | `type` | shadcn badge variant has no success/warning/info color semantics (only error->destructive is plausible), and it collides with the separate legacy `variant` axis that also targets `variant` — resolution depends on design intent. |
| tabs | `type` | Legacy primary/secondary does not clearly correspond to the shadcn TabsList variant default/line; which visual maps to which depends on design intent and real dashboard usage. |
| tooltip | `triggerOn` | base-ui Tooltip opens on hover/focus inherently with no triggerOn prop; the 'click' mode has no tooltip equivalent (would need a Popover), so intent must be confirmed. |
| nav-bar | `theme` | dark/light theming; shadcn uses CSS vars/data-theme so mapping depends on portal theming strategy. |
| input-select | `searchable` | This flag is the target selector itself: searchable=false could map to plain select, true maps to combobox. Resolve per call site before mapping. |
| list | `value` | Controlled selected value(s) have no direct home on command; routes to radio-group value (single) or a checkbox set (multi). Resolve with `multiple`. |
| list | `onChange` | Selection-change callback target depends on the chosen selection primitive (command onSelect vs radio-group/checkbox onCheckedChange). |
| list | `multiple` | Selection-mode switch that decides the real target: false->radio-group (single), true->checkbox set (multi). Not expressible on command alone. |
| loader | `appearance` | Target selector: appearance='spinner'->spinner, appearance='bar'->progress. Resolve per call site. |
| modal | `type` | Target selector: type='MOBILE_DRAWER'->drawer/sheet, 'DESKTOP'->dialog. Resolve per call site. |
| progress | `type` | Discriminant bar|circle: 'bar'->progress cleanly, but 'circle' has no shadcn circular-progress (would need a custom SVG or spinner). Resolve per call site. |

## Component overview

### Direct (6)

| Component | Target(s) | Mode | Props | fwd | map | comp | unsup | review |
|---|---|---|--:|--:|--:|--:|--:|--:|
| accordion | accordion | handwritten | 6 | 3 | 2 | 1 | 0 | 0 |
| badge | badge | handwritten | 8 | 3 | 1 | 2 | 1 | 1 |
| bread-crumb | breadcrumb | handwritten | 3 | 3 | 0 | 0 | 0 | 0 |
| input-text-area | textarea | handwritten | 14 | 7 | 3 | 1 | 3 | 0 |
| tabs | tabs | handwritten | 7 | 3 | 3 | 0 | 0 | 1 |
| tooltip | tooltip | handwritten | 7 | 3 | 1 | 1 | 1 | 1 |

### Composition (16)

| Component | Target(s) | Mode | Props | fwd | map | comp | unsup | review |
|---|---|---|--:|--:|--:|--:|--:|--:|
| banner | alert,button | handwritten | 8 | 1 | 3 | 4 | 0 | 0 |
| button-group | button-group,dropdown-menu | handwritten | 4 | 2 | 0 | 2 | 0 | 0 |
| fab | button,dropdown-menu,popover | handwritten | 10 | 4 | 1 | 5 | 0 | 0 |
| field | field,label | handwritten | 11 | 2 | 2 | 7 | 0 | 0 |
| form | field,input,select,checkbox,radio-group | handwritten | 9 | 1 | 0 | 8 | 0 | 0 |
| image | aspect-ratio,skeleton | handwritten | 7 | 2 | 0 | 4 | 1 | 0 |
| input | input,input-group | handwritten | 13 | 6 | 1 | 4 | 2 | 0 |
| input-file | input,button,attachment | handwritten | 9 | 1 | 2 | 6 | 0 | 0 |
| input-month | calendar,popover,input | handwritten | 8 | 0 | 4 | 4 | 0 | 0 |
| nav-bar | sidebar,sheet,navigation-menu | handwritten | 18 | 2 | 2 | 9 | 4 | 1 |
| page | sidebar,breadcrumb,navigation-menu | handwritten | 5 | 1 | 1 | 3 | 0 | 0 |
| pagination | pagination,select,input | handwritten | 8 | 1 | 0 | 7 | 0 | 0 |
| section | card,separator | handwritten | 5 | 2 | 0 | 3 | 0 | 0 |
| table | table,input,dropdown-menu,pagination | handwritten | 14 | 2 | 0 | 12 | 0 | 0 |
| top-bar | breadcrumb,avatar,dropdown-menu | handwritten | 4 | 1 | 0 | 3 | 0 | 0 |
| top-nav | navigation-menu,sheet,sidebar | handwritten | 8 | 1 | 0 | 7 | 0 | 0 |

### Ambiguous (5)

| Component | Target(s) | Mode | Props | fwd | map | comp | unsup | review |
|---|---|---|--:|--:|--:|--:|--:|--:|
| input-select | **combobox** (select,combobox,native-select) | handwritten | 25 | 7 | 5 | 10 | 2 | 1 |
| list | **command** (item,command,checkbox,radio-group) | handwritten | 9 | 1 | 0 | 4 | 1 | 3 |
| loader | **spinner** (spinner,progress) | handwritten | 8 | 1 | 2 | 3 | 1 | 1 |
| modal | **dialog** (dialog,alert-dialog,drawer,sheet) | handwritten | 12 | 1 | 5 | 5 | 0 | 1 |
| progress | **progress** (progress,spinner) | handwritten | 10 | 2 | 2 | 2 | 3 | 1 |

## Per-component detail

### accordion  

_category:_ direct · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Facade wraps base-ui Accordion.Root, translating Applique's index-based single-expansion contract (active/onChange) onto base-ui's value-array model while composing Item/Trigger/Content sub-parts._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `active` | mapped | accordion.value | — | Legacy expanded-item index (number) must be transformed into base-ui's value/defaultValue (item-value array); shape differs so it is a transform, not a passthrough. |
| `onChange` | mapped | accordion.onValueChange | — | Legacy onChange(currentIndex, active) has a different signature from base-ui onValueChange(value); needs an adapter converting value array back to index+active. |
| `controlIcons` | composition-owned | accordion.children | — | Custom open/close icons are hardcoded (ChevronDown/ChevronUp) in AccordionTrigger; honoring them requires re-rendering the trigger, not a primitive prop. |
| `className` | forwarded | accordion.className | — | Merged via cn() onto Accordion.Root; same name and behavior. |
| `children` | forwarded | accordion.children | — | Item content passes through to Accordion.Root children. |
| `...props` | forwarded | accordion....props | — | BaseProps' open [key:string]:any spread (id, data-*, aria-*, event handlers) forwards to the underlying element unchanged. |

### badge  

_category:_ direct · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Facade renders base-ui useRender span with badgeVariants; it must collapse Applique's two style axes (type color + variant fill) into the single shadcn variant and compose icon/close affordances as children._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `type` | needs-review | — | — | shadcn badge variant has no success/warning/info color semantics (only error->destructive is plausible), and it collides with the separate legacy `variant` axis that also targets `variant` — resolution depends on design intent. |
| `variant` | mapped | badge.variant | {"solid": "default", "outlined": "outline"} | solid/outlined fill style maps to shadcn variant default/outline; note it shares the target `variant` with legacy `type` (see needs-review above). |
| `size` | unsupported | — | — | shadcn badge has a fixed height (h-5) with no size variant, so small/regular is dropped. |
| `icon` | composition-owned | badge.children | — | No icon prop; the primitive styles [&>svg] and has-data-[icon] slots, so the facade must render the icon element as a child. |
| `onClose` | composition-owned | badge.children | — | No onClose prop; a dismiss button must be composed as a child that invokes the callback. |
| `children` | forwarded | badge.children | — | Label text passes straight through to the span children. |
| `className` | forwarded | badge.className | — | Merged via cn() with badgeVariants; same name and behavior. |
| `...props` | forwarded | badge....props | — | BaseProps' [key:string]:any spread (id, data-*, aria-*, onClick, etc.) forwards to the span unchanged. |

### bread-crumb  

_category:_ direct · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Applique BreadCrumb/BreadCrumbItem expose only BaseProps; the facade forwards className/children while internally composing the shadcn nav/list/item/separator sub-parts (auto-separators become explicit BreadcrumbSeparator)._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `className` | forwarded | breadcrumb.className | — | Forwarded to the Breadcrumb nav (and BreadcrumbItem li) via cn(); same name and behavior. |
| `children` | forwarded | breadcrumb.children | — | Crumb items pass through; note the facade must wrap them in BreadcrumbList and inject separators the legacy component rendered automatically. |
| `...props` | forwarded | breadcrumb....props | — | BaseProps' [key:string]:any spread (id, data-*, aria-*, event handlers) forwards to the underlying element unchanged. |

### input-text-area  

_category:_ direct · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Facade wraps the native shadcn textarea, adapting Applique's value-only onChange and error/noResize flags while composing icon and legacy variant behavior the bare primitive lacks._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `value` | forwarded | textarea.value | — | Controlled value passes straight to the native textarea. |
| `onChange` | mapped | textarea.onChange | — | Legacy onChange(value: string) differs from native onChange(event); facade adapter must extract e.target.value. |
| `disabled` | forwarded | textarea.disabled | — | Native disabled attribute; same name and behavior with matching disabled: styling. |
| `rows` | forwarded | textarea.rows | — | Native textarea rows attribute; passes through unchanged. |
| `noResize` | mapped | textarea.className | — | Boolean has no primitive prop; true maps to a resize-none utility class appended to className. |
| `placeholder` | forwarded | textarea.placeholder | — | Native placeholder attribute; passes through unchanged. |
| `readOnly` | forwarded | textarea.readOnly | — | Native readOnly attribute; passes through unchanged. |
| `icon` | composition-owned | textarea.className | — | The bare textarea has no prefix-icon slot; rendering an icon requires wrapping (e.g. input-group) plus padding, i.e. extra composition. |
| `error` | mapped | textarea.aria-invalid | — | Error state is surfaced via aria-invalid, which drives the primitive's destructive ring/border styling. |
| `variant` | unsupported | — | — | shadcn textarea has a single bordered look with no bordered/standard variant, so the standard (borderless) style is dropped. |
| `__fieldContext` | unsupported | — | — | Private internal channel for parent Field error/disabled propagation; a legacy escape-hatch not carried onto the primitive (shadcn uses its own field.tsx wiring). |
| `adornmentPosition` | unsupported | — | — | Present only in the runtime destructure, undocumented and absent from the Props interface; treated as a dropped escape-hatch. |
| `className` | forwarded | textarea.className | — | Merged via cn(); same name and behavior (marked @private in legacy but structurally identical). |
| `...props` | forwarded | textarea....props | — | BaseProps' [key:string]:any spread (name, id, maxLength, onBlur, aria-*, etc.) forwards to the native textarea unchanged. |

### tabs  

_category:_ direct · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Facade wraps base-ui Tabs.Root, translating Applique's numeric index model (defaultIndex/activeIndex/onChange) to base-ui value-based selection and composing TabsList/Trigger/Content from legacy Tab children._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `defaultIndex` | mapped | tabs.defaultValue | — | Numeric default index must be transformed into base-ui defaultValue (tab value). |
| `activeIndex` | mapped | tabs.value | — | Controlled numeric index maps to base-ui value; requires index<->value conversion. |
| `onChange` | mapped | tabs.onValueChange | — | Legacy onChange(activeIndex: number) differs from base-ui onValueChange(value); adapter must map value back to index. |
| `type` | needs-review | — | — | Legacy primary/secondary does not clearly correspond to the shadcn TabsList variant default/line; which visual maps to which depends on design intent and real dashboard usage. |
| `className` | forwarded | tabs.className | — | Merged via cn() onto Tabs.Root; same name and behavior. |
| `children` | forwarded | tabs.children | — | Tab children pass through, though the facade must split each legacy Tab into TabsTrigger (title) + TabsContent (body). |
| `...props` | forwarded | tabs....props | — | BaseProps' [key:string]:any spread (id, data-*, aria-*, event handlers) forwards to the underlying element unchanged. |

### tooltip  

_category:_ direct · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Facade composes base-ui Tooltip.Root/Trigger/Content, wrapping the legacy trigger children and rendering renderContent() into TooltipContent, while mapping position->side._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `renderContent` | composition-owned | tooltip.children | — | Render function has no primitive prop; the facade must invoke it and place the result inside TooltipContent children. |
| `position` | mapped | tooltip.side | {"up": "top", "down": "bottom", "left": "left", "right": "right"} | Legacy up/down/left/right maps to TooltipContent side top/bottom/left/right. |
| `triggerOn` | needs-review | — | — | base-ui Tooltip opens on hover/focus inherently with no triggerOn prop; the 'click' mode has no tooltip equivalent (would need a Popover), so intent must be confirmed. |
| `dark` | unsupported | — | — | shadcn TooltipContent is always styled dark (bg-foreground/text-background) with no light variant, so the dark toggle has no effect to map. |
| `children` | forwarded | tooltip.children | — | The trigger element passes through, wrapped by the facade in TooltipTrigger. |
| `className` | forwarded | tooltip.className | — | Merged via cn() onto TooltipContent; same name and behavior. |
| `...props` | forwarded | tooltip....props | — | BaseProps' [key:string]:any spread (id, data-*, aria-*, event handlers) forwards to the underlying element unchanged. |

### banner  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Banner composes an Alert with a semantic color/icon, title + message body, an optional link, and a dismiss Button wired to onClose._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `color` | composition-owned | alert.variant | — | Applique has 4 semantic colors (error/warning/success/info) each with a matching icon; shadcn alert only exposes default/destructive, so the color-to-variant+icon styling is composed. |
| `type` | mapped | alert.variant | {"error": "destructive", "warning": "default", "success": "default", "info": "default"} | Deprecated alias of color; same enum, maps to alert variant via the same color composition. valueMap: error->destructive, warning/success/info->default (lossy). |
| `icon` | composition-owned | alert.children (svg) | — | IconName is resolved to an svg rendered as an alert child; default derives from color, set null to remove. Applique icon-resolution logic. |
| `title` | mapped | alert.AlertTitle/children | — | Heading string maps to AlertTitle children. |
| `children` | mapped | alert.AlertDescription/children | — | Message body maps to AlertDescription children. |
| `onClose` | composition-owned | alert.AlertAction, button.onClick | — | Renders a dismiss Button inside AlertAction wired to onClose; shadcn alert has no built-in dismiss. |
| `link` | composition-owned | alert.children, button.asChild(link) | — | {href, displayText} is rendered as a link/button inside the banner body; Applique layout + validation logic. |
| `className,id,style,...BaseProps native div attrs` | forwarded | alert.className/...native | — | Root div/native attributes spread onto the Alert root. |

### button-group  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Bunches related buttons into a horizontal row and overflows extras into a 'more' dropdown menu._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `structure` | composition-owned | button.variant, dropdown-menu.children | — | Chooses which single button variant is primary and pushes the remaining buttons into the more-dropdown; owned grouping logic across button + dropdown-menu. |
| `className` | forwarded | button-group.className | — | Passed straight to the button-group wrapper className. |
| `children` | composition-owned | button-group.children, dropdown-menu.children | — | Child buttons are laid out inline and overflowed into dropdown-menu items by the composition. |
| `native-props` | forwarded | button-group....div attrs | — | Remaining native div attributes (id, role, data-*, aria-*) spread onto the button-group root. |

### fab  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ compose  
_A fixed floating action button that toggles a directional popover/dropdown of secondary actions._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `direction` | mapped | popover.side | {"up": "top", "down": "bottom", "left": "left", "right": "right"} | FAB expansion direction maps to the popover/positioner side. |
| `disabled` | forwarded | button.disabled | — | Forwarded to the trigger button disabled. |
| `triggerOn` | composition-owned | popover.children, dropdown-menu.children | — | Selects hover/click/focus open behavior on the trigger; owned interaction logic (shadcn opens on click by default). |
| `onClick` | forwarded | button.onClick | — | Forwarded to the button onClick; shadcn handler fires first, then the Applique handler. |
| `className` | forwarded | button.className | — | Applied to the FAB trigger button root. |
| `icon` | composition-owned | button.children | — | Applique IconName rendered as the primary button icon child. |
| `secondaryIcon` | composition-owned | button.children | — | Toggles with the primary icon on open/close; owned stateful icon swap. |
| `position` | composition-owned | — | — | Fixed on-screen placement (right-bottom, center-top, etc.); owned wrapper positioning with no shadcn primitive prop. |
| `children` | composition-owned | dropdown-menu.children | — | Secondary action nodes rendered as dropdown-menu items in the popover. |
| `native-props` | forwarded | button....button attrs | — | Remaining native attributes spread onto the trigger button. |

### field  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Field wraps a control with a title/label, description or error/success meta, required asterisk and info block, and injects error/disabled context into its child control._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `title` | mapped | label.children, field.FieldLabel/FieldTitle children | — | Label text maps to FieldLabel/Label children. |
| `description` | mapped | field.FieldDescription/children | — | Helper text maps to FieldDescription children. |
| `error` | composition-owned | field.FieldError, label.error styling | — | ReactNode\|boolean: renders FieldError (role=alert), toggles error styling on the label, and injects error into the child control via __fieldContext. Array errors are joined. |
| `success` | composition-owned | field.FieldDescription(success) | — | Renders a success message in place of the description; no native shadcn success slot. |
| `required` | composition-owned | field.FieldLabel asterisk | — | Renders a required asterisk in the label; shadcn field has no required prop. |
| `disabled` | composition-owned | field.data-disabled + child __fieldContext | — | Adds disabled styling on the container and injects disabled into the child control via cloneElement context. |
| `fieldInfo` | composition-owned | field.FieldLabel adornment | — | ReactNode rendered inside the label as an info block. |
| `info` | composition-owned | field.FieldLabel info icon | — | Boolean toggling an info icon in the label. |
| `htmlFor` | forwarded | label.htmlFor | — | Associates the label with the control; also used to derive label/error/description ids for aria. |
| `children` | composition-owned | field.control slot | — | Rendered as the control, but Applique clones each child to inject __fieldContext (error/disabled); shadcn just renders children so the coordination is composed. |
| `className,id,style,...BaseProps native div attrs` | forwarded | field.className/...native | — | Container div/native attributes spread onto the Field root. |

### form  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Form renders a <form> with a title and CTA row, owns aggregate value/onChange state, and distributes per-field value/onChange to typed static field subcomponents (Text/Select/Checkbox/Date/Number/Radio/TextArea/File) via createFieldProps._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `value` | composition-owned | field.aggregate state, input.value, select.value, checkbox.checked, radio-group.value | — | Aggregate form value object; createFieldProps slices it per field name and feeds each control. Applique state coordination. |
| `onChange` | composition-owned | field.aggregate state | — | Called with the whole value object; built by merging individual field onChange callbacks. Applique state coordination. |
| `onSubmit` | composition-owned | field.form submit | — | Form-level submit handled by the composed <form> element (handleSubmit); no dedicated shadcn form primitive in the target set. |
| `title` | composition-owned | field.heading | — | Form heading rendered above fields. |
| `actions` | composition-owned | field.CTA layout | — | left/right/centered positioning of the Form.Action (Button) CTA row; pure layout composition. |
| `defaultFieldSize` | composition-owned | field.layout width | — | Grid ColumnSize default width per field (Applique grid); shadcn has no grid primitive, so this is layout composition. |
| `rowGap` | composition-owned | field.spacing | — | Vertical spacing between rows; layout composition. |
| `disabled` | composition-owned | input.disabled, select.disabled, checkbox.disabled, radio-group.disabled | — | Disables the whole form; must be fanned out to every composed control. |
| `className,id,style,...BaseProps native form attrs` | forwarded | field.form className/...native | — | Native attributes spread onto the <form> root. |

### image  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Lazy-loads an image, holding a skeleton placeholder inside a fixed aspect ratio until it intersects and loads._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `src` | composition-owned | aspect-ratio.children | — | Image URL rendered onto the internal <img> once download is triggered; loading is owned by the composition. |
| `height` | composition-owned | aspect-ratio.ratio | — | Contributes with width to derive the aspect-ratio ratio / sizing. |
| `width` | composition-owned | aspect-ratio.ratio | — | Contributes with height to derive the aspect-ratio ratio / sizing. |
| `lazyLoad` | unsupported | — | — | Deprecated/private duplicate of lazy; dropped. |
| `lazy` | composition-owned | skeleton....placeholder | — | Enables IntersectionObserver-driven lazy loading with a skeleton placeholder; owned behavior. |
| `className` | forwarded | aspect-ratio.className | — | Applied to the aspect-ratio wrapper. |
| `native-props,children` | forwarded | aspect-ratio.children | — | Remaining native <img> attributes (alt, title, onLoad, onError) and children spread onto the rendered image. |

### input  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Input is a text-like control that optionally wraps the native input in an InputGroup to render an icon or start/end adornment, and reflects error/disabled from Field context._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `type` | forwarded | input.type | — | Native input type (text/email/password/tel/url/search/number) passed through. |
| `value` | forwarded | input.value | — | Controlled value passed through to native input. |
| `disabled` | forwarded | input.disabled | — | Native disabled passed through (also overridable by Field context). |
| `readOnly` | forwarded | input.readOnly | — | Native readOnly passed through. |
| `placeholder` | forwarded | input.placeholder | — | Native placeholder passed through. |
| `error` | mapped | input.aria-invalid | — | Boolean error state maps to aria-invalid; shadcn styles invalid via aria-invalid rather than an error prop. |
| `icon` | composition-owned | input-group.InputGroupAddon | — | IconName rendered as a prefix icon; in shadcn this requires wrapping in InputGroup + InputGroupAddon. |
| `adornment` | composition-owned | input-group.InputGroupAddon/InputGroupText | — | string\|JSX prefix/suffix rendered via InputGroupAddon; composition of input-group parts. |
| `adornmentPosition` | composition-owned | input-group.InputGroupAddon align | — | start/end selects the addon align (inline-start/inline-end) within InputGroup; only meaningful with adornment. |
| `variant` | composition-owned | input.container style, input-group.container style | {"bordered": "input-group wrapper", "standard": "plain input"} | bordered/standard container styling; shadcn Input has a single style, bordered maps to InputGroup wrapping. Design-team confirmation recommended. |
| `active` | unsupported | — | — | Forced visual active state; shadcn relies on native focus-visible, no equivalent prop. Deliberately dropped. |
| `__fieldContext` | unsupported | — | — | Internal Applique Field->control context injection prop; not a public API and replaced by shadcn Field data attributes. |
| `className,id,style,onChange,onFocus,...BaseProps native input attrs` | forwarded | input.className/...native | — | Remaining native input attributes spread onto the Input. |

### input-file  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ n/a  
_InputFile hides a native file input, renders a browse Button and a placeholder/attachment display of selected files, and runs client-side validations before emitting the FileList._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `onChange` | mapped | input.onChange | — | Emits a FileList (not the native ChangeEvent); event shape differs from shadcn/native input onChange. |
| `value` | mapped | input.files/value | — | FileList value; native input takes files via the FileList API rather than a value string. |
| `placeholder` | composition-owned | attachment.display text | — | Text shown when no file is selected; rendered in the composed display, not the hidden native input. |
| `actions` | composition-owned | button.render-prop | — | Render-prop actions(browse) lets the consumer render custom trigger controls (default is a browse Button). |
| `icon` | composition-owned | attachment.AttachmentMedia, button.icon | — | IconName rendered as an adornment/media in the file display or browse button. |
| `validations` | composition-owned | input.runValidations | — | Array of validation functions run against the FileList before onChange; Applique validation logic with no shadcn equivalent. |
| `onError` | composition-owned | input.validation error | — | Called when a validation throws; part of the Applique validation flow. |
| `variant` | composition-owned | input.container style, attachment.container style | {"bordered": "bordered display", "standard": "plain display"} | bordered/standard styling of the file input display; composed styling, design-team confirmation recommended. |
| `className,id,style,accept,multiple,...BaseProps native input attrs` | forwarded | input.className/...native (type=file) | — | Native file-input attributes (accept, multiple, etc.) spread onto the hidden Input. |

### input-month  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ n/a  
_InputMonth shows a text Input that opens a Popover containing a month/year Calendar picker; it formats the {month,year} value to/from a string and bounds selectable years by minDate/maxDate._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `value` | mapped | calendar.selected/month, input.value (formatted) | — | Value shape is {month:number, year:number}; shadcn Calendar uses Date objects, so a shape conversion is required. |
| `onChange` | mapped | calendar.onSelect | — | Emits {month, year} (nullable); Calendar onSelect provides a Date, so event shape must be converted. |
| `minDate` | mapped | calendar.startMonth/disabled | — | Lower year bound; maps to react-day-picker startMonth/disabled range on the Calendar. |
| `maxDate` | mapped | calendar.endMonth/disabled | — | Upper year bound; maps to react-day-picker endMonth/disabled range on the Calendar. |
| `format` | composition-owned | input.display formatting | — | defaultProps format string; Applique formats {month,year} into the Input's displayed string and parses typed input. No shadcn equivalent. |
| `highlight` | composition-owned | calendar.modifiers/cell styling | — | Callback returning an intent (info/danger/warning/success/disabled) to style individual month/year cells; custom picker-cell composition. |
| `renderMonth` | composition-owned | calendar.components override | — | Custom render function for month cell contents in the picker; maps to Calendar components overrides. |
| `className,id,style,...BaseProps` | composition-owned | input.className, popover.root | — | InputMonth is a stateful wrapper (isOpen, valueAsString); native attributes are distributed across the composed Input/Popover rather than a single passthrough root. |

### nav-bar  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ compose  
_Applique side-nav list re-expressed as a Sidebar (offcanvas Sheet on mobile); most props drive Applique-owned active-path/render/overlay behavior rather than mapping 1:1._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `title` | composition-owned | sidebar.children | — | App/product title rendered inside SidebarHeader by the composition. |
| `currentPath` | composition-owned | sidebar.children | — | Drives active-link highlighting (isActive/data-active on SidebarMenuButton); no direct shadcn prop. |
| `isActivePath` | composition-owned | sidebar.children | — | Predicate deciding active nav link; Applique-owned matching logic applied to menu items. |
| `needOverlay` | composition-owned | sheet.children | — | Whether to render backdrop overlay; shadcn Sheet/offcanvas Sidebar owns overlay so composition gates it. |
| `overlayClickHandler` | mapped | sheet.onOpenChange, sidebar.onOpenChange | — | Overlay/backdrop click maps to Sheet/Sidebar onOpenChange(false). |
| `isOpen` | mapped | sidebar.open, sheet.open | — | Controlled open state renamed to shadcn open (SidebarProvider open / Sheet open). |
| `renderLink` | composition-owned | sidebar.children | — | Overrides anchor rendering of items; composition wires it into SidebarMenuButton asChild. |
| `onNavLinkClick` | composition-owned | sidebar.children | — | Fired when a nav item is clicked; composition invokes it from SidebarMenuButton onClick alongside native handling. |
| `onClick` | forwarded | sidebar.onClick | — | Root click handler forwarded to the Sidebar root element. |
| `children` | composition-owned | sidebar.children | — | NavBar.Group/NavBar.Item tree re-rendered as SidebarMenu/SidebarMenuItem by the composition. |
| `expand` | unsupported | — | — | Deprecated ambiguous expand enum; no shadcn equivalent. |
| `match` | unsupported | — | — | Deprecated in favor of isActivePath; not carried forward. |
| `onChange` | unsupported | — | — | Deprecated navigation callback; navigation now handled by router/browser. |
| `onHeaderClick` | composition-owned | sidebar.children | — | Header-region click; composition attaches it to SidebarHeader alongside native handling. |
| `linkComponent` | unsupported | — | — | Deprecated in favor of renderLink; not carried forward. |
| `enableBackNavigation` | composition-owned | sheet.children | — | Applique-specific mobile back button; composition renders it inside the Sheet header. |
| `theme` | needs-review | — | — | dark/light theming; shadcn uses CSS vars/data-theme so mapping depends on portal theming strategy. |
| `className,style` | forwarded | sidebar.className | — | BaseProps native attrs (className/style) forwarded to the Sidebar root. |

### page  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ compose  
_Layout shell (side nav + header + content); render-slot props are composition-owned, only alwaysOpen maps to Sidebar open state._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `renderNavBar` | composition-owned | sidebar.children | — | Render prop producing the side nav; composition mounts its output as the Sidebar. |
| `renderTopBar` | composition-owned | sidebar.children | — | Render prop producing the header; mounted in the SidebarInset header region (may host breadcrumb/navigation-menu). |
| `children` | composition-owned | sidebar.children | — | Page body content rendered inside SidebarInset. |
| `alwaysOpen` | mapped | sidebar.defaultOpen | — | Keep nav permanently expanded; maps to SidebarProvider defaultOpen/open (and non-collapsible). |
| `className,style` | forwarded | sidebar.className | — | BaseProps native attrs forwarded to the layout root / SidebarProvider wrapper. |

### pagination  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ n/a  
_Pagination derives the page-link range from total/size/page, renders prev/next/ellipsis links, a page-size Select, and an optional jump-to-page Input, emitting {page,size} on change; the shadcn pagination primitive is presentational only so all state logic is composed._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `page` | composition-owned | pagination.active PaginationLink | — | Current page; drives which PaginationLink is marked active. shadcn Pagination holds no state. |
| `size` | composition-owned | select.value, pagination.range calc | — | Page size; selected value of the size Select and an input to the page-count calculation. |
| `total` | composition-owned | pagination.PaginationContent range | — | Total item count; used with size to compute how many page links/ellipses to render. |
| `onChange` | composition-owned | pagination.link onClick, select.onValueChange, input.onChange | — | Single handler emitting {page,size}; aggregates events from the page links, size Select, and jump Input. |
| `sizes` | composition-owned | select.SelectItem options | — | Allowed page sizes rendered as the size Select's options. |
| `hideSize` | composition-owned | select.visibility | — | Toggles rendering of the page-size Select. |
| `pageInputDisabled` | composition-owned | input.visibility/disabled | — | Toggles the jump-to-page Input dropdown. |
| `className` | forwarded | pagination.className | — | Private className forwarded to the Pagination nav root; BaseProps native nav attrs pass through. |

### section  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ n/a  
_A page layout block: a titled card whose header is optionally divided from its (optionally padded) content by a separator._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `title` | composition-owned | card.children, separator.orientation | — | Rendered as CardHeader/CardTitle with a separator beneath; owned header assembly. |
| `noPadding` | composition-owned | card.children | — | Toggles padding on the CardContent region; owned styling decision. |
| `className` | forwarded | card.className | — | Applied to the card root. |
| `children` | composition-owned | card.children | — | Body content placed inside CardContent by the composition. |
| `native-props` | forwarded | card....div attrs | — | Remaining native div attributes spread onto the card root. |

### table  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ compose  
_A data-driven table built from column config, with sorting/filtering via dropdown menus, inline editing via inputs, and pagination._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `data` | composition-owned | table.children | — | Row objects rendered into TableBody/TableRow/TableCell. |
| `displayColumns` | composition-owned | table.children | — | Selects which columns are rendered; owned column-visibility logic. |
| `renderRow` | composition-owned | table.children | — | Custom row render function used to build each TableRow (render prop, not an event). |
| `appearance` | composition-owned | table.className | — | default/striped visual variant applied via className; no native shadcn table variant. |
| `virtualized` | composition-owned | table.children | — | Row virtualization; owned behavior not provided by the shadcn table primitive. |
| `scrollMode` | composition-owned | table.className | — | container vs window scroll container behavior; owned layout logic. |
| `columnOrder` | composition-owned | table.children | — | Reorders rendered columns; owned ordering logic. |
| `onSort` | composition-owned | table.children, dropdown-menu.children | — | Sort handler wired to header/sort-menu controls; only the Applique callback exists (shadcn table has no onSort). |
| `onFilter` | composition-owned | dropdown-menu.children | — | Filter handler wired to the filter dropdown UI; only the Applique callback exists. |
| `editable` | composition-owned | table.children, input....cell editor | — | Switches cells to editable input editors; owned edit-mode logic across table + input. |
| `onEdit` | composition-owned | input.onChange | — | Fires on cell edit; the input onChange fires first, then the Applique onEdit with (value, rowIndex, key). |
| `className` | forwarded | table.className | — | Applied to the table root. |
| `children` | composition-owned | table.children | — | Table.Column / Table.Row config elements define the column/row structure consumed by the composition. |
| `native-props` | forwarded | table....table attrs | — | Remaining native table attributes spread onto the table element. |

### top-bar  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ compose  
_Page header composing a title/breadcrumb region plus a user avatar with dropdown; all props feed composition-rendered primitives._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `title` | composition-owned | breadcrumb.children | — | Header title text rendered in the breadcrumb/title region by the composition. |
| `user` | composition-owned | avatar.children, dropdown-menu.children | — | User object destructured: photo->AvatarImage src, name->AvatarFallback, name/email shown in the dropdown menu. |
| `headerNavigationElem` | composition-owned | breadcrumb.children | — | Custom navigation element slotted into the header nav region. |
| `className,style` | forwarded | breadcrumb.className | — | BaseProps native attrs forwarded to the header root container. |

### top-nav  

_category:_ composition · _mode:_ handwritten · _callbackPolicy:_ compose  
_SPA multi-level top navigation with mobile drawer; config-driven and routing-driven, so props are almost entirely composition-owned._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `config` | composition-owned | navigation-menu.children, sidebar.children | — | Full nav config (logo, navigationConfig L1-L3, quickLinks, quickLinksSideNav) driving the NavigationMenu (desktop) and Sidebar/Sheet (mobile). |
| `dispatchFunction` | composition-owned | navigation-menu.children | — | Routing/dispatch handler invoked on item activation; composition wires it into link/item click handlers. |
| `additionalHeader` | composition-owned | navigation-menu.children | — | Extra header content slotted alongside the navigation menu. |
| `hamburger` | composition-owned | sheet.children | — | Icon name for the mobile menu trigger; composition renders it on the Sheet/Sidebar toggle. |
| `close` | composition-owned | sheet.children | — | Icon name for the mobile drawer close control. |
| `navigationKey` | composition-owned | navigation-menu.children | — | Key identifying which nav dimension is active; drives active-item resolution logic. |
| `currentNavigationValue` | composition-owned | navigation-menu.children | — | Current active nav value; drives active/highlighted state on the menu items. |
| `className,style` | forwarded | navigation-menu.className | — | BaseProps native attrs forwarded to the nav root container. |

### input-select  

_category:_ ambiguous · _mode:_ handwritten · _callbackPolicy:_ replace · _primaryTarget:_ **combobox**  
_Audited against combobox. Applique input-select is a data-driven custom select whose defining features (options array, searchable, onSearch, renderOption, filterOptions, multiple, isLoading) only combobox can express as a single primitive; plain select covers only the non-searchable single-value case and native-select the DOM case. Selection rule: simple->select, searchable-or-multiple->combobox, native->native-select. The `searchable` prop is the actual switch that decides select vs combobox, so it is flagged needs-review._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `options` | composition-owned | — | — | Data array is rendered as ComboboxItem children (or via base-ui Collection); no single data prop on the shadcn wrapper. |
| `value` | forwarded | combobox.value | — | Controlled selected value forwards to Combobox Root value (array when multiple). |
| `onChange` | mapped | combobox.onValueChange | — | Renamed selection callback; base-ui emits the value directly like the legacy signature. |
| `onSearch` | mapped | combobox.onInputValueChange | — | Search-text callback maps to combobox input-value change; only exists on combobox, not select. |
| `renderOption` | composition-owned | — | — | Per-option JSX is provided by rendering ComboboxItem children yourself. |
| `renderEmptyState` | composition-owned | — | — | Empty state is the ComboboxEmpty sub-component. |
| `placeholder` | forwarded | combobox.placeholder | — | Forwards to ComboboxInput placeholder. |
| `multiple` | forwarded | combobox.multiple | — | Combobox Root supports a multiple prop directly. |
| `disabled` | forwarded | combobox.disabled | — | Forwarded to Root disabled. |
| `readOnly` | forwarded | combobox.readOnly | — | Forwarded to Root readOnly. |
| `required` | forwarded | combobox.required | — | Forwarded to Root required. |
| `isLoading` | composition-owned | — | — | No loading prop; render a Spinner inside ComboboxEmpty/content while fetching. |
| `searchable` | needs-review | — | — | This flag is the target selector itself: searchable=false could map to plain select, true maps to combobox. Resolve per call site before mapping. |
| `searchableKeys` | composition-owned | — | — | Client-side filter field config; expressed by implementing the combobox filter over those keys. |
| `labelKey` | composition-owned | — | — | Display-field accessor used while rendering ComboboxItem labels. |
| `valueKey` | composition-owned | — | — | Value-field accessor used while rendering ComboboxItem values. |
| `filterOptions` | mapped | combobox.filter | — | Custom filter predicate maps to combobox Root filter function (predicate, not an event). |
| `noResultsPlaceholder` | unsupported | — | — | Deprecated in legacy in favor of renderEmptyState; use ComboboxEmpty instead. |
| `icon` | composition-owned | — | — | Prefix icon is rendered inside the ComboboxTrigger/Input by the composed wrapper. |
| `up` | mapped | combobox.side | {"true": "top", "false": "bottom"} | Dropdown-above flag maps to ComboboxContent positioner side. |
| `__fieldContext` | unsupported | — | — | Internal Field-injected context; no equivalent, handled by the shadcn Field wrapper instead. |
| `error` | mapped | combobox.aria-invalid | — | Error state maps to aria-invalid on the trigger for the destructive styling. |
| `variant` | composition-owned | — | — | bordered/standard is a styling choice applied via className on the trigger; no prop. |
| `adornment` | composition-owned | — | — | Prefix/suffix JSX rendered inside the composed trigger. |
| `className,style,id,...BaseProps` | forwarded | combobox....rest | — | BaseProps HTML attributes spread onto the Combobox Root/trigger. |

### list  

_category:_ ambiguous · _mode:_ handwritten · _callbackPolicy:_ compose · _primaryTarget:_ **command**  
_Audited against command. Applique List is a data-driven, keyboard-navigable selectable list (items + render children + activeIndex nav + selection), which most closely resembles command; item is pure display, while checkbox/radio-group are the selection-mode targets. Selection rule: display->item, command->command, multi-select->checkbox, single-select->radio-group. Because selection (value/onChange/multiple) has no controlled equivalent on command, those props are flagged needs-review since they actually decide checkbox vs radio-group._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `items` | composition-owned | — | — | Data array is mapped to CommandItem children; no data prop on the wrapper. |
| `children` | composition-owned | — | — | Legacy per-item render function becomes the JSX you render for each CommandItem. |
| `value` | needs-review | — | — | Controlled selected value(s) have no direct home on command; routes to radio-group value (single) or a checkbox set (multi). Resolve with `multiple`. |
| `onChange` | needs-review | — | — | Selection-change callback target depends on the chosen selection primitive (command onSelect vs radio-group/checkbox onCheckedChange). |
| `idForItem` | composition-owned | — | — | Unique-id accessor used as the React key / item value when mapping items. |
| `isItemDisabled` | composition-owned | — | — | Predicate applied to set the disabled prop on each rendered item. |
| `multiple` | needs-review | — | — | Selection-mode switch that decides the real target: false->radio-group (single), true->checkbox set (multi). Not expressible on command alone. |
| `virtualized` | unsupported | — | — | No built-in virtualization is exposed on the shadcn item/command wrappers. |
| `className,style,id,...BaseProps` | forwarded | command....rest | — | BaseProps HTML attributes spread onto the Command root. |

### loader  

_category:_ ambiguous · _mode:_ handwritten · _callbackPolicy:_ compose · _primaryTarget:_ **spinner**  
_Audited against spinner. Applique Loader is documented as infinite (indeterminate) loading, which is exactly spinner; progress only applies to the measurable case. Selection rule: indeterminate->spinner, measurable->progress. The `appearance` prop is the switch (spinner vs bar) and is flagged needs-review. Spinner exposes only className, so most legacy visual props become className or composition._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `type` | mapped | spinner.className | {"inline": "size-4", "small": "size-4", "large": "size-6"} | Size variant maps to a Tailwind size utility on the spinner className. |
| `currentColor` | mapped | spinner.className | {"true": "text-current"} | Spinner (lucide) already strokes with currentColor; flag maps to a text-color className. Near-default, low confidence. |
| `appearance` | needs-review | — | — | Target selector: appearance='spinner'->spinner, appearance='bar'->progress. Resolve per call site. |
| `children` | unsupported | — | — | Legacy types children as `never`; nothing to map. |
| `isLoading` | composition-owned | — | — | No loading prop on spinner; conditionally render the spinner at the call site. |
| `text` | composition-owned | — | — | Accompanying label is rendered as a sibling element next to the spinner. |
| `textPosition` | composition-owned | — | — | Label placement is a flex layout choice around the spinner, not a prop. |
| `className,style,id,...BaseProps` | forwarded | spinner....rest | — | BaseProps/SVG attributes spread onto the spinner svg. |

### modal  

_category:_ ambiguous · _mode:_ handwritten · _callbackPolicy:_ compose · _primaryTarget:_ **dialog**  
_Audited against dialog as the general-purpose default. Selection rule: general->dialog, confirmation->alert-dialog, mobile-bottom->drawer, side-panel->sheet. The legacy `type` (MOBILE_DRAWER/DESKTOP) is the target selector and is flagged needs-review (MOBILE_DRAWER->drawer). Layout props (title/actions/render) become composed Dialog sub-components._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `trigger` | composition-owned | — | — | Opening element becomes a DialogTrigger child rather than a prop. |
| `isOpen` | mapped | dialog.open | — | Controlled open state renamed to open on Dialog Root. |
| `hideClose` | mapped | dialog.showCloseButton | {"true": "false", "false": "true"} | Inverted: hideClose=true means DialogContent showCloseButton=false. |
| `onOpen` | mapped | dialog.onOpenChange | — | Fires from onOpenChange when next open state is true. |
| `render` | composition-owned | — | — | Custom-layout render function becomes the DialogContent children you compose. |
| `title` | composition-owned | — | — | Rendered as a DialogTitle child (inside DialogHeader). |
| `actions` | composition-owned | — | — | Action buttons rendered as DialogFooter children; the (close)=>node form uses DialogClose. |
| `closeOnClickAway` | mapped | dialog.dismissible | {"true": "true", "false": "false"} | Maps to base-ui Dialog Root dismissible (outside-press dismissal). Verify prop name on the installed base-ui version. |
| `onClose` | mapped | dialog.onOpenChange | — | Fires from onOpenChange when next open state is false; shares the handler with onOpen. |
| `type` | needs-review | — | — | Target selector: type='MOBILE_DRAWER'->drawer/sheet, 'DESKTOP'->dialog. Resolve per call site. |
| `children` | composition-owned | — | — | Body content becomes DialogContent children. |
| `className,style,id,...BaseProps` | forwarded | dialog....rest | — | BaseProps HTML attributes spread onto DialogContent. |

### progress  

_category:_ ambiguous · _mode:_ handwritten · _callbackPolicy:_ compose · _primaryTarget:_ **progress**  
_Audited against progress. Applique Progress always carries a numeric value (both bar and circle variants), i.e. it is measurable/determinate, so progress is the primary target; spinner only fits the indeterminate/circular-without-value case. Selection rule: bar-or-known-value->progress, circular-or-indeterminate->spinner. The `type` discriminant is flagged needs-review because shadcn has no circular-progress primitive, so type='circle' has no clean home._

| Prop(s) | Strategy | Target | valueMap | Note |
|---|---|---|---|---|
| `type` | needs-review | — | — | Discriminant bar\|circle: 'bar'->progress cleanly, but 'circle' has no shadcn circular-progress (would need a custom SVG or spinner). Resolve per call site. |
| `value` | forwarded | progress.value | — | Completion percentage forwards directly to Progress Root value. |
| `showValue` | composition-owned | — | — | Toggle for the numeric readout; render (or omit) the ProgressValue sub-component. |
| `appearance` | mapped | progress.className | {"success": "bg-green-*", "info": "bg-primary", "warning": "bg-yellow-*", "danger": "bg-destructive"} | Color intent maps to an indicator className; exact token names need design confirmation. |
| `title` | unsupported | — | — | Deprecated in legacy in favor of children; use ProgressLabel instead. |
| `size` | mapped | progress.className | {"small": "h-1", "medium": "h-2", "large": "h-3"} | Bar height maps to a height utility on the ProgressTrack className. |
| `types` | unsupported | — | — | Striped vs regular fill has no equivalent in the shadcn progress primitive. |
| `movement` | unsupported | — | — | continuous/static animation of the bar has no equivalent prop. |
| `children` | composition-owned | — | — | Label content is rendered as a ProgressLabel sub-component. |
| `className,style,id,...BaseProps` | forwarded | progress....rest | — | BaseProps HTML attributes spread onto the Progress root. |
