'use client'

import * as React from 'react'

import { Button as InternalButton } from '../button'
import { ButtonGroup as InternalButtonGroup } from '../button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu'

type InternalButtonGroupProps = React.ComponentPropsWithoutRef<
  typeof InternalButtonGroup
>
type InternalButtonProps = React.ComponentPropsWithoutRef<typeof InternalButton>

type LegacyButtonType = 'primary' | 'secondary' | 'tertiary' | 'link' | 'text'

interface ButtonActionProps {
  children?: React.ReactNode
  type?: LegacyButtonType
  variant?: InternalButtonProps['variant']
}

type ButtonAction = React.ReactElement<ButtonActionProps>

export interface ButtonGroupProps {
  /** Accessible name forwarded to the shadcn ButtonGroup root. */
  'aria-label'?: InternalButtonGroupProps['aria-label']
  /**
   * Applique Button actions to sequence and, when necessary, overflow.
   *
   * This contract requires the Applique Button facade, which is installed as a
   * registry dependency. Its `type` is visual; a raw shadcn Button uses `type`
   * as the native HTML button type and must not be used as a legacy child.
   */
  children?: React.ReactNode
  /** Class name forwarded to the shadcn ButtonGroup root. */
  className?: string
  /** Optional shadcn layout extension. */
  orientation?: InternalButtonGroupProps['orientation']
  /**
   * Keeps the matching first action visible and moves every later action into
   * the overflow menu. A non-matching structure retains the normal sequencing
   * behavior, matching the legacy runtime.
   */
  structure?: 'primary-group' | 'secondary-group' | 'link-group'
}

const nextType: Partial<Record<LegacyButtonType, LegacyButtonType>> = {
  primary: 'secondary',
  secondary: 'text',
}

const variantForType: Record<
  LegacyButtonType,
  InternalButtonProps['variant']
> = {
  primary: 'default',
  secondary: 'outline',
  tertiary: 'ghost',
  link: 'link',
  text: 'link',
}

function actionType(action: ButtonAction): LegacyButtonType {
  return action.props.type ?? 'secondary'
}

function withType(
  action: ButtonAction,
  type: LegacyButtonType = actionType(action)
): ButtonAction {
  // The child remains responsible for its full Button behavior. ButtonGroup
  // only owns hierarchy, so it supplies the legacy visual type and its
  // matching shadcn variant; the legacy type wins over a conflicting variant.
  return React.cloneElement(action, {
    type,
    variant: variantForType[type],
  })
}

function buttonActions(children: React.ReactNode): ButtonAction[] {
  const nodes = React.Children.toArray(children)

  if (!nodes.every(React.isValidElement)) {
    throw new Error('ButtonGroup children must be Button elements')
  }

  return nodes as ButtonAction[]
}

function splitActions(
  actions: ButtonAction[],
  structure: ButtonGroupProps['structure']
) {
  const firstType = actions[0] ? actionType(actions[0]) : undefined
  const usesStructure =
    firstType !== undefined && structure === `${firstType}-group`

  if (usesStructure) {
    return {
      overflow: actions.slice(1),
      visible: actions.slice(0, 1),
    }
  }

  const visible: ButtonAction[] = []
  const typesFound: LegacyButtonType[] = []
  let overflowStart: number | undefined

  actions.every((action, index) => {
    const type = actionType(action)
    const followingType = nextType[type]
    const repeatsHierarchy =
      typesFound.includes(type) ||
      (followingType !== undefined && typesFound.includes(followingType))

    if (repeatsHierarchy) {
      overflowStart = index
      return false
    }

    visible.push(action)
    typesFound.push(type)
    return true
  })

  let overflow = overflowStart === undefined ? [] : actions.slice(overflowStart)

  // Preserve the legacy special case for a single repeated action. With two
  // actions it is promoted to the next type. With three, a repeated secondary
  // is promoted to text. In other cases the last visible action joins overflow.
  if (overflow.length === 1) {
    if (actions.length >= 3) {
      const promotedType = nextType[actionType(overflow[0])]

      if (promotedType === 'text' && actions.length === 3) {
        visible.push(withType(overflow[0], promotedType))
        overflow = []
      } else {
        const lastVisible = visible.pop()
        if (lastVisible) overflow.push(lastVisible)
      }
    } else {
      const promotedType = nextType[actionType(visible[0])]

      if (!promotedType) throw new Error('Not a correct sequence')

      visible.push(withType(overflow[0], promotedType))
      overflow = []
    }
  }

  return { overflow, visible }
}

function MoreActionsIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="5" r="1.75" fill="currentColor" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
      <circle cx="12" cy="19" r="1.75" fill="currentColor" />
    </svg>
  )
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    { 'aria-label': ariaLabel, children, className, orientation, structure },
    ref
  ) => {
    const actions = buttonActions(children)

    if (actions.length === 0) return null

    const { overflow, visible } = splitActions(actions, structure)

    return (
      <InternalButtonGroup
        ref={ref}
        aria-label={ariaLabel}
        className={className}
        orientation={orientation}
      >
        {visible
          .slice()
          .reverse()
          .map((action) => withType(action))}
        {overflow.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <InternalButton
                  aria-label="More actions"
                  size="icon"
                  variant="outline"
                />
              }
            >
              <MoreActionsIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {overflow.map((action, index) => (
                <DropdownMenuItem
                  key={action.key ?? index}
                  render={withType(action, 'text')}
                />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </InternalButtonGroup>
    )
  }
)

ButtonGroup.displayName = 'ButtonGroup'

export { ButtonGroup }
