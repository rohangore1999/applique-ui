import * as React from 'react'
import { createRoot } from 'react-dom/client'
import './catalog.css'
import '../src/design.css'
import {
  catalogueComponents,
  findComponent,
  type CatalogueComponent,
} from './components'
import {
  componentPropGroups,
  type CataloguePropGroup,
  type PropStrategy,
} from './component-props'
import { ButtonPreview } from './previews/button-preview'
import { CheckboxPreview } from './previews/checkbox-preview'

const previewBySlug: Record<string, React.ComponentType> = {
  button: ButtonPreview,
  checkbox: CheckboxPreview,
}

function slugFromHash() {
  const match = window.location.hash.match(/^#\/components\/([^/?#]+)/)
  const slug = match?.[1] ? decodeURIComponent(match[1]) : 'button'

  return findComponent(slug)?.slug ?? 'button'
}

function registryUrl(slug: string) {
  const pageUrl = new URL(window.location.href)
  pageUrl.hash = ''

  return new URL(`../registry/${slug}.json`, pageUrl).toString()
}

function useActiveSlug() {
  const [slug, setSlug] = React.useState(slugFromHash)

  React.useEffect(() => {
    const updateSlug = () => setSlug(slugFromHash())

    window.addEventListener('hashchange', updateSlug)

    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/components/button')
    }

    return () => window.removeEventListener('hashchange', updateSlug)
  }, [])

  return slug
}

function StatusBadge({
  status,
}: {
  status: CatalogueComponent['registryStatus']
}) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span aria-hidden="true" className="status-badge__dot" />
      {status === 'ready' ? 'Registry ready' : 'Planned'}
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

const strategyLabel: Record<PropStrategy, string> = {
  available: 'Available',
  compose: 'Compose',
  forward: 'Forward',
  map: 'Map',
  policy: 'Policy',
}

function PropsSection({
  componentName,
  groups,
}: {
  componentName: string
  groups: CataloguePropGroup[]
}) {
  return (
    <section className="panel props-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">API reference</p>
          <h2>Supported props</h2>
        </div>
        <span className="token-note">Primitive + Applique facade</span>
      </div>

      <div className="props-panel__intro">
        The current primitive and planned compatibility facade are separated so
        the table does not present unimplemented mappings as available.
      </div>

      {groups.map((group) => (
        <section className="props-group" key={group.title}>
          <div className="props-group__header">
            <div>
              <h3>{group.title}</h3>
              <p>{group.description}</p>
            </div>
            <span
              className={`props-group__status props-group__status--${group.status}`}
            >
              {group.status === 'available'
                ? 'Available now'
                : 'Facade planned'}
            </span>
          </div>

          <div className="props-table-scroll">
            <table className="props-table">
              <caption className="sr-only">
                {componentName} {group.title} props
              </caption>
              <thead>
                <tr>
                  <th scope="col">Prop</th>
                  <th scope="col">Type</th>
                  <th scope="col">Default</th>
                  <th scope="col">Strategy</th>
                  <th scope="col">Behavior</th>
                </tr>
              </thead>
              <tbody>
                {group.props.map((prop) => (
                  <tr key={prop.name}>
                    <th scope="row">
                      <code>{prop.name}</code>
                    </th>
                    <td>
                      <code>{prop.type}</code>
                    </td>
                    <td>
                      <code>{prop.defaultValue}</code>
                    </td>
                    <td>
                      <span
                        className={`prop-strategy prop-strategy--${prop.strategy}`}
                      >
                        {strategyLabel[prop.strategy]}
                      </span>
                    </td>
                    <td>{prop.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </section>
  )
}

function ComponentPage({ component }: { component: CatalogueComponent }) {
  const Preview = previewBySlug[component.slug]
  const propGroups = componentPropGroups[component.slug]
  const rawUrl = registryUrl(component.slug)
  const installCommand = `npx shadcn@4.16.0 add ${rawUrl}`

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
        <StatusBadge status={component.registryStatus} />
      </header>

      {Preview ? (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Live preview</p>
                <h2>Examples</h2>
              </div>
              <span className="token-note">Applique tokens applied</span>
            </div>
            <div className="preview-surface">
              <Preview />
            </div>
          </section>

          {propGroups ? (
            <PropsSection componentName={component.name} groups={propGroups} />
          ) : null}

          <section className="panel install-panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Registry</p>
                <h2>Install source</h2>
              </div>
            </div>
            <p className="supporting-copy">
              Run this inside a configured shadcn application. The generated
              source is copied into that application for the team to own.
            </p>
            <CopyCommand command={installCommand} />
            <a
              className="raw-link"
              href={rawUrl}
              target="_blank"
              rel="noreferrer"
            >
              View raw registry JSON <span aria-hidden="true">↗</span>
            </a>
          </section>
        </>
      ) : (
        <section className="panel empty-state">
          <span className="empty-state__icon" aria-hidden="true">
            ◌
          </span>
          <p className="eyebrow">Source available</p>
          <h2>Registry validation is pending</h2>
          <p>
            This component already exists in the package, but it is not yet
            advertised as installable. It will be enabled after its dependency
            metadata and consumer installation tests pass.
          </p>
        </section>
      )}
    </main>
  )
}

function App() {
  const activeSlug = useActiveSlug()
  const activeComponent = findComponent(activeSlug) ?? catalogueComponents[0]
  const [query, setQuery] = React.useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filteredComponents = catalogueComponents.filter((component) =>
    `${component.name} ${component.category}`
      .toLowerCase()
      .includes(normalizedQuery)
  )

  return (
    <div className="catalogue-shell">
      <a className="skip-link" href="#main-content">
        Skip to component
      </a>
      <aside className="sidebar">
        <div className="brand">
          <div>
            <strong>Applique</strong>
            <span>Registry preview</span>
          </div>
        </div>

        <label className="search">
          <span className="sr-only">Search components</span>
          <span aria-hidden="true">⌕</span>
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
            {
              catalogueComponents.filter(
                ({ registryStatus }) => registryStatus === 'ready'
              ).length
            }{' '}
            ready
          </span>
        </div>

        <nav aria-label="Component catalogue" className="component-nav">
          {filteredComponents.length > 0 ? (
            filteredComponents.map((component) => (
              <a
                aria-current={
                  component.slug === activeComponent.slug ? 'page' : undefined
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
                      : 'Planned'
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
          <span>Prototype catalogue</span>
        </footer>
      </aside>

      <ComponentPage component={activeComponent} />
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
