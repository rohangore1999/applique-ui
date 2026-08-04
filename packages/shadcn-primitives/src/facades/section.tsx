'use client'

import * as React from 'react'

import {
  Card as InternalCard,
  CardAction as InternalCardAction,
  CardContent as InternalCardContent,
  CardHeader as InternalCardHeader,
  CardTitle as InternalCardTitle,
} from '../card'
import { cn } from '../utils'
import { Button, ButtonProps } from './button'

type InternalCardProps = React.ComponentPropsWithoutRef<typeof InternalCard>
type NativeSectionProps = React.ComponentPropsWithoutRef<'section'>
type ButtonChild = React.ReactElement<ButtonProps>

export interface SectionProps
  extends Omit<NativeSectionProps, 'children' | 'title'> {
  /** Legacy heading content. Runtime-compatible because an absent title is valid. */
  title?: string
  /** Removes horizontal padding while retaining the section's vertical rhythm. */
  noPadding?: boolean
  /** Direct Applique Button children become header actions; other content stays in the body. */
  children?: React.ReactNode
  /** Non-conflicting shadcn Card density extension. */
  size?: InternalCardProps['size']
}

function isAppliqueButton(node: React.ReactNode): node is ButtonChild {
  if (!React.isValidElement(node)) return false
  if (node.type === Button) return true

  const nodeType = node.type as unknown

  // Retain the legacy lazy-component compatibility without classifying raw
  // shadcn buttons as Section actions.
  return (
    typeof nodeType === 'object' &&
    nodeType !== null &&
    '_result' in nodeType &&
    (nodeType as { _result?: unknown })._result === Button
  )
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      children,
      className,
      noPadding = false,
      size = 'default',
      title,
      ...sectionProps
    },
    ref
  ) => {
    const actions: ButtonChild[] = []
    const content: React.ReactNode[] = []

    React.Children.forEach(children, (child) => {
      if (isAppliqueButton(child)) {
        actions.push(child)
      } else if (child) {
        content.push(child)
      }
    })

    const hasHeader = Boolean(title || actions.length)

    return (
      <section
        {...sectionProps}
        ref={ref}
        className={cn(className, 'flex flex-[1_1_100%]')}
      >
        <InternalCard
          className="min-w-0 flex-1 gap-4 overflow-visible rounded-none py-4 ring-0 [--card-spacing:--spacing(6)] data-[size=sm]:gap-3 data-[size=sm]:py-3"
          size={size}
        >
          {hasHeader ? (
            <InternalCardHeader className={cn(noPadding && 'px-0')}>
              {title ? (
                <InternalCardTitle className="text-xl leading-normal font-medium">
                  <h3 className="m-0 text-[inherit] font-[inherit] leading-[inherit]">
                    {title}
                  </h3>
                </InternalCardTitle>
              ) : null}
              {actions.length ? (
                <InternalCardAction className="flex justify-end">
                  {actions}
                </InternalCardAction>
              ) : null}
            </InternalCardHeader>
          ) : null}

          {content.length ? (
            <InternalCardContent className={cn(noPadding && 'p-0')}>
              {content}
            </InternalCardContent>
          ) : null}
        </InternalCard>
      </section>
    )
  }
)

Section.displayName = 'Section'

export { Section }
