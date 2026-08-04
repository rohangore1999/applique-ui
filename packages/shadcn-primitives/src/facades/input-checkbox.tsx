'use client'

import * as React from 'react'

import { Checkbox as InternalCheckbox } from '../checkbox'

type InternalCheckboxProps = React.ComponentPropsWithoutRef<
  typeof InternalCheckbox
>

export interface InputCheckboxProps
  extends Omit<
    InternalCheckboxProps,
    'children' | 'className' | 'title' | 'value'
  > {
  /** Applique controlled checked state. It takes precedence over checked. */
  value?: boolean
  /** Preserves the Applique boolean-only callback. */
  onChange?(value: boolean): void
  /** Maps to the hidden checkbox input's form value. */
  htmlValue?: string
  /** Content rendered beside the checkbox. */
  title?: React.ReactNode
  /** Renders a dash instead of a tick for the checked visual state. */
  boxtype?: string
  /** Preserves the legacy class target on the outer label. */
  className?: string
}

const dashboxClassName =
  '[&_[data-slot=checkbox-indicator]>svg]:hidden [&_[data-slot=checkbox-indicator]]:before:h-0.5 [&_[data-slot=checkbox-indicator]]:before:w-2.5 [&_[data-slot=checkbox-indicator]]:before:rounded-full [&_[data-slot=checkbox-indicator]]:before:bg-current'

const InputCheckbox = React.forwardRef<HTMLElement, InputCheckboxProps>(
  (
    {
      boxtype = 'checkbox',
      checked,
      className,
      defaultChecked,
      disabled,
      htmlValue,
      onChange,
      onCheckedChange,
      readOnly,
      title,
      value,
      ...internalProps
    },
    ref
  ) => {
    const usesPrimitiveUncontrolledState = React.useRef(
      value === undefined &&
        checked === undefined &&
        (defaultChecked !== undefined ||
          (onChange === undefined && onCheckedChange !== undefined))
    ).current
    const resolvedChecked = usesPrimitiveUncontrolledState
      ? undefined
      : value !== undefined
      ? value
      : checked !== undefined
      ? checked
      : false
    const resolvedReadOnly = Boolean(
      readOnly ||
        (!usesPrimitiveUncontrolledState && !onChange && !onCheckedChange)
    )

    return (
      <label
        className={[
          'inline-flex items-center gap-2',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        data-applique-checkbox=""
        data-disabled={disabled ? '' : undefined}
      >
        <InternalCheckbox
          {...internalProps}
          ref={ref}
          checked={resolvedChecked}
          className={boxtype === 'dashbox' ? dashboxClassName : undefined}
          data-applique-boxtype={boxtype}
          defaultChecked={
            usesPrimitiveUncontrolledState ? defaultChecked : undefined
          }
          disabled={disabled}
          readOnly={resolvedReadOnly}
          value={htmlValue}
          onCheckedChange={(nextChecked, details) => {
            onCheckedChange?.(nextChecked, details)
            if (!details.isCanceled) onChange?.(nextChecked)
          }}
        />
        {title === undefined ? null : <span>{title}</span>}
      </label>
    )
  }
)

InputCheckbox.displayName = 'InputCheckbox'

export { InputCheckbox }
