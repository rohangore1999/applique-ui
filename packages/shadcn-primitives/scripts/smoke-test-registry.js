#!/usr/bin/env node

/*
 * Installs every source-bearing primitive and Applique-owned facade from the
 * generated registry into isolated React 18 + Tailwind 4 TypeScript and
 * JavaScript consumers using the pinned shadcn CLI.
 *
 * This catches missing registry dependencies, stale import aliases, incomplete
 * npm dependency metadata, TypeScript incompatibilities, incomplete
 * JavaScript conversion, preservation of an existing client-owned utils file,
 * and token/CSS issues before the static registry is published.
 */

const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const SHADCN_CLI_VERSION = '4.16.0'
const REACT_VERSION = '18.3.1'
const REACT_TYPES_VERSION = '18.3.28'
const REACT_DOM_TYPES_VERSION = '18.3.7'
const TAILWIND_VERSION = '4.3.3'
const TYPESCRIPT_VERSION = '5.9.2'
const EXPECTED_INSTALLABLE_UI_ITEMS = 60
const OWNED_FACADE_SMOKE_CONTRACTS = [
  {
    importPath: '@/components/applique/internal/avatar',
    name: 'avatar',
    primitiveTarget: '@components/applique/internal/avatar.tsx',
    target: '@components/applique/avatar.tsx',
  },
  {
    importPath: '@/components/applique/internal/field',
    name: 'field',
    primitiveTarget: '@components/applique/internal/field.tsx',
    target: '@components/applique/field.tsx',
  },
  {
    importPath: '@/components/applique/internal/checkbox',
    name: 'input-checkbox',
    primitiveTarget: '@ui/checkbox.tsx',
    target: '@components/applique/input-checkbox.tsx',
  },
  {
    importPath: '@/components/applique/internal/calendar',
    name: 'input-date',
    primitiveTarget: '@ui/calendar.tsx',
    target: '@components/applique/input-date.tsx',
  },
  {
    importPath: '@/components/applique/internal/input',
    name: 'input-number',
    primitiveTarget: '@ui/input.tsx',
    target: '@components/applique/input-number.tsx',
  },
  {
    importPath: '@/components/applique/internal/radio-group',
    name: 'input-radio',
    primitiveTarget: '@ui/radio-group.tsx',
    target: '@components/applique/input-radio.tsx',
  },
  {
    importPath: '@/components/applique/internal/combobox',
    name: 'input-select',
    primitiveTarget: '@ui/combobox.tsx',
    target: '@components/applique/input-select.tsx',
  },
  {
    importPath: '@/components/applique/internal/input',
    name: 'input-text',
    primitiveTarget: '@ui/input.tsx',
    target: '@components/applique/input-text.tsx',
  },
  {
    importPath: '@/components/applique/internal/accordion',
    name: 'accordion',
    primitiveTarget: '@components/applique/internal/accordion.tsx',
    target: '@components/applique/accordion.tsx',
  },
  {
    importPath: '@/components/applique/internal/badge',
    name: 'badge',
    primitiveTarget: '@components/applique/internal/badge.tsx',
    target: '@components/applique/badge.tsx',
  },
  {
    importPath: '@/components/applique/internal/alert',
    name: 'banner',
    primitiveTarget: '@ui/alert.tsx',
    target: '@components/applique/banner.tsx',
  },
  {
    importPath: '@/components/applique/internal/breadcrumb',
    name: 'bread-crumb',
    primitiveTarget: '@ui/breadcrumb.tsx',
    target: '@components/applique/bread-crumb.tsx',
  },
  {
    importPath: '@/components/applique/internal/button',
    name: 'button',
    primitiveTarget: '@components/applique/internal/button.tsx',
    target: '@components/applique/button.tsx',
  },
  {
    importPath: '@/components/applique/internal/button-group',
    name: 'button-group',
    primitiveTarget: '@components/applique/internal/button-group.tsx',
    target: '@components/applique/button-group.tsx',
  },
  {
    importPath: '@/components/applique/internal/textarea',
    name: 'input-text-area',
    primitiveTarget: '@ui/textarea.tsx',
    target: '@components/applique/input-text-area.tsx',
  },
  {
    importPath: '@/components/applique/internal/card',
    name: 'section',
    primitiveTarget: '@ui/card.tsx',
    target: '@components/applique/section.tsx',
  },
  {
    importPath: '@/components/applique/internal/tabs',
    name: 'tabs',
    primitiveTarget: '@components/applique/internal/tabs.tsx',
    target: '@components/applique/tabs.tsx',
  },
  {
    importPath: '@/components/applique/internal/tooltip',
    name: 'tooltip',
    primitiveTarget: '@components/applique/internal/tooltip.tsx',
    target: '@components/applique/tooltip.tsx',
  },
]
const EXPECTED_OWNED_FACADE_ITEMS = OWNED_FACADE_SMOKE_CONTRACTS.length
const PREEXISTING_TYPESCRIPT_UTILS_SOURCE = `import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const consumerOwnedUtilsSentinel = 'keep-client-utils'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
const PREEXISTING_JAVASCRIPT_UTILS_SOURCE = `import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const consumerOwnedUtilsSentinel = 'keep-client-utils'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
`

const packageDir = path.resolve(__dirname, '..')
const manifestPath = path.join(packageDir, 'registry.json')
const generatorPath = path.join(__dirname, 'generate-registry.js')
const hostileHostCssPath = path.join(
  __dirname,
  'fixtures',
  'hostile-host.css'
)
const shadcnPackageDirectory = path.dirname(
  path.dirname(require.resolve('shadcn', { paths: [packageDir] }))
)
const { parse: parseJavaScript } = require(require.resolve('@babel/parser', {
  paths: [shadcnPackageDirectory],
}))

const CONSUMER_MODES = [
  {
    id: 'typescript',
    label: 'TypeScript/TSX',
    tsx: true,
    configFile: 'tsconfig.json',
    smokeFile: 'src/smoke.tsx',
    utilsSource: PREEXISTING_TYPESCRIPT_UTILS_SOURCE,
  },
  {
    id: 'javascript',
    label: 'JavaScript/JSX',
    tsx: false,
    configFile: 'jsconfig.json',
    smokeFile: 'src/smoke.jsx',
    utilsSource: PREEXISTING_JAVASCRIPT_UTILS_SOURCE,
  },
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, value)
}

function appendHostileHostCss(consumerDirectory) {
  const hostileCss = fs.readFileSync(hostileHostCssPath, 'utf8')
  fs.appendFileSync(
    path.join(consumerDirectory, 'src/index.css'),
    `\n${hostileCss}`
  )
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const hasInput = typeof options.input === 'string'
    const child = spawn(command, args, {
      cwd: options.cwd || packageDir,
      env: {
        ...process.env,
        CI: '1',
      },
      stdio: hasInput ? ['pipe', 'inherit', 'inherit'] : 'inherit',
    })

    if (hasInput) child.stdin.end(options.input)

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(
        new Error(
          `${command} ${args.join(' ')} failed with ${
            signal ? `signal ${signal}` : `exit code ${code}`
          }`
        )
      )
    })
  })
}

function contentType(filePath) {
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8'
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8'
  return 'application/octet-stream'
}

function createStaticServer(rootDirectory) {
  return http.createServer((request, response) => {
    let pathname
    try {
      pathname = decodeURIComponent(
        new URL(request.url || '/', 'http://127.0.0.1').pathname
      )
    } catch {
      response.writeHead(400)
      response.end('Bad request')
      return
    }

    const requestedPath = path.resolve(rootDirectory, `.${pathname}`)
    const relativePath = path.relative(rootDirectory, requestedPath)

    if (
      relativePath === '..' ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      response.writeHead(403)
      response.end('Forbidden')
      return
    }

    let stats
    try {
      stats = fs.statSync(requestedPath)
    } catch {
      response.writeHead(404)
      response.end('Not found')
      return
    }

    if (!stats.isFile()) {
      response.writeHead(404)
      response.end('Not found')
      return
    }

    response.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': contentType(requestedPath),
    })
    fs.createReadStream(requestedPath).pipe(response)
  })
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject)
      resolve(server.address())
    })
  })
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

function sourceItems(manifest) {
  return manifest.items.filter(
    (item) =>
      ['registry:component', 'registry:ui'].includes(item.type) &&
      Array.isArray(item.files) &&
      item.files.length > 0
  )
}

function outputTarget(target, mode) {
  if (mode.tsx) return target

  return target.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js')
}

function consumerPathForTarget(target, mode) {
  const aliases = {
    '@components/': 'src/components/',
    '@hooks/': 'src/hooks/',
    '@lib/': 'src/lib/',
    '@ui/': 'src/components/applique/internal/',
  }

  const resolvedTarget = outputTarget(target, mode)

  for (const [alias, replacement] of Object.entries(aliases)) {
    if (resolvedTarget.startsWith(alias)) {
      return `${replacement}${resolvedTarget.slice(alias.length)}`
    }
  }

  throw new Error(`Smoke test does not understand registry target ${target}`)
}

function importPathForTarget(target) {
  if (target.startsWith('@components/')) {
    return `@/components/${target
      .slice('@components/'.length)
      .replace(/\.[jt]sx?$/, '')}`
  }
  if (target.startsWith('@ui/')) {
    return `@/components/applique/internal/${target
      .slice('@ui/'.length)
      .replace(/\.[jt]sx?$/, '')}`
  }
  if (target.startsWith('@hooks/')) {
    return `@/hooks/${target.slice('@hooks/'.length).replace(/\.[jt]sx?$/, '')}`
  }
  if (target.startsWith('@lib/')) {
    return `@/lib/${target.slice('@lib/'.length).replace(/\.[jt]sx?$/, '')}`
  }

  throw new Error(`Smoke test does not understand registry target ${target}`)
}

function createConsumer(consumerDirectory, manifest, mode, options = {}) {
  const devDependencies = {
    '@tailwindcss/cli': TAILWIND_VERSION,
    tailwindcss: TAILWIND_VERSION,
  }

  if (mode.tsx) {
    Object.assign(devDependencies, {
      '@types/react': REACT_TYPES_VERSION,
      '@types/react-dom': REACT_DOM_TYPES_VERSION,
      typescript: TYPESCRIPT_VERSION,
    })
  }

  writeJson(path.join(consumerDirectory, 'package.json'), {
    name: `applique-registry-smoke-${mode.id}`,
    private: true,
    version: '0.0.0',
    type: 'module',
    dependencies: {
      react: REACT_VERSION,
      'react-dom': REACT_VERSION,
    },
    devDependencies,
  })

  writeJson(path.join(consumerDirectory, 'components.json'), {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'base-nova',
    rsc: options.rsc ?? false,
    tsx: mode.tsx,
    tailwind: {
      config: '',
      css: 'src/index.css',
      baseColor: 'neutral',
      cssVariables: true,
      prefix: '',
    },
    iconLibrary: 'lucide',
    aliases: {
      components: '@/components',
      utils: '@/lib/utils',
      ui: '@/components/applique/internal',
      lib: '@/lib',
      hooks: '@/hooks',
    },
  })

  const compilerOptions = {
    baseUrl: '.',
    paths: {
      '@/*': ['./src/*'],
    },
  }

  if (mode.tsx) {
    Object.assign(compilerOptions, {
      target: 'ES2022',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      skipLibCheck: false,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      module: 'ESNext',
      moduleResolution: 'Bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
    })
  }

  writeJson(path.join(consumerDirectory, mode.configFile), {
    compilerOptions,
    include: ['src'],
  })

  writeText(
    path.join(consumerDirectory, 'src/index.css'),
    '@import "tailwindcss";\n'
  )
  writeText(
    path.join(consumerDirectory, `src/lib/utils.${mode.tsx ? 'ts' : 'js'}`),
    mode.utilsSource
  )

  const imports = []
  const moduleNames = []

  for (const item of sourceItems(manifest)) {
    for (const [fileIndex, file] of item.files.entries()) {
      const moduleName = `${item.name.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      )}Module${fileIndex}`
      imports.push(
        `import * as ${moduleName} from '${importPathForTarget(file.target)}'`
      )
      moduleNames.push(moduleName)
    }
  }

  const refDeclarations = mode.tsx
    ? `const buttonRef = createRef<HTMLButtonElement>()
const calendarDayRef = createRef<HTMLButtonElement>()
const inputRef = createRef<HTMLInputElement>()`
    : `const buttonRef = createRef()
const calendarDayRef = createRef()
const inputRef = createRef()`

  writeText(
    path.join(consumerDirectory, mode.smokeFile),
    `import * as React from 'react'
import { createRef } from 'react'
import { Button as RefButton } from '@/components/applique/button'
import { CalendarDayButton as RefCalendarDayButton } from '@/components/applique/internal/calendar'
import { Input as RefInput } from '@/components/applique/internal/input'
import { InputNumber as AppliqueInputNumber } from '@/components/applique/input-number'
${imports.join('\n')}

${refDeclarations}

export const react18RefTypeSmoke = (
  <>
    <RefButton ref={buttonRef}>Save</RefButton>
    <RefInput ref={inputRef} aria-label="Name" />
    <AppliqueInputNumber
      aria-label="Quantity"
      min={1}
      onChange={(value) => value.toFixed(1)}
      value={2}
    />
    <RefCalendarDayButton
      ref={calendarDayRef}
      day={${mode.tsx ? 'null as never' : 'null'}}
      modifiers={{ focused: false }}
    />
  </>
)

export const registryModules = [
  ${moduleNames.join(',\n  ')},
]
`
  )
}

function createFacadeOnlySmoke(consumerDirectory, mode) {
  const refDeclaration = mode.tsx
    ? 'const inputRef = createRef<HTMLInputElement>()'
    : 'const inputRef = createRef()'

  writeText(
    path.join(consumerDirectory, mode.smokeFile),
    `import * as React from 'react'
import { createRef } from 'react'
import { Accordion } from '@/components/applique/accordion'
import { Avatar } from '@/components/applique/avatar'
import { Badge } from '@/components/applique/badge'
import { BreadCrumb } from '@/components/applique/bread-crumb'
import { Field } from '@/components/applique/field'
import { InputCheckbox } from '@/components/applique/input-checkbox'
import { InputDate } from '@/components/applique/input-date'
import { InputNumber } from '@/components/applique/input-number'
import { InputRadio } from '@/components/applique/input-radio'
import { InputSelect } from '@/components/applique/input-select'
import { InputText } from '@/components/applique/input-text'
import { InputTextArea } from '@/components/applique/input-text-area'
import { Tabs } from '@/components/applique/tabs'
import { Tooltip } from '@/components/applique/tooltip'

${refDeclaration}

export const appliqueFacadeSmoke = (
  <>
    <Accordion>
      <Accordion.Item title="Registry">Reviewed source</Accordion.Item>
    </Accordion>
    <Avatar name="Jane Doe" size="medium" />
    <Badge type="success" variant="solid">Ready</Badge>
    <BreadCrumb>
      <BreadCrumb.Item>Home</BreadCrumb.Item>
      <BreadCrumb.Item>Registry</BreadCrumb.Item>
    </BreadCrumb>
    <Field description="Field help" title="Field label">
      <input aria-label="Field control" />
    </Field>
    <InputCheckbox
      onChange={(value) => Boolean(value)}
      title="Accept terms"
      value
    />
    <InputDate
      format="yyyy-MM-dd"
      label="Last Updated On"
      onChange={(value) => String(value)}
      value="2026-08-05"
    />
    <InputNumber
      aria-label="Quantity"
      min={1}
      onChange={(value) => value.toFixed(1)}
      ref={inputRef}
      value={2}
    />
    <InputRadio
      onChange={(value) => value.toUpperCase()}
      options={[{ label: 'Standard', value: 'standard' }]}
      value="standard"
    />
    <InputSelect
      aria-label="Source"
      onChange={(value) => String(value)}
      options={[{ label: 'DIY', value: 'DIY' }]}
      value="DIY"
    />
    <InputText onChange={(value) => value.trim()} value="Jane" />
    <InputTextArea onChange={(value) => value.trim()} value="Notes" />
    <Tabs defaultIndex={0} variant="line">
      <Tabs.Tab title="Overview">Registry facade</Tabs.Tab>
    </Tabs>
    <Tooltip renderContent={() => 'Details'}>
      <button type="button">Help</button>
    </Tooltip>
  </>
)
`
  )
}

function filesWithin(directory) {
  const files = []

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...filesWithin(entryPath))
    } else if (entry.isFile()) {
      files.push(entryPath)
    }
  }

  return files
}

function nodeContainsJsx(node) {
  if (!node || typeof node !== 'object') return false
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return true

  return Object.values(node).some((value) => {
    if (Array.isArray(value)) return value.some(nodeContainsJsx)
    return nodeContainsJsx(value)
  })
}

function hasClassicReactBinding(program) {
  return program.body.some((statement) => {
    if (
      statement.type !== 'ImportDeclaration' ||
      statement.source.value !== 'react' ||
      statement.importKind === 'type'
    ) {
      return false
    }

    return statement.specifiers.some(
      (specifier) =>
        (specifier.type === 'ImportDefaultSpecifier' ||
          specifier.type === 'ImportNamespaceSpecifier') &&
        specifier.local.name === 'React'
    )
  })
}

function assertJavaScriptSources(consumerDirectory) {
  const sourceDirectory = path.join(consumerDirectory, 'src')
  const sourceFiles = filesWithin(sourceDirectory).filter((filePath) =>
    /\.[jt]sx?$/.test(filePath)
  )

  for (const filePath of sourceFiles) {
    const relativePath = path.relative(consumerDirectory, filePath)
    assert(
      !/\.tsx?$/.test(filePath),
      `${relativePath} was not converted to JavaScript`
    )

    let parsed
    try {
      const source = fs.readFileSync(filePath, 'utf8')
      parsed = parseJavaScript(source, {
        sourceType: 'module',
        plugins: ['jsx'],
      })
    } catch (error) {
      throw new Error(
        `${relativePath} is not valid JavaScript/JSX: ${error.message}`
      )
    }

    assert(
      !nodeContainsJsx(parsed.program) || hasClassicReactBinding(parsed.program),
      `${relativePath} contains JSX without a runtime React binding for classic clients`
    )
  }

  const consumerPackage = readJson(path.join(consumerDirectory, 'package.json'))
  const declaredDependencies = {
    ...consumerPackage.dependencies,
    ...consumerPackage.devDependencies,
  }
  for (const dependency of Object.keys(declaredDependencies)) {
    assert(
      dependency !== 'typescript' && !dependency.startsWith('@types/'),
      `JavaScript consumer unexpectedly declares ${dependency}`
    )
  }
}

function assertInstalledConsumer(consumerDirectory, manifest, mode) {
  const expectedPaths = new Set([
    consumerPathForTarget('@lib/applique-react18-compat.ts', mode),
    consumerPathForTarget('@lib/utils.ts', mode),
  ])

  for (const item of sourceItems(manifest)) {
    for (const file of item.files) {
      expectedPaths.add(consumerPathForTarget(file.target, mode))
    }
  }

  const hook = manifest.items.find((item) => item.name === 'use-mobile')
  for (const file of hook?.files || []) {
    expectedPaths.add(consumerPathForTarget(file.target, mode))
  }

  for (const relativePath of expectedPaths) {
    const absolutePath = path.join(consumerDirectory, relativePath)
    assert(
      fs.existsSync(absolutePath),
      `shadcn did not install ${relativePath}`
    )

    if (!/\.[jt]sx?$/.test(absolutePath)) {
      continue
    }

    const source = fs.readFileSync(absolutePath, 'utf8')
    for (const forbiddenImport of [
      'IconPlaceholder',
      '@/app/(create)',
      '@/registry/',
    ]) {
      assert(
        !source.includes(forbiddenImport),
        `${relativePath} contains unresolved upstream source ${forbiddenImport}`
      )
    }
    assert(
      !/(^|[^a-z-])dark:(?=\S)/m.test(source),
      `${relativePath} contains an unscoped dark: utility`
    )
    assert(
      !source.includes('@/components/ui/'),
      `${relativePath} contains a public components/ui import instead of the Applique internal boundary`
    )
    assert(
      !source.includes('dark: ".dark"') && !source.includes("dark: '.dark'"),
      `${relativePath} contains an unscoped .dark selector`
    )
    assert(
      !/data-icon=["']inline-(?:start|end)["']|\[icon=inline-(?:start|end)\]/.test(
        source
      ),
      `${relativePath} contains a collision-prone icon-position attribute`
    )

    if (/(^|\s)data-slot=(?=["'{])/m.test(source)) {
      assert(
        source.includes('data-applique-component'),
        `${relativePath} contains data-slot without the Applique host marker`
      )
    }

    if (relativePath.startsWith('src/components/applique/internal/')) {
      for (const match of source.matchAll(
        /^function\s+([A-Z][A-Za-z0-9_]*)Impl\b/gm
      )) {
        assert(
          source.includes(
            `const ${match[1]} = withReact18Ref(${match[1]}Impl)`
          ),
          `${relativePath} does not forward refs for ${match[1]}`
        )
      }
    }
  }

  const utilsPath = consumerPathForTarget('@lib/utils.ts', mode)
  assert(
    fs.readFileSync(path.join(consumerDirectory, utilsPath), 'utf8') ===
      mode.utilsSource,
    `shadcn overwrote the consumer-owned ${path.basename(
      utilsPath
    )} file without --overwrite`
  )
  assert(
    !fs.existsSync(path.join(consumerDirectory, 'src/components/ui')),
    'Registry installation created the deprecated public components/ui directory'
  )

  const inputNumberPath = consumerPathForTarget(
    '@components/applique/input-number.tsx',
    mode
  )
  const installedInputNumber = fs.readFileSync(
    path.join(consumerDirectory, inputNumberPath),
    'utf8'
  )
  assert(
    installedInputNumber.includes('@/components/applique/internal/input') &&
      !installedInputNumber.includes('../input'),
    'Applique InputNumber did not resolve its internal primitive import'
  )

  const calendarPath = consumerPathForTarget('@ui/calendar.tsx', mode)
  const installedCalendar = fs.readFileSync(
    path.join(consumerDirectory, calendarPath),
    'utf8'
  )
  assert(
    installedCalendar.includes('ref={mergeRefs(ref, forwardedRef)}'),
    'Calendar did not preserve both its focus ref and the consumer ref'
  )
  assert(
    installedCalendar.includes('@/components/applique/internal/button') &&
      !installedCalendar.includes('@/components/ui/button'),
    'Calendar did not resolve Button to the internal shadcn primitive'
  )
  if (mode.tsx) {
    assert(
      installedCalendar.includes('ref?: React.Ref<HTMLButtonElement>'),
      'Calendar TypeScript output lost its forwarded-ref type'
    )
  }

  const internalButtonPath = consumerPathForTarget(
    '@components/applique/internal/button.tsx',
    mode
  )
  const installedInternalButton = fs.readFileSync(
    path.join(consumerDirectory, internalButtonPath),
    'utf8'
  )
  for (const attribute of [
    'data-applique-component',
    'data-variant={variant}',
    'data-size={size}',
  ]) {
    assert(
      installedInternalButton.includes(attribute),
      `installed Button is missing ${attribute}`
    )
  }

  const chartPath = consumerPathForTarget('@ui/chart.tsx', mode)
  const installedChart = fs.readFileSync(
    path.join(consumerDirectory, chartPath),
    'utf8'
  )
  for (const componentName of [
    'ChartTooltipContentImpl',
    'ChartLegendContentImpl',
  ]) {
    const componentStart = installedChart.indexOf(`function ${componentName}`)
    const componentEnd = installedChart.indexOf('\n}\n', componentStart)
    const componentSource = installedChart.slice(componentStart, componentEnd)
    assert(
      componentStart >= 0 &&
        componentSource.includes('  ref,') &&
        componentSource.includes('ref={ref}'),
      `${componentName} did not forward its DOM ref`
    )
  }

  const sidebarPath = consumerPathForTarget('@ui/sidebar.tsx', mode)
  const installedSidebar = fs.readFileSync(
    path.join(consumerDirectory, sidebarPath),
    'utf8'
  )
  for (const internalImport of [
    '@/components/applique/internal/button',
    '@/components/applique/internal/tooltip',
  ]) {
    assert(
      installedSidebar.includes(internalImport),
      `Sidebar did not resolve ${internalImport} to an internal shadcn primitive`
    )
  }

  const installedCss = fs.readFileSync(
    path.join(consumerDirectory, 'src/index.css'),
    'utf8'
  )

  assert(
    /@theme\s+inline\s*\{/.test(installedCss),
    'shadcn did not install an inline Tailwind 4 theme'
  )
  for (const [themeVariable, semanticVariable] of [
    ['color-primary', 'applique-primary'],
    ['color-primary-foreground', 'applique-primary-foreground'],
    ['color-outline-border', 'applique-outline-border'],
    ['color-sidebar-ring', 'applique-sidebar-ring'],
  ]) {
    const mappingPattern = new RegExp(
      `--${themeVariable}\\s*:\\s*var\\(\\s*--${semanticVariable}\\s*\\)`,
      'i'
    )
    assert(
      mappingPattern.test(installedCss),
      `installed CSS is missing --${themeVariable}: var(--${semanticVariable})`
    )
  }
  assert(
    /--applique-primary\s*:\s*#5232d0\b/i.test(installedCss),
    'installed CSS does not contain the namespaced primary token'
  )
  assert(
    !/(^|[;{]\s*)--primary\s*:/im.test(installedCss),
    'installed CSS contains the collision-prone --primary variable'
  )
  assert(
    /--radius-md\s*:\s*8px\b/i.test(installedCss),
    'installed CSS does not contain the exact Applique radius-md token'
  )
  assert(
    installedCss.includes('@import "@fontsource-variable/hanken-grotesk"'),
    'installed CSS does not import the pinned Hanken Grotesk font'
  )
  assert(
    installedCss.includes(
      '@custom-variant dark (&:where([data-applique-color-scheme="dark"], [data-applique-color-scheme="dark"] *))'
    ),
    'installed CSS does not override the global dark variant'
  )
  assert(
    installedCss.includes(
      '@custom-variant applique-dark (&:where([data-applique-color-scheme="dark"], [data-applique-color-scheme="dark"] *))'
    ),
    'installed CSS does not contain the scoped applique-dark variant'
  )
  for (const selector of [
    "[data-applique-component][data-slot='button']",
    "input[data-applique-component][data-slot='input']",
  ]) {
    assert(
      installedCss.includes(selector),
      `installed CSS does not contain host compatibility selector ${selector}`
    )
  }
  for (const hostileRule of [
    'html {\n  font-size: 10px;',
    '.border {\n  border: 1px solid red;',
    '[data-icon]::before',
  ]) {
    assert(
      installedCss.includes(hostileRule),
      `hostile legacy CSS fixture was not loaded: ${hostileRule}`
    )
  }
  assert(
    fs.existsSync(
      path.join(
        consumerDirectory,
        'node_modules/@fontsource-variable/hanken-grotesk/package.json'
      )
    ),
    'shadcn did not install the pinned Hanken Grotesk package'
  )
  assert(
    !fs.existsSync(
      path.join(consumerDirectory, 'node_modules/@shadcn/react/package.json')
    ),
    'React 18 consumer unexpectedly installed @shadcn/react'
  )
  const reactIsPackage = readJson(
    path.join(consumerDirectory, 'node_modules/react-is/package.json')
  )
  assert(
    reactIsPackage.version === '18.3.1',
    `React 18 consumer installed react-is@${reactIsPackage.version}`
  )
  assert(
    !/hsl\s*\(\s*var\s*\(/i.test(installedCss),
    'installed CSS contains an obsolete hsl(var(...)) wrapper'
  )
  const circularThemeVariable = installedCss.match(
    /--([a-z0-9-]+)\s*:\s*var\(\s*--\1\s*\)/i
  )
  assert(
    !circularThemeVariable,
    `installed CSS contains a circular Tailwind theme variable: ${
      circularThemeVariable?.[0] || 'unknown'
    }`
  )

  const compiledCss = fs.readFileSync(
    path.join(consumerDirectory, 'dist.css'),
    'utf8'
  )

  for (const expectedCss of [
    '--applique-primary:#5232d0',
    '--spacing-8:32px',
    '--text-sm:14px',
    '.bg-primary',
    '.text-primary-foreground',
    '.rounded-lg',
    'Hanken Grotesk Variable',
    '[data-applique-color-scheme=dark]',
    '[data-applique-component][data-slot=button]',
    'input[data-applique-component][data-slot=input]',
  ]) {
    assert(
      compiledCss.includes(expectedCss),
      `Tailwind did not emit expected Applique CSS ${expectedCss}`
    )
  }
  assert(
    !/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/i.test(compiledCss),
    'Tailwind emitted an OS-controlled dark-mode media query'
  )

  if (!mode.tsx) assertJavaScriptSources(consumerDirectory)
}

function assertFacadeOnlyConsumer(consumerDirectory, mode) {
  for (const contract of OWNED_FACADE_SMOKE_CONTRACTS) {
    const facadePath = consumerPathForTarget(contract.target, mode)
    const primitivePath = consumerPathForTarget(contract.primitiveTarget, mode)

    for (const relativePath of [facadePath, primitivePath]) {
      assert(
        fs.existsSync(path.join(consumerDirectory, relativePath)),
        `Facade-only install did not recursively install ${relativePath}`
      )
    }

    const installedFacade = fs.readFileSync(
      path.join(consumerDirectory, facadePath),
      'utf8'
    )
    assert(
      /^["']use client["']/.test(installedFacade),
      `${contract.name} lost its client-component boundary`
    )
    assert(
      installedFacade.includes(contract.importPath) &&
        !installedFacade.includes('../'),
      `${contract.name} did not resolve its primitive import`
    )

    for (const match of installedFacade.matchAll(
      /from\s+["'](@\/components\/[^"']+)["']/g
    )) {
      assert(
        match[1].startsWith('@/components/applique/'),
        `${contract.name} imports outside the public/internal Applique component boundary: ${match[1]}`
      )
    }
    assert(
      !installedFacade.includes('@/components/ui/'),
      `${contract.name} still imports the public components/ui namespace`
    )
  }

  if (!mode.tsx) assertJavaScriptSources(consumerDirectory)
}

async function main() {
  const manifest = readJson(manifestPath)
  const components = sourceItems(manifest)
  const primitiveComponents = components.filter(
    (item) => item.type === 'registry:ui'
  )
  const ownedFacades = components.filter(
    (item) => item.type === 'registry:component'
  )

  assert(
    primitiveComponents.length === EXPECTED_INSTALLABLE_UI_ITEMS,
    `Expected ${EXPECTED_INSTALLABLE_UI_ITEMS} React 18-compatible UI items, found ${primitiveComponents.length}`
  )
  assert(
    ownedFacades.length === EXPECTED_OWNED_FACADE_ITEMS &&
      ownedFacades
        .map((item) => item.name)
        .sort()
        .join(',') ===
        OWNED_FACADE_SMOKE_CONTRACTS.map((item) => item.name)
          .sort()
          .join(','),
    `Expected ${EXPECTED_OWNED_FACADE_ITEMS} reviewed Applique facades, found ${ownedFacades.length}`
  )

  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'applique-registry-smoke-')
  )
  const hostDirectory = path.join(temporaryRoot, 'host')
  const registryDirectory = path.join(hostDirectory, 'registry')
  fs.mkdirSync(hostDirectory, { recursive: true })

  const server = createStaticServer(hostDirectory)

  try {
    const address = await listen(server)
    assert(
      address && typeof address === 'object',
      'Could not determine registry server address'
    )
    const registryBaseUrl = `http://127.0.0.1:${address.port}/registry`

    await run(process.execPath, [
      generatorPath,
      '--base-url',
      registryBaseUrl,
      '--output',
      registryDirectory,
    ])

    const itemUrls = components.map(
      (item) => `${registryBaseUrl}/${encodeURIComponent(item.name)}.json`
    )

    for (const mode of CONSUMER_MODES) {
      const consumerDirectory = path.join(temporaryRoot, `consumer-${mode.id}`)
      fs.mkdirSync(consumerDirectory, { recursive: true })
      createConsumer(consumerDirectory, manifest, mode)

      await run(
        'npx',
        [
          '--yes',
          `shadcn@${SHADCN_CLI_VERSION}`,
          'add',
          ...itemUrls,
          '--yes',
          '--cwd',
          consumerDirectory,
        ],
        {
          cwd: consumerDirectory,
          input: 'n\n',
        }
      )

      appendHostileHostCss(consumerDirectory)

      if (mode.tsx) {
        await run(
          'pnpm',
          ['exec', 'tsc', '--noEmit', '--project', mode.configFile],
          { cwd: consumerDirectory }
        )
      }
      await run(
        'pnpm',
        [
          'exec',
          'tailwindcss',
          '-i',
          'src/index.css',
          '-o',
          'dist.css',
          '--minify',
        ],
        { cwd: consumerDirectory }
      )

      assertInstalledConsumer(consumerDirectory, manifest, mode)
      console.log(
        `[registry] ${mode.label} consumer passed for ${components.length} components`
      )
    }

    const facadeUrls = ownedFacades.map(
      (item) => `${registryBaseUrl}/${encodeURIComponent(item.name)}.json`
    )

    for (const mode of CONSUMER_MODES) {
      const consumerDirectory = path.join(
        temporaryRoot,
        `facade-only-${mode.id}`
      )
      fs.mkdirSync(consumerDirectory, { recursive: true })
      createConsumer(consumerDirectory, manifest, mode, { rsc: true })
      createFacadeOnlySmoke(consumerDirectory, mode)

      await run(
        'npx',
        [
          '--yes',
          `shadcn@${SHADCN_CLI_VERSION}`,
          'add',
          ...facadeUrls,
          '--yes',
          '--cwd',
          consumerDirectory,
        ],
        {
          cwd: consumerDirectory,
          input: 'n\n',
        }
      )

      if (mode.tsx) {
        await run(
          'pnpm',
          ['exec', 'tsc', '--noEmit', '--project', mode.configFile],
          { cwd: consumerDirectory }
        )
      }

      assertFacadeOnlyConsumer(consumerDirectory, mode)
      console.log(
        `[registry] ${mode.label} facade-only install passed for ${ownedFacades.length} facades`
      )
    }

    console.log(
      `[registry] React ${REACT_VERSION} smoke test passed in both output modes with shadcn@${SHADCN_CLI_VERSION}`
    )
  } finally {
    if (server.listening) await close(server)
    assert(
      temporaryRoot.startsWith(`${os.tmpdir()}${path.sep}`),
      'Refusing to remove a non-temporary smoke-test directory'
    )
    fs.rmSync(temporaryRoot, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(`[registry] smoke test failed: ${error.message}`)
  process.exitCode = 1
})
