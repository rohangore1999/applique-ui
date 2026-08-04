import * as React from 'react'
import { mount } from 'enzyme'

import { Badge } from './badge'

const knownLegacyIconNames = [
  'arrow-to-bottom',
  'barcode-scan',
  'bomb',
  'calendar',
  'calender',
  'check',
  'chevron-right',
  'download',
  'info',
  'search',
  'spinner',
  'spinnersolid',
  'thumbs-down',
  'thumbs-up',
] as const

it('preserves the legacy defaults on a div-backed shadcn badge', () => {
  const root = mount(<Badge>Default</Badge>).getDOMNode()

  expect(root.tagName).toBe('DIV')
  expect(root.getAttribute('data-slot')).toBe('badge')
  expect(root.className).toContain('bg-[var(--applique-info-background)]')
  expect(root.className).toContain('text-[var(--applique-info-foreground)]')
  expect(root.className).toContain('leading-6')
})

it.each([
  ['info', '--applique-info-background', '--applique-info-foreground'],
  ['success', '--applique-success-background', '--applique-success-foreground'],
  ['warning', '--applique-warning-background', '--applique-warning-foreground'],
  ['error', '--applique-error-background', '--applique-error-foreground'],
] as const)(
  'applies the %s semantic palette',
  (type, backgroundVariable, foregroundVariable) => {
    const root = mount(<Badge type={type}>Status</Badge>).getDOMNode()

    expect(root.className).toContain(`bg-[var(${backgroundVariable})]`)
    expect(root.className).toContain(`text-[var(${foregroundVariable})]`)
  }
)

it('maps solid and outlined while keeping the semantic surface', () => {
  const solid = mount(
    <Badge type="success" variant="solid">
      Solid
    </Badge>
  ).getDOMNode()
  const outlined = mount(
    <Badge type="success" variant="outlined">
      Outlined
    </Badge>
  ).getDOMNode()

  expect(solid.className).toContain(
    'border-[var(--applique-success-background)]'
  )
  expect(outlined.className).toContain(
    'border-[var(--applique-success-foreground)]'
  )
  expect(outlined.className).toContain(
    'bg-[var(--applique-success-background)]'
  )
})

it('preserves small and regular dimensions', () => {
  const small = mount(<Badge size="small">Small</Badge>).getDOMNode()
  const regular = mount(<Badge size="regular">Regular</Badge>).getDOMNode()

  expect(small.className).toContain('leading-none')
  expect(small.className).not.toContain('leading-6')
  expect(regular.className).toContain('leading-6')
  expect(regular.className).not.toContain('leading-none')
})

it('renders a decorative leading icon before the label', () => {
  function CheckIcon() {
    return <svg data-test-id="check-component" />
  }

  const wrapper = mount(<Badge icon={CheckIcon}>With icon</Badge>)
  const icon = wrapper.find('[data-test-id="icon"]')

  expect(icon.prop('aria-hidden')).toBe('true')
  expect(icon.find('[data-test-id="check-component"]').exists()).toBe(true)
  expect(icon.getDOMNode().nextSibling?.textContent).toContain('With icon')
})

it('renders known legacy icon names as self-contained lucide SVGs', () => {
  for (const name of knownLegacyIconNames) {
    const wrapper = mount(<Badge icon={name}>Known icon</Badge>)
    const root = wrapper.getDOMNode()

    expect(root.querySelector(`[data-applique-icon="${name}"]`)).not.toBeNull()
    expect(root.querySelector('use')).toBeNull()
    wrapper.unmount()
  }
})

it('warns and renders a visible fallback for an unknown legacy icon name', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

  try {
    const wrapper = mount(<Badge icon="missing-badge-icon">Fallback</Badge>)
    const root = wrapper.getDOMNode()

    expect(
      root.querySelector('[data-applique-icon-fallback="missing-badge-icon"]')
    ).not.toBeNull()
    expect(root.querySelector('use')).toBeNull()
    expect(warn).toHaveBeenCalledWith(
      '[Applique Badge] Unknown legacy icon "missing-badge-icon". Rendering the fallback icon.'
    )
  } finally {
    warn.mockRestore()
  }
})

it('renders React element and forwardRef exotic icon inputs', () => {
  const ForwardRefIcon = React.forwardRef<SVGSVGElement>((_props, ref) => (
    <svg ref={ref} data-test-id="badge-forward-ref-icon" />
  ))
  const element = mount(
    <Badge icon={<svg data-test-id="badge-element-icon" />}>Element</Badge>
  )
  const exotic = mount(<Badge icon={ForwardRefIcon}>Exotic</Badge>)

  expect(element.find('[data-test-id="badge-element-icon"]')).toHaveLength(1)
  expect(exotic.find('[data-test-id="badge-forward-ref-icon"]')).toHaveLength(1)
})

it('renders a sized accessible dismiss control and invokes onClose', () => {
  const onClose = jest.fn()
  const wrapper = mount(<Badge onClose={onClose}>Closable</Badge>)
  const close = wrapper.find('button[data-test-id="close"]')

  expect(close.prop('type')).toBe('button')
  expect(close.prop('aria-label')).toBe('Close')
  expect(close.find('svg').hasClass('size-2')).toBe(true)
  close.simulate('click')
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('keeps a non-interactive root when the Applique dismiss control is used', () => {
  const root = mount(
    <Badge onClose={() => undefined} render={<a href="#details" />}>
      Closable
    </Badge>
  ).getDOMNode()

  expect(root.tagName).toBe('DIV')
  expect(root.querySelector('button[data-test-id="close"]')).not.toBeNull()
})

it('applies compatibility classes after conflicting client utility classes', () => {
  const root = mount(
    <Badge className="h-20 bg-red-500 border-red-500 text-black" type="error">
      Error
    </Badge>
  ).getDOMNode()

  expect(root.className).not.toContain('h-20')
  expect(root.className).not.toContain('bg-red-500')
  expect(root.className).not.toContain('border-red-500')
  expect(root.className).not.toContain('text-black')
  expect(root.className).toContain('bg-[var(--applique-error-background)]')
})

it('forwards native props, ref, and an explicit shadcn render extension', () => {
  const ref = React.createRef<HTMLElement>()
  const wrapper = mount(
    <Badge ref={ref} aria-label="status" id="b1" render={<a href="#details" />}>
      Details
    </Badge>
  )
  const root = wrapper.getDOMNode()

  expect(root.tagName).toBe('A')
  expect(root.getAttribute('href')).toBe('#details')
  expect(root.getAttribute('id')).toBe('b1')
  expect(root.getAttribute('aria-label')).toBe('status')
  expect(ref.current).toBe(root)
})
