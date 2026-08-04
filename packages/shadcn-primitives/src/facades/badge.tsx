'use client'

import * as React from 'react'
import {
  ArrowDownToLineIcon,
  BombIcon,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  DownloadIcon,
  InfoIcon,
  LoaderCircleIcon,
  ScanBarcodeIcon,
  SearchIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from 'lucide-react'

import { Badge as InternalBadge } from '../badge'
import { cn } from '../utils'

type InternalBadgeProps = React.ComponentPropsWithoutRef<typeof InternalBadge>
type IconName =
  | string
  | React.ReactNode
  | React.ComponentType<any>
  | React.ExoticComponent<any>
type BadgeType = 'info' | 'success' | 'warning' | 'error'
type BadgeVariant = 'solid' | 'outlined'

const legacyStringIconMap: Record<string, React.ElementType> = {
  'arrow-to-bottom': ArrowDownToLineIcon,
  'barcode-scan': ScanBarcodeIcon,
  bomb: BombIcon,
  calendar: CalendarIcon,
  calender: CalendarIcon,
  check: CheckIcon,
  'chevron-right': ChevronRightIcon,
  download: DownloadIcon,
  info: InfoIcon,
  search: SearchIcon,
  spinner: LoaderCircleIcon,
  spinnersolid: LoaderCircleIcon,
  'thumbs-down': ThumbsDownIcon,
  'thumbs-up': ThumbsUpIcon,
}

const warnedUnknownIconNames = new Set<string>()

function renderStringIcon(name: string): React.ReactNode {
  const normalizedName = name.trim().toLowerCase()
  const IconComponent = legacyStringIconMap[normalizedName]

  if (IconComponent) {
    return <IconComponent data-applique-icon={normalizedName} />
  }

  const environment = (globalThis as typeof globalThis & {
    process?: { env?: { NODE_ENV?: string } }
  }).process?.env?.NODE_ENV

  if (
    environment !== 'production' &&
    !warnedUnknownIconNames.has(normalizedName)
  ) {
    warnedUnknownIconNames.add(normalizedName)
    console.warn(
      `[Applique Badge] Unknown legacy icon "${name}". Rendering the fallback icon.`
    )
  }

  return <CircleHelpIcon data-applique-icon-fallback={normalizedName} />
}

function renderIcon(name: IconName): React.ReactNode {
  let icon: React.ReactNode

  if (typeof name === 'string') {
    icon = renderStringIcon(name)
  } else if (
    typeof name === 'function' ||
    (typeof name === 'object' &&
      name !== null &&
      !React.isValidElement(name) &&
      '$$typeof' in name)
  ) {
    const IconComponent = name as React.ElementType
    icon = <IconComponent />
  } else {
    icon = name
  }

  return (
    <span
      aria-hidden="true"
      className="-ml-1 mr-0.5 inline-flex shrink-0 items-center [&>svg]:size-3"
      data-test-id="icon"
    >
      {icon}
    </span>
  )
}

const internalVariantMap = {
  solid: 'default',
  outlined: 'outline',
} as const

const typeClassNameMap: Record<BadgeType, string> = {
  info:
    'bg-[var(--applique-info-background)] text-[var(--applique-info-foreground)]',
  success:
    'bg-[var(--applique-success-background)] text-[var(--applique-success-foreground)]',
  warning:
    'bg-[var(--applique-warning-background)] text-[var(--applique-warning-foreground)]',
  error:
    'bg-[var(--applique-error-background)] text-[var(--applique-error-foreground)]',
}

const solidBorderClassNameMap: Record<BadgeType, string> = {
  info: 'border-[var(--applique-info-background)]',
  success: 'border-[var(--applique-success-background)]',
  warning: 'border-[var(--applique-warning-background)]',
  error: 'border-[var(--applique-error-background)]',
}

const outlinedBorderClassNameMap: Record<BadgeType, string> = {
  info: 'border-[var(--applique-info-foreground)]',
  success: 'border-[var(--applique-success-foreground)]',
  warning: 'border-[var(--applique-warning-foreground)]',
  error: 'border-[var(--applique-error-foreground)]',
}

const sizeClassNameMap = {
  small: 'h-auto leading-none',
  regular: 'h-auto leading-6',
} as const

export interface BadgeProps
  extends Omit<InternalBadgeProps, 'children' | 'variant'> {
  /** The public legacy API accepts a string label. */
  children: string
  /** Semantic color intent. */
  type?: BadgeType
  /** Fill or outlined presentation. */
  variant?: BadgeVariant
  /** Legacy compact or regular line-height. */
  size?: 'small' | 'regular'
  /** Optional leading legacy icon. */
  icon?: IconName
  /** Adds an accessible dismiss control. */
  onClose?: () => void
}

const Badge = React.forwardRef<HTMLElement, BadgeProps>(
  (
    {
      children,
      className,
      icon,
      onClose,
      render,
      size = 'regular',
      type = 'info',
      variant = 'solid',
      ...internalProps
    },
    ref
  ) => {
    const borderClassName =
      variant === 'outlined'
        ? outlinedBorderClassNameMap[type]
        : solidBorderClassNameMap[type]

    return (
      <InternalBadge
        {...internalProps}
        ref={ref}
        // A dismiss button cannot be nested inside an interactive render root
        // such as an anchor. The Applique onClose contract therefore keeps the
        // legacy div root and takes precedence over the shadcn render extension.
        render={onClose ? <div /> : render ?? <div />}
        variant={internalVariantMap[variant]}
        className={cn(
          className,
          'rounded-xs px-2 py-0.5 text-xs font-normal max-md:text-[10px]',
          typeClassNameMap[type],
          sizeClassNameMap[size],
          borderClassName
        )}
      >
        {icon ? renderIcon(icon) : null}
        {children}
        {onClose ? (
          <button
            type="button"
            aria-label="Close"
            className="-mr-1 ml-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-xs text-current outline-none focus-visible:ring-2 focus-visible:ring-current/40"
            data-test-id="close"
            onClick={onClose}
          >
            <svg
              aria-hidden="true"
              className="size-2"
              focusable="false"
              viewBox="0 0 352 512"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="currentColor"
                d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
              />
            </svg>
          </button>
        ) : null}
      </InternalBadge>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
