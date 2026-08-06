import * as React from 'react'
import { act } from 'react'
import { mount, ReactWrapper } from 'enzyme'

jest.mock('../calendar', () => {
  const Calendar = () => <div data-test-id="calendar" />

  return { Calendar }
})

jest.mock('../popover', () => {
  const ReactRuntime = require('react')

  const Popover = ({ children }: { children?: React.ReactNode }) => (
    <div data-test-id="popover">{children}</div>
  )
  const PopoverTrigger = ({
    children,
    render,
  }: {
    children?: React.ReactNode
    render: React.ReactElement
  }) => ReactRuntime.cloneElement(render, {}, children)
  const PopoverContent = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-slot="popover-content" {...props}>
      {children}
    </div>
  )

  return { Popover, PopoverContent, PopoverTrigger }
})

import { Calendar as InternalCalendar } from '../calendar'
import {
  Popover as InternalPopover,
  PopoverContent as InternalPopoverContent,
} from '../popover'
import { InputDate } from './input-date'

function setPopoverOpen(wrapper: ReactWrapper, open: boolean) {
  act(() => {
    ;(wrapper.find(InternalPopover).prop('onOpenChange') as Function)(open, {})
  })
  wrapper.update()
}

function selectCalendarDate(wrapper: ReactWrapper, date: Date) {
  act(() => {
    ;(wrapper.find(InternalCalendar).prop('onSelect') as Function)(
      date,
      date,
      {},
      {}
    )
  })
  wrapper.update()
}

it('displays a formatted string value and emits a new single value immediately', () => {
  const onChange = jest.fn()
  const wrapper = mount(
    <InputDate
      format="yyyy-MM-dd"
      label="Last Updated On"
      onChange={onChange}
      value="2026-08-03"
    />
  )

  expect(
    wrapper.find('[data-applique-input-date-trigger]').hostNodes().text()
  ).toContain('2026-08-03')

  setPopoverOpen(wrapper, true)
  selectCalendarDate(wrapper, new Date(2026, 7, 5))

  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onChange).toHaveBeenCalledWith('2026-08-05')
  expect(wrapper.find(InternalPopover).prop('open')).toBe(false)
})

it('keeps the first range date private and emits only the sorted completed range', () => {
  const onChange = jest.fn()
  const wrapper = mount(
    <InputDate
      format="yyyy-MM-dd"
      label="Uploaded Between Dates"
      onChange={onChange}
      range
    />
  )

  setPopoverOpen(wrapper, true)
  selectCalendarDate(wrapper, new Date(2026, 7, 5))

  expect(onChange).not.toHaveBeenCalled()
  expect(wrapper.find(InternalPopover).prop('open')).toBe(true)
  expect(wrapper.find(InternalCalendar).prop('selected')).toEqual({
    from: new Date(2026, 7, 5),
  })

  selectCalendarDate(wrapper, new Date(2026, 6, 6))

  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onChange).toHaveBeenCalledWith({
    from: '2026-07-06',
    to: '2026-08-05',
  })
  expect(wrapper.find(InternalPopover).prop('open')).toBe(false)
})

it('restores the controlled range after an unfinished draft is dismissed', () => {
  const controlledValue = {
    from: new Date(2026, 6, 1),
    to: new Date(2026, 6, 31),
  }
  const wrapper = mount(
    <InputDate label="Range" range value={controlledValue} />
  )

  setPopoverOpen(wrapper, true)
  selectCalendarDate(wrapper, new Date(2026, 7, 5))
  setPopoverOpen(wrapper, false)
  setPopoverOpen(wrapper, true)

  expect(wrapper.find(InternalCalendar).prop('selected')).toEqual(
    controlledValue
  )
})

it('uses the expected month defaults for single and range calendars', () => {
  const single = mount(<InputDate label="Single" />)
  const range = mount(<InputDate label="Range" range />)

  setPopoverOpen(single, true)
  setPopoverOpen(range, true)

  expect(single.find(InternalCalendar).prop('numberOfMonths')).toBe(1)
  expect(range.find(InternalCalendar).prop('numberOfMonths')).toBe(2)

  const custom = mount(
    <InputDate label="Custom range" monthsToDisplay={3} range />
  )
  setPopoverOpen(custom, true)
  expect(custom.find(InternalCalendar).prop('numberOfMonths')).toBe(3)
})

it('connects label, description, error, and disabled state to the trigger', () => {
  const descriptionWrapper = mount(
    <InputDate
      description="Choose the update date"
      disabled
      id="last-updated"
      label="Last Updated On"
      name="lastModifiedOn"
      required
    />
  )
  const trigger = descriptionWrapper
    .find('[data-applique-input-date-trigger]')
    .hostNodes()

  expect(descriptionWrapper.find('label').prop('htmlFor')).toBe('last-updated')
  expect(trigger.prop('disabled')).toBe(true)
  expect(trigger.prop('name')).toBe('lastModifiedOn')
  expect(trigger.prop('aria-required')).toBe(true)
  expect(trigger.prop('aria-describedby')).toBe('last-updated__description')

  setPopoverOpen(descriptionWrapper, true)
  expect(descriptionWrapper.find(InternalPopover).prop('open')).toBe(false)

  const errorWrapper = mount(
    <InputDate error="Invalid date" id="invalid-date" label="Date" />
  )
  const invalidTrigger = errorWrapper
    .find('[data-applique-input-date-trigger]')
    .hostNodes()

  expect(invalidTrigger.prop('aria-invalid')).toBe(true)
  expect(invalidTrigger.prop('aria-describedby')).toBe('invalid-date__error')
  expect(errorWrapper.find('[role="alert"]').text()).toBe('Invalid date')
})

it('keeps className on the Field root and wrapperClassName on the popover', () => {
  const wrapper = mount(
    <InputDate
      className="date-field"
      label="Date"
      wrapperClassName="date-popover"
    />
  )
  setPopoverOpen(wrapper, true)

  expect(
    wrapper.find('[data-applique-input-date]').hostNodes().hasClass('date-field')
  ).toBe(true)
  expect(
    String(wrapper.find(InternalPopoverContent).prop('className'))
  ).toContain('date-popover')
})

it('clears either date mode through the value-only callback', () => {
  const onSingleChange = jest.fn()
  const single = mount(
    <InputDate
      label="Last Updated On"
      onChange={onSingleChange}
      value={new Date(2026, 7, 5)}
    />
  )

  single
    .find('[data-applique-input-date-clear]')
    .hostNodes()
    .simulate('click')
  expect(onSingleChange).toHaveBeenCalledWith(null)

  const onRangeChange = jest.fn()
  const range = mount(
    <InputDate
      label="Uploaded Between Dates"
      onChange={onRangeChange}
      range
      value={{ from: new Date(2026, 6, 6), to: new Date(2026, 7, 5) }}
    />
  )

  range
    .find('[data-applique-input-date-clear]')
    .hostNodes()
    .simulate('click')
  expect(onRangeChange).toHaveBeenCalledWith(null)
})
