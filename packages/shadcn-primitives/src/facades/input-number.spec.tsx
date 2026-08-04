import * as React from 'react'
import { mount } from 'enzyme'
import { Simulate } from 'react-dom/test-utils'

import { InputNumber } from './input-number'

it('renders a numeric input and forwards native props', () => {
  const wrapper = mount(
    <InputNumber
      aria-label="Quantity"
      className="quantity"
      max={10}
      min={1}
      value={5}
    />
  )
  const input = wrapper.find('input')

  expect(input.prop('type')).toBe('number')
  expect(input.prop('value')).toBe(5)
  expect(input.prop('min')).toBe(1)
  expect(input.prop('max')).toBe(10)
  expect(input.prop('aria-label')).toBe('Quantity')
  expect(input.hasClass('quantity')).toBe(true)
})

it('maps the browser change event to the Applique number callback', () => {
  const onChange = jest.fn()
  const ref = React.createRef<HTMLInputElement>()
  mount(<InputNumber onChange={onChange} ref={ref} />)
  const element = ref.current as HTMLInputElement

  element.value = '2.5'
  Simulate.change(element)

  expect(onChange).toHaveBeenCalledWith(2.5)

  element.value = ''
  Simulate.change(element)

  expect(onChange).toHaveBeenLastCalledWith(Number.NaN)
})

it('preserves the legacy empty and invalid value behavior', () => {
  expect(
    mount(<InputNumber />)
      .find('input')
      .prop('value')
  ).toBe('')
  expect(
    mount(<InputNumber value="not-a-number" />)
      .find('input')
      .prop('value')
  ).toBe('')
})

it('forwards its ref to the native input', () => {
  const ref = React.createRef<HTMLInputElement>()
  mount(<InputNumber ref={ref} />)

  expect(ref.current?.tagName).toBe('INPUT')
})
