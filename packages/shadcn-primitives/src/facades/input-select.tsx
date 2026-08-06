'use client'

import * as React from 'react'

import {
  Combobox as InternalCombobox,
  ComboboxChip as InternalComboboxChip,
  ComboboxChips as InternalComboboxChips,
  ComboboxChipsInput as InternalComboboxChipsInput,
  ComboboxContent as InternalComboboxContent,
  ComboboxEmpty as InternalComboboxEmpty,
  ComboboxInput as InternalComboboxInput,
  ComboboxItem as InternalComboboxItem,
  ComboboxList as InternalComboboxList,
  ComboboxValue as InternalComboboxValue,
} from '../combobox'
import {
  Field as InternalField,
  FieldDescription as InternalFieldDescription,
  FieldError as InternalFieldError,
  FieldLabel as InternalFieldLabel,
} from '../field'
import { Spinner as InternalSpinner } from '../spinner'

type NativeInputProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  | 'children'
  | 'className'
  | 'defaultValue'
  | 'disabled'
  | 'id'
  | 'multiple'
  | 'name'
  | 'onChange'
  | 'placeholder'
  | 'readOnly'
  | 'required'
  | 'value'
>

export type InputSelectValue = string | number

export interface InputSelectOption {
  [key: string]: unknown
  label?: string | number
  value?: InputSelectValue
}

export interface InputSelectProps extends NativeInputProps {
  /** Options use label/value by default; labelKey and valueKey customize them. */
  options?: readonly InputSelectOption[]
  /** A primitive selected value, or an array of primitive values for multiple. */
  value?: InputSelectValue | readonly InputSelectValue[] | null
  /** Preserves the Applique value-only callback instead of exposing option objects. */
  onChange?(value: InputSelectValue | InputSelectValue[] | null): void
  /** Enables multiple selection. */
  multiple?: boolean
  /** Empty-state text shown in the input. */
  placeholder?: string
  /** Enables local text filtering. */
  searchable?: boolean
  /** Receives the current search text. */
  onSearch?(text: string): void
  /** Replaces the trigger affordance with an accessible loading indicator. */
  isLoading?: boolean
  /** Applies invalid styling and optionally renders the error message. */
  error?: React.ReactNode | boolean
  /** Optional visible field label. Use aria-label when the design hides labels. */
  label?: React.ReactNode
  /** Optional help text, hidden while an error is displayed. */
  description?: React.ReactNode
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
  id?: string
  /** Applies to the composed field root. */
  className?: string
  /** Property containing the text or number used to render and search an option. */
  labelKey?: string
  /** Property used for controlled values and callbacks. */
  valueKey?: string
}

function readOptionValue(
  option: InputSelectOption,
  valueKey: string
): InputSelectValue {
  const value = option[valueKey]
  return typeof value === 'number' || typeof value === 'string'
    ? value
    : String(value ?? '')
}

function readOptionLabel(
  option: InputSelectOption,
  labelKey: string
): string {
  const label = option[labelKey]
  return typeof label === 'string' || typeof label === 'number'
    ? String(label)
    : ''
}

const InputSelect = React.forwardRef<HTMLInputElement, InputSelectProps>(
  (
    {
      className,
      description,
      disabled = false,
      error = false,
      id,
      isLoading = false,
      label,
      labelKey = 'label',
      multiple = false,
      name,
      onChange,
      onSearch,
      options = [],
      placeholder = 'Select...',
      readOnly = false,
      required = false,
      searchable = true,
      value,
      valueKey = 'value',
      ...inputProps
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id || `${generatedId}-input`
    const descriptionId = `${inputId}-description`
    const errorId = `${inputId}-error`
    const hasError = Boolean(error)
    const describedBy = [
      inputProps['aria-describedby'],
      hasError ? errorId : description ? descriptionId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined
    const selectedValues = React.useMemo<readonly InputSelectValue[]>(() => {
      if (Array.isArray(value)) return value
      return value === null || value === undefined ? [] : [value]
    }, [value])
    const selectedOptions = React.useMemo(
      () =>
        selectedValues
          .map((selectedValue) =>
            options.find((option) =>
              Object.is(readOptionValue(option, valueKey), selectedValue)
            )
          )
          .filter((option): option is InputSelectOption => Boolean(option)),
      [options, selectedValues, valueKey]
    )
    const selectedOption = multiple ? null : selectedOptions[0] || null
    const anchor = React.useRef<HTMLDivElement | null>(null)

    const commonRootProps = {
      autoHighlight: true as const,
      disabled,
      filter: searchable ? undefined : null,
      isItemEqualToValue: (
        option: InputSelectOption,
        selected: InputSelectOption
      ) =>
        Object.is(
          readOptionValue(option, valueKey),
          readOptionValue(selected, valueKey)
        ),
      itemToStringLabel: (option: InputSelectOption) =>
        readOptionLabel(option, labelKey),
      itemToStringValue: (option: InputSelectOption) =>
        String(readOptionValue(option, valueKey)),
      items: options,
      name,
      onInputValueChange: (nextSearch: string) => {
        if (searchable) onSearch?.(nextSearch)
      },
      readOnly,
      required,
    }

    const popup = (popupAnchor?: React.RefObject<HTMLDivElement | null>) => (
      <InternalComboboxContent anchor={popupAnchor}>
        <InternalComboboxEmpty>No results found.</InternalComboboxEmpty>
        <InternalComboboxList>
          {(option: InputSelectOption, index: number) => (
            <InternalComboboxItem
              key={`${String(readOptionValue(option, valueKey))}-${index}`}
              value={option}
            >
              {readOptionLabel(option, labelKey)}
            </InternalComboboxItem>
          )}
        </InternalComboboxList>
      </InternalComboboxContent>
    )

    const commonInputProps = {
      ...inputProps,
      'aria-busy': isLoading || inputProps['aria-busy'] || undefined,
      'aria-describedby': describedBy,
      'aria-invalid': hasError || inputProps['aria-invalid'] || undefined,
      'aria-required': required || inputProps['aria-required'] || undefined,
      disabled,
      id: inputId,
      placeholder,
      readOnly: readOnly || !searchable,
    }

    return (
      <InternalField
        className={className}
        data-disabled={disabled ? 'true' : undefined}
        data-invalid={hasError ? 'true' : undefined}
      >
        {label === undefined ? null : (
          <InternalFieldLabel htmlFor={inputId}>{label}</InternalFieldLabel>
        )}

        {multiple ? (
          <InternalCombobox<InputSelectOption, true>
            {...commonRootProps}
            multiple
            value={selectedOptions}
            onValueChange={(nextOptions) => {
              const nextValues = nextOptions.map((option) =>
                readOptionValue(option, valueKey)
              )
              onChange?.(nextValues)
            }}
          >
            <InternalComboboxChips ref={anchor}>
              <InternalComboboxValue>
                {(nextOptions: InputSelectOption[]) => (
                  <React.Fragment>
                    {nextOptions.map((option) => (
                      <InternalComboboxChip
                        key={String(readOptionValue(option, valueKey))}
                      >
                        {readOptionLabel(option, labelKey)}
                      </InternalComboboxChip>
                    ))}
                    <InternalComboboxChipsInput
                      {...commonInputProps}
                      ref={ref}
                    />
                    {isLoading ? <InternalSpinner className="ml-auto" /> : null}
                  </React.Fragment>
                )}
              </InternalComboboxValue>
            </InternalComboboxChips>
            {popup(anchor)}
          </InternalCombobox>
        ) : (
          <InternalCombobox<InputSelectOption>
            {...commonRootProps}
            value={selectedOption}
            onValueChange={(nextOption) =>
              onChange?.(
                nextOption === null
                  ? null
                  : readOptionValue(nextOption, valueKey)
              )
            }
          >
            <InternalComboboxInput
              {...commonInputProps}
              ref={ref}
              showClear={!isLoading && !required && selectedOption !== null}
              showTrigger={!isLoading}
            >
              {isLoading ? <InternalSpinner className="mr-2" /> : null}
            </InternalComboboxInput>
            {popup()}
          </InternalCombobox>
        )}

        {hasError && error !== true ? (
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

InputSelect.displayName = 'InputSelect'

export { InputSelect }
