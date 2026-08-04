'use client'

import * as React from 'react'
import {
  ArrowDownToLineIcon,
  BellIcon,
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
import { Button as InternalButton } from '../button'
import { Spinner as InternalSpinner } from '../spinner'
import { cn } from '../utils'

type InternalButtonProps = React.ComponentPropsWithoutRef<typeof InternalButton>
type InternalButtonSize = InternalButtonProps['size']
type InternalButtonVariant = InternalButtonProps['variant']

export type ButtonIcon =
  | string
  | React.ReactNode
  | React.ComponentType<any>
  | React.ExoticComponent<any>
export type ButtonVisualType =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'link'
  | 'text'
export type ButtonLegacySize = 'xs' | 'small' | 'regular' | 'large'
export type ButtonTransform = 'none' | 'capitalize' | 'uppercase' | 'lowercase'

type AnchorCompatibilityProps = Pick<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'download' | 'hrefLang' | 'ping' | 'referrerPolicy' | 'rel' | 'target'
>

export interface ButtonProps
  extends Omit<
      InternalButtonProps,
      | 'aria-busy'
      | 'children'
      | 'color'
      | 'disabled'
      | 'onClick'
      | 'render'
      | 'size'
      | 'style'
      | 'type'
      | 'variant'
    >,
    AnchorCompatibilityProps {
  /** Legacy visual intent. When present, it takes precedence over variant. */
  type?: ButtonVisualType
  /** Native button type, renamed because type is the legacy visual prop. */
  htmlType?: 'submit' | 'reset' | 'button'
  /** Legacy sizes plus non-conflicting shadcn size extensions. */
  size?: ButtonLegacySize | Exclude<InternalButtonSize, null | undefined>
  /** Non-conflicting shadcn visual extension. Legacy type takes precedence. */
  variant?: InternalButtonVariant
  /** Non-conflicting Base UI polymorphic render extension. */
  render?: InternalButtonProps['render']
  /** Content rendered as the primary button label. */
  children?: React.ReactNode
  /** Runtime-compatible fallback used when children is absent or falsy. */
  label?: React.ReactNode
  /** Leading Applique icon. */
  icon?: ButtonIcon
  /** Trailing Applique icon. */
  secondaryIcon?: ButtonIcon
  /** Disables interaction and renders the shared spinner. */
  loading?: boolean
  /** Notification mode, including the legacy 99+ visible cap. */
  notifications?: number
  /** Uses the surrounding text color across interaction states. */
  inheritTextColor?: boolean
  /** Applies to style.textTransform and takes precedence over style. */
  transform?: ButtonTransform
  /** Browser anchor navigation. */
  href?: string
  /** Client-router destination. Uses a supplied router render or a safe browser fallback. */
  to?: string | object
  /** Secondary text rendered only by the legacy large-button recipe. */
  caption?: string
  /**
   * Accepted only so JavaScript and migrating clients can audit usage. The
   * arbitrary legacy palette has no approved semantic mapping yet.
   */
  color?: string
  /** The legacy arbitrary CSS-state escape hatch is intentionally unsupported. */
  state?: never
  disabled?: boolean
  onClick?: InternalButtonProps['onClick']
  style?: InternalButtonProps['style']
  'aria-busy'?: React.AriaAttributes['aria-busy']
}

const visualTypeMap: Record<
  ButtonVisualType,
  Exclude<InternalButtonVariant, null | undefined>
> = {
  primary: 'default',
  secondary: 'outline',
  tertiary: 'ghost',
  link: 'link',
  text: 'link',
}

const legacySizeMap: Record<
  Exclude<ButtonLegacySize, 'large'>,
  Exclude<InternalButtonSize, null | undefined>
> = {
  xs: 'icon-xs',
  small: 'sm',
  regular: 'default',
}

const largeButtonClassName =
  'h-24 w-full flex-col gap-0 rounded-sm px-2.5 py-2 text-base shadow-md'
const textButtonClassName =
  'h-auto border-transparent bg-transparent p-0 shadow-none hover:bg-transparent hover:no-underline'
const inheritTextColorClassName =
  'text-inherit hover:text-inherit active:text-inherit disabled:text-inherit'

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
      `[Applique Button] Unknown legacy icon "${name}". Rendering the fallback icon.`
    )
  }

  return <CircleHelpIcon data-applique-icon-fallback={normalizedName} />
}

function renderLegacyIcon(
  name: ButtonIcon,
  position: 'inline-start' | 'inline-end',
  overlay?: React.ReactNode
) {
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
      className="relative inline-flex shrink-0 items-center justify-center"
      data-icon={position}
      data-test-id={
        position === 'inline-start' ? 'primary-icon' : 'secondary-icon'
      }
    >
      {overlay}
      {icon}
    </span>
  )
}

function resolveInternalSize(
  size: ButtonProps['size'],
  isIconButton: boolean
): InternalButtonSize {
  if (size === undefined || size === 'regular' || size === 'large') {
    return 'default'
  }

  if (size === 'xs') return isIconButton ? legacySizeMap.xs : 'xs'
  if (size === 'small') return legacySizeMap.small

  return size
}

function mergeTransformStyle(
  style: ButtonProps['style'],
  transform: ButtonTransform
): InternalButtonProps['style'] {
  if (typeof style === 'function') {
    return (state) => ({
      ...style(state),
      textTransform: transform,
    })
  }

  return {
    ...style,
    textTransform: transform,
  }
}

function mergeLinkRender(
  render: ButtonProps['render'],
  linkProps: Record<string, unknown>
): ButtonProps['render'] | null {
  if (render === undefined) return null

  if (typeof render === 'function') {
    const renderFunction = render as (
      props: Record<string, unknown>,
      state: unknown
    ) => React.ReactElement

    return ((props: Record<string, unknown>, state: unknown) =>
      renderFunction(
        { ...props, ...linkProps },
        state
      )) as ButtonProps['render']
  }

  if (!React.isValidElement(render)) return null

  return React.cloneElement(render as React.ReactElement<any>, linkProps)
}

function routerDestinationToHref(to: ButtonProps['to']): string | undefined {
  if (typeof to === 'string') return to
  if (!to || typeof to !== 'object') return undefined

  const destination = to as {
    hash?: unknown
    pathname?: unknown
    search?: unknown
  }
  const pathname =
    typeof destination.pathname === 'string' ? destination.pathname : ''
  const search =
    typeof destination.search === 'string' ? destination.search : ''
  const hash = typeof destination.hash === 'string' ? destination.hash : ''
  const href = `${pathname}${search}${hash}`

  return href || undefined
}

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      'aria-busy': ariaBusy,
      'aria-label': ariaLabel,
      caption,
      children,
      className,
      color,
      disabled = false,
      download,
      href,
      hrefLang,
      htmlType = 'button',
      icon,
      inheritTextColor = false,
      label,
      loading = false,
      nativeButton,
      notifications,
      onClick,
      ping,
      referrerPolicy,
      rel,
      render,
      secondaryIcon,
      size = 'regular',
      state: _unsupportedState,
      style,
      target,
      to,
      transform = 'none',
      type,
      variant,
      ...internalProps
    },
    ref
  ) => {
    const resolvedLabel = children || label
    const isNotificationButton = typeof notifications === 'number'
    const notificationsActive = isNotificationButton && notifications > 0
    const isIconButton = !resolvedLabel || isNotificationButton
    const isPlainEmptyButton = !resolvedLabel && !icon && !isNotificationButton
    const hasLinkConflict = href !== undefined && to !== undefined

    const visualType = notificationsActive ? 'primary' : type
    const resolvedVariant = visualType
      ? visualTypeMap[visualType]
      : variant ?? visualTypeMap.secondary
    const resolvedSize = resolveInternalSize(size, isIconButton)
    const isLargeButton = size === 'large'
    const usesTextRecipe = type === 'link' || type === 'text'

    const anchorProps = {
      download,
      hrefLang,
      ping,
      referrerPolicy,
      rel,
      target,
    }

    let resolvedRender = render
    let usedRouterRender = false
    let usedBrowserRouterFallback = false
    let rendersLegacyLink = false

    // Legacy Button chose `to` when both destinations were supplied. Preserve
    // that precedence without throwing during render. A missing router render
    // element falls back to normal browser navigation when a URL can be built.
    if (to !== undefined) {
      const routerRender = mergeLinkRender(render, { ...anchorProps, to })

      if (routerRender) {
        resolvedRender = routerRender
        usedRouterRender = true
        rendersLegacyLink = true
      } else {
        const fallbackHref = routerDestinationToHref(to)
        if (fallbackHref !== undefined) {
          resolvedRender = <a {...anchorProps} href={fallbackHref} />
          usedBrowserRouterFallback = true
          rendersLegacyLink = true
        } else {
          resolvedRender = undefined
        }
      }
    } else if (href !== undefined) {
      resolvedRender = mergeLinkRender(render, { ...anchorProps, href }) ?? (
        <a {...anchorProps} href={href} />
      )
      rendersLegacyLink = true
    }

    const notificationBadge = notificationsActive ? (
      <InternalBadge
        aria-hidden="true"
        className="absolute -right-2 -top-2 h-4 min-w-4 rounded-full border-background px-1 text-[10px] leading-none"
        data-test-id="notification-count"
        title={String(notifications)}
        variant="default"
      >
        {notifications > 99 ? '99+' : notifications}
      </InternalBadge>
    ) : null
    const usesLegacyBellFallback =
      isNotificationButton || (size === 'xs' && !resolvedLabel)
    const leadingIconName =
      icon || (usesLegacyBellFallback ? BellIcon : undefined)
    const visualContent = (
      <>
        {leadingIconName
          ? renderLegacyIcon(leadingIconName, 'inline-start', notificationBadge)
          : null}
        {isIconButton ? null : resolvedLabel}
        {!isIconButton && secondaryIcon
          ? renderLegacyIcon(secondaryIcon, 'inline-end')
          : null}
        {isLargeButton ? (
          <span
            className="mt-1 text-xs italic normal-case"
            data-test-id="caption"
          >
            {caption}
          </span>
        ) : null}
      </>
    )
    const resolvedAriaLabel =
      ariaLabel ??
      (isNotificationButton
        ? notificationsActive
          ? `Notifications, ${notifications}`
          : 'Notifications'
        : isPlainEmptyButton
        ? 'Button'
        : undefined)

    return (
      <InternalButton
        {...internalProps}
        ref={ref as React.Ref<HTMLButtonElement>}
        aria-busy={loading ? true : ariaBusy}
        aria-label={resolvedAriaLabel}
        className={cn(
          className,
          usesTextRecipe && textButtonClassName,
          inheritTextColor && inheritTextColorClassName,
          isLargeButton && largeButtonClassName,
          isLargeButton &&
            '[&_[data-test-id=primary-icon]>svg]:mb-2 [&_[data-test-id=primary-icon]>svg]:size-7'
        )}
        data-applique-empty-button={isPlainEmptyButton ? '' : undefined}
        data-applique-link-conflict={hasLinkConflict ? '' : undefined}
        data-applique-router-fallback={
          to !== undefined && !usedRouterRender
            ? usedBrowserRouterFallback
              ? 'browser'
              : 'button'
            : undefined
        }
        data-applique-unresolved-color={color || undefined}
        data-test-id="target"
        disabled={disabled || loading}
        nativeButton={rendersLegacyLink ? false : nativeButton}
        render={resolvedRender}
        size={resolvedSize}
        style={mergeTransformStyle(style, transform)}
        type={
          rendersLegacyLink || nativeButton === false ? undefined : htmlType
        }
        variant={resolvedVariant}
        onClick={(event) => {
          if (disabled || loading) {
            event.preventDefault()
            return
          }

          onClick?.(event)
        }}
      >
        <span
          className={cn(
            'inline-flex items-center justify-center gap-[inherit]',
            isLargeButton && 'flex-col',
            loading &&
              'pointer-events-none opacity-0 [&_[data-test-id=notification-count]]:opacity-0'
          )}
        >
          {visualContent}
        </span>
        {loading ? (
          <InternalSpinner
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            data-test-id="loading"
            focusable="false"
          />
        ) : null}
      </InternalButton>
    )
  }
)

Button.displayName = 'Button'

export { Button }
