'use client'

import * as React from 'react'

import {
  Field as InternalField,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '../field'
import { cn } from '../utils'

type InternalFieldProps = React.ComponentPropsWithoutRef<typeof InternalField>

export interface FieldContext {
  error?: boolean
  disabled?: boolean
}

export interface FieldProps
  extends Omit<InternalFieldProps, 'children' | 'title'> {
  /** The visible label for the wrapped control. */
  title?: React.ReactNode
  /** Supporting text rendered when neither error nor success is present. */
  description?: React.ReactNode
  /** Invalid state or error content. Arrays retain the legacy joined output. */
  error?: React.ReactNode | boolean
  /** Adds the legacy required marker beside the title. */
  required?: boolean
  /** Applies disabled styling and passes disabled context to compatible children. */
  disabled?: boolean
  /** Optional element rendered beside the title. */
  fieldInfo?: React.ReactNode
  /** Success content rendered when no error is present. */
  success?: React.ReactNode
  /** Legacy no-op retained while its intended UI is reviewed. */
  info?: boolean
  /** Associates the generated label and metadata with a child control. */
  htmlFor?: string
  children?: React.ReactNode
}

type FieldCompatibleChildProps = {
  __fieldContext?: FieldContext
  disabled?: boolean
  error?: boolean
}

const compoundFieldParts = new Set<React.ElementType>([
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
])

function metadataContent(value: React.ReactNode | boolean): React.ReactNode {
  return Array.isArray(value) ? value.join(' ') : value
}

function childWithFieldContext(
  child: React.ReactNode,
  context: FieldContext
): React.ReactNode {
  if (!React.isValidElement<FieldCompatibleChildProps>(child)) return child
  if (
    typeof child.type === 'string' ||
    child.type === React.Fragment ||
    compoundFieldParts.has(child.type as React.ElementType)
  ) {
    return child
  }

  return React.cloneElement(child, {
    __fieldContext: {
      disabled: Boolean(
        context.disabled ||
          child.props.disabled ||
          child.props.__fieldContext?.disabled
      ),
      error: Boolean(
        context.error || child.props.error || child.props.__fieldContext?.error
      ),
    },
  })
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  (
    {
      children,
      className,
      description,
      disabled = false,
      error = false,
      fieldInfo,
      htmlFor,
      info: _info,
      required = false,
      success,
      title,
      ...internalProps
    },
    ref
  ) => {
    const hasError = Boolean(error)
    const labelId = htmlFor ? `${htmlFor}__label` : undefined
    const errorId = htmlFor ? `${htmlFor}__error` : undefined
    const successId = htmlFor ? `${htmlFor}__success` : undefined
    const descriptionId = htmlFor ? `${htmlFor}__description` : undefined
    const context = { disabled, error: hasError }
    const hasLegacyLabel =
      title !== undefined || required || React.isValidElement(fieldInfo)

    return (
      <InternalField
        {...internalProps}
        ref={ref}
        className={cn(
          className,
          'gap-1.5',
          disabled && 'text-muted-foreground'
        )}
        data-applique-field=""
        data-disabled={disabled ? 'true' : undefined}
        data-invalid={hasError ? 'true' : undefined}
      >
        {hasLegacyLabel ? (
          <FieldLabel
            className={cn(
              'w-full justify-between text-sm font-medium',
              hasError && 'text-destructive'
            )}
            htmlFor={htmlFor}
            id={labelId}
          >
            <span>
              {title}
              {required ? (
                <span
                  aria-hidden="true"
                  className="ml-0.5 text-destructive"
                  data-applique-field-required=""
                >
                  *
                </span>
              ) : null}
            </span>
            {React.isValidElement(fieldInfo) ? fieldInfo : null}
          </FieldLabel>
        ) : null}

        {React.Children.map(children, (child) =>
          childWithFieldContext(child, context)
        )}

        {hasError ? (
          <FieldError id={errorId}>{metadataContent(error)}</FieldError>
        ) : success ? (
          <FieldDescription
            className="text-[var(--applique-success-foreground)]"
            data-applique-field-success=""
            id={successId}
          >
            {success}
          </FieldDescription>
        ) : description ? (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        ) : null}
      </InternalField>
    )
  }
)

Field.displayName = 'Field'

export interface WithFieldProps {
  label?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode | boolean
  required?: boolean
}

/** Legacy helper retained for clients that wrap a control as a Field. */
export function withField<P extends object>(
  BaseComponent: React.ComponentType<P>
) {
  let counter = 0

  return class InputField extends React.PureComponent<P & WithFieldProps> {
    readonly generatedId = `__uikit_field_${++counter}_`

    render() {
      const {
        description,
        error,
        label,
        required,
        ...componentProps
      } = this.props
      const props = componentProps as P & { id?: string }
      const id = props.id || this.generatedId

      return (
        <Field
          description={description}
          error={error}
          htmlFor={id}
          required={required}
          title={label}
        >
          <BaseComponent
            {...(props as P)}
            {...({
              'aria-describedby': `${id}__description ${id}__error`,
              'aria-labelledby': `${id}__label`,
              id,
              required,
            } as Record<string, unknown>)}
          />
        </Field>
      )
    }
  }
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
}
