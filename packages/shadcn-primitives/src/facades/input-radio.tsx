'use client'

import * as React from 'react'

import {
  RadioGroup as InternalRadioGroup,
  RadioGroupItem as InternalRadioGroupItem,
} from '../radio-group'

type InternalRadioGroupProps = React.ComponentPropsWithoutRef<
  typeof InternalRadioGroup
>
type InternalValueChange = NonNullable<InternalRadioGroupProps['onValueChange']>
type InternalChangeDetails = Parameters<InternalValueChange>[1]

export interface InputRadioOption {
  value: string
  /** Preferred option label. */
  label?: string
  /** Runtime-compatible alias used by older Applique examples. */
  title?: string
}

export interface InputRadioProps
  extends Omit<
    InternalRadioGroupProps,
    'children' | 'defaultValue' | 'onChange' | 'onValueChange' | 'value'
  > {
  /** Options rendered as shadcn radio items. */
  options: readonly InputRadioOption[]
  /** Selected option value. */
  value?: string
  /** Optional shadcn uncontrolled initial value. */
  defaultValue?: string
  /** Preserves the Applique value-only callback. */
  onChange?(value: string): void
  /** Additional shadcn callback; it runs before the Applique callback. */
  onValueChange?(value: string, details: InternalChangeDetails): void
  /** Customizes the content beside each radio control. */
  renderOption?(option: InputRadioOption): React.ReactNode
}

const InputRadio = React.forwardRef<HTMLDivElement, InputRadioProps>(
  (
    {
      defaultValue,
      disabled,
      onChange,
      onValueChange,
      options,
      renderOption,
      value,
      ...internalProps
    },
    ref
  ) => {
    const generatedId = React.useId()
    const usesPrimitiveUncontrolledState = React.useRef(
      value === undefined &&
        (defaultValue !== undefined ||
          (onChange === undefined && onValueChange !== undefined))
    ).current
    const resolvedValue = usesPrimitiveUncontrolledState
      ? undefined
      : value !== undefined
      ? value
      : null

    return (
      <InternalRadioGroup
        data-test-id="group"
        {...internalProps}
        ref={ref}
        defaultValue={usesPrimitiveUncontrolledState ? defaultValue : undefined}
        disabled={disabled}
        value={resolvedValue}
        onValueChange={(nextValue, details) => {
          onValueChange?.(String(nextValue), details)
          if (!details.isCanceled) onChange?.(String(nextValue))
        }}
      >
        {options.map((option, index) => {
          const label = option.label || option.title || ''
          const optionId = `${generatedId}-${index}`
          const compatibilityOption = {
            ...option,
            label,
            title: option.title || label,
          }

          return (
            <label
              className="flex cursor-pointer items-center gap-2 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
              htmlFor={optionId}
              key={option.value}
            >
              <InternalRadioGroupItem
                data-test-id={option.value}
                id={optionId}
                value={option.value}
              />
              <span>
                {renderOption
                  ? renderOption(compatibilityOption)
                  : compatibilityOption.label}
              </span>
            </label>
          )
        })}
      </InternalRadioGroup>
    )
  }
)

InputRadio.displayName = 'InputRadio'

export { InputRadio }
