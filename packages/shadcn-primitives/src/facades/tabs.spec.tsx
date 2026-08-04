import * as React from 'react'
import { mount } from 'enzyme'

import { Tabs as InternalTabs } from '../tabs'
import { Tab, Tabs } from './tabs'

it('exposes the tab through both the static and named APIs', () => {
  expect(Tabs.Tab).toBe(Tab)
})

function renderTwoTabs(props: React.ComponentProps<typeof Tabs> = {}) {
  return mount(
    <Tabs {...props}>
      <Tabs.Tab title="One">Panel one</Tabs.Tab>
      <Tabs.Tab title="Two">Panel two</Tabs.Tab>
    </Tabs>
  )
}

it('renders a trigger per tab and shows the active panel', () => {
  const root = renderTwoTabs().getDOMNode()

  const triggers = root.querySelectorAll('[data-slot="tabs-trigger"]')
  expect(triggers.length).toBe(2)
  expect(triggers[0].textContent).toBe('One')
  expect(triggers[1].textContent).toBe('Two')

  // base-ui panels are lazily mounted; the first tab is active by default.
  const panels = root.querySelectorAll('[data-slot="tabs-content"]')
  expect(panels.length).toBeGreaterThanOrEqual(1)
  expect(root.textContent).toContain('Panel one')
})

it('maps index<->value: selecting a tab fires the legacy onChange with its index', () => {
  const onChange = jest.fn()
  const wrapper = renderTwoTabs({ onChange })

  wrapper
    .find('[data-slot="tabs-trigger"]')
    .hostNodes()
    .at(1)
    .simulate('click')

  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onChange).toHaveBeenCalledWith(1)
})

it('reflects a controlled activeIndex', () => {
  const root = renderTwoTabs({
    activeIndex: 1,
    onChange: () => {},
  }).getDOMNode()

  const triggers = root.querySelectorAll('[data-slot="tabs-trigger"]')
  expect(triggers[0].hasAttribute('data-active')).toBe(false)
  expect(triggers[1].hasAttribute('data-active')).toBe(true)

  // Only the active tab's panel content is visible.
  expect(root.textContent).toContain('Panel two')
  expect(root.textContent).not.toContain('Panel one')
})

it('supports raw controlled and uncontrolled shadcn values', () => {
  const controlledRoot = renderTwoTabs({ value: 1 }).getDOMNode()
  const uncontrolledRoot = renderTwoTabs({ defaultValue: 1 }).getDOMNode()

  expect(
    controlledRoot
      .querySelectorAll('[data-slot="tabs-trigger"]')[1]
      .hasAttribute('data-active')
  ).toBe(true)
  expect(
    uncontrolledRoot
      .querySelectorAll('[data-slot="tabs-trigger"]')[1]
      .hasAttribute('data-active')
  ).toBe(true)
})

it('gives Applique index props precedence over raw shadcn values', () => {
  const controlledRoot = renderTwoTabs({
    activeIndex: 0,
    value: 1,
  }).getDOMNode()
  const uncontrolledRoot = renderTwoTabs({
    defaultIndex: 0,
    defaultValue: 1,
  }).getDOMNode()

  expect(
    controlledRoot
      .querySelectorAll('[data-slot="tabs-trigger"]')[0]
      .hasAttribute('data-active')
  ).toBe(true)
  expect(
    uncontrolledRoot
      .querySelectorAll('[data-slot="tabs-trigger"]')[0]
      .hasAttribute('data-active')
  ).toBe(true)
})

it('falls back from a disabled controlled index to the first enabled tab', () => {
  const root = mount(
    <Tabs activeIndex={0} onChange={() => undefined}>
      <Tabs.Tab disabled title="Disabled">
        Disabled panel
      </Tabs.Tab>
      <Tabs.Tab title="Enabled">Enabled panel</Tabs.Tab>
      <Tabs.Tab title="Other">Other panel</Tabs.Tab>
    </Tabs>
  ).getDOMNode()
  const triggers = root.querySelectorAll('[data-slot="tabs-trigger"]')

  expect(triggers[0].hasAttribute('data-active')).toBe(false)
  expect(triggers[1].hasAttribute('data-active')).toBe(true)
  expect(root.textContent).toContain('Enabled panel')
})

it('composes the shadcn onValueChange before the legacy onChange', () => {
  const calls: string[] = []
  const onValueChange = jest.fn((_value: unknown) => calls.push('shadcn'))
  const onChange = jest.fn((_index: number) => calls.push('applique'))

  mount(
    <Tabs onValueChange={onValueChange} onChange={onChange}>
      <Tabs.Tab title="One">a</Tabs.Tab>
      <Tabs.Tab title="Two">b</Tabs.Tab>
    </Tabs>
  )
    .find('[data-slot="tabs-trigger"]')
    .hostNodes()
    .at(1)
    .simulate('click')

  expect(onValueChange).toHaveBeenCalledTimes(1)
  expect(onValueChange.mock.calls[0][0]).toBe(1)
  expect(onChange).toHaveBeenCalledWith(1)
  expect(calls).toEqual(['shadcn', 'applique'])
})

it('honors cancellation before calling the legacy callback or changing tabs', () => {
  const onChange = jest.fn()
  const onValueChange = jest.fn((_value, details) => details.cancel())
  const wrapper = renderTwoTabs({ onChange, onValueChange })
  const triggers = wrapper
    .getDOMNode()
    .querySelectorAll('[data-slot="tabs-trigger"]')
  ;(triggers[1] as HTMLElement).click()
  wrapper.update()

  expect(onValueChange).toHaveBeenCalledTimes(1)
  expect(onChange).not.toHaveBeenCalled()
  expect(triggers[0].hasAttribute('data-active')).toBe(true)
  expect(triggers[1].hasAttribute('data-active')).toBe(false)
})

it('does not turn an automatic null fallback into legacy index zero', () => {
  const onChange = jest.fn()
  const onValueChange = jest.fn()
  const wrapper = renderTwoTabs({ onChange, onValueChange })
  const change = wrapper
    .find(InternalTabs)
    .prop('onValueChange') as NonNullable<
    React.ComponentProps<typeof InternalTabs>['onValueChange']
  >
  const details = {
    isCanceled: false,
    reason: 'missing',
  } as Parameters<typeof change>[1]

  change(null, details)

  expect(onValueChange).toHaveBeenCalledWith(null, details)
  expect(onChange).not.toHaveBeenCalled()
})

it('does not forward the deferred `type` prop', () => {
  const root = renderTwoTabs({ type: 'secondary' }).getDOMNode()
  expect(root.getAttribute('type')).toBeNull()
})

it('forwards className and native props to the root', () => {
  const root = renderTwoTabs({
    className: 'my-tabs',
    id: 'tabs-1',
  }).getDOMNode()

  expect(root.getAttribute('data-slot')).toBe('tabs')
  expect(root.getAttribute('id')).toBe('tabs-1')
  expect(root.className).toContain('my-tabs')
})

it('forwards list variant and safe tab props while keeping isActive internal', () => {
  const root = mount(
    <Tabs variant="line">
      <Tabs.Tab
        title="One"
        id="tab-one"
        data-client-tab="one"
        aria-label="First tab"
        isActive
      >
        Panel one
      </Tabs.Tab>
    </Tabs>
  ).getDOMNode()
  const list = root.querySelector('[data-slot="tabs-list"]')
  const trigger = root.querySelector('[data-slot="tabs-trigger"]')

  expect(list?.getAttribute('data-variant')).toBe('line')
  expect(trigger?.getAttribute('id')).toBe('tab-one')
  expect(trigger?.getAttribute('data-client-tab')).toBe('one')
  expect(trigger?.getAttribute('aria-label')).toBe('First tab')
  expect(trigger?.hasAttribute('isActive')).toBe(false)
})

it('returns null without tabs and forwards the root ref otherwise', () => {
  expect(mount(<Tabs />).isEmptyRender()).toBe(true)

  const ref = React.createRef<HTMLDivElement>()
  renderTwoTabs({ ref })
  expect(ref.current?.getAttribute('data-slot')).toBe('tabs')
})

it('ignores unrelated elements instead of creating malformed tabs', () => {
  const root = mount(
    <Tabs>
      <div data-unrelated="true">Not a tab</div>
      <Tabs.Tab title="One">Panel one</Tabs.Tab>
    </Tabs>
  ).getDOMNode()

  expect(root.querySelectorAll('[data-slot="tabs-trigger"]')).toHaveLength(1)
  expect(root.querySelector('[data-unrelated="true"]')).toBeNull()
})
