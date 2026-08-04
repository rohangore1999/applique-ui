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
}

const InputText = React.forwardRef<HTMLInputElement, InputTextProps>(
  (
    { onChange, placeholder = ' ', type = 'text', value, ...nativeProps },
    ref
  ) => (
    <InternalInput
      {...nativeProps}
      ref={ref}
      onChange={(event) => onChange?.(event.currentTarget.value)}
      placeholder={placeholder}
      type={type}
      value={typeof value === 'string' ? value : ''}
    />
  )
)

InputText.displayName = 'InputText'

export { InputText }
