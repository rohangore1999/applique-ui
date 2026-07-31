import * as React from 'react'
import {
  CircleIcon,
  icons,
  type LucideProps,
} from 'lucide-react'

export interface IconPlaceholderProps extends LucideProps {
  hugeicons?: string
  lucide?: string
  phosphor?: string
  remixicon?: string
  tabler?: string
}

export function IconPlaceholder({
  hugeicons: _hugeicons,
  lucide,
  phosphor: _phosphor,
  remixicon: _remixicon,
  tabler: _tabler,
  ...props
}: IconPlaceholderProps) {
  const Icon =
    (lucide
      ? (icons as Record<string, React.ComponentType<LucideProps>>)[lucide]
      : undefined) || CircleIcon

  return <Icon aria-hidden="true" {...props} />
}
