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

import { Textarea } from '../textarea'
import { cn } from '../utils'

type NativeTextareaProps = React.ComponentPropsWithoutRef<'textarea'>
type IconName =
  | string
  | React.ReactNode
  | React.ComponentType<any>
  | React.ExoticComponent<any>

export interface InputTextAreaFieldContext {
  error?: boolean
  disabled?: boolean
}

export interface InputTextAreaProps
  extends Omit<
    NativeTextareaProps,
    'children' | 'className' | 'onChange' | 'value'
  > {
  /** Preserves the legacy class target on the outer container. */
  className?: string
  /** Current controlled value. Missing values remain controlled as an empty string. */
  value?: string
  /** Receives the string value instead of the browser change event. */
  onChange?(value: string): void
  /** Disables resizing of the outer legacy-compatible container. */
  noResize?: boolean
  /** Optional leading legacy icon. */
  icon?: IconName
  /** Private compatibility channel populated by the legacy Field component. */
  __fieldContext?: InputTextAreaFieldContext
  /** Explicit invalid state, combined with Field context. */
  error?: boolean
  /** Legacy visual treatment. */
  variant?: 'bordered' | 'standard'
}

const wrapperVariantClassName = {
  bordered:
    'rounded-xs border border-input bg-background p-2 hover:border-ring/40 focus-within:border-ring',
  standard:
    'rounded-none border-x-0 border-t-0 border-b border-input bg-background px-2 pt-2 pb-1 pl-0 hover:border-ring/40 focus-within:border-ring',
} as const

const textareaCompatibilityClassName =
  'min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent p-0 shadow-none focus-visible:border-transparent focus-visible:ring-0 disabled:bg-transparent disabled:opacity-100 applique-dark:bg-transparent applique-dark:disabled:bg-transparent'

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
      `[Applique InputTextArea] Unknown legacy icon "${name}". Rendering the fallback icon.`
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
      className="mt-1 mr-2 inline-flex shrink-0 [&>svg]:size-4"
      data-test-id="icon"
    >
      {icon}
    </span>
  )
}

const InputTextArea = React.forwardRef<HTMLTextAreaElement, InputTextAreaProps>(
  (props, ref) => {
    // `adornmentPosition` was destructured and ignored by the legacy runtime,
    // despite never being part of its declared Props interface. Reading it here
    // keeps JavaScript call sites from leaking it onto the DOM without adding a
    // new public TypeScript prop.
    const {
      __fieldContext = {},
      className,
      defaultValue,
      disabled,
      error = false,
      icon,
      noResize = false,
      onChange,
      rows = 1,
      value,
      variant = 'bordered',
      adornmentPosition: _adornmentPosition,
      ...nativeProps
    } = props as InputTextAreaProps & { adornmentPosition?: unknown }

    const resolvedDisabled = Boolean(disabled || __fieldContext.disabled)
    const resolvedError = Boolean(error || __fieldContext.error)
    const usesNativeDefaultValue =
      value === undefined && defaultValue !== undefined

    return (
      <div
        className={cn(
          className,
          'relative flex overflow-auto',
          wrapperVariantClassName[variant],
          resolvedError && 'border-destructive',
          resolvedDisabled && 'text-muted-foreground',
          resolvedDisabled || noResize ? 'resize-none' : 'resize-y'
        )}
        data-applique-input-text-area=""
        data-disabled={resolvedDisabled ? '' : undefined}
        data-filled={typeof value === 'string' && value ? '' : undefined}
        data-invalid={resolvedError ? '' : undefined}
        data-variant={variant}
      >
        {icon ? renderIcon(icon) : null}
        <Textarea
          {...nativeProps}
          ref={ref}
          aria-invalid={resolvedError || nativeProps['aria-invalid']}
          className={textareaCompatibilityClassName}
          defaultValue={usesNativeDefaultValue ? defaultValue : undefined}
          disabled={resolvedDisabled}
          rows={rows}
          value={
            usesNativeDefaultValue
              ? undefined
              : typeof value === 'string'
              ? value
              : ''
          }
          onChange={(event) => onChange?.(event.currentTarget.value)}
        />
      </div>
    )
  }
)

InputTextArea.displayName = 'InputTextArea'

export { InputTextArea }
