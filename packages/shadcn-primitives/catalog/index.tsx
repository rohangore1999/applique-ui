import * as React from 'react'
import { createRoot } from 'react-dom/client'
import './catalog.css'
import '../src/design.css'
import {
  CatalogueApiExport,
  CatalogueComponent,
  CatalogueMapping,
  CataloguePropMapping,
  MappingKind,
  PropMappingKind,
  catalogueComponents,
  catalogueMappings,
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

  return new URL(`../registry/${slug}.json`, pageUrl).toString()
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

function StatusBadge({ component }: { component: CatalogueComponent }) {
  const label =
    component.availability === 'deprecated'
      ? 'Deprecated'
      : component.availability === 'incompatible'
      ? 'Requires React 19'
      : component.registryStatus === 'ready'
      ? 'Registry ready'
      : 'Source unavailable'

  return (
    <span className={`status-badge status-badge--${component.registryStatus}`}>
      <span aria-hidden="true" className="status-badge__dot" />
      {label}
    </span>
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

function ExportApi({
  item,
  index,
}: {
  item: CatalogueApiExport
  index: number
}) {
  const hasPropSurface =
    item.ownedProps.length > 0 || item.propSources.length > 0

  return (
    <details className="api-export" open={index === 0}>
      <summary>
        <span>
          <code>{item.name}</code>
          <small>{item.kind}</small>
        </span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="api-export__body">
        <code className="api-signature">{item.signature}</code>

        {item.ownedProps.length > 0 ? (
          <div className="api-subsection">
            <h4>Declared props</h4>
            <div className="api-props-scroll">
              <table className="api-props">
                <thead>
                  <tr>
                    <th scope="col">Prop</th>
                    <th scope="col">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {item.ownedProps.map((prop) => (
                    <tr key={`${item.name}-${prop.name}`}>
                      <th scope="row">
                        <code>
                          {prop.name}
                          {prop.optional ? '?' : ''}
                        </code>
                      </th>
                      <td>
                        <code>{prop.type}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {item.propSources.length > 0 ? (
          <div className="api-subsection">
            <h4>Inherited or forwarded prop surfaces</h4>
            <p>
              These exact upstream types are accepted by composition. They are
              intentionally not expanded into fabricated local props.
            </p>
            <ul className="type-sources">
              {item.propSources.map((source) => (
                <li key={`${item.name}-${source}`}>
                  <code>{source}</code>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!hasPropSurface ? (
          <p className="api-empty">
            This export does not declare a separate local prop contract in the
            checked-in module.
          </p>
        ) : null}
      </div>
    </details>
  )
}

function ApiSection({ component }: { component: CatalogueComponent }) {
  return (
    <section className="panel api-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">API reference</p>
          <h2>Exported surface</h2>
        </div>
        <span className="token-note">Generated from checked-in TypeScript</span>
      </div>

      <p className="supporting-copy">
        Signatures, explicitly declared props, and inherited primitive surfaces
        are read from the source module. Runtime behavior remains defined by
        Base UI and React.
      </p>

      <div className="api-exports">
        {component.api.exports.length > 0 ? (
          component.api.exports.map((item, index) => (
            <ExportApi
              index={index}
              item={item}
              key={`${component.slug}-${item.name}`}
            />
          ))
        ) : (
          <p className="api-empty api-empty--standalone">
            No source API is published for this entry.
          </p>
        )}
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
          <h2>Pinned implementation</h2>
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
          <dt>Upstream</dt>
          <dd>
            <code>
              {component.upstream.base}-{component.upstream.style}
            </code>
          </dd>
        </div>
        <div>
          <dt>Snapshot</dt>
          <dd>
            <a
              href={`https://github.com/shadcn-ui/ui/commit/${component.upstream.commit}`}
              target="_blank"
              rel="noreferrer"
            >
              <code>{component.upstream.commit.slice(0, 12)}</code>
            </a>
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
  const installCommand = `npx shadcn@${SHADCN_CLI_VERSION} add ${rawUrl}`

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

      {component.availability === 'deprecated' ? (
        <DeprecatedPage component={component} />
      ) : component.availability === 'incompatible' ? (
        <IncompatiblePage component={component} />
      ) : component.registryStatus === 'ready' ? (
        <>
          <ComponentPreview component={component} />
          <ApiSection component={component} />
          <RegistrySource
            component={component}
            key={component.slug}
            rawUrl={rawUrl}
          />

          <section className="panel install-panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Registry</p>
                <h2>Install source</h2>
              </div>
            </div>
            <p className="supporting-copy">
              Run this inside a configured shadcn application. The source and
              Applique theme are copied into that application for the client
              team to own.
            </p>
            <CopyCommand command={installCommand} />
          </section>
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
          <span>{readyCount} ready</span>
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
