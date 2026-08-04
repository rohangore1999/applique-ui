import {
  generatedCatalogueComponents,
  generatedCatalogueMappings,
  generatedCataloguePropDefinitions,
  generatedCatalogueSource,
  generatedRegistryVersion,
} from './generated/components.generated'

export type RegistryStatus = 'ready' | 'testing' | 'unavailable'
export type ComponentAvailability = 'registry' | 'deprecated' | 'incompatible'
export type ApiExportKind = 'component' | 'hook' | 'type' | 'utility'
export type CataloguePropOrigin =
  | 'applique'
  | 'shadcn'
  | 'primitive'
  | 'dependency'
  | 'native'
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
  acceptedPropIds: number[]
  kind: ApiExportKind
  name: string
  ownedProps: CatalogueOwnedProp[]
  propSources: string[]
  signature: string
}

export interface CatalogueResolvedProp {
  description?: string
  name: string
  optional: boolean
  origin: CataloguePropOrigin
  type: string
}

export interface CatalogueComponent {
  api: {
    exports: CatalogueApiExport[]
  }
  availability: ComponentAvailability
  category: string
  clientContract: {
    basicUsage: string | null
    importPath: string | null
    note: string | null
    registryTarget: string | null
    replacement: string | null
    unavailableReason: string | null
  }
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

export interface CatalogueLegacyApiProp {
  default: unknown
  description?: string
  name: string
  type: string
}

export interface CatalogueLegacyApi {
  component: string
  props: CatalogueLegacyApiProp[]
}

export interface CatalogueMapping {
  applique: string[]
  appliqueApi: CatalogueLegacyApi[]
  id: string
  kind: MappingKind
  mainShadcnProps: string[]
  propMappings?: CataloguePropMapping[]
  review: MappingReview
  shadcn: string[]
  summary: string
}

export const catalogueComponents = (generatedCatalogueComponents as unknown) as CatalogueComponent[]

export const catalogueMappings = (generatedCatalogueMappings as unknown) as CatalogueMapping[]

export const cataloguePropDefinitions = (generatedCataloguePropDefinitions as unknown) as CatalogueResolvedProp[]

export const catalogueSource = generatedCatalogueSource

export const catalogueRegistryVersion = generatedRegistryVersion

export function findComponent(slug: string) {
  return catalogueComponents.find((component) => component.slug === slug)
}
