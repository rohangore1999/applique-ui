import * as React from 'react'
import { cn } from '../../src/utils'

export function ExampleWrapper({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="catalog-example-wrapper"
      className={cn(
        'grid w-full min-w-0 items-start gap-6 xl:grid-cols-2',
        className
      )}
      {...props}
    />
  )
}

export function Example({
  title,
  children,
  className,
  containerClassName,
  ...props
}: React.ComponentProps<'section'> & {
  title?: string
  containerClassName?: string
}) {
  return (
    <section
      data-slot="catalog-example"
      className={cn(
        'flex min-w-0 flex-col gap-2 self-stretch',
        containerClassName
      )}
      {...props}
    >
      {title ? (
        <h3 className="m-0 px-1 text-xs font-medium text-muted-foreground">
          {title}
        </h3>
      ) : null}
      <div
        data-slot="catalog-example-content"
        className={cn(
          'flex min-h-36 min-w-0 flex-1 flex-col items-start gap-6 overflow-x-auto rounded-lg border border-border bg-card p-6 text-card-foreground *:[div:not([class*=w-)]:w-full',
          className
        )}
      >
        {children}
      </div>
    </section>
  )
}
