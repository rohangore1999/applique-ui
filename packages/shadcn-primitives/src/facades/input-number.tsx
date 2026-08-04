'use client'

import * as React from 'react'

import { Input } from '../input'

type NativeInputProps = React.ComponentPropsWithoutRef<'input'>

export interface InputNumberProps
  extends Omit<
    NativeInputProps,
    'children' | 'defaultValue' | 'onChange' | 'type' | 'value'
  > {
  /** Keeps the existing Applique numeric-input contract. */
  type?: 'number'
  /** Current value. Invalid numeric strings are displayed as an empty value. */
  value?: string | number
  /** Receives the parsed number instead of the browser change event. */
  onChange?(value: number): void
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ onChange, type: _type, value, ...primitiveProps }, ref) => {
    const parsedValue = Number.parseFloat(String(value))

    return (
      <Input
        {...primitiveProps}
        ref={ref}
        type="number"
        value={Number.isNaN(parsedValue) ? '' : value}
        onChange={(event) =>
          onChange?.(Number.parseFloat(event.currentTarget.value))
        }
      />
    )
  }
)

InputNumber.displayName = 'InputNumber'

export { InputNumber }
