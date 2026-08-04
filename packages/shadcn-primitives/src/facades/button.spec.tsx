import * as React from 'react'
import { mount } from 'enzyme'

import { Button as InternalButton } from '../button'
import { Spinner as InternalSpinner } from '../spinner'
import { Button } from './button'

function StartIcon() {
  return <svg data-test-id="start-component" />
}

function EndIcon() {
  return <svg data-test-id="end-component" />
}

type RouterLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  to?: string | object
}

const RouterLink = React.forwardRef<HTMLAnchorElement, RouterLinkProps>(
  ({ to, ...props }, ref) => (
    <a
      {...props}
      ref={ref}
      data-router-to={typeof to === 'string' ? to : JSON.stringify(to)}
    />
  )
)

RouterLink.displayName = 'RouterLink'

it('preserves the legacy defaults while rendering the shadcn primitive', () => {
  const wrapper = mount(<Button>Save</Button>)
  const internalButton = wrapper.find(InternalButton)
  const root = wrapper.getDOMNode()

  expect(root.tagName).toBe('BUTTON')
  expect(root.getAttribute('type')).toBe('button')
  expect(root.getAttribute('data-slot')).toBe('button')
  expect(root.getAttribute('data-test-id')).toBe('target')
  expect(root.textContent).toContain('Save')
  expect(internalButton.prop('variant')).toBe('outline')
  expect(internalButton.prop('size')).toBe('default')
  expect(internalButton.prop('disabled')).toBe(false)
  expect(root.getAttribute('style')).toContain('text-transform: none')
})

it.each([
  ['primary', 'default'],
  ['secondary', 'outline'],
  ['tertiary', 'ghost'],
  ['link', 'link'],
  ['text', 'link'],
] as const)('maps legacy type %s to shadcn variant %s', (type, variant) => {
  const wrapper = mount(<Button type={type}>Action</Button>)

  expect(wrapper.find(InternalButton).prop('variant')).toBe(variant)
})

it('adds the legacy text compatibility recipe for link and text types', () => {
  const textRoot = mount(<Button type="text">Text</Button>).getDOMNode()
  const linkRoot = mount(<Button type="link">Link</Button>).getDOMNode()

  expect(textRoot.className).toContain('p-0')
  expect(textRoot.className).toContain('hover:no-underline')
  expect(linkRoot.className).toContain('p-0')
  expect(linkRoot.className).toContain('hover:no-underline')
})

it.each([
  ['xs', 'icon-xs'],
  ['small', 'sm'],
  ['regular', 'default'],
] as const)('maps legacy size %s to shadcn size %s', (size, internalSize) => {
  const wrapper = mount(
    <Button icon={StartIcon} size={size}>
      {size === 'xs' ? undefined : 'Action'}
    </Button>
  )

  expect(wrapper.find(InternalButton).prop('size')).toBe(internalSize)
})

it('uses an Applique-owned recipe instead of shadcn lg for large', () => {
  const root = mount(
    <Button caption="Secondary information" icon={StartIcon} size="large">
      Action
    </Button>
  ).getDOMNode()

  expect(root.className).toContain('h-24')
  expect(root.className).toContain('w-full')
  expect(root.className).toContain('flex-col')
  expect(root.querySelector('[data-test-id="caption"]')?.textContent).toBe(
    'Secondary information'
  )
})

it('keeps non-conflicting shadcn variant and size extensions available', () => {
  const wrapper = mount(
    <Button size="icon-lg" variant="destructive" aria-label="Delete" />
  )
  const internalButton = wrapper.find(InternalButton)

  expect(internalButton.prop('variant')).toBe('destructive')
  expect(internalButton.prop('size')).toBe('icon-lg')
})

it('gives explicit legacy type precedence over the shadcn variant extension', () => {
  const wrapper = mount(
    <Button type="primary" variant="destructive">
      Save
    </Button>
  )

  expect(wrapper.find(InternalButton).prop('variant')).toBe('default')
})

it('preserves the xs icon-only runtime contract', () => {
  expect(() => mount(<Button size="xs" />)).toThrow(
    "The prop 'icon' is required when size is set to 'xs'."
  )
  expect(() =>
    mount(
      <Button icon={StartIcon} size="xs">
        Invalid
      </Button>
    )
  ).toThrow(
    "The props 'children' and 'label' cannot be used when size is set to 'xs'."
  )
})

it('renders component, sprite, and trailing icons as decorative content', () => {
  const wrapper = mount(
    <Button icon={StartIcon} secondaryIcon="chevron-right">
      Continue
    </Button>
  )
  const primary = wrapper.find('[data-test-id="primary-icon"]')
  const secondary = wrapper.find('[data-test-id="secondary-icon"]')

  expect(primary.prop('aria-hidden')).toBe('true')
  expect(primary.prop('data-icon')).toBe('inline-start')
  expect(primary.find('[data-test-id="start-component"]').exists()).toBe(true)
  expect(secondary.prop('aria-hidden')).toBe('true')
  expect(secondary.prop('data-icon')).toBe('inline-end')
  expect(secondary.find('use').prop('href')).toBe('#uikit-i-chevron-right')
})

it('preserves children over label and the legacy falsy-children fallback', () => {
  expect(
    mount(<Button label="Fallback">Children</Button>).getDOMNode().textContent
  ).toContain('Children')
  expect(
    mount(<Button label="Fallback">{0}</Button>).getDOMNode().textContent
  ).toContain('Fallback')
})

it('renders caption only for the legacy large recipe', () => {
  expect(
    mount(<Button caption="Details">Action</Button>).find(
      '[data-test-id="caption"]'
    )
  ).toHaveLength(0)
  expect(
    mount(
      <Button caption="Details" size="large">
        Action
      </Button>
    ).find('[data-test-id="caption"]')
  ).toHaveLength(1)
})

it('maps htmlType and forwards native button props and ref', () => {
  const ref = React.createRef<HTMLElement>()
  const wrapper = mount(
    <Button
      ref={ref}
      aria-describedby="save-help"
      focusableWhenDisabled
      form="edit-form"
      htmlType="submit"
      id="save"
      name="intent"
    >
      Save
    </Button>
  )
  const internalButton = wrapper.find(InternalButton)
  const root = wrapper.getDOMNode()

  expect(root.getAttribute('type')).toBe('submit')
  expect(root.getAttribute('form')).toBe('edit-form')
  expect(root.getAttribute('name')).toBe('intent')
  expect(root.getAttribute('aria-describedby')).toBe('save-help')
  expect(internalButton.prop('focusableWhenDisabled')).toBe(true)
  expect(ref.current).toBe(root)
})

it('forwards clicks and preserves loading and disabled click guards', () => {
  const enabledClick = jest.fn()
  const enabled = mount(<Button onClick={enabledClick}>Save</Button>)
  const enabledHandler = enabled.find(InternalButton).prop('onClick')!
  const enabledEvent = { preventDefault: jest.fn() } as any

  enabledHandler(enabledEvent)
  expect(enabledClick).toHaveBeenCalledWith(enabledEvent)
  expect(enabledEvent.preventDefault).not.toHaveBeenCalled()

  for (const guardedProps of [{ disabled: true }, { loading: true }]) {
    const guardedClick = jest.fn()
    const wrapper = mount(
      <Button {...guardedProps} onClick={guardedClick}>
        Save
      </Button>
    )
    const event = { preventDefault: jest.fn() } as any

    wrapper.find(InternalButton).prop('onClick')!(event)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(guardedClick).not.toHaveBeenCalled()
  }
})

it('composes loading with disabled, aria-busy, hidden content, and Spinner', () => {
  const wrapper = mount(<Button loading>Save</Button>)
  const internalButton = wrapper.find(InternalButton)

  expect(internalButton.prop('disabled')).toBe(true)
  expect(internalButton.prop('aria-busy')).toBe(true)
  expect(wrapper.find(InternalSpinner)).toHaveLength(1)
  expect(wrapper.find(InternalSpinner).prop('aria-hidden')).toBe('true')
  expect(
    wrapper.getDOMNode().querySelectorAll('[data-test-id="loading"]')
  ).toHaveLength(1)
  expect(wrapper.getDOMNode().textContent).toContain('Save')
})

it('preserves caller aria-busy when the facade is not loading', () => {
  const wrapper = mount(<Button aria-busy="false">Save</Button>)

  expect(wrapper.find(InternalButton).prop('aria-busy')).toBe('false')
})

it('composes notification mode and caps the visible count at 99+', () => {
  const wrapper = mount(
    <Button notifications={100} secondaryIcon={EndIcon} type="tertiary">
      Hidden label
    </Button>
  )
  const internalButton = wrapper.find(InternalButton)
  const badge = wrapper
    .getDOMNode()
    .querySelector('[data-test-id="notification-count"]')

  expect(internalButton.prop('variant')).toBe('default')
  expect(internalButton.prop('aria-label')).toBe('Notifications, 100')
  expect(badge?.textContent).toBe('99+')
  expect(badge?.getAttribute('title')).toBe('100')
  expect(badge?.getAttribute('aria-hidden')).toBe('true')
  expect(wrapper.text()).not.toContain('Hidden label')
  expect(wrapper.find('[data-test-id="secondary-icon"]')).toHaveLength(0)
  expect(wrapper.getDOMNode().querySelectorAll('.lucide-bell')).toHaveLength(1)
})

it('keeps zero notifications in notification mode without a count badge', () => {
  const wrapper = mount(<Button notifications={0}>Hidden label</Button>)
  const internalButton = wrapper.find(InternalButton)

  expect(internalButton.prop('variant')).toBe('outline')
  expect(internalButton.prop('aria-label')).toBe('Notifications')
  expect(wrapper.find('[data-test-id="notification-count"]')).toHaveLength(0)
  expect(wrapper.text()).not.toContain('Hidden label')
})

it('allows a caller-provided notification accessible name', () => {
  const wrapper = mount(<Button aria-label="Open alerts" notifications={4} />)

  expect(wrapper.find(InternalButton).prop('aria-label')).toBe('Open alerts')
})

it('merges style and gives the legacy transform prop precedence', () => {
  const objectStyle = mount(
    <Button
      style={{ opacity: 0.5, textTransform: 'uppercase' }}
      transform="lowercase"
    >
      Save
    </Button>
  ).find(InternalButton)

  expect(objectStyle.prop('style')).toEqual({
    opacity: 0.5,
    textTransform: 'lowercase',
  })

  const stateStyle = mount(
    <Button
      style={() => ({ opacity: 0.75, textTransform: 'uppercase' })}
      transform="capitalize"
    >
      Save
    </Button>
  )
    .find(InternalButton)
    .prop('style')

  expect(typeof stateStyle).toBe('function')
  expect((stateStyle as (state: unknown) => React.CSSProperties)({})).toEqual({
    opacity: 0.75,
    textTransform: 'capitalize',
  })
})

it('makes facade-owned inherit-text styling win over conflicting classes', () => {
  const root = mount(
    <Button className="text-red-500 hover:text-blue-500" inheritTextColor>
      Save
    </Button>
  ).getDOMNode()

  expect(root.className).not.toContain('text-red-500')
  expect(root.className).not.toContain('hover:text-blue-500')
  expect(root.className).toContain('text-inherit')
  expect(root.className).toContain('hover:text-inherit')
})

it('renders href as a non-native Base UI anchor and forwards anchor props', () => {
  const ref = React.createRef<HTMLElement>()
  const wrapper = mount(
    <Button ref={ref} href="/orders" rel="noreferrer" target="_blank">
      Orders
    </Button>
  )
  const internalButton = wrapper.find(InternalButton)
  const root = wrapper.getDOMNode()

  expect(root.tagName).toBe('A')
  expect(root.getAttribute('href')).toBe('/orders')
  expect(root.getAttribute('rel')).toBe('noreferrer')
  expect(root.getAttribute('target')).toBe('_blank')
  expect(root.hasAttribute('type')).toBe(false)
  expect(internalButton.prop('nativeButton')).toBe(false)
  expect(ref.current).toBe(root)
})

it('keeps disabled anchor navigation non-interactive and accessible', () => {
  const onClick = jest.fn()
  const root = mount(
    <Button disabled href="/orders" onClick={onClick}>
      Orders
    </Button>
  ).getDOMNode()

  root.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true })
  )

  expect(root.tagName).toBe('A')
  expect(root.getAttribute('aria-disabled')).toBe('true')
  expect(onClick).not.toHaveBeenCalled()
})

it('merges href into an explicit shadcn render element', () => {
  const root = mount(
    <Button href="/orders" render={<a data-custom-link="" />}>
      Orders
    </Button>
  ).getDOMNode()

  expect(root.tagName).toBe('A')
  expect(root.getAttribute('href')).toBe('/orders')
  expect(root.hasAttribute('data-custom-link')).toBe(true)
})

it('maps to through an explicit client-router render element', () => {
  const destination = { pathname: '/orders', search: '?state=open' }
  const root = mount(
    <Button render={<RouterLink />} to={destination}>
      Orders
    </Button>
  ).getDOMNode()

  expect(root.tagName).toBe('A')
  expect(root.getAttribute('data-router-to')).toBe(JSON.stringify(destination))
})

it('fails clearly for unresolved router integration and conflicting links', () => {
  expect(() => mount(<Button to="/orders">Orders</Button>)).toThrow(
    "The prop 'to' requires render={<RouterLink />} until the client router integration is configured."
  )
  expect(() =>
    mount(
      <Button href="/orders" to="/orders">
        Orders
      </Button>
    )
  ).toThrow("The props 'to' and 'href' cannot coexist.")
})

it('forwards render when no legacy link prop owns polymorphism', () => {
  const root = mount(
    <Button nativeButton={false} render={<div role="button" tabIndex={0} />}>
      Custom
    </Button>
  ).getDOMNode()

  expect(root.tagName).toBe('DIV')
  expect(root.getAttribute('role')).toBe('button')
})

it('marks arbitrary color as unresolved and drops the state escape hatch', () => {
  const unsupportedProps = { color: 'brand-purple', state: 'active' } as any
  const root = mount(<Button {...unsupportedProps}>Save</Button>).getDOMNode()

  expect(root.getAttribute('data-applique-unresolved-color')).toBe(
    'brand-purple'
  )
  expect(root.hasAttribute('state')).toBe(false)
  expect(root.className).not.toContain('brand-purple')
  expect(root.className.split(/\s+/)).not.toContain('active')
})
