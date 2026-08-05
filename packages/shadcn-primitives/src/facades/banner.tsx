'use client'

import * as React from 'react'
import {
  ArrowDownToLineIcon,
  BombIcon,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  DownloadIcon,
  InfoIcon,
  LoaderCircleIcon,
  ScanBarcodeIcon,
  SearchIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'

import {
  Alert as ShadcnAlert,
  AlertAction as ShadcnAlertAction,
  AlertDescription as ShadcnAlertDescription,
  AlertTitle as ShadcnAlertTitle,
} from '../alert'
import { Button as ShadcnButton } from '../button'
import { cn } from '../utils'

type ShadcnAlertProps = React.ComponentPropsWithoutRef<typeof ShadcnAlert>

export type BannerTone = 'error' | 'warning' | 'success' | 'info'
export type BannerIcon =
  | string
  | React.ReactNode
  | React.ComponentType<any>
  | React.ExoticComponent<any>

export interface BannerLink {
  href: string
  displayText: string
}

export interface BannerProps
  extends Omit<ShadcnAlertProps, 'children' | 'className' | 'color' | 'title'> {
  /** Deprecated legacy semantic intent. `color` takes precedence. */
  type?: BannerTone
  /** Legacy semantic intent. It takes precedence over shadcn `variant`. */
  color?: BannerTone
  /** Explicit legacy icon. `undefined` derives a default; `null` removes it. */
  icon?: BannerIcon | null
  /** Optional heading. Without it, children are rendered as the heading. */
  title?: string
  /** The legacy banner body. */
  children: string | React.ReactElement
  /** Renders an external action link below the banner content. */
  link?: BannerLink
  /** Renders the dismiss action and receives its click. */
  onClose?: () => void
  /** Preserves the legacy root class target. */
  className?: string
  /** Accepted for compatibility; the verified legacy runtime ignored it. */
  solid?: boolean
  /** Accepted for compatibility; the verified legacy runtime ignored it. */
  noFill?: boolean
}

export interface BannerActionableData {
  /** Deprecated legacy semantic intent. `color` takes precedence. */
  type?: BannerTone
  /** Legacy input. To preserve the active runtime, every truthy value resolves to info. */
  color?: BannerTone
  icon?: BannerIcon | null
  header?: string
  subHeader?: string
  feedback?: string
  entityName?: string
  entityId?: string
  actionToTake: string | React.ReactElement
  actionButtonText: string
  onActionClick?: () => void
  onClose?: () => void
}

export interface BannerActionableProps
  extends Omit<
    ShadcnAlertProps,
    'children' | 'className' | 'color' | 'title' | 'variant'
  > {
  data?: BannerActionableData
  /** Accepted for compatibility; the legacy Actionable runtime ignored it. */
  className?: string
}

const defaultIconMap: Record<BannerTone, BannerIcon> = {
  error: TriangleAlertIcon,
  warning: CircleAlertIcon,
  success: CircleCheckIcon,
  info: CircleAlertIcon,
}

const toneClassNameMap: Record<BannerTone, string> = {
  info:
    'border-[var(--applique-info-background)] bg-[var(--applique-info-background)] text-foreground',
  success:
    'border-[var(--applique-success-background)] bg-[var(--applique-success-background)] text-foreground',
  warning:
    'border-[var(--applique-warning-background)] bg-[var(--applique-warning-background)] text-foreground',
  error:
    'border-[var(--applique-error-background)] bg-[var(--applique-error-background)] text-foreground',
}

const iconClassNameMap: Record<BannerTone, string> = {
  info: 'text-[var(--applique-info-foreground)]',
  success: 'text-[var(--applique-success-foreground)]',
  warning: 'text-[var(--applique-warning-foreground)]',
  error: 'text-[var(--applique-error-foreground)]',
}

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
      `[Applique Banner] Unknown legacy icon "${name}". Rendering the fallback icon.`
    )
  }

  return <CircleHelpIcon data-applique-icon-fallback={normalizedName} />
}

function isBackwardCompatibleInfo(value: unknown) {
  return value === 'primary' || value === 'info'
}

function isBannerTone(value: unknown): value is BannerTone {
  return (
    value === 'error' ||
    value === 'warning' ||
    value === 'success' ||
    value === 'info'
  )
}

/** Preserve the active Banner rule, including the old out-of-type `primary`. */
function resolveLegacyTone(color: unknown, type: unknown): BannerTone {
  if (isBackwardCompatibleInfo(color) || isBackwardCompatibleInfo(type)) {
    return 'info'
  }

  if (isBannerTone(color)) return color
  if (isBannerTone(type)) return type

  return 'info'
}

/** Preserve the active Actionable runtime, where every truthy color became info. */
function resolveLegacyActionableTone(
  color: unknown,
  type: unknown
): BannerTone {
  if (color) return 'info'
  return resolveLegacyTone(undefined, type)
}

function variantForTone(tone: BannerTone): ShadcnAlertProps['variant'] {
  return tone === 'error' ? 'destructive' : 'default'
}

function renderIconContent(icon: BannerIcon): React.ReactNode {
  if (typeof icon === 'string') {
    return renderStringIcon(icon)
  }

  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' &&
      icon !== null &&
      !React.isValidElement(icon) &&
      '$$typeof' in icon)
  ) {
    const IconComponent = icon as React.ElementType
    return <IconComponent />
  }

  return icon
}

function BannerIconView({
  icon,
  tone,
}: {
  icon: BannerIcon
  tone: BannerTone
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'row-span-2 inline-flex size-6 shrink-0 items-center justify-center [&>svg]:size-full',
        iconClassNameMap[tone]
      )}
      data-test-id="icon"
    >
      {renderIconContent(icon)}
    </span>
  )
}

function DismissButton({ onClose }: { onClose: () => void }) {
  return (
    <ShadcnButton
      aria-label="Close"
      className="size-7 text-current hover:bg-black/5 hover:text-current"
      data-test-id="close"
      size="icon-sm"
      type="button"
      variant="ghost"
      onClick={onClose}
    >
      <XIcon aria-hidden="true" />
    </ShadcnButton>
  )
}

const BannerRoot = React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      children,
      className,
      color,
      icon,
      link,
      noFill: _ignoredNoFill,
      onClose,
      role = 'alert',
      solid: _ignoredSolid,
      title,
      type,
      variant,
      ...alertProps
    },
    ref
  ) => {
    // These props were destructured but never applied by the legacy runtime.
    void _ignoredNoFill
    void _ignoredSolid

    const hasLegacyTone = color !== undefined || type !== undefined
    const usesLegacyTone = hasLegacyTone || variant === undefined
    const tone = resolveLegacyTone(color, type)
    const iconTone = usesLegacyTone
      ? tone
      : variant === 'destructive'
      ? 'error'
      : 'info'
    const resolvedIcon = icon === undefined ? defaultIconMap[iconTone] : icon
    const heading = title || children
    const body = title ? children : null
    const completeLink = link?.href && link.displayText ? link : undefined

    return (
      <ShadcnAlert
        {...alertProps}
        ref={ref}
        className={cn(
          className,
          'items-start rounded-sm px-4 py-3',
          resolvedIcon && 'grid-cols-[auto_1fr] gap-x-3',
          usesLegacyTone && toneClassNameMap[tone]
        )}
        data-applique-banner-tone={usesLegacyTone ? tone : undefined}
        data-applique-incomplete-link={link && !completeLink ? '' : undefined}
        role={role}
        variant={usesLegacyTone ? variantForTone(tone) : variant}
      >
        {resolvedIcon ? (
          <BannerIconView icon={resolvedIcon} tone={iconTone} />
        ) : null}
        <div
          className={cn('min-w-0', resolvedIcon && 'col-start-2')}
          data-test-id="content"
        >
          <ShadcnAlertTitle className="font-semibold">
            {heading}
          </ShadcnAlertTitle>
          {body ? (
            <ShadcnAlertDescription className="mt-1 text-inherit">
              {body}
            </ShadcnAlertDescription>
          ) : null}
          {completeLink ? (
            <ShadcnButton
              className="mt-1 h-auto justify-start gap-1 p-0 text-current hover:bg-transparent hover:text-current"
              data-test-id="link"
              nativeButton={false}
              render={<a href={completeLink.href} target="_blank" />}
              size="sm"
              variant="link"
            >
              {completeLink.displayText}
              <ChevronRightIcon
                aria-hidden="true"
                data-applique-icon-position="inline-end"
              />
            </ShadcnButton>
          ) : null}
        </div>
        {onClose ? (
          <ShadcnAlertAction>
            <DismissButton onClose={onClose} />
          </ShadcnAlertAction>
        ) : null}
      </ShadcnAlert>
    )
  }
)

BannerRoot.displayName = 'Banner'

const BannerActionable = React.forwardRef<
  HTMLDivElement,
  BannerActionableProps
>(
  (
    { className: _ignoredClassName, data, role = 'alert', ...alertProps },
    ref
  ) => {
    // The active legacy runtime intentionally discarded this class target.
    void _ignoredClassName

    if (!data) return null

    const {
      actionButtonText,
      actionToTake,
      color,
      entityId,
      entityName,
      feedback,
      header,
      icon,
      onActionClick,
      onClose,
      subHeader,
      type,
    } = data
    const tone = resolveLegacyActionableTone(color, type)
    const resolvedIcon = icon === undefined ? defaultIconMap[tone] : icon

    // Actionable remains an Alert-based full-screen takeover, matching the
    // audited Alert + Button composition. It does not invent Dialog focus trap,
    // inert-background, or Escape behavior; those semantics require approval.
    return (
      <ShadcnAlert
        {...alertProps}
        ref={ref}
        className={cn(
          'fixed inset-0 z-50 block h-dvh w-screen rounded-none border-0 px-8 py-6',
          toneClassNameMap[tone]
        )}
        data-applique-banner-actionable=""
        data-applique-banner-tone={tone}
        role={role}
        variant={variantForTone(tone)}
      >
        <div className="ml-8" data-test-id="header">
          <ShadcnAlertTitle className="text-lg font-semibold">
            {header}
          </ShadcnAlertTitle>
          <ShadcnAlertDescription className="text-inherit">
            {subHeader}
          </ShadcnAlertDescription>
        </div>
        {onClose ? (
          <ShadcnAlertAction className="right-4 top-3">
            <DismissButton onClose={onClose} />
          </ShadcnAlertAction>
        ) : null}
        <div
          className="mt-[20vh] flex items-start gap-5"
          data-test-id="actionable-content"
        >
          {resolvedIcon ? (
            <BannerIconView icon={resolvedIcon} tone={tone} />
          ) : null}
          <div className="flex min-w-0 flex-col">
            <h1 className="text-2xl font-semibold" data-test-id="feedback">
              {feedback}
            </h1>
            <p className="font-medium" data-test-id="entity-name">
              {entityName}
            </p>
            <h2 className="text-xl font-semibold" data-test-id="entity-id">
              {entityId}
            </h2>
            <h3
              className="mt-7 w-[70vw] border-t border-current pt-2 text-lg font-semibold"
              data-test-id="action-to-take"
            >
              {actionToTake}
            </h3>
            {actionButtonText ? (
              <ShadcnButton
                className="mt-5 min-w-24 self-start"
                data-test-id="action"
                type="button"
                variant="secondary"
                onClick={onActionClick}
              >
                {actionButtonText}
              </ShadcnButton>
            ) : null}
          </div>
        </div>
      </ShadcnAlert>
    )
  }
)

BannerActionable.displayName = 'Banner.Actionable'

const Banner = Object.assign(BannerRoot, { Actionable: BannerActionable })

export { Banner, BannerActionable }
