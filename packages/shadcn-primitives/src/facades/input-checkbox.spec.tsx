import * as React from 'react'
import { mount } from 'enzyme'

import { Checkbox as InternalCheckbox } from '../checkbox'
import { InputCheckbox } from './input-checkbox'

it('maps Applique value and htmlValue to the shadcn checkbox', () => {
  const wrapper = mount(
    <InputCheckbox htmlValue="terms" title="Accept terms" value />
  )
  const checkbox = wrapper.find(InternalCheckbox)

  expect(checkbox.prop('checked')).toBe(true)
  expect(checkbox.prop('value')).toBe('terms')
  expect(wrapper.text()).toContain('Accept terms')
})

it('runs the shadcn callback and then maps to the Applique callback', () => {
  const onChange = jest.fn()
  const onCheckedChange = jest.fn()
  const wrapper = mount(
    <InputCheckbox
      onChange={onChange}
      onCheckedChange={onCheckedChange}
      value={false}
    />
  )
  const change = wrapper.find(InternalCheckbox).prop('onCheckedChange') as (
    checked: boolean,
    details: { isCanceled: boolean }
  ) => void
  const details = { isCanceled: false }

  change(true, details)

  expect(onCheckedChange).toHaveBeenCalledWith(true, details)
  expect(onChange).toHaveBeenCalledWith(true)
})

it('keeps the legacy no-value mode controlled and unchecked', () => {
  const wrapper = mount(<InputCheckbox />)
  const checkbox = wrapper.find(InternalCheckbox)

  expect(checkbox.prop('checked')).toBe(false)
  expect(checkbox.prop('defaultChecked')).toBe(undefined)
})

it('keeps explicit shadcn uncontrolled state available', () => {
  const wrapper = mount(<InputCheckbox defaultChecked />)
  const checkbox = wrapper.find(InternalCheckbox)

  expect(checkbox.prop('checked')).toBe(undefined)
  expect(checkbox.prop('defaultChecked')).toBe(true)
  expect(checkbox.prop('readOnly')).toBe(false)
})

it('uses uncontrolled shadcn state for a raw callback-only consumer', () => {
  const wrapper = mount(<InputCheckbox onCheckedChange={() => undefined} />)
  const checkbox = wrapper.find(InternalCheckbox)

  expect(checkbox.prop('checked')).toBe(undefined)
  expect(checkbox.prop('defaultChecked')).toBe(undefined)
})

it('preserves read-only safety, dashbox styling, class target, and ref', () => {
  const ref = React.createRef<HTMLElement>()
  const wrapper = mount(
    <InputCheckbox
      boxtype="dashbox"
      className="terms"
      ref={ref}
      title="Partial"
      value
    />
  )
  const label = wrapper.find('[data-applique-checkbox=""]')
  const checkbox = wrapper.find(InternalCheckbox)

  expect(label.hasClass('terms')).toBe(true)
  expect(checkbox.prop('readOnly')).toBe(true)
  expect(checkbox.prop('data-applique-boxtype')).toBe('dashbox')
  expect(checkbox.prop('className')).toContain('checkbox-indicator')
  expect(ref.current?.tagName).toBe('SPAN')
})
