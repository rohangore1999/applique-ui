import * as React from 'react'
import { mount } from 'enzyme'

import {
  Field,
  FieldDescription,
  FieldLabel,
  withField,
} from './field'

function CompatibleInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    __fieldContext?: { disabled?: boolean; error?: boolean }
  }
) {
  const { __fieldContext, ...inputProps } = props

  return (
    <input
      {...inputProps}
      aria-invalid={__fieldContext?.error || inputProps['aria-invalid']}
      data-field-disabled={__fieldContext?.disabled ? '' : undefined}
      disabled={__fieldContext?.disabled || inputProps.disabled}
    />
  )
}

it('renders the legacy title, required marker and description', () => {
  const wrapper = mount(
    <Field
      description="Enter your full name."
      htmlFor="name"
      required
      title="Name"
    >
      <CompatibleInput id="name" />
    </Field>
  )

  expect(wrapper.find('label').prop('htmlFor')).toBe('name')
  expect(wrapper.find('label').prop('id')).toBe('name__label')
  expect(wrapper.find('[data-applique-field-required]')).toHaveLength(1)
  expect(wrapper.find(FieldDescription).text()).toBe(
    'Enter your full name.'
  )
})

it('prioritizes joined errors over success and description', () => {
  const wrapper = mount(
    <Field
      description="Description"
      error={['First', 'Second']}
      htmlFor="name"
      success="Saved"
      title="Name"
    >
      <CompatibleInput />
    </Field>
  )

  expect(wrapper.find('[role="alert"]').text()).toBe('First Second')
  expect(wrapper.find('[data-applique-field-success]')).toHaveLength(0)
  expect(wrapper.text()).not.toContain('Description')
})

it('passes combined disabled and error state through Field context', () => {
  const wrapper = mount(
    <Field disabled error="Invalid" title="Name">
      <CompatibleInput />
    </Field>
  )
  const input = wrapper.find('input')

  expect(input.prop('disabled')).toBe(true)
  expect(input.prop('aria-invalid')).toBe(true)
  expect(input.prop('data-field-disabled')).toBe('')
  expect(wrapper.find('[data-applique-field]').prop('data-disabled')).toBe(
    'true'
  )
})

it('forwards root props and keeps Applique state authoritative', () => {
  const onClick = jest.fn()
  const ref = React.createRef<HTMLDivElement>()
  const wrapper = mount(
    <Field
      className="custom gap-20 text-red-500"
      data-disabled="false"
      disabled
      onClick={onClick}
      ref={ref}
      title="Name"
    />
  )
  const root = wrapper.find('[data-applique-field]')

  root.simulate('click')
  expect(onClick).toHaveBeenCalledTimes(1)
  expect(root.prop('data-disabled')).toBe('true')
  expect(root.hasClass('gap-1.5')).toBe(true)
  expect(root.hasClass('gap-20')).toBe(false)
  expect(ref.current).toBe(root.getDOMNode())
})

it('exposes non-conflicting shadcn compound Field parts', () => {
  const wrapper = mount(
    <Field>
      <FieldLabel>Nested label</FieldLabel>
      <FieldDescription>Nested help</FieldDescription>
    </Field>
  )

  expect(wrapper.find('[data-slot="field-label"]')).toHaveLength(1)
  expect(wrapper.find('[data-slot="field-description"]')).toHaveLength(1)
  expect(
    wrapper.find(FieldLabel).first().prop('__fieldContext')
  ).toBeUndefined()
})

it('retains the legacy withField helper contract', () => {
  const WrappedInput = withField(CompatibleInput)
  const wrapper = mount(
    <WrappedInput
      description="Help"
      label="Email"
      required
      type="email"
    />
  )
  const input = wrapper.find('input')
  const id = input.prop('id') as string

  expect(wrapper.find(Field).prop('htmlFor')).toBe(id)
  expect(input.prop('required')).toBe(true)
  expect(input.prop('aria-labelledby')).toBe(`${id}__label`)
  expect(input.prop('aria-describedby')).toBe(
    `${id}__description ${id}__error`
  )
})
