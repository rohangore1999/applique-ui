import * as React from 'react'
import { mount } from 'enzyme'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../dropdown-menu'
import { ButtonGroup } from './button-group'

const ShallowRenderer = require('react-shallow-renderer') as {
  createRenderer(): {
    getRenderOutput(): React.ReactElement
    render(element: React.ReactElement): void
  }
}

interface ActionProps {
  children?: React.ReactNode
  type?: 'primary' | 'secondary' | 'tertiary' | 'link' | 'text'
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'destructive'
    | 'link'
}

const Action = React.forwardRef<HTMLButtonElement, ActionProps>(
  ({ children, type, variant, ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      data-action-type={type}
      data-action-variant={variant}
      type="button"
    >
      {children}
    </button>
  )
)

Action.displayName = 'Action'

function facadeOutput(element: React.ReactElement) {
  const renderer = ShallowRenderer.createRenderer()
  renderer.render(element)
  return renderer.getRenderOutput() as React.ReactElement | null
}

function visibleActions(element: React.ReactElement) {
  const output = facadeOutput(element)

  if (!output) return []

  return React.Children.toArray(output.props.children).filter(
    (child): child is React.ReactElement<ActionProps> =>
      React.isValidElement(child) && child.type === Action
  )
}

function overflowActions(element: React.ReactElement) {
  const output = facadeOutput(element)

  if (!output) return []

  const dropdown = React.Children.toArray(output.props.children).find(
    (child) => React.isValidElement(child) && child.type === DropdownMenu
  ) as React.ReactElement | undefined

  if (!dropdown) return []

  const content = React.Children.toArray(dropdown.props.children).find(
    (child) => React.isValidElement(child) && child.type === DropdownMenuContent
  ) as React.ReactElement | undefined

  if (!content) return []

  return React.Children.toArray(content.props.children)
    .filter(
      (child): child is React.ReactElement =>
        React.isValidElement(child) && child.type === DropdownMenuItem
    )
    .map((item) => item.props.render as React.ReactElement<ActionProps>)
}

it('renders nothing without actions', () => {
  expect(facadeOutput(<ButtonGroup />)).toBeNull()
})

it('forwards the supported group props and ref to the shadcn root', () => {
  const ref = React.createRef<HTMLDivElement>()
  const wrapper = mount(
    <ButtonGroup
      ref={ref}
      aria-label="Order actions"
      className="order-actions"
      orientation="vertical"
    >
      <Action type="primary">Save</Action>
    </ButtonGroup>
  )
  const root = ref.current as HTMLDivElement

  expect(wrapper.find('[data-slot="button-group"]')).toHaveLength(1)
  expect(root.getAttribute('data-slot')).toBe('button-group')
  expect(root.getAttribute('aria-label')).toBe('Order actions')
  expect(root.getAttribute('data-orientation')).toBe('vertical')
  expect(root.className).toContain('order-actions')
})

it('reverses the legacy hierarchy and maps each type to a shadcn variant', () => {
  const actions = visibleActions(
    <ButtonGroup>
      <Action type="primary" variant="destructive">
        Primary
      </Action>
      <Action type="secondary">Secondary</Action>
      <Action type="link">Link</Action>
    </ButtonGroup>
  )

  expect(actions.map((action) => action.props.children)).toEqual([
    'Link',
    'Secondary',
    'Primary',
  ])
  expect(actions.map((action) => action.props.variant)).toEqual([
    'link',
    'outline',
    'default',
  ])
})

it('uses the legacy secondary default and lets it win over a shadcn variant', () => {
  const [action] = visibleActions(
    <ButtonGroup>
      <Action variant="destructive">Default action</Action>
    </ButtonGroup>
  )

  expect(action.props.type).toBe('secondary')
  expect(action.props.variant).toBe('outline')
})

it('promotes a repeated secondary action to text for a two-button group', () => {
  const element = (
    <ButtonGroup>
      <Action type="secondary">First</Action>
      <Action type="secondary">Second</Action>
    </ButtonGroup>
  )
  const actions = visibleActions(element)

  expect(actions.map((action) => action.props.children)).toEqual([
    'Second',
    'First',
  ])
  expect(actions.map((action) => action.props.type)).toEqual([
    'text',
    'secondary',
  ])
  expect(actions.map((action) => action.props.variant)).toEqual([
    'link',
    'outline',
  ])
  expect(overflowActions(element)).toHaveLength(0)
})

it('keeps only the matching first structured action visible', () => {
  const element = (
    <ButtonGroup structure="primary-group">
      <Action type="primary">Primary</Action>
      <Action type="link">Link</Action>
      <Action type="secondary">Secondary</Action>
    </ButtonGroup>
  )
  const actions = visibleActions(element)

  expect(actions).toHaveLength(1)
  expect(actions[0].props.children).toBe('Primary')

  const overflow = overflowActions(element)
  expect(overflow).toHaveLength(2)
  overflow.forEach((action) => {
    expect(action.props.type).toBe('text')
    expect(action.props.variant).toBe('link')
  })
})

it('moves every action from the first hierarchy conflict into overflow', () => {
  const element = (
    <ButtonGroup>
      <Action type="primary">First primary</Action>
      <Action type="secondary">Secondary</Action>
      <Action type="primary">Repeated primary</Action>
      <Action type="secondary">Repeated secondary</Action>
    </ButtonGroup>
  )
  expect(
    visibleActions(element).map((action) => action.props.children)
  ).toEqual(['Secondary', 'First primary'])

  const overflow = overflowActions(element)
  expect(overflow).toHaveLength(2)
  expect(overflow.map((action) => action.props.children)).toEqual([
    'Repeated primary',
    'Repeated secondary',
  ])
})

it('ignores a structure that does not match the first action', () => {
  const element = (
    <ButtonGroup structure="primary-group">
      <Action type="secondary">Secondary</Action>
      <Action type="link">Link</Action>
    </ButtonGroup>
  )

  expect(
    visibleActions(element).map((action) => action.props.children)
  ).toEqual(['Link', 'Secondary'])
  expect(overflowActions(element)).toHaveLength(0)
})

it('rejects a repeated link sequence just like the legacy component', () => {
  expect(() =>
    facadeOutput(
      <ButtonGroup>
        <Action type="link">First</Action>
        <Action type="link">Second</Action>
      </ButtonGroup>
    )
  ).toThrow('Not a correct sequence')
})

it('rejects non-element children instead of silently misclassifying them', () => {
  expect(() => facadeOutput(<ButtonGroup>Not a button</ButtonGroup>)).toThrow(
    'ButtonGroup children must be Button elements'
  )
})
