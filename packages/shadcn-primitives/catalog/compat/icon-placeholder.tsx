import * as React from 'react'
import { CircleHelpIcon, icons, LucideProps } from 'lucide-react'

const legacyLucideNames: Record<string, string> = {
  AlertTriangle: 'TriangleAlert',
  ArrowLeftCircle: 'CircleArrowLeft',
  FileWarning: 'FileExclamationPoint',
  FlipHorizontal: 'SquareCenterlineDashedHorizontal',
  FlipVertical: 'SquareCenterlineDashedVertical',
  HelpCircle: 'CircleQuestionMark',
  Home: 'House',
  Layout: 'PanelsTopLeft',
  MoreHorizontal: 'Ellipsis',
  PlusCircle: 'CirclePlus',
}

const lucideIcons = (icons as unknown) as Record<
  string,
  React.ComponentType<LucideProps>
>

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
  const requestedName = lucide && lucide.replace(/Icon$/, '')
  const resolvedName =
    (requestedName && legacyLucideNames[requestedName]) || requestedName
  const Icon = (resolvedName && lucideIcons[resolvedName]) || CircleHelpIcon

  return (
    <Icon
      aria-hidden="true"
      data-missing-lucide-icon={
        lucide && resolvedName && !lucideIcons[resolvedName]
          ? lucide
          : undefined
      }
      {...props}
    />
  )
}
