'use client'

import * as React from 'react'

import {
  Accordion as ShadcnAccordion,
  AccordionContent as ShadcnAccordionContent,
  AccordionItem as ShadcnAccordionItem,
  AccordionTrigger as ShadcnAccordionTrigger,
} from '../accordion'

type ShadcnAccordionProps = React.ComponentPropsWithoutRef<
  typeof ShadcnAccordion
>
type ShadcnAccordionItemProps = React.ComponentPropsWithoutRef<
  typeof ShadcnAccordionItem
>
type LegacyIconName = string | React.ReactNode | React.ComponentType<any>

export interface AccordionControlIcons {
  open: LegacyIconName
  close: LegacyIconName
}

export interface AccordionItemProps
  extends Omit<ShadcnAccordionItemProps, 'children' | 'title' | 'value'> {
  /** The always-visible header of the item (legacy `title`). */
  title?: React.ReactNode
  /** Accepted for source compatibility; legacy runtime ignored this override. */
  controlIcons?: AccordionControlIcons
  children?: React.ReactNode
}

/**
 * A single accordion pane. Preserves the legacy `<Accordion.Item title>` API.
 * It is a declarative marker: the root reads `title`/`children` and composes
 * them into the shadcn trigger/content parts, so it renders nothing on its own.
 */
function AccordionItem(_props: AccordionItemProps): React.ReactElement | null {
  return null
}

AccordionItem.displayName = 'Accordion.Item'

export interface AccordionProps
  extends Omit<ShadcnAccordionProps, 'children' | 'multiple' | 'onChange'> {
  /** Accepted while the legacy documented/runtime mismatch is under review. */
  active?: number
  /** Legacy change callback: `(currentIndex, active)`. */
  onChange?(currentIndex: number, active: boolean): void
  /** Replaces the default closed/open trigger icons. */
  controlIcons?: AccordionControlIcons
  children?: React.ReactNode
}

const AccordionRoot = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      active,
      children,
      controlIcons,
      defaultValue,
      onChange,
      onValueChange: passthroughOnValueChange,
      value,
      ...primitiveProps
    },
    ref
  ) => {
    // The documented `active` prop was never applied by the legacy runtime.
    // Keep accepting it while the contract is reviewed, but do not invent new
    // controlled behavior in this migration batch.
    void active

    const childNodes = React.Children.toArray(children)

    const controlledOpenValues =
      value === undefined ? undefined : normalizeOpenValues(value)

    // Track the real starting state so the first legacy callback can report an
    // accurate open/closed diff for raw value/defaultValue consumers.
    const openRef = React.useRef<number[]>(
      controlledOpenValues ?? normalizeOpenValues(defaultValue)
    )
    if (controlledOpenValues !== undefined) {
      openRef.current = controlledOpenValues
    }

    const handleValueChange: ShadcnAccordionProps['onValueChange'] = (
      nextValue,
      eventDetails
    ) => {
      passthroughOnValueChange?.(nextValue, eventDetails)
      if (eventDetails.isCanceled) return

      const next = nextValue
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value))
      const nextSet = new Set(next)
      const prevSet = new Set(controlledOpenValues ?? openRef.current)
      if (controlledOpenValues === undefined) openRef.current = next

      if (!onChange) return

      const added = next.filter((value) => !prevSet.has(value))
      added.forEach((index) => onChange(index, true))
      const removed = openRefDiff(prevSet, nextSet)
      removed.forEach((index) => onChange(index, false))
    }

    let itemIndex = 0

    return (
      <ShadcnAccordion
        {...primitiveProps}
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        multiple
        onValueChange={handleValueChange}
      >
        {childNodes.map((child, childIndex) => {
          if (!isAccordionItem(child)) return child

          const index = itemIndex
          itemIndex += 1
          const {
            title,
            children: itemChildren,
            controlIcons: _itemControlIcons,
            ...itemProps
          } = child.props

          return (
            <ShadcnAccordionItem
              {...itemProps}
              key={child.key ?? childIndex}
              value={index}
            >
              <ShadcnAccordionTrigger
                className={
                  controlIcons
                    ? '[&>[data-slot=accordion-trigger-icon]]:hidden'
                    : undefined
                }
              >
                {title}
                {controlIcons ? (
                  <LegacyControlIcons controlIcons={controlIcons} />
                ) : null}
              </ShadcnAccordionTrigger>
              <ShadcnAccordionContent>{itemChildren}</ShadcnAccordionContent>
            </ShadcnAccordionItem>
          )
        })}
      </ShadcnAccordion>
    )
  }
)

AccordionRoot.displayName = 'Accordion'

function isAccordionItem(
  child: React.ReactNode
): child is React.ReactElement<AccordionItemProps> {
  return React.isValidElement(child) && child.type === AccordionItem
}

function LegacyControlIcons({
  controlIcons,
}: {
  controlIcons: AccordionControlIcons
}) {
  return (
    <>
      <span
        aria-hidden="true"
        data-applique-accordion-icon="close"
        className="ml-auto inline-flex group-aria-expanded/accordion-trigger:hidden"
      >
        {renderLegacyIcon(controlIcons.close)}
      </span>
      <span
        aria-hidden="true"
        data-applique-accordion-icon="open"
        className="ml-auto hidden group-aria-expanded/accordion-trigger:inline-flex"
      >
        {renderLegacyIcon(controlIcons.open)}
      </span>
    </>
  )
}

function renderLegacyIcon(icon: LegacyIconName): React.ReactNode {
  return typeof icon === 'function' ? React.createElement(icon) : icon
}

function openRefDiff(prevSet: Set<number>, nextSet: Set<number>): number[] {
  const removed: number[] = []
  prevSet.forEach((value) => {
    if (!nextSet.has(value)) removed.push(value)
  })
  return removed
}

function normalizeOpenValues(values?: unknown[]): number[] {
  if (!values) return []

  return values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value))
}

const Accordion = Object.assign(AccordionRoot, { Item: AccordionItem })

export { Accordion, AccordionItem }
