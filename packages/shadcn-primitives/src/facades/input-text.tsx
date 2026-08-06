'use client'

import * as React from 'react'

import { Input as InternalInput } from '../input'

type NativeInputProps = React.ComponentPropsWithoutRef<'input'>

export interface InputTextProps
  extends Omit<
    NativeInputProps,
    'children' | 'defaultValue' | 'onChange' | 'type' | 'value'
  > {
  /** Sets the text format for the field. */
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search'
  /** Current value of the text field. Non-string values render as empty. */
  value?: string
  /** Receives the string value instead of the browser change event. */
  onChange?(value: string): void
  /** Invalid state supplied directly or by the public Field facade. */
  error?: React.ReactNode | boolean
  /** Legacy Field state injected into compatible child controls. */
  __fieldContext?: {
    disabled?: boolean
    error?: boolean
  }
}

const InputText = React.forwardRef<HTMLInputElement, InputTextProps>(
  (
    {
      __fieldContext = {},
      'aria-invalid': ariaInvalid,
      disabled = false,
      error = false,
      onChange,
      placeholder = ' ',
      type = 'text',
      value,
      ...nativeProps
    },
    ref
  ) => {
    const resolvedDisabled = Boolean(disabled || __fieldContext.disabled)
    const resolvedError = Boolean(error || __fieldContext.error)

    return (
      <InternalInput
        {...nativeProps}
        ref={ref}
        aria-invalid={resolvedError || ariaInvalid || undefined}
        disabled={resolvedDisabled}
        onChange={(event) => onChange?.(event.currentTarget.value)}
        placeholder={placeholder}
        type={type}
        value={typeof value === 'string' ? value : ''}
      />
    )
  }
)

InputText.displayName = 'InputText'

export { InputText }
