'use client'

import * as React from 'react'
import {
  format as formatDate,
  isValid,
  parse as parseDate,
} from 'date-fns'
import { CalendarIcon, XIcon } from 'lucide-react'

import { Button as InternalButton } from '../button'
import { Calendar as InternalCalendar } from '../calendar'
import {
  Field as InternalField,
  FieldDescription as InternalFieldDescription,
  FieldError as InternalFieldError,
  FieldLabel as InternalFieldLabel,
} from '../field'
import {
  Popover as InternalPopover,
  PopoverContent as InternalPopoverContent,
  PopoverTrigger as InternalPopoverTrigger,
} from '../popover'
import { cn } from '../utils'

const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd'

export type InputDateValue = Date | string

export interface InputDateRange {
  from?: InputDateValue
  to?: InputDateValue
}

type NormalizedDateRange = {
  from: Date | undefined
  to?: Date
}

type CompleteDateRange = {
  from: Date
  to: Date
}

export interface InputDateProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'children' | 'defaultValue' | 'onChange'
  > {
  /** Current single date or date range. String values are parsed with format. */
  value?: InputDateValue | InputDateRange | null
  /** Receives a single date immediately or a completed, ordered date range. */
  onChange?(value: InputDateValue | InputDateRange | null): void
  /** Enables two-step date-range selection. */
  range?: boolean
  /** Parses string values and serializes callback values. */
  format?: string
  /** Formats the value shown in the trigger without changing callback output. */
  displayFormat?: string
  /** Field label associated with the date trigger. */
  label?: React.ReactNode
  /** Supporting field text, hidden while an error is present. */
  description?: React.ReactNode
  /** Invalid state or error content. */
  error?: React.ReactNode | boolean
  /**
   * Identifies the trigger for legacy integrations. Date values remain
   * controlled through value/onChange and are not added to native FormData.
   */
  name?: string
  /** Marks the field as required for styling and accessibility. */
  required?: boolean
  /** Disables the trigger and prevents the popover from opening. */
  disabled?: boolean
  /** Number of Calendar month panels. Defaults to one, or two for ranges. */
  monthsToDisplay?: number
  /** Class applied to Popover content. */
  wrapperClassName?: string
}

function isRangeValue(
  value: InputDateProps['value']
): value is InputDateRange {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      ('from' in value || 'to' in value)
  )
}

function normalizeDate(
  value: InputDateValue | null | undefined,
  valueFormat?: string
): Date | undefined {
  if (value instanceof Date) {
    return isValid(value) ? value : undefined
  }

  if (typeof value !== 'string' || value.length === 0) {
    return undefined
  }

  const parsedValue = parseDate(
    value,
    valueFormat ?? DEFAULT_DATE_FORMAT,
    new Date()
  )

  return isValid(parsedValue) ? parsedValue : undefined
}

function normalizeRange(
  value: InputDateProps['value'],
  valueFormat?: string
): NormalizedDateRange | undefined {
  if (!isRangeValue(value)) {
    return undefined
  }

  const from = normalizeDate(value.from, valueFormat)
  const to = normalizeDate(value.to, valueFormat)

  return from || to ? { from, to } : undefined
}

function serializeDate(date: Date, valueFormat?: string): InputDateValue {
  return valueFormat ? formatDate(date, valueFormat) : date
}

function serializeRange(
  range: CompleteDateRange,
  valueFormat?: string
): InputDateRange {
  return {
    from: serializeDate(range.from, valueFormat),
    to: serializeDate(range.to, valueFormat),
  }
}

function orderedRange(from: Date, to: Date): CompleteDateRange {
  return from.getTime() <= to.getTime()
    ? { from, to }
    : { from: to, to: from }
}

function describedBy(
  description: React.ReactNode,
  error: React.ReactNode | boolean,
  descriptionId: string,
  errorId: string
) {
  if (error) return errorId
  if (description) return descriptionId
  return undefined
}

const InputDate = React.forwardRef<HTMLDivElement, InputDateProps>(
  (
    {
      className,
      description,
      disabled = false,
      displayFormat,
      error = false,
      format,
      id,
      label,
      monthsToDisplay,
      name,
      onChange,
      range = false,
      required = false,
      value,
      wrapperClassName,
      ...rootProps
    },
    ref
  ) => {
    const generatedId = React.useId()
    const triggerId = id ?? `applique-input-date-${generatedId}`
    const descriptionId = `${triggerId}__description`
    const errorId = `${triggerId}__error`
    const resolvedDisplayFormat =
      displayFormat ?? format ?? DEFAULT_DATE_FORMAT
    const normalizedSingleValue = range
      ? undefined
      : normalizeDate(
          value instanceof Date || typeof value === 'string' ? value : undefined,
          format
        )
    const normalizedRangeValue = range
      ? normalizeRange(value, format)
      : undefined
    const [open, setOpen] = React.useState(false)
    const [draftRange, setDraftRange] =
      React.useState<NormalizedDateRange>()
    const [awaitingRangeEnd, setAwaitingRangeEnd] = React.useState(false)

    const handleOpenChange = React.useCallback(
      (nextOpen: boolean) => {
        if (disabled && nextOpen) return

        if (nextOpen && range) {
          const nextDraft = normalizeRange(value, format)
          setDraftRange(nextDraft)
          setAwaitingRangeEnd(Boolean(nextDraft?.from && !nextDraft.to))
        }

        if (!nextOpen) {
          setAwaitingRangeEnd(false)
        }

        setOpen(nextOpen)
      },
      [disabled, format, range, value]
    )

    const handleSingleSelect = React.useCallback(
      (selectedDate: Date | undefined) => {
        if (!selectedDate || disabled) return

        onChange?.(serializeDate(selectedDate, format))
        setOpen(false)
      },
      [disabled, format, onChange]
    )

    const handleClear = React.useCallback(() => {
      if (disabled || required) return

      setDraftRange(undefined)
      setAwaitingRangeEnd(false)
      setOpen(false)
      onChange?.(null)
    }, [disabled, onChange, required])

    const handleRangeSelect = React.useCallback(
      (
        _selectedRange: NormalizedDateRange | undefined,
        triggerDate: Date
      ) => {
        if (disabled || !triggerDate) return

        if (!awaitingRangeEnd || !draftRange?.from) {
          setDraftRange({ from: triggerDate })
          setAwaitingRangeEnd(true)
          return
        }

        const completeRange = orderedRange(draftRange.from, triggerDate)
        setDraftRange(completeRange)
        setAwaitingRangeEnd(false)
        onChange?.(serializeRange(completeRange, format))
        setOpen(false)
      },
      [awaitingRangeEnd, disabled, draftRange, format, onChange]
    )

    const selectedRange = open ? draftRange : normalizedRangeValue
    const displaySingleValue = normalizedSingleValue
      ? formatDate(normalizedSingleValue, resolvedDisplayFormat)
      : ''
    const displayRangeValue = selectedRange
      ? [selectedRange.from, selectedRange.to]
          .map((date) =>
            date ? formatDate(date, resolvedDisplayFormat) : ''
          )
          .filter(Boolean)
          .join(' – ')
      : ''
    const displayValue = range ? displayRangeValue : displaySingleValue
    const placeholder = range
      ? `${resolvedDisplayFormat.toUpperCase()} – ${resolvedDisplayFormat.toUpperCase()}`
      : resolvedDisplayFormat.toUpperCase()
    const ariaDescribedBy = describedBy(
      description,
      error,
      descriptionId,
      errorId
    )

    return (
      <InternalField
        {...rootProps}
        ref={ref}
        className={cn(className)}
        data-applique-input-date=""
        data-disabled={disabled || undefined}
        data-invalid={Boolean(error) || undefined}
      >
        {label ? (
          <InternalFieldLabel htmlFor={triggerId}>
            {label}
            {required ? <span aria-hidden="true">*</span> : null}
          </InternalFieldLabel>
        ) : null}

        <div className="relative">
          <InternalPopover open={open} onOpenChange={handleOpenChange}>
            <InternalPopoverTrigger
              render={
                <InternalButton
                  id={triggerId}
                  name={name}
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  aria-describedby={ariaDescribedBy}
                  aria-invalid={Boolean(error) || undefined}
                  aria-required={required || undefined}
                  className={cn(
                    'w-full justify-start pr-9 text-left font-normal',
                    !displayValue && 'text-muted-foreground'
                  )}
                  data-applique-input-date-trigger=""
                />
              }
            >
              <CalendarIcon aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{displayValue || placeholder}</span>
            </InternalPopoverTrigger>

            <InternalPopoverContent
              align="start"
              className={cn('w-auto p-0', wrapperClassName)}
            >
              {range ? (
                <InternalCalendar
                  mode="range"
                  numberOfMonths={monthsToDisplay ?? 2}
                  selected={selectedRange}
                  defaultMonth={selectedRange?.from ?? selectedRange?.to}
                  onSelect={handleRangeSelect}
                  resetOnSelect
                />
              ) : (
                <InternalCalendar
                  mode="single"
                  numberOfMonths={monthsToDisplay ?? 1}
                  selected={normalizedSingleValue}
                  defaultMonth={normalizedSingleValue}
                  onSelect={handleSingleSelect}
                />
              )}
            </InternalPopoverContent>
          </InternalPopover>

          {displayValue && !disabled && !required ? (
            <InternalButton
              aria-label={`Clear ${typeof label === 'string' ? label : 'date'}`}
              className="absolute top-1/2 right-1 -translate-y-1/2"
              data-applique-input-date-clear=""
              onClick={handleClear}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <XIcon aria-hidden="true" />
            </InternalButton>
          ) : null}
        </div>

        {error ? (
          <InternalFieldError id={errorId}>{error}</InternalFieldError>
        ) : description ? (
          <InternalFieldDescription id={descriptionId}>
            {description}
          </InternalFieldDescription>
        ) : null}
      </InternalField>
    )
  }
)

InputDate.displayName = 'InputDate'

export { InputDate }
