'use client'

import * as React from 'react'

import {
  Tabs as TabsPrimitive,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../tabs'

type PrimitiveTabsProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive>
type PrimitiveTabsListProps = React.ComponentPropsWithoutRef<typeof TabsList>
type PrimitiveTabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsTrigger
>

export interface TabProps
  extends Omit<
    PrimitiveTabsTriggerProps,
    'children' | 'disabled' | 'title' | 'value'
  > {
  /** Label rendered in the tab strip. Preserves the legacy `title` API. */
  title: React.ReactNode
  /** Whether the tab is disabled. */
  disabled?: boolean
  /** Legacy child-internal prop. Accepted but deliberately behavior-neutral. */
  isActive?: boolean
  children?: React.ReactNode
}

/**
 * A single tab. Preserves the legacy `<Tabs.Tab title=...>` API. It is a
 * configuration element: the root reads its `title`/`disabled`/`children`
 * props and splits them into a shadcn trigger and its matching panel. It is
 * never rendered directly.
 */
function Tab(_props: TabProps): React.ReactElement | null {
  return null
}

Tab.displayName = 'Tabs.Tab'

export interface TabsProps
  extends Omit<PrimitiveTabsProps, 'children' | 'onChange'> {
  /** Default active tab (index-based). Maps to the shadcn `defaultValue`. */
  defaultIndex?: number
  /** Current active tab (index-based, controlled). Maps to shadcn `value`. */
  activeIndex?: number
  /** Called with the newly active tab index. Maps from shadcn `onValueChange`. */
  onChange?(activeIndex: number): void
  /** Non-conflicting shadcn TabsList extension. */
  variant?: PrimitiveTabsListProps['variant']
  /**
   * Unsupported pending UX decision (primary/secondary → TabsList variant).
   */
  type?: 'primary' | 'secondary'
  children?: React.ReactNode
}

const TabsRoot = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      activeIndex,
      defaultIndex,
      defaultValue,
      onChange,
      onValueChange,
      type: _type,
      value,
      variant,
      children,
      ...primitiveProps
    },
    ref
  ) => {
    // Legacy Tabs is index-based; shadcn (base-ui) is value-based. The facade
    // owns the adaptation by assigning each tab an explicit numeric value equal
    // to its index, so value and index are one and the same and the legacy
    // index contract is preserved end-to-end.
    // Only the public marker participates in the compound API. Treating every
    // React element as a tab creates malformed triggers from unrelated UI.
    // Non-marker children are ignored, matching the facade's configuration-
    // element contract rather than guessing where arbitrary content belongs.
    const tabs = React.Children.toArray(children).filter(
      isTab
    ) as React.ReactElement<TabProps>[]

    if (!tabs.length) return null

    const hasAppliqueValue = activeIndex !== undefined
    const hasRawValue = value !== undefined
    const resolvedValue = hasAppliqueValue
      ? resolveEnabledIndex(activeIndex, tabs)
      : value
    const resolvedDefaultValue =
      hasAppliqueValue || hasRawValue
        ? undefined
        : defaultIndex !== undefined
        ? resolveEnabledIndex(defaultIndex, tabs)
        : defaultValue !== undefined
        ? defaultValue
        : resolveEnabledIndex(0, tabs)

    // Compose the shadcn callback (fired first) with the legacy `onChange`,
    // skipping the legacy call if the change was canceled.
    const handleValueChange: NonNullable<PrimitiveTabsProps['onValueChange']> = (
      value,
      eventDetails
    ) => {
      onValueChange?.(value, eventDetails)
      if (eventDetails?.isCanceled) return

      // Base UI also reports automatic initial/disabled/missing fallbacks.
      // Legacy onChange was click-only, so those stay available solely through
      // the raw shadcn callback.
      if (eventDetails.reason !== 'none') return
      if (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= 0 &&
        value < tabs.length
      ) {
        onChange?.(value)
      }
    }

    return (
      <TabsPrimitive
        {...primitiveProps}
        ref={ref}
        value={resolvedValue}
        defaultValue={resolvedDefaultValue}
        onValueChange={handleValueChange}
      >
        <TabsList variant={variant}>
          {tabs.map((tab, index) => {
            const {
              children: _tabChildren,
              className,
              disabled,
              isActive: _isActive,
              title,
              ...triggerProps
            } = tab.props

            return (
              <TabsTrigger
                {...triggerProps}
                key={tab.key ?? index}
                value={index}
                disabled={disabled}
                className={className}
              >
                {title}
              </TabsTrigger>
            )
          })}
        </TabsList>
        {tabs.map((tab, index) => (
          <TabsContent key={tab.key ?? index} value={index}>
            {tab.props.children}
          </TabsContent>
        ))}
      </TabsPrimitive>
    )
  }
)

TabsRoot.displayName = 'Tabs'

function isTab(child: React.ReactNode): child is React.ReactElement<TabProps> {
  return React.isValidElement(child) && child.type === Tab
}

function resolveEnabledIndex(
  requestedIndex: number,
  tabs: React.ReactElement<TabProps>[]
): number | null {
  if (
    Number.isInteger(requestedIndex) &&
    requestedIndex >= 0 &&
    requestedIndex < tabs.length &&
    !tabs[requestedIndex].props.disabled
  ) {
    return requestedIndex
  }

  const fallbackIndex = tabs.findIndex((tab) => !tab.props.disabled)
  return fallbackIndex >= 0 ? fallbackIndex : null
}

const Tabs = Object.assign(TabsRoot, { Tab })

export { Tab, Tabs }
