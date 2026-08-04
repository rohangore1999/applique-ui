import * as React from 'react'
import { mount } from 'enzyme'
import { Simulate } from 'react-dom/test-utils'

import { InputTextArea } from './input-text-area'

it('keeps className on the wrapper and forwards native props to textarea', () => {
  const style = { letterSpacing: '1px' }
  const wrapper = mount(
    <InputTextArea
      aria-label="Notes"
      className="notes"
      id="notes"
      maxLength={200}
      name="notes"
      placeholder="Type here"
      rows={5}
      style={style}
      value="hello"
    />
  )
  const container = wrapper.find('[data-applique-input-text-area]')
  const textarea = wrapper.find('textarea')

  expect(container.hasClass('notes')).toBe(true)
  expect(textarea.hasClass('notes')).toBe(false)
  expect(textarea.prop('value')).toBe('hello')
  expect(textarea.prop('rows')).toBe(5)
  expect(textarea.prop('id')).toBe('notes')
  expect(textarea.prop('name')).toBe('notes')
  expect(textarea.prop('placeholder')).toBe('Type here')
  expect(textarea.prop('maxLength')).toBe(200)
  expect(textarea.prop('aria-label')).toBe('Notes')
  expect(textarea.prop('style')).toBe(style)
})

it('retains the legacy one-row default', () => {
  const textarea = mount(<InputTextArea />).find('textarea')

  expect(textarea.prop('rows')).toBe(1)
})

it('maps the browser change event to the Applique string callback', () => {
  const onChange = jest.fn()
  const ref = React.createRef<HTMLTextAreaElement>()
  mount(<InputTextArea onChange={onChange} ref={ref} value="before" />)

  const element = ref.current as HTMLTextAreaElement
  element.value = 'after'
  Simulate.change(element)

  expect(onChange).toHaveBeenCalledWith('after')
})

it('keeps the legacy empty controlled value unless defaultValue opts into native state', () => {
  const empty = mount(<InputTextArea />).find('textarea')
  const uncontrolled = mount(<InputTextArea defaultValue="initial" />).find(
    'textarea'
  )

  expect(empty.prop('value')).toBe('')
  expect(empty.prop('defaultValue')).toBeUndefined()
  expect(uncontrolled.prop('value')).toBeUndefined()
  expect(uncontrolled.prop('defaultValue')).toBe('initial')
})

it('combines explicit and Field-context disabled/error state', () => {
  const wrapper = mount(
    <InputTextArea
      __fieldContext={{ disabled: true, error: true }}
      disabled={false}
      error={false}
    />
  )
  const container = wrapper.find('[data-applique-input-text-area]')
  const textarea = wrapper.find('textarea')

  expect(container.prop('data-disabled')).toBe('')
  expect(container.prop('data-invalid')).toBe('')
  expect(textarea.prop('disabled')).toBe(true)
  expect(textarea.prop('aria-invalid')).toBe(true)
  expect(container.hasClass('resize-none')).toBe(true)
  expect(container.hasClass('resize-y')).toBe(false)
})

it('keeps an explicit native aria-invalid value when Applique error is false', () => {
  const textarea = mount(
    <InputTextArea aria-invalid="spelling" error={false} />
  ).find('textarea')

  expect(textarea.prop('aria-invalid')).toBe('spelling')
})

it('preserves bordered/standard wrappers and wrapper-owned resize behavior', () => {
  const bordered = mount(<InputTextArea />)
  const standard = mount(<InputTextArea noResize variant="standard" />)

  expect(
    bordered.find('[data-applique-input-text-area]').prop('data-variant')
  ).toBe('bordered')
  expect(
    bordered.find('[data-applique-input-text-area]').hasClass('resize-y')
  ).toBe(true)
  expect(
    standard.find('[data-applique-input-text-area]').prop('data-variant')
  ).toBe('standard')
  expect(
    standard.find('[data-applique-input-text-area]').hasClass('resize-none')
  ).toBe(true)
  expect(standard.find('textarea').hasClass('resize-none')).toBe(true)
})

it('renders a decorative icon before the textarea', () => {
  function NotesIcon() {
    return <svg data-test-id="notes-icon" />
  }

  const wrapper = mount(<InputTextArea icon={NotesIcon} />)
  const icon = wrapper.find('[data-test-id="icon"]')

  expect(icon.prop('aria-hidden')).toBe('true')
  expect(icon.find('[data-test-id="notes-icon"]').exists()).toBe(true)
  expect(icon.getDOMNode().nextSibling?.nodeName).toBe('TEXTAREA')
})

it('does not leak the legacy runtime-only adornmentPosition prop to the DOM', () => {
  const wrapper = mount(
    <InputTextArea
      {...({ adornmentPosition: 'start' } as Record<string, unknown>)}
    />
  )

  expect(
    wrapper
      .find('textarea')
      .getDOMNode()
      .hasAttribute('adornmentPosition')
  ).toBe(false)
})

it('applies Applique wrapper decisions after conflicting client classes', () => {
  const container = mount(
    <InputTextArea
      className="resize-none rounded-full border-red-500"
      variant="bordered"
    />
  ).find('[data-applique-input-text-area]')

  expect(container.hasClass('resize-none')).toBe(false)
  expect(container.hasClass('resize-y')).toBe(true)
  expect(container.hasClass('rounded-full')).toBe(false)
  expect(container.hasClass('rounded-xs')).toBe(true)
  expect(container.hasClass('border-red-500')).toBe(false)
})

it('forwards its ref to the native textarea', () => {
  const ref = React.createRef<HTMLTextAreaElement>()
  mount(<InputTextArea ref={ref} />)

  expect(ref.current?.tagName).toBe('TEXTAREA')
})
