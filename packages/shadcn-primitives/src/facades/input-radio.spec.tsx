import * as React from 'react'
import { mount } from 'enzyme'

import { RadioGroup as InternalRadioGroup } from '../radio-group'
import { InputRadio } from './input-radio'

const options = [
  { label: 'Pass', value: 'ok' },
  { title: 'Retry', value: 'retry' },
]

it('composes one shadcn radio item for every legacy option', () => {
  const wrapper = mount(<InputRadio options={options} value="ok" />)
  const root = wrapper.getDOMNode()

  expect(root.matches('[data-test-id="group"]')).toBe(true)
  expect(root.querySelectorAll('[data-slot="radio-group-item"]')).toHaveLength(
    2
  )
  expect(root.textContent).toContain('Pass')
  expect(root.textContent).toContain('Retry')
})

it('runs the shadcn callback and then maps to the Applique callback', () => {
  const onChange = jest.fn()
  const onValueChange = jest.fn()
  const wrapper = mount(
    <InputRadio
      onChange={onChange}
      onValueChange={onValueChange}
      options={options}
    />
  )
  const change = wrapper.find(InternalRadioGroup).prop('onValueChange') as (
    value: string,
    details: { isCanceled: boolean }
  ) => void
  const details = { isCanceled: false }

  change('retry', details)

  expect(onValueChange).toHaveBeenCalledWith('retry', details)
  expect(onChange).toHaveBeenCalledWith('retry')
})

it('keeps the legacy no-value mode controlled and unselected', () => {
  const wrapper = mount(<InputRadio options={options} />)
  const group = wrapper.find(InternalRadioGroup)

  expect(group.prop('value')).toBe(null)
  expect(group.prop('defaultValue')).toBe(undefined)
})

it('keeps explicit shadcn uncontrolled state available', () => {
  const wrapper = mount(<InputRadio defaultValue="retry" options={options} />)
  const group = wrapper.find(InternalRadioGroup)

  expect(group.prop('value')).toBe(undefined)
  expect(group.prop('defaultValue')).toBe('retry')
})

it('uses uncontrolled shadcn state for a raw callback-only consumer', () => {
  const wrapper = mount(
    <InputRadio onValueChange={() => undefined} options={options} />
  )
  const group = wrapper.find(InternalRadioGroup)

  expect(group.prop('value')).toBe(undefined)
  expect(group.prop('defaultValue')).toBe(undefined)
})

it('supports custom option rendering and forwards the group ref', () => {
  const ref = React.createRef<HTMLDivElement>()
  const wrapper = mount(
    <InputRadio
      options={options}
      ref={ref}
      renderOption={(option) => <strong>{option.title}</strong>}
    />
  )

  expect(
    wrapper
      .find('strong')
      .first()
      .text()
  ).toBe('Pass')
  expect(ref.current?.tagName).toBe('DIV')
})
