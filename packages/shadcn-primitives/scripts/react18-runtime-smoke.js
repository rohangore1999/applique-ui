#!/usr/bin/env node

/* eslint-disable node/no-unpublished-require */

const assert = require('assert')
const { spawnSync } = require('child_process')
const path = require('path')
const { JSDOM } = require('jsdom')

const packageDirectory = path.resolve(__dirname, '..')
const repositoryDirectory = path.resolve(packageDirectory, '../..')
const sourceDirectory = path.join(packageDirectory, 'src')
const bundlePath = path.join(
  packageDirectory,
  'dist/shadcn-primitives.cjs.js'
)

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
  ...require('fs')
    .readdirSync(sourceDirectory)
    .filter((fileName) => /\.tsx?$/.test(fileName))
    .map((fileName) =>
      require('fs').statSync(path.join(sourceDirectory, fileName)).mtimeMs
    )
)
assert(
  require('fs').statSync(bundlePath).mtimeMs >= newestSourceMtime,
  'The bundle is older than its source. Rebuild before running this test.'
)

const React = require('react')
const ReactDOM = require('react-dom/client')
const { act } = require('react-dom/test-utils')

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
  const { Button, CalendarDayButton, Input } = require(bundlePath)
  const buttonRef = React.createRef()
  const calendarDayRef = React.createRef()
  const inputRef = React.createRef()
  const root = ReactDOM.createRoot(document.getElementById('root'))

  act(() => {
    root.render(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(Button, { ref: buttonRef }, 'Save'),
        React.createElement(Input, { ref: inputRef, 'aria-label': 'Name' }),
        React.createElement(CalendarDayButton, {
          ref: calendarDayRef,
          day: { date: new Date('2026-07-31T00:00:00Z') },
          modifiers: { focused: true },
        })
      )
    )
  })

  assert(
    buttonRef.current instanceof HTMLButtonElement,
    'Button did not forward its ref under React 18.'
  )
  assert(
    inputRef.current instanceof HTMLInputElement,
    'Input did not forward its ref under React 18.'
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
