export type RegistryStatus = 'ready' | 'planned'

export interface CatalogueComponent {
  category: string
  description: string
  name: string
  registryStatus: RegistryStatus
  slug: string
}

const readyComponents: CatalogueComponent[] = [
  {
    category: 'Inputs',
    description:
      'Triggers an action or event, with Applique-themed intents and sizes.',
    name: 'Button',
    registryStatus: 'ready',
    slug: 'button',
  },
  {
    category: 'Inputs',
    description:
      'Lets a user select one or more options, including destructive states.',
    name: 'Checkbox',
    registryStatus: 'ready',
    slug: 'checkbox',
  },
]

const plannedComponents = [
  ['Accordion', 'accordion', 'Layout'],
  ['Alert', 'alert', 'Feedback'],
  ['Alert Dialog', 'alert-dialog', 'Overlays'],
  ['Aspect Ratio', 'aspect-ratio', 'Layout'],
  ['Avatar', 'avatar', 'Data display'],
  ['Badge', 'badge', 'Data display'],
  ['Breadcrumb', 'breadcrumb', 'Navigation'],
  ['Calendar', 'calendar', 'Inputs'],
  ['Card', 'card', 'Layout'],
  ['Carousel', 'carousel', 'Data display'],
  ['Chart', 'chart', 'Data display'],
  ['Collapsible', 'collapsible', 'Layout'],
  ['Command', 'command', 'Navigation'],
  ['Context Menu', 'context-menu', 'Overlays'],
  ['Data Table', 'data-table', 'Compositions'],
  ['Dialog', 'dialog', 'Overlays'],
  ['Drawer', 'drawer', 'Overlays'],
  ['Dropdown Menu', 'dropdown-menu', 'Overlays'],
  ['Form', 'form', 'Compositions'],
  ['Hover Card', 'hover-card', 'Overlays'],
  ['Input', 'input', 'Inputs'],
  ['Input OTP', 'input-otp', 'Inputs'],
  ['Label', 'label', 'Inputs'],
  ['Menubar', 'menubar', 'Navigation'],
  ['Navigation Menu', 'navigation-menu', 'Navigation'],
  ['Pagination', 'pagination', 'Navigation'],
  ['Popover', 'popover', 'Overlays'],
  ['Progress', 'progress', 'Feedback'],
  ['Radio Group', 'radio-group', 'Inputs'],
  ['Resizable', 'resizable', 'Layout'],
  ['Scroll Area', 'scroll-area', 'Layout'],
  ['Select', 'select', 'Inputs'],
  ['Separator', 'separator', 'Layout'],
  ['Sheet', 'sheet', 'Overlays'],
  ['Sidebar', 'sidebar', 'Navigation'],
  ['Skeleton', 'skeleton', 'Feedback'],
  ['Slider', 'slider', 'Inputs'],
  ['Sonner', 'sonner', 'Feedback'],
  ['Spinner', 'spinner', 'Feedback'],
  ['Switch', 'switch', 'Inputs'],
  ['Table', 'table', 'Data display'],
  ['Tabs', 'tabs', 'Navigation'],
  ['Textarea', 'textarea', 'Inputs'],
  ['Toggle', 'toggle', 'Inputs'],
  ['Toggle Group', 'toggle-group', 'Inputs'],
  ['Tooltip', 'tooltip', 'Overlays'],
] as const

export const catalogueComponents: CatalogueComponent[] = [
  ...readyComponents,
  ...plannedComponents.map(([name, slug, category]) => ({
    category,
    description:
      'The component source exists in Applique and will be published after registry validation.',
    name,
    registryStatus: 'planned' as const,
    slug,
  })),
].sort((left, right) => left.name.localeCompare(right.name))

export function findComponent(slug: string) {
  return catalogueComponents.find((component) => component.slug === slug)
}
