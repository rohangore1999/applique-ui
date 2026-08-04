import * as React from 'react'
import { mount } from 'enzyme'

import { Avatar as InternalAvatar } from '../avatar'
import { Avatar } from './avatar'

it('renders legacy initials with an accessible name', () => {
  const wrapper = mount(<Avatar name="JaneDoe" />)
  const initials = wrapper
    .getDOMNode()
    .querySelector('[data-test-id="initials"]')

  expect(initials?.textContent).toBe('JD')
  expect(wrapper.find(InternalAvatar).prop('aria-label')).toBe('JaneDoe')
  expect(wrapper.find(InternalAvatar).prop('role')).toBe('img')
})

it.each([
  ['small', 'sm', '16px'],
  ['medium', 'default', '32px'],
  ['large', 'lg', '64px'],
] as const)('maps the %s size to %s at %s', (size, expected, dimension) => {
  const wrapper = mount(<Avatar name="Jane Doe" size={size} />)
  const avatar = wrapper.find(InternalAvatar)

  expect(avatar.prop('size')).toBe(expected)
  expect(avatar.prop('style')).toMatchObject({
    height: dimension,
    width: dimension,
  })
  expect(
    wrapper
      .find('[data-test-id="initials"]')
      .first()
      .prop('style')
  ).toEqual({
    fontSize: size === 'small' ? '9px' : size === 'medium' ? '18px' : '36px',
  })
})

it('preserves the legacy inherited size when size is omitted', () => {
  const wrapper = mount(<Avatar name="Jane Doe" />)

  expect(wrapper.find(InternalAvatar).prop('style')).toMatchObject({
    height: '1em',
    width: '1em',
  })
  expect(
    wrapper
      .find('[data-test-id="initials"]')
      .first()
      .prop('style')
  ).toEqual({ fontSize: '0.5625em' })
})

it('preserves the shadcn state-based style extension', () => {
  const wrapper = mount(
    <Avatar
      name="Jane Doe"
      size="large"
      style={() => ({ opacity: 0.5, width: '80px' })}
    />
  )
  const style = wrapper.find(InternalAvatar).prop('style')

  expect(typeof style).toBe('function')
  expect((style as (state: unknown) => React.CSSProperties)({})).toEqual({
    height: '64px',
    opacity: 0.5,
    width: '80px',
  })
})

it('forwards root props, custom children, and its ref', () => {
  const ref = React.createRef<HTMLElement>()
  const wrapper = mount(
    <Avatar aria-label="Account" className="account" name="Jane Doe" ref={ref}>
      <span data-test-id="custom-avatar">Photo</span>
    </Avatar>
  )

  expect(wrapper.find('[data-test-id="initials"]')).toHaveLength(0)
  expect(wrapper.find('[data-test-id="custom-avatar"]').text()).toBe('Photo')
  expect(wrapper.find(InternalAvatar).prop('aria-label')).toBe('Account')
  expect(wrapper.find(InternalAvatar).prop('className')).toBe('account')
  expect(ref.current?.tagName).toBe('SPAN')
})
