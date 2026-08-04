import * as React from 'react'
import { mount } from 'enzyme'

import { Button as InternalButton } from '../button'
import { Button } from './button'
import { Section } from './section'

it('keeps a semantic section root and forwards its ref and native props', () => {
  const onClick = jest.fn()
  const ref = React.createRef<HTMLElement>()
  const wrapper = mount(
    <Section
      ref={ref}
      aria-label="Order summary"
      className="order-summary flex-[0_0_auto]"
      data-dashboard="partner"
      id="summary"
      onClick={onClick}
      style={{ minWidth: 320 }}
    >
      Summary content
    </Section>
  )
  const root = wrapper.find('section')

  expect(root).toHaveLength(1)
  expect(ref.current).toBe(root.getDOMNode())
  expect(root.hasClass('order-summary')).toBe(true)
  expect(root.hasClass('flex-[0_0_auto]')).toBe(false)
  expect(root.hasClass('flex-[1_1_100%]')).toBe(true)
  expect(root.prop('aria-label')).toBe('Order summary')
  expect(root.prop('data-dashboard')).toBe('partner')
  expect(root.prop('id')).toBe('summary')
  expect(root.prop('style')).toEqual({ minWidth: 320 })

  root.simulate('click')
  expect(onClick).toHaveBeenCalledTimes(1)
})

it('maps the title, direct Applique Button actions, and remaining content to Card parts', () => {
  const wrapper = mount(
    <Section title="Order details">
      <Button type="primary">Save</Button>
      <p>Line items</p>
      <Button type="secondary">Cancel</Button>
    </Section>
  )
  const header = wrapper.find('[data-slot="card-header"]')
  const action = wrapper.find('[data-slot="card-action"]')
  const content = wrapper.find('[data-slot="card-content"]')

  expect(wrapper.find('[data-slot="card"]')).toHaveLength(1)
  expect(header).toHaveLength(1)
  expect(wrapper.find('[data-slot="card-title"] h3').text()).toBe(
    'Order details'
  )
  expect(action.find('button')).toHaveLength(2)
  expect(action.text()).toContain('Save')
  expect(action.text()).toContain('Cancel')
  expect(content.find('p').text()).toBe('Line items')
  expect(content.find('button')).toHaveLength(0)
})

it('recognizes the public Applique Button facade rather than a raw button', () => {
  const wrapper = mount(
    <Section>
      <Button>Facade action</Button>
      <InternalButton>Raw primitive</InternalButton>
    </Section>
  )

  expect(wrapper.find('[data-slot="card-action"]').text()).toContain(
    'Facade action'
  )
  expect(wrapper.find('[data-slot="card-content"] button')).toHaveLength(1)
  expect(wrapper.find('[data-slot="card-content"] button').text()).toBe(
    'Raw primitive'
  )
})

it('renders wrapped actions through the explicit actions slot without inspecting React internals', () => {
  const WrappedAction = React.memo(function WrappedAction() {
    return <Button>Wrapped action</Button>
  })
  const wrapper = mount(
    <Section actions={<WrappedAction />} title="Order details">
      <Button>Direct action</Button>
      <p>Line items</p>
    </Section>
  )
  const action = wrapper.find('[data-slot="card-action"]')
  const content = wrapper.find('[data-slot="card-content"]')

  expect(action.find('button')).toHaveLength(2)
  expect(action.text()).toContain('Direct action')
  expect(action.text()).toContain('Wrapped action')
  expect(content.find('p').text()).toBe('Line items')
  expect(content.find('button')).toHaveLength(0)
})

it('only promotes direct Applique Button children, matching the legacy structure', () => {
  const wrapper = mount(
    <Section>
      <div>
        <Button>Nested action</Button>
      </div>
    </Section>
  )

  expect(wrapper.find('[data-slot="card-header"]')).toHaveLength(0)
  expect(wrapper.find('[data-slot="card-action"]')).toHaveLength(0)
  expect(wrapper.find('[data-slot="card-content"] button').text()).toContain(
    'Nested action'
  )
})

it('supports an action-only header and omits an empty content block', () => {
  const wrapper = mount(
    <Section>
      <Button>Save</Button>
    </Section>
  )

  expect(wrapper.find('[data-slot="card-header"]')).toHaveLength(1)
  expect(wrapper.find('[data-slot="card-title"]')).toHaveLength(0)
  expect(wrapper.find('[data-slot="card-action"]')).toHaveLength(1)
  expect(wrapper.find('[data-slot="card-content"]')).toHaveLength(0)
})

it('omits the header when there is no title or direct action', () => {
  const wrapper = mount(
    <Section>
      <p>Body only</p>
    </Section>
  )

  expect(wrapper.find('[data-slot="card-header"]')).toHaveLength(0)
  expect(wrapper.find('[data-slot="card-content"]').text()).toBe('Body only')
})

it('removes horizontal header and content padding without removing root vertical rhythm', () => {
  const wrapper = mount(
    <Section noPadding title="Compact">
      <p>Body</p>
    </Section>
  )
  const card = wrapper.find('[data-slot="card"]')
  const header = wrapper.find('[data-slot="card-header"]')
  const content = wrapper.find('[data-slot="card-content"]')

  expect(header.hasClass('px-0')).toBe(true)
  expect(content.hasClass('p-0')).toBe(true)
  expect(card.hasClass('py-4')).toBe(true)
})

it('retains default padding and forwards the non-conflicting Card size extension', () => {
  const wrapper = mount(
    <Section size="sm" title="Compact">
      <p>Body</p>
    </Section>
  )
  const card = wrapper.find('[data-slot="card"]')

  expect(card.prop('data-size')).toBe('sm')
  expect(card.hasClass('data-[size=sm]:py-3')).toBe(true)
  expect(wrapper.find('[data-slot="card-header"]').hasClass('px-0')).toBe(false)
  expect(wrapper.find('[data-slot="card-content"]').hasClass('p-0')).toBe(false)
})

it('does not leak facade-only props onto the semantic or Card roots', () => {
  const root = mount(
    <Section noPadding size="sm" title="Private props">
      Body
    </Section>
  ).find('section')
  const card = root.find('[data-slot="card"]')

  expect(root.getDOMNode().hasAttribute('noPadding')).toBe(false)
  expect(root.getDOMNode().hasAttribute('size')).toBe(false)
  expect(root.getDOMNode().hasAttribute('title')).toBe(false)
  expect(card.getDOMNode().hasAttribute('noPadding')).toBe(false)
  expect(card.getDOMNode().hasAttribute('title')).toBe(false)
})
