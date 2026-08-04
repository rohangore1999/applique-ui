import * as React from 'react'
import { mount } from 'enzyme'

import { Alert as ShadcnAlert } from '../alert'
import { Button as ShadcnButton } from '../button'
import { Banner, BannerActionable } from './banner'

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

function CustomIcon() {
  return <svg data-test-id="custom-icon" />
}

const actionableData = {
  actionButtonText: 'Okay',
  actionToTake: 'Move it to the completed bin',
  color: 'success' as const,
  entityId: '100309334556',
  entityName: 'Item ID',
  feedback: 'Completed!',
  header: 'Adding MasterBags',
  subHeader: 'Deepak Kumar - New Whitefield',
}

it('preserves the default info banner while rendering the shadcn Alert', () => {
  const wrapper = mount(<Banner>An alert message.</Banner>)
  const alert = wrapper.find(ShadcnAlert)
  const root = wrapper.getDOMNode()

  expect(root.tagName).toBe('DIV')
  expect(root.getAttribute('role')).toBe('alert')
  expect(root.getAttribute('data-slot')).toBe('alert')
  expect(root.getAttribute('data-applique-banner-tone')).toBe('info')
  expect(root.className).toContain('bg-[var(--applique-info-background)]')
  expect(alert.prop('variant')).toBe('default')
  expect(root.querySelector('.lucide-circle-alert')).not.toBeNull()
  expect(root.textContent).toContain('An alert message.')
})

it.each([
  ['info', 'default', '--applique-info-background'],
  ['success', 'default', '--applique-success-background'],
  ['warning', 'default', '--applique-warning-background'],
  ['error', 'destructive', '--applique-error-background'],
] as const)(
  'maps the legacy %s semantic tone to the Alert composition',
  (color, variant, backgroundVariable) => {
    const wrapper = mount(<Banner color={color}>Status</Banner>)
    const root = wrapper.getDOMNode()

    expect(wrapper.find(ShadcnAlert).prop('variant')).toBe(variant)
    expect(root.getAttribute('data-applique-banner-tone')).toBe(color)
    expect(root.className).toContain(`bg-[var(${backgroundVariable})]`)
  }
)

it('keeps the legacy info compatibility rule and color precedence', () => {
  const colorWins = mount(
    <Banner color="warning" type="success">
      Warning
    </Banner>
  ).getDOMNode()
  const oldInfoWins = mount(
    <Banner color="error" type="info">
      Info
    </Banner>
  ).getDOMNode()
  const oldPrimary = mount(
    <Banner type={'primary' as any}>Old primary</Banner>
  ).getDOMNode()

  expect(colorWins.getAttribute('data-applique-banner-tone')).toBe('warning')
  expect(oldInfoWins.getAttribute('data-applique-banner-tone')).toBe('info')
  expect(oldPrimary.getAttribute('data-applique-banner-tone')).toBe('info')
})

it('gives an explicit legacy tone precedence over the shadcn variant', () => {
  const wrapper = mount(
    <Banner color="success" variant="destructive">
      Saved
    </Banner>
  )
  const root = wrapper.getDOMNode()

  expect(wrapper.find(ShadcnAlert).prop('variant')).toBe('default')
  expect(root.className).toContain('bg-[var(--applique-success-background)]')
  expect(root.className).not.toContain('text-destructive')
})

it('keeps a non-conflicting raw shadcn variant extension available', () => {
  const wrapper = mount(<Banner variant="destructive">Danger</Banner>)
  const root = wrapper.getDOMNode()

  expect(wrapper.find(ShadcnAlert).prop('variant')).toBe('destructive')
  expect(root.getAttribute('data-applique-banner-tone')).toBeNull()
  expect(root.className).toContain('text-destructive')
  expect(root.querySelector('.lucide-triangle-alert')).not.toBeNull()
})

it('splits title and body exactly when the legacy title is truthy', () => {
  const withTitle = mount(
    <Banner title="Upload complete">
      <span>New data is available.</span>
    </Banner>
  )
  const withoutTitle = mount(<Banner>Heading only</Banner>)

  expect(
    withTitle.find('[data-slot="alert-title"]').getDOMNode().textContent
  ).toBe('Upload complete')
  expect(
    withTitle.find('[data-slot="alert-description"]').getDOMNode().textContent
  ).toBe('New data is available.')
  expect(withoutTitle.find('[data-slot="alert-title"]').text()).toBe(
    'Heading only'
  )
  expect(withoutTitle.find('[data-slot="alert-description"]')).toHaveLength(0)
})

it('derives, customizes, and removes the legacy icon', () => {
  const error = mount(<Banner color="error">Error</Banner>)
  const custom = mount(<Banner icon={CustomIcon}>Custom</Banner>)
  const stringIcon = mount(<Banner icon="bomb">String icon</Banner>)
  const withoutIcon = mount(<Banner icon={null}>No icon</Banner>)

  expect(
    error.getDOMNode().querySelector('.lucide-triangle-alert')
  ).not.toBeNull()
  expect(custom.find('[data-test-id="custom-icon"]')).toHaveLength(1)
  expect(
    stringIcon.getDOMNode().querySelector('[data-applique-icon="bomb"]')
  ).not.toBeNull()
  expect(stringIcon.getDOMNode().querySelector('use')).toBeNull()
  expect(withoutIcon.find('[data-test-id="icon"]')).toHaveLength(0)
})

it('renders every supported legacy icon name without an SVG sprite', () => {
  for (const name of knownLegacyIconNames) {
    const wrapper = mount(<Banner icon={name}>Known icon</Banner>)
    const root = wrapper.getDOMNode()

    expect(root.querySelector(`[data-applique-icon="${name}"]`)).not.toBeNull()
    expect(root.querySelector('use')).toBeNull()
    wrapper.unmount()
  }
})

it('warns and renders a visible fallback for an unknown legacy icon name', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

  try {
    const wrapper = mount(<Banner icon="missing-banner-icon">Fallback</Banner>)
    const root = wrapper.getDOMNode()

    expect(
      root.querySelector('[data-applique-icon-fallback="missing-banner-icon"]')
    ).not.toBeNull()
    expect(root.querySelector('use')).toBeNull()
    expect(warn).toHaveBeenCalledWith(
      '[Applique Banner] Unknown legacy icon "missing-banner-icon". Rendering the fallback icon.'
    )
  } finally {
    warn.mockRestore()
  }
})

it('renders React element and forwardRef exotic icon inputs', () => {
  const ForwardRefIcon = React.forwardRef<SVGSVGElement>((_props, ref) => (
    <svg ref={ref} data-test-id="banner-forward-ref-icon" />
  ))
  const element = mount(
    <Banner icon={<svg data-test-id="banner-element-icon" />}>Element</Banner>
  )
  const exotic = mount(<Banner icon={ForwardRefIcon}>Exotic</Banner>)

  expect(element.find('[data-test-id="banner-element-icon"]')).toHaveLength(1)
  expect(exotic.find('[data-test-id="banner-forward-ref-icon"]')).toHaveLength(
    1
  )
})

it('composes the legacy external link with a trailing icon', () => {
  const wrapper = mount(
    <Banner
      link={{ href: 'https://www.myntra.com', displayText: 'See more' }}
      title="Critical error"
    >
      The service cannot be reached.
    </Banner>
  )
  const link = wrapper.getDOMNode().querySelector('[data-test-id="link"]')

  expect(link?.tagName).toBe('A')
  expect(link?.getAttribute('href')).toBe('https://www.myntra.com')
  expect(link?.getAttribute('target')).toBe('_blank')
  expect(link?.textContent).toContain('See more')
  expect(link?.querySelector('[data-icon="inline-end"]')).not.toBeNull()
  expect(
    wrapper
      .find(ShadcnButton)
      .filterWhere((node) => node.prop('data-test-id') === 'link')
      .prop('variant')
  ).toBe('link')
})

it('omits an incomplete legacy link without throwing during render', () => {
  const missingText = mount(
    <Banner link={{ href: '/details' } as any}>Missing display text</Banner>
  ).getDOMNode()
  const missingHref = mount(
    <Banner link={{ displayText: 'Details' } as any}>Missing href</Banner>
  ).getDOMNode()

  expect(missingText.getAttribute('data-applique-incomplete-link')).toBe('')
  expect(missingText.querySelector('[data-test-id="link"]')).toBeNull()
  expect(missingHref.getAttribute('data-applique-incomplete-link')).toBe('')
  expect(missingHref.querySelector('[data-test-id="link"]')).toBeNull()
})

it('composes an accessible dismiss Button and invokes onClose', () => {
  const onClose = jest.fn()
  const wrapper = mount(<Banner onClose={onClose}>Closable</Banner>)
  const close = wrapper.find('button[data-test-id="close"]')

  expect(close.prop('type')).toBe('button')
  expect(close.prop('aria-label')).toBe('Close')
  close.simulate('click')
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('forwards native Alert props, role, and ref', () => {
  const ref = React.createRef<HTMLDivElement>()
  const onClick = jest.fn()
  const wrapper = mount(
    <Banner
      ref={ref}
      aria-label="Service status"
      data-client="orders"
      id="service-banner"
      role="status"
      onClick={onClick}
    >
      Status
    </Banner>
  )
  const root = wrapper.getDOMNode()

  expect(root.getAttribute('id')).toBe('service-banner')
  expect(root.getAttribute('data-client')).toBe('orders')
  expect(root.getAttribute('aria-label')).toBe('Service status')
  expect(root.getAttribute('role')).toBe('status')
  expect(ref.current).toBe(root)
  wrapper.find(ShadcnAlert).simulate('click')
  expect(onClick).toHaveBeenCalledTimes(1)
})

it('applies facade-owned layout and tone after conflicting client classes', () => {
  const root = mount(
    <Banner
      className="rounded-full bg-red-500 px-20 py-20 text-red-500"
      color="success"
      noFill
      solid
    >
      Saved
    </Banner>
  ).getDOMNode()

  expect(root.className).not.toContain('rounded-full')
  expect(root.className).not.toContain('bg-red-500')
  expect(root.className).not.toContain('px-20')
  expect(root.className).not.toContain('py-20')
  expect(root.className).not.toContain('text-red-500')
  expect(root.className).toContain('rounded-sm')
  expect(root.className).toContain('bg-[var(--applique-success-background)]')
  expect(root.hasAttribute('solid')).toBe(false)
  expect(root.hasAttribute('noFill')).toBe(false)
})

it('exposes the actionable facade through the legacy static API', () => {
  expect(Banner.Actionable).toBe(BannerActionable)
  expect(Banner.Actionable.displayName).toBe('Banner.Actionable')
})

it('renders nothing when actionable data is absent', () => {
  const wrapper = mount(<Banner.Actionable />)

  expect(wrapper.html()).toBeNull()
})

it('preserves the active legacy Actionable color behavior by default', () => {
  const wrapper = mount(<Banner.Actionable data={actionableData} />)
  const root = wrapper.getDOMNode()

  expect(root.getAttribute('data-applique-banner-actionable')).toBe('')
  expect(root.getAttribute('data-applique-banner-tone')).toBe('info')
  expect(root.className).toContain('fixed')
  expect(root.className).toContain('bg-[var(--applique-info-background)]')
  expect(wrapper.find(ShadcnAlert).prop('variant')).toBe('default')
  expect(root.querySelector('.lucide-circle-alert')).not.toBeNull()
  expect(wrapper.find('[data-test-id="header"]').text()).toContain(
    'Adding MasterBags'
  )
  expect(wrapper.find('[data-test-id="header"]').text()).toContain(
    'Deepak Kumar - New Whitefield'
  )
  expect(wrapper.find('[data-test-id="feedback"]').text()).toBe('Completed!')
  expect(wrapper.find('[data-test-id="entity-name"]').text()).toBe('Item ID')
  expect(wrapper.find('[data-test-id="entity-id"]').text()).toBe('100309334556')
  expect(wrapper.find('[data-test-id="action-to-take"]').text()).toBe(
    'Move it to the completed bin'
  )
  expect(wrapper.find('button[data-test-id="action"]').text()).toBe('Okay')
})

it.each(['success', 'warning', 'error'] as const)(
  'uses Actionable type=%s only when color is absent',
  (type) => {
    const root = mount(
      <Banner.Actionable data={{ ...actionableData, color: undefined, type }} />
    ).getDOMNode()

    expect(root.getAttribute('data-applique-banner-tone')).toBe(type)
  }
)

it('keeps the Actionable takeover Alert-based pending Dialog semantics', () => {
  const wrapper = mount(<Banner.Actionable data={actionableData} />)
  const root = wrapper.getDOMNode()

  expect(root.getAttribute('role')).toBe('alert')
  expect(root.getAttribute('aria-modal')).toBeNull()
  expect(wrapper.find('[role="dialog"]')).toHaveLength(0)
})

it('wires the actionable action and close callbacks', () => {
  const onActionClick = jest.fn()
  const onClose = jest.fn()
  const wrapper = mount(
    <Banner.Actionable data={{ ...actionableData, onActionClick, onClose }} />
  )

  wrapper.find('button[data-test-id="action"]').simulate('click')
  wrapper.find('button[data-test-id="close"]').simulate('click')

  expect(onActionClick).toHaveBeenCalledTimes(1)
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('keeps Actionable className ignored while forwarding other root props and ref', () => {
  const ref = React.createRef<HTMLDivElement>()
  const wrapper = mount(
    <Banner.Actionable
      ref={ref}
      aria-label="Scanner feedback"
      className="legacy-client-class"
      data={actionableData}
      id="scanner-feedback"
      role="status"
    />
  )
  const root = wrapper.getDOMNode()

  expect(root.className).not.toContain('legacy-client-class')
  expect(root.getAttribute('id')).toBe('scanner-feedback')
  expect(root.getAttribute('aria-label')).toBe('Scanner feedback')
  expect(root.getAttribute('role')).toBe('status')
  expect(ref.current).toBe(root)
})

it('uses the actionable default tone and omits optional controls', () => {
  const wrapper = mount(
    <Banner.Actionable
      data={{
        actionButtonText: '',
        actionToTake: 'Review the item',
        icon: null,
      }}
    />
  )
  const root = wrapper.getDOMNode()

  expect(root.getAttribute('data-applique-banner-tone')).toBe('info')
  expect(wrapper.find('[data-test-id="icon"]')).toHaveLength(0)
  expect(wrapper.find('[data-test-id="action"]')).toHaveLength(0)
  expect(wrapper.find('[data-test-id="close"]')).toHaveLength(0)
})
