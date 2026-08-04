import * as React from 'react'
import { createRoot } from 'react-dom/client'
import './catalog.css'
import '../src/design.css'
import {
  CatalogueApiExport,
  CatalogueComponent,
  CatalogueMapping,
  CataloguePropMapping,
  CatalogueResolvedProp,
  MappingKind,
  PropMappingKind,
  catalogueComponents,
  catalogueMappings,
  cataloguePropDefinitions,
  catalogueRegistryVersion,
  catalogueSource,
  findComponent,
} from './components'
import { previewLoaders } from './generated/preview-loaders.generated'
import { Toaster as BaseToaster } from '../src/toast'
import { Toaster as SonnerToaster } from '../src/sonner'

const SHADCN_CLI_VERSION = '4.16.0'
const mappingKindOrder: MappingKind[] = [
  'direct',
  'composition',
  'no-equivalent',
  'ambiguous',
]
const mappingKindDetails: Record<
  MappingKind,
  { description: string; label: string }
> = {
  direct: {
    description:
      'One shadcn component family covers the same primary interaction.',
    label: 'Direct',
  },
  composition: {
    description:
      'Multiple shadcn component families and Applique glue recreate the behavior.',
    label: 'Composition',
  },
  'no-equivalent': {
    description:
      'The capability currently exists in only one system; direction is shown per row.',
    label: 'No equivalent',
  },
  ambiguous: {
    description:
      'The correct target depends on the intent of each client usage.',
    label: 'Ambiguous',
  },
}
const propMappingKindOrder: PropMappingKind[] = [
  'forwarded',
  'mapped',
  'composition-owned',
  'unsupported',
  'needs-review',
]
const propMappingKindDetails: Record<
  PropMappingKind,
  { description: string; label: string; shortLabel: string }
> = {
  forwarded: {
    description: 'Same name and behavior; pass through unchanged.',
    label: 'Direct / forwarded',
    shortLabel: 'Direct',
  },
  mapped: {
    description: 'The facade renames a prop or converts values and events.',
    label: 'Mapped by facade',
    shortLabel: 'Mapped',
  },
  'composition-owned': {
    description:
      'The facade consumes the prop and builds behavior from registry primitives.',
    label: 'Owned by composition',
    shortLabel: 'Composed',
  },
  unsupported: {
    description: 'Intentionally excluded from the new facade contract.',
    label: 'Unsupported',
    shortLabel: 'Unsupported',
  },
  'needs-review': {
    description: 'Usage or UX intent must be resolved before implementation.',
    label: 'Needs review',
    shortLabel: 'Review',
  },
}
const migrationRows = catalogueMappings.flatMap((mapping) => {
  if (mapping.kind !== 'no-equivalent') return [mapping]

  const populatedSide =
    mapping.applique.length > 0 ? mapping.applique : mapping.shadcn

  return populatedSide.map((slug) => ({
    ...mapping,
    applique: mapping.applique.length > 0 ? [slug] : [],
    id: `${mapping.id}-${slug}`,
    shadcn: mapping.shadcn.length > 0 ? [slug] : [],
  }))
})

type CatalogueRoute =
  | { kind: 'component'; slug: string }
  | { kind: 'migration' }

function routeFromHash(): CatalogueRoute {
  if (window.location.hash === '#/migration') return { kind: 'migration' }

  const match = window.location.hash.match(/^#\/components\/([^/?#]+)/)
  const slug = match?.[1] ? decodeURIComponent(match[1]) : 'button'

  return {
    kind: 'component',
    slug: findComponent(slug)?.slug ?? 'button',
  }
}

function registryUrl(slug: string) {
  const pageUrl = new URL(window.location.href)
  pageUrl.hash = ''

  return new URL(
    `../registry/v${catalogueRegistryVersion}/${slug}.json`,
    pageUrl
  ).toString()
}

function useCatalogueRoute() {
  const [route, setRoute] = React.useState<CatalogueRoute>(routeFromHash)

  React.useEffect(() => {
    const updateRoute = () => setRoute(routeFromHash())

    window.addEventListener('hashchange', updateRoute)

    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/components/button')
    }

    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  return route
}

function componentStatusLabel(component: CatalogueComponent) {
  return component.availability === 'deprecated'
    ? 'Deprecated'
    : component.availability === 'incompatible'
    ? 'Requires React 19'
    : component.registryStatus === 'ready'
    ? 'Registry ready'
    : component.registryStatus === 'testing'
    ? 'Test only'
    : 'Source unavailable'
}

function StatusBadge({ component }: { component: CatalogueComponent }) {
  const label = componentStatusLabel(component)

  return (
    <span className={`status-badge status-badge--${component.registryStatus}`}>
      <span aria-hidden="true" className="status-badge__dot" />
      {label}
    </span>
  )
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="client-usage-code">
      <button
        aria-label="Copy basic usage example"
        onClick={copy}
        type="button"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="command">
      <code>{command}</code>
      <button
        className="command__copy"
        onClick={copy}
        type="button"
        aria-label="Copy installation command"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function ClientContract({
  component,
  rawUrl,
}: {
  component: CatalogueComponent
  rawUrl: string
}) {
  const isFacade = component.upstream.base === 'applique'
  const installCommand = component.sourceAvailable
    ? `npx shadcn@${SHADCN_CLI_VERSION} add ${rawUrl}`
    : null
  const contract = component.clientContract
  const propContract = !component.sourceAvailable
    ? 'No React 18 client API is published for this entry.'
    : isFacade
    ? 'Applique props plus non-conflicting shadcn and native props. Applique props win when both control the same behavior.'
    : 'shadcn props directly. Applique tokens control the visual baseline; legacy Applique props are not adapted.'

  return (
    <section className="panel client-contract">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Client-side contract</p>
          <h2>How clients use {component.name}</h2>
        </div>
        <span className="token-note">
          {component.sourceAvailable
            ? isFacade
              ? 'Applique facade'
              : 'shadcn primitive'
            : 'No client API'}
        </span>
      </div>

      <dl className="client-contract__facts">
        <div>
          <dt>Default import</dt>
          <dd>
            {contract.importPath ? (
              <code>{contract.importPath}</code>
            ) : (
              'Not available'
            )}
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{componentStatusLabel(component)}</dd>
        </div>
        <div>
          <dt>Accepted props</dt>
          <dd>{propContract}</dd>
        </div>
        <div>
          <dt>Ownership and updates</dt>
          <dd>
            Installed source belongs to the client. Future registry changes are
            accepted explicitly through a reviewed source diff.
          </dd>
        </div>
      </dl>

      {contract.basicUsage ? (
        <div className="client-contract__section">
          <div>
            <h3>Basic usage</h3>
            <p>
              Uses the default aliases configured for the client application.
            </p>
          </div>
          <CopyableCode code={contract.basicUsage} />
          {contract.note ? (
            <p className="client-contract__note">{contract.note}</p>
          ) : null}
        </div>
      ) : (
        <div className="client-contract__section client-contract__unavailable">
          <div>
            <h3>No usage example</h3>
            <p>{contract.unavailableReason}</p>
            {contract.replacement ? (
              <a href={`#/components/${contract.replacement}`}>
                Use {findComponent(contract.replacement)?.name ?? contract.replacement}{' '}
                instead
              </a>
            ) : null}
          </div>
        </div>
      )}

      {installCommand ? (
        <div className="client-contract__section client-contract__install">
          <div>
            <h3>Install or update</h3>
            <p>Run on a branch, review the copied source, then test and commit.</p>
          </div>
          <CopyCommand command={installCommand} />
        </div>
      ) : null}
    </section>
  )
}

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="preview-message" role="alert">
          <strong>Preview could not render.</strong>
          <span>{this.state.error.message}</span>
        </div>
      )
    }

    return this.props.children
  }
}

function ComponentPreview({ component }: { component: CatalogueComponent }) {
  const loader = previewLoaders[component.slug]
  const Preview = React.useMemo(() => (loader ? React.lazy(loader) : null), [
    loader,
  ])

  if (!Preview) return null

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Live preview</p>
          <h2>{component.previewProvenance}</h2>
        </div>
        <span className="token-note">Applique tokens applied</span>
      </div>
      <div className="preview-surface">
        <PreviewErrorBoundary key={component.slug}>
          <React.Suspense
            fallback={
              <div className="preview-message" role="status">
                Loading preview…
              </div>
            }
          >
            <Preview />
          </React.Suspense>
        </PreviewErrorBoundary>
      </div>
    </section>
  )
}

type UnifiedPropSource = 'applique' | 'shadcn'
type UnifiedPropHandling = PropMappingKind | 'pending-audit'
type UnifiedPropStatus =
  | 'available'
  | 'supported'
  | 'facade-available'
  | 'approved'
  | 'proposed'
  | 'pending-audit'
  | 'needs-review'
  | 'unsupported'

interface UnifiedPropRow {
  behavior: string
  defaultValue?: unknown
  description?: string
  handling: UnifiedPropHandling
  hasDefault: boolean
  key: string
  name: string
  optional?: boolean
  source: UnifiedPropSource
  sourceLabel: string
  status: UnifiedPropStatus
  targets: string[]
  type: string
}

const unifiedPropStatusLabels: Record<UnifiedPropStatus, string> = {
  available: 'Available',
  supported: 'Supported',
  'facade-available': 'Facade available',
  approved: 'Approved mapping',
  proposed: 'Proposed',
  'pending-audit': 'Pending audit',
  'needs-review': 'Needs review',
  unsupported: 'Unsupported',
}

const unifiedPropHandlingDetails: Record<
  UnifiedPropHandling,
  { label: string; shortLabel: string }
> = {
  ...propMappingKindDetails,
  'pending-audit': {
    label: 'Pending prop audit',
    shortLabel: 'Pending',
  },
}

// Compact semantic fallback for components whose useful public state comes
// from a primitive or dependency. Generic DOM, ARIA, style, and event props stay
// out of the catalogue unless a component explicitly curates them.
const mainInheritedPropNames = new Set([
  'align',
  'alignOffset',
  'autoComplete',
  'checked',
  'children',
  'closeDelay',
  'defaultChecked',
  'defaultMonth',
  'defaultOpen',
  'defaultPressed',
  'defaultSelected',
  'defaultValue',
  'delay',
  'disabled',
  'disableHoverablePopup',
  'forceMount',
  'form',
  'indeterminate',
  'isItemEqualToValue',
  'items',
  'itemToStringLabel',
  'itemToStringValue',
  'keepMounted',
  'loop',
  'loopFocus',
  'max',
  'min',
  'minStepsBetweenValues',
  'modal',
  'mode',
  'month',
  'multiple',
  'name',
  'numberOfMonths',
  'onCheckedChange',
  'onMonthChange',
  'onOpenChange',
  'onOpenChangeComplete',
  'onPressedChange',
  'onSelect',
  'onSelectedChange',
  'onValueChange',
  'onValueCommitted',
  'open',
  'orientation',
  'pressed',
  'readOnly',
  'required',
  'selected',
  'side',
  'sideOffset',
  'step',
  'trackCursorAxis',
  'value',
])

function formatDefaultValue(value: unknown) {
  if (value === null || typeof value === 'undefined') return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function displayName(slug: string) {
  return slug
    .split('-')
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join('')
}

const anatomyRoleOverrides: Record<string, string> = {
  'accordion:AccordionItem':
    'Declarative item configuration read by Accordion.',
  'alert-dialog:AlertDialogAction': 'Confirms the dialog action.',
  'alert-dialog:AlertDialogCancel': 'Cancels and closes the dialog.',
  'alert-dialog:AlertDialogMedia': 'Icon or media region.',
  'alert:AlertAction': 'Holds action buttons or links.',
  'attachment:AttachmentAction': 'One attachment action button.',
  'attachment:AttachmentActions': 'Groups attachment action buttons.',
  'attachment:AttachmentTrigger': 'Interactive attachment target.',
  'banner:BannerActionable': 'Actionable status banner.',
  'bread-crumb:BreadCrumbItem':
    'Declarative breadcrumb item read by BreadCrumb.',
  'breadcrumb:BreadcrumbPage': 'Current non-clickable page.',
  'card:CardAction': 'Slot for an action in the card header.',
  'command:CommandDialog': 'Command palette presented inside a dialog.',
  'drawer:DrawerSwipeHandle': 'Visual handle for the drawer swipe gesture.',
  'native-select:NativeSelectOptGroup': 'Groups related native options.',
  'sidebar:SidebarGroupAction': 'Action associated with a sidebar group.',
  'sidebar:SidebarMenuAction': 'Action associated with a sidebar item.',
  'sidebar:SidebarMenuButton': 'Primary control for a sidebar item.',
  'sidebar:SidebarMenuSubButton': 'Control for a nested sidebar item.',
  'tabs:Tab': 'Declarative tab and panel configuration read by Tabs.',
  'table:TableHead': 'One table header cell.',
  'table:TableHeader': 'Table header row group.',
  'toast:Toaster': 'Renders and manages the Base UI toast viewport.',
  'toast:ToastViewport': 'Placement region for the toast stack.',
  AlertAction: 'Holds action buttons or links.',
  CalendarDayButton: 'Interactive button for one calendar day.',
  ChartContainer: 'Provides chart sizing, configuration and theme variables.',
  ChartLegend: 'Connects a Recharts legend to the chart contract.',
  ChartLegendContent: 'Renders the visible chart legend.',
  ChartStyle: 'Injects chart-specific colour variables.',
  ChartTooltip: 'Connects a Recharts tooltip to the chart contract.',
  ChartTooltipContent: 'Renders the visible chart tooltip.',
  DirectionProvider: 'Provides left-to-right or right-to-left direction.',
  InputOTPGroup: 'Groups related one-time-password slots.',
  InputOTPSeparator: 'Visually separates one-time-password groups.',
  InputOTPSlot: 'Displays one character of the one-time password.',
  NavigationMenuIndicator: 'Shows which navigation item is active.',
  NavigationMenuPositioner: 'Positions navigation overlay content.',
  ResizableHandle: 'Drag handle between resizable panels.',
  ResizablePanel: 'One resizable content panel.',
  ResizablePanelGroup: 'Coordinates a set of resizable panels.',
  ScrollBar: 'Optional scrollbar for the scroll area.',
  SidebarInset: 'Main content area displayed beside the sidebar.',
  SidebarRail: 'Compact edge control for the sidebar.',
  Tab: 'One selectable tab and its panel content.',
  Toaster: 'Renders the notification viewport.',
}

const anatomyRoleSuffixes: Array<[string, string]> = [
  ['ScrollDownButton', 'Scrolls the available options down.'],
  ['ScrollUpButton', 'Scrolls the available options up.'],
  ['GroupContent', 'Content region for a related group.'],
  ['GroupLabel', 'Label for a related group.'],
  ['SubContent', 'Content for a nested submenu.'],
  ['SubTrigger', 'Opens a nested submenu.'],
  ['SubItem', 'One item in a nested collection.'],
  ['Sub', 'Coordinates a nested submenu.'],
  ['OptGroup', 'Groups related options.'],
  ['Description', 'Supporting description or help text.'],
  ['Positioner', 'Positions floating content.'],
  ['Indicator', 'Displays the current visual state.'],
  ['Separator', 'Visually separates related content.'],
  ['Previous', 'Moves to the previous item or page.'],
  ['Next', 'Moves to the next item or page.'],
  ['Ellipsis', 'Represents omitted items or pages.'],
  ['CheckboxItem', 'One checkbox option in the collection.'],
  ['RadioItem', 'One radio option in the collection.'],
  ['Shortcut', 'Displays an associated keyboard shortcut.'],
  ['Provider', 'Provides shared state to its descendants.'],
  ['Trigger', 'Opens, closes or toggles the related content.'],
  ['Overlay', 'Backdrop behind floating content.'],
  ['Backdrop', 'Backdrop behind floating content.'],
  ['Portal', 'Renders content outside the normal DOM hierarchy.'],
  ['Content', 'Main content region.'],
  ['Collection', 'Collection of available items.'],
  ['Container', 'Layout and behavior container.'],
  ['Panel', 'One content panel.'],
  ['Actions', 'Groups related action controls.'],
  ['Action', 'Holds or performs an action.'],
  ['Header', 'Header region.'],
  ['Footer', 'Footer or action region.'],
  ['Title', 'Heading for the component.'],
  ['Legend', 'Label for a grouped set of controls or data.'],
  ['Caption', 'Caption or supporting summary.'],
  ['Text', 'Supporting text content.'],
  ['Label', 'Accessible or visible label.'],
  ['Input', 'User input control.'],
  ['Textarea', 'Multiline user input control.'],
  ['Button', 'Interactive button control.'],
  ['Link', 'Navigation link.'],
  ['Close', 'Closes the related content.'],
  ['Cancel', 'Cancels the current action.'],
  ['Value', 'Displays the current or selected value.'],
  ['Option', 'One selectable option.'],
  ['Item', 'One item in the collection.'],
  ['List', 'Container for a collection of items.'],
  ['Group', 'Groups related items.'],
  ['Menu', 'Menu composition root.'],
  ['Media', 'Visual or icon region.'],
  ['Image', 'Displays the component image.'],
  ['Avatar', 'Avatar or identity region.'],
  ['Icon', 'Icon region.'],
  ['Badge', 'Compact status or count.'],
  ['Empty', 'Displayed when no items are available.'],
  ['Error', 'Displays validation or loading errors.'],
  ['Fallback', 'Fallback shown when primary content is unavailable.'],
  ['Skeleton', 'Loading placeholder.'],
  ['Viewport', 'Visible viewport for scrollable content.'],
  ['Track', 'Track that displays a value range.'],
  ['Handle', 'Interactive drag or resize handle.'],
  ['Thumb', 'Draggable control on a track.'],
  ['Cell', 'One table or grid cell.'],
  ['Row', 'One table or grid row.'],
  ['Head', 'Header cell or heading region.'],
  ['Body', 'Main body region.'],
  ['Addon', 'Content attached to an input.'],
  ['Chips', 'Container for selected value chips.'],
  ['Chip', 'One selected value chip.'],
  ['Slot', 'One value or content slot.'],
  ['Set', 'Groups related controls or values.'],
  ['Style', 'Provides generated component styling.'],
  ['Reactions', 'Reaction controls for the item.'],
  ['Actionable', 'Actionable version of the component.'],
  ['Bar', 'Scrollbar or compact bar control.'],
  ['Rail', 'Compact edge or navigation rail.'],
  ['Inset', 'Content region offset by a surrounding layout.'],
]

function componentExportRole({
  component,
  compound,
  item,
  primary,
}: {
  component: CatalogueComponent
  compound: boolean
  item: CatalogueApiExport
  primary: boolean
}) {
  const override =
    anatomyRoleOverrides[`${component.slug}:${item.name}`] ||
    anatomyRoleOverrides[item.name]
  if (override) return override
  if (primary) {
    return compound
      ? `Main ${component.name} component and composition root.`
      : `Main ${component.name} component.`
  }

  const suffix = anatomyRoleSuffixes.find(([name]) =>
    item.name.endsWith(name)
  )
  return (
    suffix?.[1] || `Supporting part of the ${component.name} composition.`
  )
}

function anatomyCustomProps(item: CatalogueApiExport) {
  const names = new Set(item.ownedProps.map((prop) => prop.name))

  for (const id of item.acceptedPropIds) {
    const prop = cataloguePropDefinitions[id]
    if (!prop) continue
    if (prop.origin === 'applique' || prop.origin === 'shadcn') {
      names.add(prop.name)
    }
  }

  return Array.from(names)
}

function inheritedPropContracts(
  item: CatalogueApiExport,
  facadeAvailable: boolean
) {
  const labels = new Set<string>()

  for (const source of item.propSources) {
    const native = source.match(
      /(?:React\.|useRender\.)ComponentProps(?:WithRef|WithoutRef)?<["']([a-z0-9-]+)["']>/
    )
    if (native) {
      labels.add(`Standard <${native[1]}> props`)
      continue
    }

    const component = source.match(
      /React\.ComponentProps(?:WithRef|WithoutRef)?<typeof ([A-Za-z0-9_.]+)>/
    )
    if (component) {
      const sourceName = component[1]
      labels.add(
        facadeAvailable
          ? 'Non-conflicting shadcn and HTML props'
          : sourceName.includes('Primitive') || sourceName.includes('Internal')
          ? 'shadcn primitive props'
          : `${sourceName.split('.').pop()} props`
      )
      continue
    }

    if (source.includes('Primitive') || /\.Props\b/.test(source)) {
      labels.add(
        facadeAvailable
          ? 'Non-conflicting shadcn and HTML props'
          : 'shadcn primitive props'
      )
    } else if (source.includes('Internal') || source.includes('Native')) {
      labels.add(
        facadeAvailable
          ? 'Non-conflicting shadcn/native props'
          : 'Component props'
      )
    }
  }

  if (labels.size === 0) {
    const acceptedOrigins = new Set(
      item.acceptedPropIds
        .map((id) => cataloguePropDefinitions[id]?.origin)
        .filter(Boolean)
    )
    if (acceptedOrigins.has('native')) labels.add('Standard React DOM props')
    if (acceptedOrigins.has('primitive')) {
      labels.add(
        facadeAvailable
          ? 'Non-conflicting shadcn and HTML props'
          : 'shadcn primitive props'
      )
    }
    if (acceptedOrigins.has('dependency')) {
      labels.add('Underlying library props')
    }
  }

  if (labels.size === 0 && item.propSources.length > 0) {
    labels.add(
      facadeAvailable
        ? 'Non-conflicting shadcn and HTML props'
        : 'Underlying component props'
    )
  }

  return Array.from(labels)
}

function targetLabel(target: CataloguePropMapping['targets'][number]) {
  return target.prop ? `${target.component}.${target.prop}` : target.component
}

function exactPropMapping(mapping: CatalogueMapping, propName: string) {
  return (mapping.propMappings || []).find((propMapping) =>
    propMapping.from.includes(propName)
  )
}

function legacyPropStatus(
  facadeAvailable: boolean,
  mapping: CatalogueMapping,
  propMapping?: CataloguePropMapping
): UnifiedPropStatus {
  if (!propMapping) return 'pending-audit'
  if (propMapping.kind === 'needs-review') return 'needs-review'
  if (propMapping.kind === 'unsupported') return 'unsupported'
  if (facadeAvailable) return 'supported'
  if (findComponent(mapping.id)) return 'facade-available'
  return mapping.review === 'approved' ? 'approved' : 'proposed'
}

function unifiedPropRows({
  acceptedProps,
  facadeAvailable,
  mappings,
}: {
  acceptedProps: CatalogueResolvedProp[]
  facadeAvailable: boolean
  mappings: CatalogueMapping[]
}) {
  const rows: UnifiedPropRow[] = []
  const appliquePropNames = new Set<string>()
  const seenAppliqueComponents = new Set<string>()

  for (const mapping of mappings) {
    for (const api of mapping.appliqueApi || []) {
      if (seenAppliqueComponents.has(api.component)) continue
      seenAppliqueComponents.add(api.component)

      for (const prop of api.props) {
        appliquePropNames.add(prop.name)
        const propMapping = exactPropMapping(mapping, prop.name)

        rows.push({
          behavior:
            propMapping?.summary ||
            'Adapter mapping has not been audited for this prop yet.',
          defaultValue: prop.default,
          description: prop.description,
          handling: propMapping?.kind || 'pending-audit',
          hasDefault: true,
          key: `applique-${mapping.id}-${api.component}-${prop.name}`,
          name: prop.name,
          source: 'applique',
          sourceLabel: `Applique ${displayName(api.component)}`,
          status: legacyPropStatus(facadeAvailable, mapping, propMapping),
          targets: (propMapping?.targets || []).map(targetLabel),
          type: prop.type,
        })
      }
    }
  }

  const curatedShadcnNames = Array.from(
    new Set(mappings.flatMap((mapping) => mapping.mainShadcnProps || []))
  )
  const candidateNames =
    curatedShadcnNames.length > 0
      ? curatedShadcnNames
      : acceptedProps
          .filter(
            (prop) =>
              prop.origin === 'shadcn' ||
              ((prop.origin === 'primitive' || prop.origin === 'dependency') &&
                mainInheritedPropNames.has(prop.name))
          )
          .map((prop) => prop.name)
  const propsByName = new Map(acceptedProps.map((prop) => [prop.name, prop]))
  const usedInheritedFallback =
    curatedShadcnNames.length === 0 &&
    candidateNames.some((name) => propsByName.get(name)?.origin !== 'shadcn')

  for (const propName of candidateNames) {
    if (appliquePropNames.has(propName)) continue
    const prop = propsByName.get(propName)
    if (!prop) continue

    const exactMappings = mappings.flatMap((mapping) => {
      const propMapping = exactPropMapping(mapping, propName)
      return propMapping ? [{ mapping, propMapping }] : []
    })
    const controllingMappings = mappings.flatMap((mapping) =>
      (mapping.propMappings || [])
        .filter(
          (propMapping) =>
            !propMapping.from.includes(propName) &&
            propMapping.targets.some((target) => target.prop === propName)
        )
        .map((propMapping) => ({ mapping, propMapping }))
    )
    const exact = exactMappings[0]?.propMapping
    const controllingProps = Array.from(
      new Set(
        controllingMappings.flatMap(({ propMapping }) =>
          propMapping.from.filter((name) => appliquePropNames.has(name))
        )
      )
    )
    const behavior = exact
      ? exact.summary
      : controllingProps.length > 0
      ? `Forwarded when Applique ${controllingProps.join(', ')} ${
          controllingProps.length === 1 ? 'is' : 'are'
        } not supplied. The Applique mapping takes precedence.`
      : 'Forwarded unchanged to the registry component.'
    const targets = exact
      ? exact.targets
      : controllingMappings.flatMap(({ propMapping }) =>
          propMapping.targets.filter((target) => target.prop === propName)
        )

    rows.push({
      behavior,
      description: prop.description,
      handling: 'forwarded',
      hasDefault: false,
      key: `shadcn-${prop.name}`,
      name: prop.name,
      optional: prop.optional,
      source: 'shadcn',
      sourceLabel: 'shadcn',
      status: facadeAvailable ? 'supported' : 'available',
      targets: Array.from(new Set(targets.map(targetLabel))),
      type: prop.type,
    })
  }

  return {
    auditPending:
      mappings.some(
        (mapping) => (mapping.mainShadcnProps || []).length === 0
      ) || usedInheritedFallback,
    rows,
  }
}

function ResolvedPropSurface({
  facadeAvailable,
  item,
  mappings,
}: {
  facadeAvailable: boolean
  item: CatalogueApiExport
  mappings: CatalogueMapping[]
}) {
  const [query, setQuery] = React.useState('')
  const acceptedProps = React.useMemo(
    () =>
      item.acceptedPropIds
        .map((id) => cataloguePropDefinitions[id])
        .filter((prop): prop is CatalogueResolvedProp => Boolean(prop)),
    [item.acceptedPropIds]
  )
  const { auditPending, rows } = React.useMemo(
    () => unifiedPropRows({ acceptedProps, facadeAvailable, mappings }),
    [acceptedProps, facadeAvailable, mappings]
  )
  const normalizedQuery = query.trim().toLowerCase()
  const filteredRows = normalizedQuery
    ? rows.filter((row) =>
        [
          row.name,
          row.type,
          row.description || '',
          row.sourceLabel,
          unifiedPropHandlingDetails[row.handling].label,
          row.behavior,
          unifiedPropStatusLabels[row.status],
          ...row.targets,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : rows

  if (rows.length === 0) {
    const inherited = inheritedPropContracts(item, facadeAvailable)

    return (
      <p className="api-empty">
        No component-specific props.
        {inherited.length > 0
          ? ` Accepts ${inherited.join(' and ')}.`
          : ' No inherited prop contract is declared.'}
      </p>
    )
  }

  return (
    <div className="api-subsection api-accepted-props">
      <div className="api-accepted-props__header">
        <div>
          <h4>
            {facadeAvailable
              ? 'Unified prop contract'
              : mappings.length > 0
              ? 'Unified prop comparison'
              : 'Main props'}
          </h4>
          <p>
            {facadeAvailable
              ? 'Applique props appear first, followed by additional shadcn props in the same table.'
              : mappings.length > 0
              ? 'Existing Applique props and selected raw shadcn props are compared in one table.'
              : 'Main source-declared and semantic inherited props are listed in one table.'}
          </p>
        </div>
        <label>
          <span className="sr-only">Search {item.name} props</span>
          <input
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search props"
            type="search"
            value={query}
          />
        </label>
      </div>

      {filteredRows.length > 0 ? (
        <>
          <div
            aria-label={`${item.name} prop reference. Scroll horizontally to view every column.`}
            className="api-props-scroll api-props-scroll--unified"
            role="region"
            tabIndex={0}
          >
            <table className="api-props api-props--unified">
              <thead>
                <tr>
                  <th scope="col">Prop</th>
                  <th scope="col">Source</th>
                  <th scope="col">Type / default</th>
                  <th scope="col">Handling</th>
                  <th scope="col">Registry behavior</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => {
                  const startsShadcnRows =
                    row.source === 'shadcn' &&
                    filteredRows[index - 1]?.source === 'applique'

                  return (
                    <tr
                      className={
                        startsShadcnRows ? 'api-prop-row--source-break' : ''
                      }
                      key={row.key}
                    >
                      <th scope="row">
                        <code>
                          {row.name}
                          {row.optional ? '?' : ''}
                        </code>
                        {row.description ? (
                          <small>{row.description}</small>
                        ) : null}
                      </th>
                      <td>
                        <span
                          className={`api-prop-source api-prop-source--${row.source}`}
                        >
                          {row.sourceLabel}
                        </span>
                      </td>
                      <td>
                        <code>{row.type}</code>
                        {row.hasDefault ? (
                          <small>
                            Default:{' '}
                            <code>{formatDefaultValue(row.defaultValue)}</code>
                          </small>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className={`prop-count prop-count--${row.handling}`}
                        >
                          {unifiedPropHandlingDetails[row.handling].shortLabel}
                        </span>
                      </td>
                      <td>
                        {row.targets.length > 0 ? (
                          <div className="api-prop-targets">
                            {row.targets.map((target) => (
                              <code key={`${row.key}-${target}`}>{target}</code>
                            ))}
                          </div>
                        ) : null}
                        <p>{row.behavior}</p>
                      </td>
                      <td>
                        <span
                          className={`api-prop-status api-prop-status--${row.status}`}
                        >
                          {unifiedPropStatusLabels[row.status]}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {auditPending ? (
            <p className="prop-audit-pending">
              Main shadcn prop audit pending. The compact semantic fallback is
              shown until the reviewed component-specific list is completed.
            </p>
          ) : null}
        </>
      ) : (
        <p className="api-empty">No props match “{query}”.</p>
      )}
    </div>
  )
}

function compatibilityMappingsFor(component: CatalogueComponent) {
  if (component.upstream.base === 'applique') {
    const exact = catalogueMappings.find(
      (mapping) =>
        mapping.id === component.slug && mapping.applique.length > 0
    )

    return exact ? [exact] : []
  }

  const exact = catalogueMappings.find(
    (mapping) =>
      mapping.id === component.slug &&
      mapping.applique.length > 0 &&
      mapping.shadcn.includes(component.slug)
  )

  const directMappings = catalogueMappings.filter(
    (mapping) =>
      mapping.kind === 'direct' &&
      mapping.applique.length > 0 &&
      mapping.shadcn.includes(component.slug)
  )

  return Array.from(
    new Map(
      [...(exact ? [exact] : []), ...directMappings].map((mapping) => [
        mapping.id,
        mapping,
      ])
    ).values()
  )
}

function ComponentAnatomy({
  component,
  primaryComponentIndex,
}: {
  component: CatalogueComponent
  primaryComponentIndex: number
}) {
  const facadeAvailable = component.upstream.base === 'applique'
  const componentExports = component.api.exports
    .map((item, index) => ({ index, item }))
    .filter(({ item }) => item.kind === 'component')

  if (componentExports.length === 0) {
    return (
      <p className="api-empty api-empty--standalone">
        No component anatomy is available because this entry has no published
        source API.
      </p>
    )
  }

  return (
    <div className="api-anatomy">
      <div>
        <h3>Component anatomy</h3>
        <p>
          Each row explains what the part does, its own props, and any standard
          or shadcn props it also accepts.
        </p>
      </div>

      <div
        aria-label={`${component.name} component anatomy. Scroll horizontally to view every column.`}
        className="api-anatomy__scroll"
        role="region"
        tabIndex={0}
      >
        <table className="api-anatomy__table">
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Used for</th>
              <th scope="col">Own props</th>
              <th scope="col">Also accepts</th>
            </tr>
          </thead>
          <tbody>
            {componentExports.map(({ index, item }) => {
              const mainProps = anatomyCustomProps(item)
              const inherited = inheritedPropContracts(item, facadeAvailable)

              return (
                <tr key={`${component.slug}-anatomy-${item.name}`}>
                  <th scope="row">
                    <code>{item.name}</code>
                  </th>
                  <td>
                    {componentExportRole({
                      component,
                      compound: componentExports.length > 1,
                      item,
                      primary: index === primaryComponentIndex,
                    })}
                  </td>
                  <td>
                    {mainProps.length > 0 ? (
                      <div className="api-anatomy__chips">
                        {mainProps.map((prop) => (
                          <code key={`${item.name}-${prop}`}>{prop}</code>
                        ))}
                      </div>
                    ) : (
                      <span className="api-anatomy__none">None</span>
                    )}
                  </td>
                  <td>
                    {inherited.length > 0 ? (
                      <div className="api-anatomy__contracts">
                        {inherited.map((contract) => (
                          <span key={`${item.name}-${contract}`}>{contract}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="api-anatomy__none">Nothing extra</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TechnicalSignatures({ component }: { component: CatalogueComponent }) {
  if (component.api.exports.length === 0) return null

  return (
    <details className="api-technical">
      <summary>
        <span>
          <strong>Technical signatures</strong>
          <small>
            {component.api.exports.length}{' '}
            {component.api.exports.length === 1 ? 'export' : 'exports'}
          </small>
        </span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="api-technical__list">
        {component.api.exports.map((item) => (
          <div key={`${component.slug}-signature-${item.name}`}>
            <span className="api-technical__name">
              <code>{item.name}</code>
              <small>{item.kind}</small>
            </span>
            <code className="api-signature">{item.signature}</code>
          </div>
        ))}
      </div>
    </details>
  )
}

function ApiSection({ component }: { component: CatalogueComponent }) {
  const mappings = compatibilityMappingsFor(component)
  const facadeAvailable = component.upstream.base === 'applique'
  const expectedRootExport = displayName(component.slug).toLowerCase()
  const primaryExportOverrides: Record<string, string> = {
    resizable: 'ResizablePanelGroup',
  }
  const preferredExport = primaryExportOverrides[component.slug]
  const rootExportIndex = component.api.exports.findIndex(
    (item) =>
      item.kind === 'component' &&
      (item.name === preferredExport ||
        (!preferredExport && item.name.toLowerCase() === expectedRootExport))
  )
  const primaryComponentIndex =
    rootExportIndex >= 0
      ? rootExportIndex
      : component.api.exports.findIndex((item) => item.kind === 'component')
  const primaryComponent = component.api.exports[primaryComponentIndex]

  return (
    <section className="panel api-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">API reference</p>
          <h2>Component anatomy and props</h2>
        </div>
        <span className="token-note">
          {mappings.length > 0
            ? 'Legacy docs + registry source'
            : 'API extracted from registry source'}
        </span>
      </div>

      <p className="supporting-copy">
        {facadeAvailable
          ? 'This facade exposes the documented Applique contract plus selected shadcn additions. Exact duplicate names appear only under Applique, and the mapping rules define precedence.'
          : mappings.length > 0
          ? 'This page compares the existing Applique contract with the registry component for adapter planning. The raw shadcn component does not accept the Applique props.'
          : 'This page lists the main props exposed by the checked-in registry component.'}{' '}
        Only selected semantic inherited props are included.
      </p>

      <div className="api-reference__body">
        <ComponentAnatomy
          component={component}
          primaryComponentIndex={primaryComponentIndex}
        />

        {primaryComponent ? (
          <div className="api-primary-contract">
            <ResolvedPropSurface
              facadeAvailable={facadeAvailable}
              item={primaryComponent}
              mappings={mappings}
            />
          </div>
        ) : null}

        <TechnicalSignatures component={component} />
      </div>
    </section>
  )
}

interface RegistryFile {
  content?: string
  path?: string
  target?: string
}

interface RegistryDocument {
  files?: RegistryFile[]
}

function RegistrySource({
  component,
  rawUrl,
}: {
  component: CatalogueComponent
  rawUrl: string
}) {
  const [state, setState] = React.useState<
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; files: RegistryFile[] }
  >({ kind: 'idle' })

  React.useEffect(() => setState({ kind: 'idle' }), [component.slug])

  async function loadSource() {
    setState({ kind: 'loading' })

    try {
      const response = await fetch(rawUrl)
      if (!response.ok) {
        throw new Error(`Registry returned HTTP ${response.status}`)
      }

      const document = (await response.json()) as RegistryDocument
      const files = (document.files || []).filter(
        (file): file is RegistryFile & { content: string } =>
          typeof file.content === 'string'
      )

      if (files.length === 0) {
        throw new Error('Registry item does not contain source files.')
      }

      setState({ files, kind: 'ready' })
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <section className="panel source-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Source metadata</p>
          <h2>Registry implementation</h2>
        </div>
        <span className="token-note">{component.previewProvenance}</span>
      </div>

      <dl className="source-metadata">
        <div>
          <dt>Local source</dt>
          <dd>
            <code>{component.sourcePath || 'No source file'}</code>
          </dd>
        </div>
        <div>
          <dt>Ownership</dt>
          <dd>
            <code>
              {component.upstream.base === 'applique'
                ? 'Applique-owned facade'
                : `${component.upstream.base}-${component.upstream.style}`}
            </code>
          </dd>
        </div>
        <div>
          <dt>Snapshot</dt>
          <dd>
            {component.upstream.base === 'applique' ? (
              <code>Handwritten and reviewed</code>
            ) : (
              <a
                href={`https://github.com/shadcn-ui/ui/commit/${component.upstream.commit}`}
                target="_blank"
                rel="noreferrer"
              >
                <code>{component.upstream.commit.slice(0, 12)}</code>
              </a>
            )}
          </dd>
        </div>
        <div>
          <dt>Catalogue index</dt>
          <dd>
            <code>{catalogueSource}</code>
          </dd>
        </div>
      </dl>

      <div className="source-actions">
        <button
          className="source-load"
          disabled={state.kind === 'loading'}
          onClick={loadSource}
          type="button"
        >
          {state.kind === 'loading' ? 'Loading…' : 'Load registry source'}
        </button>
        <a href={rawUrl} target="_blank" rel="noreferrer">
          View raw registry JSON <span aria-hidden="true">↗</span>
        </a>
      </div>

      {state.kind === 'error' ? (
        <p className="source-error" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.kind === 'ready'
        ? state.files.map((file, index) => (
            <details
              className="source-code"
              key={file.path || file.target || index}
            >
              <summary>
                {file.path || file.target || `Source ${index + 1}`}
              </summary>
              <pre>
                <code>{file.content}</code>
              </pre>
            </details>
          ))
        : null}
    </section>
  )
}

function PropMappingRow({ mapping }: { mapping: CataloguePropMapping }) {
  return (
    <div className="prop-mapping-row">
      <div className="prop-mapping-cell">
        <span>Applique prop</span>
        <div className="prop-mapping-chips">
          {mapping.from.map((prop) => (
            <code key={prop}>{prop}</code>
          ))}
        </div>
      </div>

      <span className="prop-mapping-arrow" aria-hidden="true">
        →
      </span>

      <div className="prop-mapping-cell">
        <span>Registry target</span>
        {mapping.targets.length > 0 ? (
          <div className="prop-mapping-chips">
            {mapping.targets.map((target, index) => (
              <code key={`${target.component}-${target.prop || index}`}>
                {findComponent(target.component)?.name ?? target.component}
                {target.prop ? `.${target.prop}` : ''}
              </code>
            ))}
          </div>
        ) : (
          <em>No registry target</em>
        )}
      </div>

      <div className="prop-mapping-explanation">
        <p>{mapping.summary}</p>
        {mapping.valueMap ? (
          <div className="prop-value-map" aria-label="Value mapping">
            {Object.entries(mapping.valueMap).map(([source, target]) => (
              <code key={source}>
                {source} <span aria-hidden="true">→</span> {target}
              </code>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function PropMigration({ mapping }: { mapping: CatalogueMapping }) {
  const propMappings = mapping.propMappings

  if (!propMappings) {
    const message =
      mapping.kind === 'no-equivalent'
        ? mapping.applique.length > 0
          ? 'No prop mapping until a registry replacement is selected.'
          : 'New registry API; no legacy prop migration is required.'
        : 'Prop audit pending. Component similarity does not prove prop compatibility.'

    return <p className="prop-audit-pending">{message}</p>
  }

  const assessedProps = new Set(
    propMappings.flatMap((propMapping) => propMapping.from)
  ).size

  return (
    <details className="prop-migration">
      <summary>
        <span className="prop-migration__title">
          <strong>Prop migration</strong>
          <small>
            {assessedProps} legacy {assessedProps === 1 ? 'prop' : 'props'}{' '}
            assessed
          </small>
        </span>
        <span className="prop-migration__counts">
          {propMappingKindOrder.map((kind) => {
            const count = propMappings.filter(
              (propMapping) => propMapping.kind === kind
            ).length
            if (count === 0) return null

            return (
              <span className={`prop-count prop-count--${kind}`} key={kind}>
                {propMappingKindDetails[kind].shortLabel} {count}
              </span>
            )
          })}
        </span>
        <span className="prop-migration__chevron" aria-hidden="true">
          ⌄
        </span>
      </summary>

      <div className="prop-migration__body">
        <p className="prop-migration__note">
          This is a curated adapter contract, not an automatic name match.
          Counts describe assessed legacy props and may not yet cover every
          runtime escape hatch.
        </p>

        {propMappingKindOrder.map((kind) => {
          const entries = propMappings.filter(
            (propMapping) => propMapping.kind === kind
          )
          if (entries.length === 0) return null

          return (
            <section className="prop-strategy" key={kind}>
              <header>
                <div>
                  <h4>{propMappingKindDetails[kind].label}</h4>
                  <p>{propMappingKindDetails[kind].description}</p>
                </div>
                <span>{entries.length}</span>
              </header>
              <div className="prop-strategy__rows">
                {entries.map((entry) => (
                  <PropMappingRow key={entry.id} mapping={entry} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </details>
  )
}

function MigrationMappingRow({ mapping }: { mapping: CatalogueMapping }) {
  const direction =
    mapping.kind === 'no-equivalent'
      ? mapping.applique.length > 0
        ? 'Applique only'
        : 'New in registry'
      : null

  return (
    <article className="migration-row">
      <div className="migration-row__meta">
        {direction ? (
          <span className="migration-direction">{direction}</span>
        ) : null}
        <span className={`mapping-review mapping-review--${mapping.review}`}>
          {mapping.review === 'approved' ? 'Approved' : 'Initial assessment'}
        </span>
      </div>

      <div className="migration-row__mapping">
        <div className="migration-side">
          <span>Applique</span>
          {mapping.applique.length > 0 ? (
            <div className="migration-chips">
              {mapping.applique.map((slug) => (
                <code className="migration-chip" key={slug}>
                  @applique-ui/{slug}
                </code>
              ))}
            </div>
          ) : (
            <p>No legacy counterpart</p>
          )}
        </div>

        <span className="migration-arrow" aria-hidden="true">
          →
        </span>

        <div className="migration-side">
          <span>shadcn registry</span>
          {mapping.shadcn.length > 0 ? (
            <div className="migration-chips">
              {mapping.shadcn.map((slug) => (
                <a
                  className="migration-chip migration-chip--link"
                  href={`#/components/${slug}`}
                  key={slug}
                >
                  {findComponent(slug)?.name ?? slug}
                </a>
              ))}
            </div>
          ) : (
            <p>No registry counterpart</p>
          )}
        </div>
      </div>

      <p className="migration-row__summary">{mapping.summary}</p>
      <PropMigration mapping={mapping} />
    </article>
  )
}

function MigrationGuide() {
  const [activeKind, setActiveKind] = React.useState<MappingKind>('direct')
  const [query, setQuery] = React.useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const visibleMappings = migrationRows.filter((mapping) => {
    const matchesKind = mapping.kind === activeKind
    const searchText = [
      mapping.id,
      mapping.kind,
      mapping.summary,
      ...mapping.applique,
      ...mapping.shadcn,
      ...(mapping.propMappings ?? []).flatMap((propMapping) => [
        propMapping.id,
        propMapping.kind,
        propMapping.summary,
        ...propMapping.from,
        ...propMapping.targets.flatMap((target) => [
          target.component,
          target.prop ?? '',
        ]),
        ...Object.entries(propMapping.valueMap ?? {}).flat(),
      ]),
    ]
      .join(' ')
      .toLowerCase()

    return matchesKind && searchText.includes(normalizedQuery)
  })

  return (
    <main className="content migration-page" id="main-content">
      <div className="breadcrumb">
        Applique <span aria-hidden="true">/</span> Migration guide
      </div>

      <header className="component-header migration-header">
        <div>
          <h1>Component migration map</h1>
          <p>
            Compare legacy Applique behavior with the pinned shadcn registry.
            These strategies describe migration relationships, not permanent
            labels on individual shadcn components.
          </p>
        </div>
        <span className="status-badge status-badge--unavailable">
          Initial assessment
        </span>
      </header>

      <aside className="migration-note">
        <strong>Why this is a separate view</strong>
        <p>
          One registry component can play several roles. Button participates in
          the InputDate recipe as well as the legacy Button composition, for
          example. Final mappings should be approved after reviewing client
          usage and UX requirements.
        </p>
      </aside>

      <div className="migration-toolbar">
        <div
          aria-label="Filter migration strategy"
          className="migration-filters"
          role="group"
        >
          {mappingKindOrder.map((kind) => (
            <button
              aria-pressed={activeKind === kind}
              key={kind}
              onClick={() => setActiveKind(kind)}
              type="button"
            >
              {mappingKindDetails[kind].label}{' '}
              <span>
                {
                  migrationRows.filter((mapping) => mapping.kind === kind)
                    .length
                }
              </span>
            </button>
          ))}
        </div>

        <label className="migration-search">
          <span className="sr-only">Search migration mappings</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mappings"
            type="search"
            value={query}
          />
        </label>
      </div>

      {visibleMappings.length > 0 ? (
        mappingKindOrder.map((kind) => {
          const mappings = visibleMappings.filter(
            (mapping) => mapping.kind === kind
          )
          if (mappings.length === 0) return null

          return (
            <section
              aria-labelledby={`migration-${kind}`}
              className="panel migration-group"
              key={kind}
            >
              <div className="panel__header migration-group__header">
                <div>
                  <p className="eyebrow">Migration strategy</p>
                  <h2 id={`migration-${kind}`}>
                    {mappingKindDetails[kind].label}
                  </h2>
                  <p>{mappingKindDetails[kind].description}</p>
                </div>
                <span className="token-note">
                  {mappings.length}{' '}
                  {mappings.length === 1 ? 'mapping' : 'mappings'}
                </span>
              </div>
              <div className="migration-rows">
                {mappings.map((mapping) => (
                  <MigrationMappingRow key={mapping.id} mapping={mapping} />
                ))}
              </div>
            </section>
          )
        })
      ) : (
        <section className="panel no-mappings">
          <h2>No mappings found</h2>
          <p>Try another component name or migration strategy.</p>
        </section>
      )}
    </main>
  )
}

function DeprecatedPage({ component }: { component: CatalogueComponent }) {
  return (
    <>
      <section className="panel empty-state">
        <span className="empty-state__icon" aria-hidden="true">
          ◌
        </span>
        <p className="eyebrow">Upstream entry retained for discovery</p>
        <h2>Form is deprecated and unavailable</h2>
        <p>
          The pinned Base index no longer publishes a Form source file. Use
          Field with native form elements or a form-state library instead. No
          installation command is shown because publishing one would be
          misleading.
        </p>
      </section>
      <ApiSection component={component} />
    </>
  )
}

function IncompatiblePage({ component }: { component: CatalogueComponent }) {
  return (
    <>
      <section className="panel empty-state">
        <span className="empty-state__icon" aria-hidden="true">
          ◌
        </span>
        <p className="eyebrow">React compatibility boundary</p>
        <h2>Message Scroller requires React 19</h2>
        <p>
          The upstream <code>@shadcn/react</code> primitive requires React 19
          and uses its ref-as-prop behavior. It is listed for discovery but is
          not installable from this React 18 registry release.
        </p>
      </section>
      <ApiSection component={component} />
    </>
  )
}

function ComponentPage({ component }: { component: CatalogueComponent }) {
  const rawUrl = registryUrl(component.slug)

  return (
    <main className="content" id="main-content">
      <div className="breadcrumb">
        Components <span aria-hidden="true">/</span> {component.name}
      </div>

      <header className="component-header">
        <div>
          <h1>{component.name}</h1>
          <p>{component.description}</p>
        </div>
        <StatusBadge component={component} />
      </header>

      <ClientContract component={component} rawUrl={rawUrl} />

      {component.availability === 'deprecated' ? (
        <DeprecatedPage component={component} />
      ) : component.availability === 'incompatible' ? (
        <IncompatiblePage component={component} />
      ) : component.registryStatus !== 'unavailable' ? (
        <>
          {component.registryStatus === 'testing' ? (
            <section className="testing-notice" role="note">
              <strong>Installable for testing, not migration-ready.</strong>
              <span>
                This facade still has unresolved legacy behaviour. Use it to
                validate the registry integration, but do not treat it as an
                approved production migration yet.
              </span>
            </section>
          ) : null}
          <ComponentPreview component={component} />
          <ApiSection component={component} />
          <RegistrySource
            component={component}
            key={component.slug}
            rawUrl={rawUrl}
          />
        </>
      ) : (
        <section className="panel empty-state">
          <span className="empty-state__icon" aria-hidden="true">
            ◌
          </span>
          <p className="eyebrow">Pinned catalogue entry</p>
          <h2>Source is not available</h2>
          <p>
            This entry is listed by the pinned Base index, but no checked-in
            source module exists. It is not advertised as installable.
          </p>
        </section>
      )}
    </main>
  )
}

function App() {
  const route = useCatalogueRoute()
  const activeComponent =
    route.kind === 'component'
      ? findComponent(route.slug) ?? catalogueComponents[0]
      : catalogueComponents[0]
  const [query, setQuery] = React.useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filteredComponents = catalogueComponents.filter((component) =>
    `${component.name} ${component.category}`
      .toLowerCase()
      .includes(normalizedQuery)
  )
  const readyCount = catalogueComponents.filter(
    ({ registryStatus }) => registryStatus === 'ready'
  ).length
  const testingCount = catalogueComponents.filter(
    ({ registryStatus }) => registryStatus === 'testing'
  ).length

  return (
    <div className="catalogue-shell">
      <a className="skip-link" href="#main-content">
        Skip to component
      </a>
      <aside className="sidebar">
        <div className="brand">
          <div>
            <strong>Applique</strong>
            <span>Base registry catalogue</span>
          </div>
        </div>

        <nav aria-label="Catalogue views" className="catalogue-views">
          <a
            aria-current={route.kind === 'component' ? 'page' : undefined}
            href="#/components/button"
          >
            <strong>Components</strong>
            <span>{catalogueComponents.length} registry entries</span>
          </a>
          <a
            aria-current={route.kind === 'migration' ? 'page' : undefined}
            href="#/migration"
          >
            <strong>Migration guide</strong>
            <span>4 mapping strategies</span>
          </a>
        </nav>

        <label className="search">
          <span className="sr-only">Search components</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search components"
            type="search"
            value={query}
          />
        </label>

        <div className="sidebar__summary">
          <span>{catalogueComponents.length} components</span>
          <span>
            {readyCount} ready
            {testingCount > 0 ? ` · ${testingCount} testing` : ''}
          </span>
        </div>

        <nav aria-label="Component catalogue" className="component-nav">
          {filteredComponents.length > 0 ? (
            filteredComponents.map((component) => (
              <a
                aria-current={
                  route.kind === 'component' &&
                  component.slug === activeComponent.slug
                    ? 'page'
                    : undefined
                }
                className="component-link"
                href={`#/components/${component.slug}`}
                key={component.slug}
              >
                <span>
                  <strong>{component.name}</strong>
                  <small>{component.category}</small>
                </span>
                <span
                  aria-label={
                    component.registryStatus === 'ready'
                      ? 'Registry ready'
                      : component.registryStatus === 'testing'
                      ? 'Test only'
                      : component.availability === 'deprecated'
                      ? 'Deprecated'
                      : component.availability === 'incompatible'
                      ? 'Requires React 19'
                      : 'Unavailable'
                  }
                  className={`component-link__status component-link__status--${component.registryStatus}`}
                />
              </a>
            ))
          ) : (
            <p className="no-results">No components match “{query}”.</p>
          )}
        </nav>

        <footer className="sidebar__footer">
          <a href="../registry/registry.json" target="_blank" rel="noreferrer">
            Registry index <span aria-hidden="true">↗</span>
          </a>
          <span>Base · Nova</span>
        </footer>
      </aside>

      {route.kind === 'migration' ? (
        <MigrationGuide />
      ) : (
        <ComponentPage component={activeComponent} />
      )}
      <BaseToaster />
      <SonnerToaster />
    </div>
  )
}

const container = document.getElementById('root')

if (!container) {
  throw new Error('Catalogue root element was not found.')
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
