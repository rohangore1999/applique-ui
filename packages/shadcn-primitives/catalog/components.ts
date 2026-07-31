import {
  generatedCatalogueComponents,
  generatedCatalogueSource,
} from './generated/components.generated'

export type RegistryStatus = 'ready' | 'unavailable'
export type ComponentAvailability = 'registry' | 'deprecated'
export type ApiExportKind = 'component' | 'hook' | 'type' | 'utility'

export interface CatalogueOwnedProp {
  name: string
  optional: boolean
  type: string
}

export interface CatalogueApiExport {
  kind: ApiExportKind
  name: string
  ownedProps: CatalogueOwnedProp[]
  propSources: string[]
  signature: string
}

export interface CatalogueComponent {
  api: {
    exports: CatalogueApiExport[]
  }
  availability: ComponentAvailability
  category: string
  description: string
  name: string
  previewProvenance: string
  registryStatus: RegistryStatus
  slug: string
  sourceAvailable: boolean
  sourcePath: string | null
  upstream: {
    base: string
    commit: string
    style: string
  }
}

export const catalogueComponents =
  generatedCatalogueComponents as unknown as CatalogueComponent[]

export const catalogueSource = generatedCatalogueSource

export function findComponent(slug: string) {
  return catalogueComponents.find((component) => component.slug === slug)
}
