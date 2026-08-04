import * as React from 'react'
import { mount } from 'enzyme'
import { Simulate } from 'react-dom/test-utils'

import { InputText } from './input-text'

it('preserves the basic Applique defaults and forwards native props', () => {
  const wrapper = mount(
    <InputText aria-label="Name" className="name" maxLength={20} />
  )
  const input = wrapper.find('input')

  expect(input.prop('type')).toBe('text')
  expect(input.prop('value')).toBe('')
  expect(input.prop('placeholder')).toBe(' ')
  expect(input.prop('maxLength')).toBe(20)
  expect(input.prop('aria-label')).toBe('Name')
  expect(input.hasClass('name')).toBe(true)
})

it('maps the browser event to the Applique string callback', () => {
  const onChange = jest.fn()
  const ref = React.createRef<HTMLInputElement>()
  mount(<InputText onChange={onChange} ref={ref} value="before" />)

  const element = ref.current as HTMLInputElement
  element.value = 'after'
  Simulate.change(element)

  expect(onChange).toHaveBeenCalledWith('after')
})

it('forwards its ref and supported input type', () => {
  const ref = React.createRef<HTMLInputElement>()
  mount(<InputText ref={ref} type="email" />)

  expect(ref.current?.tagName).toBe('INPUT')
  expect(ref.current?.type).toBe('email')
})
