import * as React from 'react'
import { mount } from 'enzyme'

import { BreadCrumb, BreadCrumbItem } from './bread-crumb'

it('exposes the item through both the static and named APIs', () => {
  expect(BreadCrumb.Item).toBe(BreadCrumbItem)
})

it('renders items inside a breadcrumb list with auto-inserted separators', () => {
  const wrapper = mount(
    <BreadCrumb>
      <BreadCrumb.Item>
        <a href="/">Home</a>
      </BreadCrumb.Item>
      <BreadCrumb.Item>
        <a href="/orders">Orders</a>
      </BreadCrumb.Item>
      <BreadCrumb.Item>Detail</BreadCrumb.Item>
    </BreadCrumb>
  )
  const root = wrapper.getDOMNode()

  expect(root.getAttribute('data-slot')).toBe('breadcrumb')
  expect(root.querySelector('[data-slot="breadcrumb-list"]')).toBeTruthy()
  expect(root.querySelectorAll('[data-slot="breadcrumb-item"]').length).toBe(3)
  // N items => N-1 separators, matching the legacy CSS-drawn dividers.
  expect(
    root.querySelectorAll('[data-slot="breadcrumb-separator"]').length
  ).toBe(2)
  expect(root.querySelector('[data-slot="breadcrumb-page"]')?.textContent).toBe(
    'Detail'
  )
})

it('adds no separator for a single item', () => {
  const wrapper = mount(
    <BreadCrumb>
      <BreadCrumb.Item>Home</BreadCrumb.Item>
    </BreadCrumb>
  )
  expect(
    wrapper.getDOMNode().querySelectorAll('[data-slot="breadcrumb-separator"]')
      .length
  ).toBe(0)
})

it('forwards className and native props to the nav element', () => {
  const wrapper = mount(
    <BreadCrumb className="crumbs" id="bc" aria-label="trail">
      <BreadCrumb.Item>Home</BreadCrumb.Item>
    </BreadCrumb>
  )
  const root = wrapper.getDOMNode()

  expect(root.getAttribute('id')).toBe('bc')
  expect(root.getAttribute('aria-label')).toBe('trail')
  expect(root.className).toContain('crumbs')
})

it('forwards item className and children', () => {
  const wrapper = mount(
    <BreadCrumb>
      <BreadCrumb.Item className="x">Home</BreadCrumb.Item>
    </BreadCrumb>
  )
  const item = wrapper
    .getDOMNode()
    .querySelector('[data-slot="breadcrumb-item"]')

  expect(item?.className).toContain('x')
  expect(item?.textContent).toBe('Home')
})

it('turns a final plain anchor into the non-navigating current page', () => {
  const root = mount(
    <BreadCrumb>
      <BreadCrumb.Item>
        <a href="/">Home</a>
      </BreadCrumb.Item>
      <BreadCrumb.Item>
        <a href="/orders">Orders</a>
      </BreadCrumb.Item>
    </BreadCrumb>
  ).getDOMNode()
  const currentPage = root.querySelector('[data-slot="breadcrumb-page"]')

  expect(currentPage?.getAttribute('aria-current')).toBe('page')
  expect(currentPage?.textContent).toBe('Orders')
  expect(currentPage?.querySelector('a')).toBeNull()
})

it('forwards item events and the root ref', () => {
  const onClick = jest.fn()
  const ref = React.createRef<HTMLElement>()
  const wrapper = mount(
    <BreadCrumb ref={ref}>
      <BreadCrumb.Item onClick={onClick}>Home</BreadCrumb.Item>
      <BreadCrumb.Item>Current</BreadCrumb.Item>
    </BreadCrumb>
  )

  wrapper
    .find('[data-slot="breadcrumb-item"]')
    .hostNodes()
    .first()
    .simulate('click')

  expect(onClick).toHaveBeenCalledTimes(1)
  expect(ref.current?.tagName).toBe('NAV')
})

it('preserves non-marker children instead of treating them as crumbs', () => {
  const root = mount(
    <BreadCrumb>
      <li data-custom="true">Custom</li>
      <BreadCrumb.Item>Home</BreadCrumb.Item>
    </BreadCrumb>
  ).getDOMNode()

  expect(root.querySelector('[data-custom="true"]')?.textContent).toBe('Custom')
  expect(
    root.querySelectorAll('[data-slot="breadcrumb-separator"]')
  ).toHaveLength(0)
})
