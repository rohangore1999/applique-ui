#!/usr/bin/env node

/*
 * Explicitly snapshots the official shadcn Base UI registry into this package.
 * Normal registry builds stay offline and consume the checked-in result.
 *
 * Usage:
 *   node scripts/sync-shadcn.js --from /path/to/downloaded/items
 *   node scripts/sync-shadcn.js --from /path/to/downloaded/items --check
 *   node scripts/sync-shadcn.js --allow-network
 */

const crypto = require('crypto')
const fs = require('fs')
const https = require('https')
const path = require('path')

const CLI_VERSION = '4.16.0'
const STYLE = 'base-nova'
const UPSTREAM_COMMIT = '705ce5961080264830471ddd885c01b907706068'
const SOURCE_BASE_URL = `https://ui.shadcn.com/r/styles/${STYLE}`
const UI_ITEMS = [
  'accordion',
  'alert',
  'alert-dialog',
  'aspect-ratio',
  'attachment',
  'avatar',
  'badge',
  'breadcrumb',
  'bubble',
  'button',
  'button-group',
  'calendar',
  'card',
  'carousel',
  'chart',
  'checkbox',
  'collapsible',
  'combobox',
  'command',
  'context-menu',
  'dialog',
  'direction',
  'drawer',
  'dropdown-menu',
  'empty',
  'field',
  'form',
  'hover-card',
  'input',
  'input-group',
  'input-otp',
  'item',
  'kbd',
  'label',
  'marker',
  'menubar',
  'message',
  'message-scroller',
  'native-select',
  'navigation-menu',
  'pagination',
  'popover',
  'progress',
  'radio-group',
  'resizable',
  'scroll-area',
  'select',
  'separator',
  'sheet',
  'sidebar',
  'skeleton',
  'slider',
  'sonner',
  'spinner',
  'switch',
  'table',
  'tabs',
  'textarea',
  'toast',
  'toggle',
  'toggle-group',
  'tooltip',
]
const SUPPORT_ITEMS = ['use-mobile']
const PUBLIC_FACADE_NAMES = new Set([
  'accordion',
  'avatar',
  'badge',
  'banner',
  'bread-crumb',
  'button',
  'button-group',
  'field',
  'input-checkbox',
  'input-date',
  'input-number',
  'input-radio',
  'input-select',
  'input-text',
  'input-text-area',
  'section',
  'tabs',
  'tooltip',
])
const INTERNALIZED_PRIMITIVE_NAMES = new Set([
  'accordion',
  'avatar',
  'badge',
  'button',
  'button-group',
  'field',
  'tabs',
  'tooltip',
])
const REACT_18_UNSUPPORTED_ITEMS = {
  'message-scroller': {
    requiredReact: '>=19',
    reason:
      'The upstream @shadcn/react MessageScroller primitive requires React 19 and relies on ref-as-prop behavior that React 18 does not provide.',
  },
}

// Exact versions are reviewed together with an upstream snapshot. Registry
// generation never resolves "latest" or a semver range.
const DEPENDENCY_PINS = {
  '@base-ui/react': '1.6.0',
  'class-variance-authority': '0.7.1',
  clsx: '2.1.1',
  cmdk: '1.1.1',
  'date-fns': '4.4.0',
  'embla-carousel-react': '8.6.0',
  'input-otp': '1.4.2',
  'lucide-react': '1.28.0',
  'next-themes': '0.4.6',
  'react-day-picker': '10.0.1',
  'react-is': '18.3.1',
  'react-resizable-panels': '4.12.2',
  recharts: '3.8.0',
  sonner: '2.0.7',
  'tailwind-merge': '3.6.0',
}

const packageDir = path.resolve(__dirname, '..')
const sourceDir = path.join(packageDir, 'src')
const manifestPath = path.join(packageDir, 'registry.json')
const lockPath = path.join(packageDir, 'shadcn-base-nova.lock.json')
const indexPath = path.join(sourceDir, 'index.ts')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function parseArguments(argv) {
  const options = { allowNetwork: false, check: false, from: null }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--') {
      continue
    } else if (argument === '--check') {
      options.check = true
    } else if (argument === '--allow-network') {
      options.allowNetwork = true
    } else if (argument === '--help' || argument === '-h') {
      options.help = true
    } else if (argument === '--from') {
      const value = argv[index + 1]
      assert(value && !value.startsWith('--'), '--from requires a directory')
      options.from = path.resolve(value)
      index += 1
    } else {
      throw new Error(`Unknown option: ${argument}`)
    }
  }
  return options
}

function printHelp() {
  console.log(`Snapshot official shadcn ${STYLE} source.

Options:
  --from <directory>  Read downloaded <item>.json files instead of the network.
  --allow-network     Explicitly refresh from the mutable official endpoint.
  --check             Compare without writing files.
  --help              Show this help.
`)
}

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex')
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': `applique-shadcn-sync/${CLI_VERSION}`,
        },
      },
      (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume()
          fetchText(new URL(response.headers.location, url).toString()).then(
            resolve,
            reject
          )
          return
        }
        if (response.statusCode !== 200) {
          response.resume()
          reject(
            new Error(
              `Could not download ${url}: HTTP ${response.statusCode ||
                'unknown'}`
            )
          )
          return
        }
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => resolve(body))
      }
    )
    request.on('error', reject)
  })
}

async function loadItem(name, fromDirectory) {
  if (fromDirectory) {
    const filePath = path.join(fromDirectory, `${name}.json`)
    assert(fs.existsSync(filePath), `Downloaded item is missing: ${filePath}`)
    return readJson(filePath)
  }
  const source = await fetchText(`${SOURCE_BASE_URL}/${name}.json`)
  try {
    return JSON.parse(source)
  } catch (error) {
    throw new Error(`Invalid upstream JSON for ${name}: ${error.message}`)
  }
}

function packageNameFromSpecifier(specifier) {
  return specifier.startsWith('@')
    ? specifier
        .split('/')
        .slice(0, 2)
        .join('/')
    : specifier.split('/')[0]
}

function packageNameFromDependency(dependency) {
  if (dependency.startsWith('@')) {
    const slash = dependency.indexOf('/')
    const versionSeparator = dependency.indexOf('@', slash)
    return versionSeparator === -1
      ? dependency
      : dependency.slice(0, versionSeparator)
  }
  const versionSeparator = dependency.lastIndexOf('@')
  return versionSeparator > 0
    ? dependency.slice(0, versionSeparator)
    : dependency
}

function exactDependency(dependency) {
  const packageName = packageNameFromDependency(dependency)
  const pinnedVersion = DEPENDENCY_PINS[packageName]
  assert(pinnedVersion, `No exact dependency pin for ${packageName}`)
  return `${packageName}@${pinnedVersion}`
}

function collectModuleSpecifiers(content) {
  const specifiers = []
  const pattern = /(?:from\s+|import\s*\(\s*)["'`]([^"'`]+)["'`](?:\s*\))?/g
  for (const match of content.matchAll(pattern)) specifiers.push(match[1])
  return [...new Set(specifiers)]
}

function transformIconPlaceholders(content, itemName) {
  const importPattern = /^import\s+\{\s*IconPlaceholder\s*\}\s+from\s+["']@\/app\/\(create\)\/components\/icon-placeholder["'];?\s*\n/m
  const hasImport = importPattern.test(content)
  const icons = new Set()
  let transformed = content.replace(importPattern, '')

  transformed = transformed.replace(
    /<IconPlaceholder\b([\s\S]*?)\/>/g,
    (_source, attributes) => {
      const lucide = attributes.match(/\blucide="([A-Za-z0-9]+)"/)
      assert(
        lucide,
        `${itemName} has IconPlaceholder without a static lucide choice`
      )
      icons.add(lucide[1])
      let retained = attributes
      for (const property of [
        'lucide',
        'tabler',
        'hugeicons',
        'phosphor',
        'remixicon',
      ]) {
        retained = retained.replace(
          new RegExp(`\\s+${property}="[A-Za-z0-9]+"`, 'g'),
          ''
        )
      }
      return `<${lucide[1]}${retained} />`
    }
  )

  assert(
    hasImport === icons.size > 0,
    `${itemName} IconPlaceholder import and usage mismatch`
  )
  if (icons.size > 0) {
    const iconImport = `import { ${[...icons]
      .sort()
      .join(', ')} } from "lucide-react"\n`
    const clientDirective = /^("use client"|'use client');?\s*\n+/
    const directive = transformed.match(clientDirective)
    transformed = directive
      ? `${directive[0]}${iconImport}${transformed.slice(directive[0].length)}`
      : `${iconImport}${transformed}`
  }
  return transformed
}

function addReact18CompatibilityImport(content, itemName) {
  const importedNames = [
    ...(itemName === 'calendar' ? ['mergeRefs'] : []),
    'withReact18Ref',
  ]
  const importStatement = `import { ${importedNames.join(
    ', '
  )} } from "./applique-react18-compat"`
  const utilsImport = /^import\s+\{[^}]+\}\s+from\s+["']\.\/utils["'];?[ \t]*$/m

  if (utilsImport.test(content)) {
    return content.replace(
      utilsImport,
      (source) => `${source}\n${importStatement}`
    )
  }

  const clientDirective = /^("use client"|'use client');?\s*\n+/
  const directive = content.match(clientDirective)

  return directive
    ? `${directive[0]}${importStatement}\n\n${content.slice(
        directive[0].length
      )}`
    : `${importStatement}\n\n${content}`
}

function transformReact18Refs(content, itemName) {
  const exportStart = content.lastIndexOf('export {')
  if (exportStart === -1) return content

  const functionNames = [
    ...content.matchAll(/^function\s+([A-Z][A-Za-z0-9_]*)\b/gm),
  ].map((match) => match[1])
  const exportedNames = new Set(
    [...content.slice(exportStart).matchAll(/\b([A-Z][A-Za-z0-9_]*)\b/g)].map(
      (match) => match[1]
    )
  )
  const componentNames = functionNames.filter((name) => exportedNames.has(name))

  if (componentNames.length === 0) return content

  let transformed = addReact18CompatibilityImport(content, itemName)

  for (const name of componentNames) {
    transformed = transformed.replace(
      new RegExp(`(^function\\s+)${name}\\b`, 'm'),
      `$1${name}Impl`
    )
  }

  if (itemName === 'calendar') {
    const dayButtonStart = transformed.indexOf('function CalendarDayButtonImpl')
    const dayButtonEnd = transformed.indexOf('\n}\n', dayButtonStart) + 3
    assert(
      dayButtonStart >= 0 && dayButtonEnd > dayButtonStart + 2,
      'Could not locate CalendarDayButton for the React 18 ref patch'
    )
    const dayButton = transformed
      .slice(dayButtonStart, dayButtonEnd)
      .replace(
        '  locale,\n  ...props',
        '  locale,\n  ref: forwardedRef,\n  ...props'
      )
      .replace(
        '}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> })',
        '}: React.ComponentProps<typeof DayButton> & {\n  locale?: Partial<Locale>\n  ref?: React.Ref<HTMLButtonElement>\n})'
      )
      .replace(
        '    <Button\n      variant="ghost"',
        '    <Button\n      ref={mergeRefs(ref, forwardedRef)}\n      variant="ghost"'
      )
    assert(
      dayButton.includes('ref={mergeRefs(ref, forwardedRef)}') &&
        dayButton.includes('ref?: React.Ref<HTMLButtonElement>'),
      'Could not merge CalendarDayButton refs for React 18'
    )
    transformed = `${transformed.slice(
      0,
      dayButtonStart
    )}${dayButton}${transformed.slice(dayButtonEnd)}`
  }

  if (itemName === 'chart') {
    transformed = transformed
      .replace(
        'function ChartTooltipContentImpl({\n  active,\n  payload,\n  className,',
        'function ChartTooltipContentImpl({\n  active,\n  payload,\n  className,\n  ref,'
      )
      .replace(
        '  return (\n    <div\n      className={cn(\n        "grid min-w-32',
        '  return (\n    <div\n      ref={ref}\n      className={cn(\n        "grid min-w-32'
      )
      .replace(
        'function ChartLegendContentImpl({\n  className,',
        'function ChartLegendContentImpl({\n  className,\n  ref,'
      )
      .replace(
        '  return (\n    <div\n      className={cn(\n        "flex items-center justify-center gap-4",',
        '  return (\n    <div\n      ref={ref}\n      className={cn(\n        "flex items-center justify-center gap-4",'
      )

    assert(
      transformed.includes(
        'function ChartTooltipContentImpl({\n  active,\n  payload,\n  className,\n  ref,'
      ) &&
        transformed.includes(
          'function ChartLegendContentImpl({\n  className,\n  ref,'
        ) &&
        (transformed.match(/ref=\{ref\}/g) || []).length >= 2,
      'Could not forward Chart content refs for React 18'
    )
  }

  const wrappers = componentNames
    .map((name) => `const ${name} = withReact18Ref(${name}Impl)`)
    .join('\n')
  const transformedExportStart = transformed.lastIndexOf('export {')

  return `${transformed.slice(
    0,
    transformedExportStart
  )}${wrappers}\n\n${transformed.slice(transformedExportStart)}`
}

function transformSource(content, itemName) {
  let transformed = content.replace(/\r\n?/g, '\n')
  transformed = transformIconPlaceholders(transformed, itemName)
    .replaceAll('@/registry/base-nova/lib/utils', './utils')
    .replaceAll('@/registry/base-nova/hooks/use-mobile', './use-mobile')
    .replace(
      /@\/registry\/base-nova\/ui\/([a-z0-9-]+)/g,
      (_match, componentName) => `./${componentName}`
    )
    .replace(
      /(^|[\s"'`])dark:(?=\S)/gm,
      (_match, boundary) => `${boundary}applique-dark:`
    )

  if (itemName === 'chart') {
    transformed = transformed.replace(
      'const THEMES = { light: "", dark: ".dark" } as const',
      `const THEMES = { light: "", dark: '[data-applique-color-scheme="dark"]' } as const`
    )
  }

  if (itemName === 'calendar') {
    const localeCodeUses = (transformed.match(/locale\?\.code/g) || []).length
    assert(
      localeCodeUses === 2,
      `Expected two Calendar locale.code reads, found ${localeCodeUses}`
    )
    transformed = transformed.replaceAll(
      'locale?.code',
      '(locale as { code?: string } | undefined)?.code'
    )
  }

  transformed = transformReact18Refs(transformed, itemName)

  assert(
    !transformed.includes('@/registry/'),
    `${itemName} still contains a private registry alias`
  )
  assert(
    !transformed.includes('@/app/'),
    `${itemName} still contains a private application alias`
  )
  assert(
    !transformed.includes('dark:".dark"') &&
      !transformed.includes('dark: ".dark"'),
    `${itemName} still contains an unscoped dark selector`
  )
  return transformed.endsWith('\n') ? transformed : `${transformed}\n`
}

function localDependencyFromSpecifier(specifier) {
  if (specifier === './utils') return 'utils'
  if (specifier === './use-mobile') return 'use-mobile'
  return /^\.\/[a-z0-9-]+$/.test(specifier) ? specifier.slice(2) : null
}

function registryNameForPrimitive(name) {
  return INTERNALIZED_PRIMITIVE_NAMES.has(name)
    ? `applique-internal-${name}`
    : name
}

function consumerImportForLocalDependency(dependency) {
  if (dependency === 'utils') return '@/lib/utils'
  if (dependency === 'applique-react18-compat') {
    return '@/lib/applique-react18-compat'
  }
  if (dependency === 'use-mobile') return '@/hooks/use-mobile'
  if (INTERNALIZED_PRIMITIVE_NAMES.has(dependency)) {
    return `@/components/applique/internal/${dependency}`
  }
  return `@/components/ui/${dependency}`
}

function buildItemDependencies(upstreamItem, transformedSource, itemName) {
  const packageNames = new Set(
    (upstreamItem.dependencies || []).map(packageNameFromDependency)
  )
  for (const specifier of collectModuleSpecifiers(transformedSource)) {
    if (
      specifier === 'react' ||
      specifier === 'react-dom' ||
      specifier.startsWith('.') ||
      specifier.startsWith('@/') ||
      specifier.startsWith('node:')
    ) {
      continue
    }
    packageNames.add(packageNameFromSpecifier(specifier))
  }
  if (itemName === 'chart') packageNames.add('react-is')
  return [...packageNames].sort().map(exactDependency)
}

function buildRegistryDependencies(upstreamItem, transformedSource) {
  const dependencies = new Set(['applique-theme'])
  for (const specifier of collectModuleSpecifiers(transformedSource)) {
    const dependency = localDependencyFromSpecifier(specifier)
    if (dependency) dependencies.add(registryNameForPrimitive(dependency))
  }
  for (const dependency of upstreamItem.registryDependencies || []) {
    dependencies.add(registryNameForPrimitive(dependency))
  }
  return [...dependencies]
}

function buildImportMap(transformedSource) {
  const importMap = {}
  for (const specifier of collectModuleSpecifiers(transformedSource)) {
    const dependency = localDependencyFromSpecifier(specifier)
    if (dependency) {
      importMap[specifier] = consumerImportForLocalDependency(dependency)
    }
  }
  return importMap
}

function titleFromName(name) {
  return name
    .split('-')
    .map((word) =>
      word === 'otp' ? 'OTP' : `${word[0].toUpperCase()}${word.slice(1)}`
    )
    .join(' ')
}

function createManifestItem(snapshot) {
  const upstream = {
    cliVersion: CLI_VERSION,
    sourceSha256: snapshot.sourceSha256,
    style: STYLE,
    upstreamSha256: snapshot.upstreamSha256,
  }

  if (snapshot.status === 'deprecated') {
    return {
      name: snapshot.name,
      type: snapshot.type,
      title: titleFromName(snapshot.name),
      description:
        'Deprecated upstream placeholder. Base UI uses Field instead of the former Form wrapper.',
      categories: ['deprecated'],
      files: [],
      meta: {
        replacement: 'field',
        status: 'deprecated',
        upstream: { ...upstream, fileless: true },
      },
    }
  }

  if (snapshot.status === 'unsupported') {
    return {
      name: snapshot.name,
      type: snapshot.type,
      title: titleFromName(snapshot.name),
      description:
        'Unavailable in the React 18 registry baseline because its upstream primitive requires React 19.',
      categories: ['compatibility', 'react-19'],
      dependencies: [],
      registryDependencies: [],
      files: [],
      meta: {
        compatibility: REACT_18_UNSUPPORTED_ITEMS[snapshot.name],
        status: 'unsupported',
        upstream: { ...upstream, excluded: true },
      },
    }
  }

  const internalized = INTERNALIZED_PRIMITIVE_NAMES.has(snapshot.name)
  const manifestName = registryNameForPrimitive(snapshot.name)
  const target = snapshot.type === 'registry:hook'
    ? `@hooks/${snapshot.name}.ts`
    : internalized
      ? `@components/applique/internal/${snapshot.name}.tsx`
      : `@ui/${snapshot.name}.tsx`
  const item = {
    name: manifestName,
    type: snapshot.type,
    title: internalized
      ? `Internal ${titleFromName(snapshot.name)} Primitive`
      : titleFromName(snapshot.name),
    description:
      snapshot.type === 'registry:hook'
        ? 'Support hook required by the Applique-themed Sidebar.'
        : internalized
          ? `Internal pinned shadcn ${STYLE} primitive used by the public Applique facade.`
        : `Official shadcn ${STYLE} component with Applique theme tokens.`,
    categories:
      snapshot.type === 'registry:hook'
        ? ['foundation', 'hook']
        : internalized
          ? ['internal', 'primitive', 'base-ui']
        : ['primitive', 'base-ui'],
    dependencies: snapshot.dependencies,
    registryDependencies: snapshot.registryDependencies,
    files: [
      {
        path: snapshot.sourcePath,
        type: snapshot.type,
        target,
      },
    ],
    meta: {
      status:
        snapshot.type === 'registry:hook'
          ? 'foundation'
          : internalized
            ? 'internal'
            : 'experimental',
      upstream,
    },
  }
  if (Object.keys(snapshot.importMap).length > 0) {
    item.meta.build = { importMap: snapshot.importMap }
  }
  return item
}

function createIndex(snapshots, ownedItems) {
  const lines = ['/* This file is generated by scripts/sync-shadcn.js. */', '']
  for (const snapshot of snapshots) {
    if (
      snapshot.type !== 'registry:ui' ||
      snapshot.status !== 'installable' ||
      INTERNALIZED_PRIMITIVE_NAMES.has(snapshot.name)
    ) {
      continue
    }
    lines.push(
      snapshot.name === 'sonner'
        ? `export { Toaster as SonnerToaster } from './sonner'`
        : `export * from './${snapshot.name}'`
    )
  }
  for (const item of ownedItems) {
    for (const file of item.files) {
      const modulePath = file.path
        .replace(/^src\//, './')
        .replace(/\.[jt]sx?$/, '')
      const publicExports =
        item.meta && item.meta.build && item.meta.build.publicExports

      if (!Array.isArray(publicExports) || publicExports.length === 0) {
        lines.push(`export * from '${modulePath}'`)
        continue
      }

      for (const entry of publicExports) {
        assert(
          entry &&
            typeof entry.name === 'string' &&
            /^[A-Za-z_$][\w$]*$/.test(entry.name),
          `Owned facade ${item.name} has an invalid public export`
        )
        assert(
          entry.as === undefined ||
            (typeof entry.as === 'string' &&
              /^[A-Za-z_$][\w$]*$/.test(entry.as)),
          `Owned facade ${item.name} has an invalid public export alias`
        )
        assert(
          entry.type === undefined || typeof entry.type === 'boolean',
          `Owned facade ${item.name} has an invalid public export type flag`
        )

        const exportedName = entry.as
          ? `${entry.name} as ${entry.as}`
          : entry.name
        lines.push(
          `export${
            entry.type ? ' type' : ''
          } { ${exportedName} } from '${modulePath}'`
        )
      }
    }
  }
  lines.push(`export { useIsMobile } from './use-mobile'`)
  lines.push(`export { cn } from './utils'`, '')
  return lines.join('\n')
}

function stageFile(files, filePath, content) {
  files.set(path.resolve(filePath), content)
}

function applyFiles(files, check) {
  const differences = []
  for (const [filePath, expected] of files) {
    const exists = fs.existsSync(filePath)
    if (expected === null) {
      if (!exists) continue
      if (check) {
        differences.push(`${path.relative(packageDir, filePath)} is stale`)
        continue
      }
      fs.unlinkSync(filePath)
      console.log(
        `[shadcn-sync] removed ${path.relative(packageDir, filePath)}`
      )
      continue
    }
    const actual = exists ? fs.readFileSync(filePath, 'utf8') : null
    if (actual === expected) continue
    if (check) {
      differences.push(
        `${path.relative(packageDir, filePath)} is ${
          exists ? 'stale' : 'missing'
        }`
      )
      continue
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    const temporaryPath = `${filePath}.${process.pid}.tmp`
    fs.writeFileSync(temporaryPath, expected)
    fs.renameSync(temporaryPath, filePath)
    console.log(`[shadcn-sync] wrote ${path.relative(packageDir, filePath)}`)
  }
  assert(
    differences.length === 0,
    `Checked-in shadcn snapshot is not current:\n- ${differences.join('\n- ')}`
  )
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) return printHelp()
  assert(
    options.from || options.allowNetwork,
    `Network sync is intentionally explicit because ${SOURCE_BASE_URL} is mutable. Use --from for an audited download or --allow-network after reviewing shadcn@${CLI_VERSION} and upstream commit ${UPSTREAM_COMMIT}.`
  )
  if (options.from) {
    assert(
      fs.existsSync(options.from) && fs.statSync(options.from).isDirectory(),
      `--from is not a directory: ${options.from}`
    )
  }
  assert(UI_ITEMS.length === 62, `Expected 62 UI items, got ${UI_ITEMS.length}`)

  const itemNames = [...UI_ITEMS, ...SUPPORT_ITEMS]
  const upstreamItems = new Map()
  for (const name of itemNames) {
    const item = await loadItem(name, options.from)
    assert(item.name === name, `${name}.json contains item "${item.name}"`)
    upstreamItems.set(name, item)
  }

  const snapshots = []
  const stagedFiles = new Map()
  for (const name of [...itemNames].sort()) {
    const upstreamItem = upstreamItems.get(name)
    const upstreamPath = `upstream/${STYLE}/${name}.json`
    stageFile(
      stagedFiles,
      path.join(packageDir, upstreamPath),
      serialize(upstreamItem)
    )
    const type = name === 'use-mobile' ? 'registry:hook' : 'registry:ui'
    assert(upstreamItem.type === type, `${name} has type ${upstreamItem.type}`)
    const files = upstreamItem.files || []

    if (name === 'form') {
      assert(files.length === 0, 'Base UI Form unexpectedly gained source')
      snapshots.push({
        dependencies: [],
        importMap: {},
        name,
        registryDependencies: [],
        sourcePath: null,
        sourceSha256: null,
        status: 'deprecated',
        type,
        upstreamPath,
        upstreamSha256: sha256(JSON.stringify(upstreamItem)),
      })
      continue
    }

    if (REACT_18_UNSUPPORTED_ITEMS[name]) {
      assert(
        files.length === 1,
        `${name} compatibility exclusion expected exactly one upstream source file`
      )
      const sourcePath = `src/${name}.tsx`
      snapshots.push({
        dependencies: [],
        importMap: {},
        name,
        registryDependencies: [],
        sourcePath: null,
        sourceSha256: null,
        status: 'unsupported',
        type,
        upstreamPath,
        upstreamSha256: sha256(JSON.stringify(upstreamItem)),
      })
      stageFile(stagedFiles, path.join(packageDir, sourcePath), null)
      continue
    }

    assert(files.length === 1, `${name} must contain exactly one source file`)
    const transformedSource = transformSource(files[0].content, name)
    const extension = type === 'registry:hook' ? 'ts' : 'tsx'
    const sourcePath = `src/${name}.${extension}`
    const snapshot = {
      dependencies: buildItemDependencies(
        upstreamItem,
        transformedSource,
        name
      ),
      importMap: buildImportMap(transformedSource),
      name,
      registryDependencies:
        type === 'registry:hook'
          ? []
          : buildRegistryDependencies(upstreamItem, transformedSource),
      sourcePath,
      sourceSha256: sha256(transformedSource),
      status: 'installable',
      type,
      upstreamPath,
      upstreamSha256: sha256(JSON.stringify(upstreamItem)),
    }
    snapshots.push(snapshot)
    stageFile(stagedFiles, path.join(packageDir, sourcePath), transformedSource)
  }
  snapshots.sort((left, right) => left.name.localeCompare(right.name))

  const currentManifest = readJson(manifestPath)
  const foundationItems = currentManifest.items.filter((item) =>
    ['applique-theme', 'applique-react18-compat', 'utils'].includes(item.name)
  )
  const ownedItems = currentManifest.items
    .filter((item) => item.meta && item.meta.status === 'facade')
    .sort((left, right) => left.name.localeCompare(right.name))
  assert(
    foundationItems.length === 3,
    'registry.json must contain applique-theme, applique-react18-compat, and utils'
  )
  assert(
    ownedItems.length === PUBLIC_FACADE_NAMES.size &&
      ownedItems.every((item) => PUBLIC_FACADE_NAMES.has(item.name)),
    'registry.json must contain every reviewed public facade name exactly once'
  )
  for (const item of ownedItems) {
    assert(
      item.type === 'registry:component' && PUBLIC_FACADE_NAMES.has(item.name),
      `Owned facade ${item.name} must use its reviewed public registry name`
    )
    assert(
      Array.isArray(item.files) && item.files.length > 0,
      `Owned facade ${item.name} must contain source files`
    )
    for (const file of item.files) {
      assert(
        file.path.startsWith('src/facades/') &&
          file.target.startsWith('@components/applique/'),
        `Owned facade ${item.name} must use src/facades and @components/applique targets`
      )
      assert(
        fs.existsSync(path.join(packageDir, file.path)),
        `Owned facade ${item.name} source is missing: ${file.path}`
      )
    }
    const publicExports = item.meta.build && item.meta.build.publicExports
    assert(
      !Array.isArray(publicExports) ||
        publicExports.every((entry) => entry.as === undefined),
      `Owned facade ${item.name} must expose its public names without Applique aliases`
    )
  }
  foundationItems.find((item) => item.name === 'utils').dependencies = [
    exactDependency('clsx'),
    exactDependency('tailwind-merge'),
  ]

  const manifest = {
    ...currentManifest,
    meta: {
      ...(currentManifest.meta || {}),
      upstream: {
        cliVersion: CLI_VERSION,
        commit: UPSTREAM_COMMIT,
        itemCount: UI_ITEMS.length,
        style: STYLE,
      },
    },
    items: [
      ...foundationItems,
      ...snapshots
        .filter((snapshot) => snapshot.type === 'registry:hook')
        .map(createManifestItem),
      ...snapshots
        .filter((snapshot) => snapshot.type === 'registry:ui')
        .map(createManifestItem),
      ...ownedItems,
    ],
  }
  const lock = {
    cliVersion: CLI_VERSION,
    dependencyPins: Object.fromEntries(
      Object.entries(DEPENDENCY_PINS).sort(([left], [right]) =>
        left.localeCompare(right)
      )
    ),
    itemCount: UI_ITEMS.length,
    items: snapshots.map((snapshot) => ({
      dependencies: snapshot.dependencies,
      name: snapshot.name,
      registryDependencies: snapshot.registryDependencies,
      sourcePath: snapshot.sourcePath,
      sourceSha256: snapshot.sourceSha256,
      status: snapshot.status,
      type: snapshot.type,
      upstreamPath: snapshot.upstreamPath,
      upstreamSha256: snapshot.upstreamSha256,
    })),
    sourceBaseUrl: SOURCE_BASE_URL,
    style: STYLE,
    upstreamCommit: UPSTREAM_COMMIT,
  }

  stageFile(stagedFiles, manifestPath, serialize(manifest))
  stageFile(stagedFiles, lockPath, serialize(lock))
  stageFile(stagedFiles, indexPath, createIndex(snapshots, ownedItems))
  applyFiles(stagedFiles, options.check)
  console.log(
    `[shadcn-sync] ${options.check ? 'validated' : 'snapshotted'} ${
      UI_ITEMS.length
    } ${STYLE} items + ${SUPPORT_ITEMS.length} support item`
  )
}

main().catch((error) => {
  console.error(`[shadcn-sync] ${error.message}`)
  process.exitCode = 1
})
