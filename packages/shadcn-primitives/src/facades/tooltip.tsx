'use client'

import * as React from 'react'

import {
  Tooltip as InternalTooltip,
  TooltipContent as InternalTooltipContent,
  TooltipProvider as InternalTooltipProvider,
  TooltipTrigger as InternalTooltipTrigger,
} from '../tooltip'
import { cn } from '../utils'

type InternalTooltipContentProps = React.ComponentPropsWithoutRef<
  typeof InternalTooltipContent
>
type InternalTooltipRootProps = React.ComponentPropsWithoutRef<
  typeof InternalTooltip
>

type LegacyPosition = 'up' | 'down' | 'left' | 'right'

const positionToSide = {
  up: 'top',
  down: 'bottom',
  left: 'left',
  right: 'right',
} as const

const contentToneClassName = {
  light:
    'bg-popover text-popover-foreground [&>*:last-child]:bg-popover! [&>*:last-child]:fill-popover!',
  dark:
    'bg-foreground text-background [&>*:last-child]:bg-foreground! [&>*:last-child]:fill-foreground!',
} as const

export interface TooltipProps
  extends Omit<InternalTooltipContentProps, 'children' | 'className'>,
    Pick<InternalTooltipRootProps, 'defaultOpen' | 'onOpenChange' | 'open'> {
  /** The first truthy child becomes the tooltip trigger. */
  children?: React.ReactNode
  /** Preserves the legacy class target on the trigger wrapper. */
  className?: string
  /** Renders the tooltip body. */
  renderContent(): React.ReactNode
  /** Legacy placement relative to the trigger. */
  position?: LegacyPosition
  /** Per-tooltip open delay forwarded to the shadcn provider. */
  delay?: number
  /** Per-tooltip close delay forwarded to the shadcn provider. */
  closeDelay?: number
  /**
   * `click` remains unresolved: Base UI Tooltip provides hover and focus
   * interactions, while click-only content belongs in a Popover. The prop is
   * retained so migrated call sites type-check, but it does not select an
   * interaction yet.
   */
  triggerOn?: 'hover' | 'click' | 'focus'
  /** Uses the legacy dark surface when true; the default surface is light. */
  dark?: boolean
}

function DeferredTooltipBody({
  renderContent,
}: Pick<TooltipProps, 'renderContent'>) {
  return <>{renderContent()}</>
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      className,
      closeDelay,
      dark = false,
      defaultOpen,
      delay,
      onOpenChange,
      open,
      position,
      renderContent,
      side,
      // Retained as an explicit unresolved compatibility prop. Destructuring
      // prevents it from leaking to TooltipContent or the DOM.
      triggerOn: _triggerOn,
      ...contentProps
    },
    ref
  ) => {
    const [trigger] = React.Children.toArray(children).filter(Boolean)
    const canRenderTriggerDirectly =
      React.isValidElement(trigger) && trigger.type !== React.Fragment

    return (
      <InternalTooltipProvider delay={delay} closeDelay={closeDelay}>
        <InternalTooltip
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
          open={open}
        >
          <div
            ref={ref}
            className={cn(className, 'relative inline-block')}
            data-applique-tooltip=""
          >
            {canRenderTriggerDirectly ? (
              <InternalTooltipTrigger render={trigger as React.ReactElement} />
            ) : (
              <InternalTooltipTrigger render={<span tabIndex={0} />}>
                {trigger}
              </InternalTooltipTrigger>
            )}
          </div>
          <InternalTooltipContent
            {...contentProps}
            className={contentToneClassName[dark ? 'dark' : 'light']}
            side={position ? positionToSide[position] : side ?? 'top'}
          >
            <DeferredTooltipBody renderContent={renderContent} />
          </InternalTooltipContent>
        </InternalTooltip>
      </InternalTooltipProvider>
    )
  }
)

Tooltip.displayName = 'Tooltip'

export { Tooltip }
