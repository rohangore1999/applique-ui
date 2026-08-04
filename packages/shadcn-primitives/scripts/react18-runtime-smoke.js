#!/usr/bin/env node

/* eslint-disable node/no-unpublished-require */

const assert = require('assert')
const { spawnSync } = require('child_process')
const path = require('path')
const { JSDOM } = require('jsdom')

const packageDirectory = path.resolve(__dirname, '..')
const repositoryDirectory = path.resolve(packageDirectory, '../..')
const sourceDirectory = path.join(packageDirectory, 'src')
const bundlePath = path.join(packageDirectory, 'dist/shadcn-primitives.cjs.js')

function sourceFilesWithin(directory) {
  return require('fs')
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? sourceFilesWithin(entryPath) : [entryPath]
    })
    .filter((filePath) => /\.tsx?$/.test(filePath))
}

const build = spawnSync(
  process.execPath,
  [path.join(repositoryDirectory, 'scripts/build.js'), 'shadcn-primitives'],
  {
    cwd: repositoryDirectory,
    env: { ...process.env, CI: '1' },
    stdio: 'inherit',
  }
)

assert.strictEqual(build.status, 0, 'Could not build shadcn-primitives.')

assert(
  require('fs').existsSync(bundlePath),
  'Build shadcn-primitives before running the React 18 runtime smoke test.'
)

const newestSourceMtime = Math.max(
  ...sourceFilesWithin(sourceDirectory).map(
    (filePath) => require('fs').statSync(filePath).mtimeMs
  )
)
assert(
  require('fs').statSync(bundlePath).mtimeMs >= newestSourceMtime,
  'The bundle is older than its source. Rebuild before running this test.'
)

const React = require('react')
const ReactDOM = require('react-dom/client')
const { act, Simulate } = require('react-dom/test-utils')

assert.strictEqual(
  require('react/package.json').version,
  '18.3.1',
  'The runtime smoke test must execute with React 18.3.1.'
)

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  url: 'http://localhost',
})
const globals = {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  Node: dom.window.Node,
  Element: dom.window.Element,
  HTMLElement: dom.window.HTMLElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle,
  requestAnimationFrame: (callback) => setTimeout(callback, 0),
  cancelAnimationFrame: clearTimeout,
  IS_REACT_ACT_ENVIRONMENT: true,
}
const previousDescriptors = new Map()

for (const [name, value] of Object.entries(globals)) {
  previousDescriptors.set(name, Object.getOwnPropertyDescriptor(global, name))
  Object.defineProperty(global, name, {
    configurable: true,
    writable: true,
    value,
  })
}

const originalError = console.error
const reactErrors = []
console.error = (...args) => reactErrors.push(args.map(String).join(' '))

try {
  const {
    Accordion,
    Avatar,
    Badge,
    Banner,
    BreadCrumb,
    Button,
    ButtonGroup,
    CalendarDayButton,
    Input,
    InputCheckbox,
    InputNumber,
    InputRadio,
    InputText,
    InputTextArea,
    Section,
    Tabs,
    Tooltip,
  } = require(bundlePath)
  const accordionRef = React.createRef()
  const appliqueAvatarRef = React.createRef()
  const badgeRef = React.createRef()
  const bannerRef = React.createRef()
  const breadCrumbRef = React.createRef()
  const appliqueButtonRef = React.createRef()
  const appliqueButtonGroupRef = React.createRef()
  const sectionRef = React.createRef()
  const inputCheckboxRef = React.createRef()
  const buttonRef = React.createRef()
  const calendarDayRef = React.createRef()
  const inputRef = React.createRef()
  const inputNumberRef = React.createRef()
  const inputRadioRef = React.createRef()
  const inputTextRef = React.createRef()
  const inputTextAreaRef = React.createRef()
  const tabsRef = React.createRef()
  const tooltipRef = React.createRef()
  let numberValue
  let textValue
  const root = ReactDOM.createRoot(document.getElementById('root'))

  act(() => {
    root.render(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          Accordion,
          { ref: accordionRef },
          React.createElement(
            Accordion.Item,
            { title: 'Registry' },
            'Reviewed source'
          )
        ),
        React.createElement(Avatar, {
          name: 'Jane Doe',
          ref: appliqueAvatarRef,
        }),
        React.createElement(
          Badge,
          { ref: badgeRef, type: 'success', variant: 'solid' },
          'Ready'
        ),
        React.createElement(
          Banner,
          { color: 'info', ref: bannerRef, title: 'Registry' },
          'Installable for focused testing'
        ),
        React.createElement(
          BreadCrumb,
          { ref: breadCrumbRef },
          React.createElement(BreadCrumb.Item, null, 'Home'),
          React.createElement(BreadCrumb.Item, null, 'Registry')
        ),
        React.createElement(
          ButtonGroup,
          { 'aria-label': 'Actions', ref: appliqueButtonGroupRef },
          React.createElement(
            Button,
            { ref: appliqueButtonRef, type: 'primary' },
            'Publish'
          ),
          React.createElement(Button, { type: 'secondary' }, 'Preview'),
          React.createElement(Button, { type: 'text' }, 'Cancel')
        ),
        React.createElement(
          Section,
          { ref: sectionRef, title: 'Summary' },
          React.createElement(Button, { type: 'primary' }, 'Save'),
          React.createElement('p', null, 'Registry-owned content')
        ),
        React.createElement(Button, { ref: buttonRef }, 'Save'),
        React.createElement(InputCheckbox, {
          onChange: () => {},
          ref: inputCheckboxRef,
          title: 'Accept terms',
          value: true,
        }),
        React.createElement(Input, { ref: inputRef, 'aria-label': 'Name' }),
        React.createElement(InputNumber, {
          ref: inputNumberRef,
          'aria-label': 'Quantity',
          min: 1,
          onChange: (value) => {
            numberValue = value
          },
          value: 5,
        }),
        React.createElement(InputRadio, {
          options: [{ label: 'Standard', value: 'standard' }],
          ref: inputRadioRef,
          value: 'standard',
        }),
        React.createElement(InputText, {
          onChange: (value) => {
            textValue = value
          },
          ref: inputTextRef,
          value: 'Jane',
        }),
        React.createElement(InputTextArea, {
          onChange: () => {},
          ref: inputTextAreaRef,
          value: 'Notes',
        }),
        React.createElement(
          Tabs,
          { defaultIndex: 0, ref: tabsRef },
          React.createElement(
            Tabs.Tab,
            { title: 'Overview' },
            'Registry facade'
          )
        ),
        React.createElement(
          Tooltip,
          {
            ref: tooltipRef,
            renderContent: () => 'Details',
          },
          React.createElement('button', { type: 'button' }, 'Help')
        ),
        React.createElement(CalendarDayButton, {
          ref: calendarDayRef,
          day: { date: new Date('2026-07-31T00:00:00Z') },
          modifiers: { focused: true },
        })
      )
    )
  })

  assert(
    accordionRef.current instanceof HTMLElement,
    'Applique Accordion did not forward its ref under React 18.'
  )
  assert(
    appliqueAvatarRef.current instanceof HTMLElement,
    'Applique Avatar did not forward its ref under React 18.'
  )
  assert(
    badgeRef.current instanceof HTMLElement,
    'Applique Badge did not forward its ref under React 18.'
  )
  assert(
    bannerRef.current instanceof HTMLElement,
    'Applique Banner did not forward its ref under React 18.'
  )
  assert(
    breadCrumbRef.current instanceof HTMLElement,
    'Applique BreadCrumb did not forward its ref under React 18.'
  )
  assert(
    appliqueButtonRef.current instanceof HTMLButtonElement,
    'Applique Button did not forward its ref under React 18.'
  )
  assert(
    appliqueButtonGroupRef.current instanceof HTMLElement,
    'Applique ButtonGroup did not forward its ref under React 18.'
  )
  assert(
    sectionRef.current instanceof HTMLElement &&
      sectionRef.current.tagName === 'SECTION',
    'Applique Section did not preserve and forward its semantic root under React 18.'
  )
  assert.strictEqual(
    appliqueAvatarRef.current.getAttribute('aria-label'),
    'Jane Doe'
  )
  assert(
    buttonRef.current instanceof HTMLButtonElement,
    'Button did not forward its ref under React 18.'
  )
  assert(
    inputRef.current instanceof HTMLInputElement,
    'Input did not forward its ref under React 18.'
  )
  assert(
    inputNumberRef.current instanceof HTMLInputElement,
    'InputNumber did not forward its ref under React 18.'
  )
  assert.strictEqual(inputNumberRef.current.type, 'number')
  assert.strictEqual(inputNumberRef.current.min, '1')
  act(() => {
    inputNumberRef.current.value = '2.5'
    Simulate.change(inputNumberRef.current)
  })
  assert.strictEqual(
    numberValue,
    2.5,
    'InputNumber did not map the browser change event to a number.'
  )
  assert(
    inputCheckboxRef.current instanceof HTMLElement,
    'InputCheckbox did not forward its ref under React 18.'
  )
  assert(
    inputRadioRef.current instanceof HTMLElement,
    'InputRadio did not forward its ref under React 18.'
  )
  assert(
    inputTextRef.current instanceof HTMLInputElement,
    'InputText did not forward its ref under React 18.'
  )
  act(() => {
    inputTextRef.current.value = 'Janet'
    Simulate.change(inputTextRef.current)
  })
  assert.strictEqual(
    textValue,
    'Janet',
    'InputText did not map the browser change event to a string.'
  )
  assert(
    inputTextAreaRef.current instanceof dom.window.HTMLTextAreaElement,
    'InputTextArea did not forward its ref under React 18.'
  )
  assert(
    tabsRef.current instanceof HTMLElement,
    'Applique Tabs did not forward its ref under React 18.'
  )
  assert(
    tooltipRef.current instanceof HTMLElement,
    'Applique Tooltip did not forward its ref under React 18.'
  )
  assert(
    calendarDayRef.current instanceof HTMLButtonElement,
    'CalendarDayButton did not forward its ref under React 18.'
  )
  assert.strictEqual(
    document.activeElement,
    calendarDayRef.current,
    'CalendarDayButton did not preserve its internal focus ref.'
  )
  assert(
    !reactErrors.some((message) =>
      message.includes('Function components cannot be given refs')
    ),
    `React emitted a ref warning:\n${reactErrors.join('\n')}`
  )
  act(() => root.unmount())
  console.log('React 18 runtime and ref forwarding smoke test passed.')
} finally {
  console.error = originalError
  dom.window.close()

  for (const [name, descriptor] of previousDescriptors) {
    if (descriptor) Object.defineProperty(global, name, descriptor)
    else delete global[name]
  }
}
