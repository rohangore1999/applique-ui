import {
  generatedCatalogueComponents,
  generatedCatalogueMappings,
  generatedCatalogueSource,
} from './generated/components.generated'

export type RegistryStatus = 'ready' | 'unavailable'
export type ComponentAvailability = 'registry' | 'deprecated'
export type ApiExportKind = 'component' | 'hook' | 'type' | 'utility'
export type MappingKind =
  | 'direct'
  | 'composition'
  | 'no-equivalent'
  | 'ambiguous'
export type MappingReview = 'proposed' | 'approved'
export type PropMappingKind =
  | 'forwarded'
  | 'mapped'
  | 'composition-owned'
  | 'unsupported'
  | 'needs-review'

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

export interface CataloguePropTarget {
  component: string
  prop?: string
}

export interface CataloguePropMapping {
  from: string[]
  id: string
  kind: PropMappingKind
  summary: string
  targets: CataloguePropTarget[]
  valueMap?: Record<string, string>
}

export interface CatalogueMapping {
  applique: string[]
  id: string
  kind: MappingKind
  propMappings?: CataloguePropMapping[]
  review: MappingReview
  shadcn: string[]
  summary: string
}

export const catalogueComponents = (generatedCatalogueComponents as unknown) as CatalogueComponent[]

export const catalogueMappings = (generatedCatalogueMappings as unknown) as CatalogueMapping[]

export const catalogueSource = generatedCatalogueSource

export function findComponent(slug: string) {
  return catalogueComponents.find((component) => component.slug === slug)
}
