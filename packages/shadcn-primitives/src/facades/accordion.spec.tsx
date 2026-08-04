import * as React from 'react'
import { mount } from 'enzyme'
import { Simulate } from 'react-dom/test-utils'

import { Accordion, AccordionItem } from './accordion'

it('exposes the item through both the static and named APIs', () => {
  expect(Accordion.Item).toBe(AccordionItem)
})

it('renders each legacy item as a shadcn trigger', () => {
  const wrapper = mount(
    <Accordion active={0}>
      <Accordion.Item title="First">Content one</Accordion.Item>
      <Accordion.Item title="Second">Content two</Accordion.Item>
    </Accordion>
  )
  const root = wrapper.getDOMNode()

  expect(root.getAttribute('data-slot')).toBe('accordion')
  expect(root.querySelectorAll('[data-slot="accordion-item"]').length).toBe(2)
  expect(root.querySelectorAll('[data-slot="accordion-trigger"]').length).toBe(
    2
  )

  const triggers = root.querySelectorAll('[data-slot="accordion-trigger"]')
  expect(triggers[0].textContent).toContain('First')
  expect(triggers[1].textContent).toContain('Second')

  // `active` is accepted but behavior-neutral until its legacy docs/runtime
  // mismatch is resolved; the real legacy items initially started closed.
  expect(triggers[0].getAttribute('aria-expanded')).toBe('false')
  expect(triggers[1].getAttribute('aria-expanded')).toBe('false')
})

it('expanding an item fires legacy onChange with (index, active)', () => {
  const onChange = jest.fn()
  const wrapper = mount(
    <Accordion onChange={onChange}>
      <Accordion.Item title="First">Content one</Accordion.Item>
      <Accordion.Item title="Second">Content two</Accordion.Item>
    </Accordion>
  )
  const triggers = wrapper
    .getDOMNode()
    .querySelectorAll('[data-slot="accordion-trigger"]')

  React.act(() => Simulate.click(triggers[1] as HTMLElement))
  wrapper.update()

  expect(onChange).toHaveBeenCalledWith(1, true)
  expect(triggers[1].getAttribute('aria-expanded')).toBe('true')
})

it('collapsing the open item fires legacy onChange with active=false', () => {
  const onChange = jest.fn()
  const wrapper = mount(
    <Accordion onChange={onChange}>
      <Accordion.Item title="First">Content one</Accordion.Item>
      <Accordion.Item title="Second">Content two</Accordion.Item>
    </Accordion>
  )
  const triggers = wrapper
    .getDOMNode()
    .querySelectorAll('[data-slot="accordion-trigger"]')

  React.act(() => Simulate.click(triggers[0] as HTMLElement))
  wrapper.update()
  React.act(() => Simulate.click(triggers[0] as HTMLElement))
  wrapper.update()

  expect(onChange).toHaveBeenLastCalledWith(0, false)
  expect(triggers[0].getAttribute('aria-expanded')).toBe('false')
})

it('preserves the legacy ability to keep multiple items open', () => {
  const wrapper = mount(
    <Accordion>
      <Accordion.Item title="First">Content one</Accordion.Item>
      <Accordion.Item title="Second">Content two</Accordion.Item>
    </Accordion>
  )
  const triggers = wrapper
    .getDOMNode()
    .querySelectorAll('[data-slot="accordion-trigger"]')

  React.act(() => Simulate.click(triggers[0] as HTMLElement))
  wrapper.update()
  React.act(() => Simulate.click(triggers[1] as HTMLElement))
  wrapper.update()

  expect(triggers[0].getAttribute('aria-expanded')).toBe('true')
  expect(triggers[1].getAttribute('aria-expanded')).toBe('true')
})

it('uses raw defaultValue as the initial state and diffs the first close', () => {
  const onChange = jest.fn()
  const wrapper = mount(
    <Accordion defaultValue={[1]} onChange={onChange}>
      <Accordion.Item title="First">Content one</Accordion.Item>
      <Accordion.Item title="Second">Content two</Accordion.Item>
    </Accordion>
  )
  const triggers = wrapper
    .getDOMNode()
    .querySelectorAll('[data-slot="accordion-trigger"]')

  expect(triggers[1].getAttribute('aria-expanded')).toBe('true')
  React.act(() => Simulate.click(triggers[1] as HTMLElement))
  wrapper.update()

  expect(onChange).toHaveBeenLastCalledWith(1, false)
})

it('uses raw controlled value and synchronizes callback diffs after updates', () => {
  const onChange = jest.fn()
  const wrapper = mount(
    <Accordion value={[0]} onChange={onChange}>
      <Accordion.Item title="First">Content one</Accordion.Item>
      <Accordion.Item title="Second">Content two</Accordion.Item>
    </Accordion>
  )
  let triggers = wrapper
    .getDOMNode()
    .querySelectorAll('[data-slot="accordion-trigger"]')

  expect(triggers[0].getAttribute('aria-expanded')).toBe('true')
  React.act(() => wrapper.setProps({ value: [1] }))
  wrapper.update()
  triggers = wrapper
    .getDOMNode()
    .querySelectorAll('[data-slot="accordion-trigger"]')
  expect(triggers[0].getAttribute('aria-expanded')).toBe('false')
  expect(triggers[1].getAttribute('aria-expanded')).toBe('true')

  React.act(() => Simulate.click(triggers[1] as HTMLElement))
  wrapper.update()
  expect(onChange).toHaveBeenLastCalledWith(1, false)
})

it('runs the raw callback first and stops when it cancels the change', () => {
  const onChange = jest.fn()
  const onValueChange = jest.fn((_value, details) => details.cancel())
  const wrapper = mount(
    <Accordion onChange={onChange} onValueChange={onValueChange}>
      <Accordion.Item title="First">Content one</Accordion.Item>
    </Accordion>
  )
  const trigger = wrapper
    .getDOMNode()
    .querySelector('[data-slot="accordion-trigger"]') as HTMLElement

  React.act(() => Simulate.click(trigger))
  wrapper.update()

  expect(onValueChange).toHaveBeenCalledTimes(1)
  expect(onChange).not.toHaveBeenCalled()
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
})

it('forwards className and native props to the root element', () => {
  const wrapper = mount(
    <Accordion className="panels" id="acc" data-testid="acc-root">
      <Accordion.Item title="First">Content one</Accordion.Item>
    </Accordion>
  )
  const root = wrapper.getDOMNode()

  expect(root.getAttribute('id')).toBe('acc')
  expect(root.getAttribute('data-testid')).toBe('acc-root')
  expect(root.className).toContain('panels')
})

it('forwards item className to the shadcn item', () => {
  const wrapper = mount(
    <Accordion>
      <Accordion.Item className="item-x" title="First">
        Content one
      </Accordion.Item>
    </Accordion>
  )
  const item = wrapper
    .getDOMNode()
    .querySelector('[data-slot="accordion-item"]')

  expect(item?.className).toContain('item-x')
})

it('renders root controlIcons and ignores the legacy item-level override', () => {
  const OpenIcon = () => <svg data-icon="root-open" />
  const CloseIcon = () => <svg data-icon="root-close" />
  const ItemIcon = () => <svg data-icon="item" />
  const root = mount(
    <Accordion controlIcons={{ open: OpenIcon, close: CloseIcon }}>
      <Accordion.Item
        title="First"
        controlIcons={{ open: ItemIcon, close: ItemIcon }}
      >
        Content one
      </Accordion.Item>
    </Accordion>
  ).getDOMNode()
  const trigger = root.querySelector('[data-slot="accordion-trigger"]')

  expect(trigger?.querySelector('[data-icon="root-open"]')).toBeTruthy()
  expect(trigger?.querySelector('[data-icon="root-close"]')).toBeTruthy()
  expect(trigger?.querySelector('[data-icon="item"]')).toBeNull()
  expect(trigger?.className).toContain('accordion-trigger-icon')
})

it('preserves non-marker children and forwards the root ref', () => {
  const ref = React.createRef<HTMLDivElement>()
  const root = mount(
    <Accordion ref={ref}>
      <div data-extra="true">Extra content</div>
      <Accordion.Item title="First">Content one</Accordion.Item>
    </Accordion>
  ).getDOMNode()

  expect(root.querySelector('[data-extra="true"]')?.textContent).toBe(
    'Extra content'
  )
  expect(ref.current).toBe(root)
})
