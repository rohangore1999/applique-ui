import * as React from 'react'
import { mount } from 'enzyme'

import { Combobox as InternalCombobox } from '../combobox'
import { InputSelect, InputSelectOption } from './input-select'

const sourceOptions = [
  { label: 'DIY', value: 'DIY' },
  { label: 'OI', value: 'OI_VENDOR' },
  { label: 'MAS', value: 'MAS' },
]

it('resolves a primitive controlled value to its option object', () => {
  const wrapper = mount(
    <InputSelect options={sourceOptions} value="OI_VENDOR" />
  )
  const combobox = wrapper.find(InternalCombobox)

  expect(combobox.prop('value')).toBe(sourceOptions[1])
  const itemToStringLabel = combobox.prop('itemToStringLabel') as unknown as (
    option: InputSelectOption
  ) => string
  const itemToStringValue = combobox.prop('itemToStringValue') as unknown as (
    option: InputSelectOption
  ) => string

  expect(itemToStringLabel(sourceOptions[1])).toBe('OI')
  expect(itemToStringValue(sourceOptions[1])).toBe('OI_VENDOR')
})

it('maps a selected option back to the Applique scalar callback', () => {
  const onChange = jest.fn()
  const wrapper = mount(
    <InputSelect onChange={onChange} options={sourceOptions} value="DIY" />
  )
  const change = wrapper.find(InternalCombobox).prop('onValueChange') as (
    option: InputSelectOption | null
  ) => void

  change(sourceOptions[1])
  expect(onChange).toHaveBeenCalledWith('OI_VENDOR')

  change(null)
  expect(onChange).toHaveBeenLastCalledWith(null)
})

it('maps multiple primitive values in client order and returns value arrays', () => {
  const onChange = jest.fn()
  const wrapper = mount(
    <InputSelect
      multiple
      onChange={onChange}
      options={sourceOptions}
      value={['MAS', 'DIY']}
    />
  )
  const combobox = wrapper.find(InternalCombobox)

  expect(combobox.prop('value')).toEqual([sourceOptions[2], sourceOptions[0]])

  const change = combobox.prop('onValueChange') as (
    options: InputSelectOption[]
  ) => void
  change([sourceOptions[0], sourceOptions[1]])

  expect(onChange).toHaveBeenCalledWith(['DIY', 'OI_VENDOR'])
})

it('retains selection when asynchronously loaded options change identity', () => {
  const wrapper = mount(<InputSelect options={[]} value="DIY" />)
  expect(wrapper.find(InternalCombobox).prop('value')).toBe(null)

  const loadedOptions = sourceOptions.map((option) => ({ ...option }))
  wrapper.setProps({ options: loadedOptions })
  wrapper.update()

  expect(wrapper.find(InternalCombobox).prop('value')).toBe(loadedOptions[0])
})

it('maps searchable behavior and the text-only search callback', () => {
  const onSearch = jest.fn()
  const wrapper = mount(
    <InputSelect onSearch={onSearch} options={sourceOptions} />
  )
  const combobox = wrapper.find(InternalCombobox)

  expect(combobox.prop('filter')).toBe(undefined)
  const onInputValueChange = combobox.prop(
    'onInputValueChange'
  ) as unknown as (value: string, details: unknown) => void
  onInputValueChange('di', {})
  expect(onSearch).toHaveBeenCalledWith('di')

  wrapper.setProps({ searchable: false })
  wrapper.update()
  expect(wrapper.find(InternalCombobox).prop('filter')).toBe(null)
})

it('composes label, description, error, loading, and input aria props', () => {
  const ref = React.createRef<HTMLInputElement>()
  const wrapper = mount(
    <InputSelect
      aria-label="Brand"
      className="brand-field"
      description="Choose a brand"
      error="Brands could not be loaded"
      id="brand"
      isLoading
      label="Brand"
      options={sourceOptions}
      ref={ref}
    />
  )
  const root = wrapper.getDOMNode() as HTMLElement
  const input = root.querySelector('input[role="combobox"]') as HTMLInputElement

  expect(root.classList.contains('brand-field')).toBe(true)
  expect(root.querySelector('label')?.getAttribute('for')).toBe('brand')
  expect(root.querySelector('[role="alert"]')?.textContent).toBe(
    'Brands could not be loaded'
  )
  expect(root.textContent).not.toContain('Choose a brand')
  expect(input.getAttribute('aria-label')).toBe('Brand')
  expect(input.getAttribute('aria-busy')).toBe('true')
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(input.getAttribute('aria-describedby')).toBe('brand-error')
  expect(root.querySelector('[data-slot="spinner"]')).not.toBeNull()
  expect(ref.current).toBe(input)
})

it('forwards field state and form identity to the combobox', () => {
  const wrapper = mount(
    <InputSelect
      disabled
      name="status"
      options={sourceOptions}
      readOnly
      required
    />
  )
  const combobox = wrapper.find(InternalCombobox)

  expect(combobox.prop('disabled')).toBe(true)
  expect(combobox.prop('name')).toBe('status')
  expect(combobox.prop('readOnly')).toBe(true)
  expect(combobox.prop('required')).toBe(true)
})
