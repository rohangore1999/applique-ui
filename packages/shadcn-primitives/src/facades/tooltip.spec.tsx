import * as React from 'react'
import { mount } from 'enzyme'

import {
  Tooltip as InternalTooltip,
  TooltipContent as InternalTooltipContent,
  TooltipProvider as InternalTooltipProvider,
} from '../tooltip'
import { Tooltip } from './tooltip'

const renderContent = () => <span data-test-id="content">Details</span>

it('uses the first trigger element without nesting it in another button', () => {
  const wrapper = mount(
    <Tooltip renderContent={renderContent}>
      <button type="button">Hover me</button>
      <button type="button">Ignored</button>
    </Tooltip>
  )

  const trigger = wrapper.find('button')
  expect(trigger).toHaveLength(1)
  expect(trigger.prop('data-slot')).toBe('tooltip-trigger')
  expect(trigger.text()).toBe('Hover me')
})

it('wraps a text trigger in a focusable span rather than a default button', () => {
  const wrapper = mount(
    <Tooltip renderContent={renderContent}>Plain text</Tooltip>
  )
  const trigger = wrapper.find('span[data-slot="tooltip-trigger"]').hostNodes()

  expect(trigger.is('span')).toBe(true)
  expect(trigger.prop('tabIndex')).toBe(0)
  expect(trigger.text()).toBe('Plain text')
})

it.each([
  ['up', 'top'],
  ['down', 'bottom'],
  ['left', 'left'],
  ['right', 'right'],
] as const)('maps legacy position %s to shadcn side %s', (position, side) => {
  const wrapper = mount(
    <Tooltip position={position} renderContent={renderContent}>
      <button type="button">Trigger</button>
    </Tooltip>
  )

  expect(wrapper.find(InternalTooltipContent).prop('side')).toBe(side)
})

it('defaults to top when neither placement API is supplied', () => {
  const defaultWrapper = mount(
    <Tooltip renderContent={renderContent}>
      <button type="button">Trigger</button>
    </Tooltip>
  )

  expect(defaultWrapper.find(InternalTooltipContent).prop('side')).toBe('top')
})

it('forwards raw shadcn side when no Applique position is supplied', () => {
  const wrapper = mount(
    <Tooltip renderContent={renderContent} side="right">
      <button type="button">Trigger</button>
    </Tooltip>
  )

  expect(wrapper.find(InternalTooltipContent).prop('side')).toBe('right')
})

it('lets an explicit Applique position override raw shadcn side', () => {
  const wrapper = mount(
    <Tooltip position="down" renderContent={renderContent} side="left">
      <button type="button">Trigger</button>
    </Tooltip>
  )

  expect(wrapper.find(InternalTooltipContent).prop('side')).toBe('bottom')
})

it('keeps className on the facade wrapper and forwards content extensions', () => {
  const wrapper = mount(
    <Tooltip className="tip" id="tip-1" renderContent={renderContent}>
      <button type="button">Trigger</button>
    </Tooltip>
  )
  const facadeWrapper = wrapper.find('[data-applique-tooltip]')
  const content = wrapper.find(InternalTooltipContent)

  expect(facadeWrapper.hasClass('tip')).toBe(true)
  expect(String(content.prop('className')).split(/\s+/)).not.toContain('tip')
  expect(content.prop('id')).toBe('tip-1')
})

it('preserves the legacy light default and dark opt-in on content and its last-child arrow', () => {
  const light = mount(
    <Tooltip renderContent={renderContent}>
      <button type="button">Light</button>
    </Tooltip>
  ).find(InternalTooltipContent)
  const dark = mount(
    <Tooltip dark renderContent={renderContent}>
      <button type="button">Dark</button>
    </Tooltip>
  ).find(InternalTooltipContent)

  expect(light.prop('className')).toContain('bg-popover')
  expect(light.prop('className')).toContain('[&>*:last-child]:bg-popover!')
  expect(light.prop('className')).toContain('[&>*:last-child]:fill-popover!')
  expect(dark.prop('className')).toContain('bg-foreground')
  expect(dark.prop('className')).toContain('[&>*:last-child]:bg-foreground!')
  expect(dark.prop('className')).toContain('[&>*:last-child]:fill-foreground!')
})

it('routes delay props to the provider and open state to the root', () => {
  const onOpenChange = jest.fn()
  const wrapper = mount(
    <Tooltip
      closeDelay={75}
      delay={150}
      open={false}
      onOpenChange={onOpenChange}
      renderContent={renderContent}
    >
      <button type="button">Trigger</button>
    </Tooltip>
  )

  const provider = wrapper.find(InternalTooltipProvider)
  expect(provider.prop('delay')).toBe(150)
  expect(provider.prop('closeDelay')).toBe(75)
  expect(wrapper.find(InternalTooltip).prop('open')).toBe(false)
  expect(wrapper.find(InternalTooltip).prop('onOpenChange')).toBe(onOpenChange)
})

it('wires the render function into deferred tooltip content', () => {
  const wrapper = mount(
    <Tooltip renderContent={renderContent}>
      <button type="button">Trigger</button>
    </Tooltip>
  )
  const deferredBody = wrapper
    .find(InternalTooltipContent)
    .prop('children') as React.ReactElement
  const body = mount(deferredBody)

  expect(body.find('[data-test-id="content"]').text()).toBe('Details')
})

it('accepts unresolved triggerOn without leaking it to content', () => {
  const wrapper = mount(
    <Tooltip renderContent={renderContent} triggerOn="click">
      <button type="button">Trigger</button>
    </Tooltip>
  )
  const content = wrapper.find(InternalTooltipContent)

  expect((content.props() as Record<string, unknown>).triggerOn).toBeUndefined()
})

it('forwards its ref to the stable facade wrapper', () => {
  const ref = React.createRef<HTMLDivElement>()
  mount(
    <Tooltip ref={ref} renderContent={renderContent}>
      <button type="button">Trigger</button>
    </Tooltip>
  )

  expect(ref.current?.hasAttribute('data-applique-tooltip')).toBe(true)
})
