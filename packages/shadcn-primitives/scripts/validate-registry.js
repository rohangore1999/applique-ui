#!/usr/bin/env node

/*
 * Performs dependency-free validation of the generated Applique registry.
 *
 * This intentionally checks the generated files rather than only the source
 * manifest. It catches malformed JSON, unsafe install paths, duplicate names,
 * invalid registry dependencies, and incomplete component payloads before the
 * files are uploaded to a static host.
 *
 * Usage:
 *   node scripts/validate-registry.js
 *   node scripts/validate-registry.js ../../../docs/registry
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const PACKAGE_DIR = path.resolve(__dirname, '..')
const SNAPSHOT_LOCK_PATH = path.join(PACKAGE_DIR, 'shadcn-base-nova.lock.json')
const SOURCE_MANIFEST_PATH = path.join(PACKAGE_DIR, 'registry.json')
const DEFAULT_REGISTRY_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'docs',
  'registry'
)

const REGISTRY_SCHEMA = 'https://ui.shadcn.com/schema/registry.json'
const REGISTRY_ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json'
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TYPE_PATTERN = /^registry:[a-z][a-z0-9-]*$/
const EXACT_SEMVER_PATTERN = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+(?:[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
const FOUNDATION_ITEM_TYPES = new Map([
  ['applique-theme', 'registry:theme'],
  ['applique-react18-compat', 'registry:lib'],
  ['utils', 'registry:lib'],
])
const FOUNDATION_ITEM_NAMES = new Set(FOUNDATION_ITEM_TYPES.keys())
const INTERNAL_UPSTREAM_ITEM_NAMES = new Map([
  ['accordion', 'applique-internal-accordion'],
  ['avatar', 'applique-internal-avatar'],
  ['badge', 'applique-internal-badge'],
  ['button', 'applique-internal-button'],
  ['button-group', 'applique-internal-button-group'],
  ['tabs', 'applique-internal-tabs'],
  ['tooltip', 'applique-internal-tooltip'],
])
const UPSTREAM_NAMES_BY_INTERNAL_ITEM = new Map(
  [...INTERNAL_UPSTREAM_ITEM_NAMES].map(([upstreamName, internalName]) => [
    internalName,
    upstreamName,
  ])
)
const INTERNAL_UPSTREAM_ITEM_NAME_SET = new Set(
  INTERNAL_UPSTREAM_ITEM_NAMES.values()
)
const OWNED_FACADE_CONTRACTS = new Map([
  [
    'avatar',
    {
      publicExports: [
        { name: 'Avatar' },
        { name: 'AvatarProps', type: true },
      ],
      registryDependencies: ['applique-internal-avatar'],
      sourcePath: 'src/facades/avatar.tsx',
      target: '@components/applique/avatar.tsx',
    },
  ],
  [
    'input-checkbox',
    {
      registryDependencies: ['checkbox'],
      sourcePath: 'src/facades/input-checkbox.tsx',
      target: '@components/applique/input-checkbox.tsx',
    },
  ],
  [
    'input-number',
    {
      registryDependencies: ['input'],
      sourcePath: 'src/facades/input-number.tsx',
      target: '@components/applique/input-number.tsx',
    },
  ],
  [
    'input-radio',
    {
      registryDependencies: ['radio-group'],
      sourcePath: 'src/facades/input-radio.tsx',
      target: '@components/applique/input-radio.tsx',
    },
  ],
  [
    'input-text',
    {
      registryDependencies: ['input'],
      sourcePath: 'src/facades/input-text.tsx',
      target: '@components/applique/input-text.tsx',
    },
  ],
  [
    'accordion',
    {
      publicExports: [
        { name: 'Accordion' },
        { name: 'AccordionItem' },
        { name: 'AccordionProps', type: true },
        { name: 'AccordionItemProps', type: true },
        { name: 'AccordionControlIcons', type: true },
      ],
      registryDependencies: ['applique-internal-accordion'],
      sourcePath: 'src/facades/accordion.tsx',
      target: '@components/applique/accordion.tsx',
    },
  ],
  [
    'badge',
    {
      dependencies: ['lucide-react@1.28.0'],
      publicExports: [
        { name: 'Badge' },
        { name: 'BadgeProps', type: true },
      ],
      registryDependencies: ['applique-internal-badge'],
      sourcePath: 'src/facades/badge.tsx',
      target: '@components/applique/badge.tsx',
    },
  ],
  [
    'banner',
    {
      publicExports: [
        { name: 'Banner' },
        { name: 'BannerActionable' },
        { name: 'BannerProps', type: true },
        { name: 'BannerActionableProps', type: true },
        { name: 'BannerActionableData', type: true },
        { name: 'BannerIcon', type: true },
        { name: 'BannerLink', type: true },
        { name: 'BannerTone', type: true },
      ],
      dependencies: ['lucide-react@1.28.0'],
      registryDependencies: ['alert', 'applique-internal-button'],
      sourcePath: 'src/facades/banner.tsx',
      target: '@components/applique/banner.tsx',
    },
  ],
  [
    'bread-crumb',
    {
      registryDependencies: ['breadcrumb'],
      sourcePath: 'src/facades/bread-crumb.tsx',
      target: '@components/applique/bread-crumb.tsx',
    },
  ],
  [
    'button',
    {
      dependencies: ['lucide-react@1.28.0'],
      publicExports: [
        { name: 'Button' },
        { name: 'ButtonProps', type: true },
      ],
      registryDependencies: [
        'applique-internal-badge',
        'applique-internal-button',
        'spinner',
      ],
      sourcePath: 'src/facades/button.tsx',
      target: '@components/applique/button.tsx',
    },
  ],
  [
    'button-group',
    {
      publicExports: [
        { name: 'ButtonGroup' },
        { name: 'ButtonGroupProps', type: true },
      ],
      registryDependencies: [
        'button',
        'applique-internal-button',
        'applique-internal-button-group',
        'dropdown-menu',
      ],
      sourcePath: 'src/facades/button-group.tsx',
      target: '@components/applique/button-group.tsx',
    },
  ],
  [
    'input-text-area',
    {
      dependencies: ['lucide-react@1.28.0'],
      registryDependencies: ['textarea'],
      sourcePath: 'src/facades/input-text-area.tsx',
      target: '@components/applique/input-text-area.tsx',
    },
  ],
  [
    'section',
    {
      publicExports: [
        { name: 'Section' },
        { name: 'SectionProps', type: true },
      ],
      registryDependencies: ['button', 'card'],
      sourcePath: 'src/facades/section.tsx',
      target: '@components/applique/section.tsx',
    },
  ],
  [
    'tabs',
    {
      publicExports: [
        { name: 'Tabs' },
        { name: 'Tab' },
        { name: 'TabsProps', type: true },
        { name: 'TabProps', type: true },
      ],
      registryDependencies: ['applique-internal-tabs'],
      sourcePath: 'src/facades/tabs.tsx',
      target: '@components/applique/tabs.tsx',
    },
  ],
  [
    'tooltip',
    {
      publicExports: [
        { name: 'Tooltip' },
        { name: 'TooltipProps', type: true },
      ],
      registryDependencies: ['applique-internal-tooltip'],
      sourcePath: 'src/facades/tooltip.tsx',
      target: '@components/applique/tooltip.tsx',
    },
  ],
])
const FOUNDATION_DEPENDENCY_PINS = {
  '@fontsource-variable/hanken-grotesk': '5.3.0',
}
const EXPECTED_UI_ENTRIES = 62
const EXPECTED_INSTALLABLE_UI_ENTRIES = 60
const EXPECTED_SUPPORT_HOOKS = 1
const EXPECTED_FOUNDATION_ENTRIES = FOUNDATION_ITEM_NAMES.size
const EXPECTED_OWNED_FACADE_ENTRIES = OWNED_FACADE_CONTRACTS.size
const EXPECTED_MANIFEST_ENTRIES =
  EXPECTED_UI_ENTRIES +
  EXPECTED_SUPPORT_HOOKS +
  EXPECTED_FOUNDATION_ENTRIES +
  EXPECTED_OWNED_FACADE_ENTRIES
const APPLIQUE_SEMANTIC_COLOR_VARS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'applique-info-background',
  'applique-info-foreground',
  'applique-success-background',
  'applique-success-foreground',
  'applique-warning-background',
  'applique-warning-foreground',
  'applique-error-background',
  'applique-error-foreground',
  'border',
  'input',
  'outline-border',
  'outline-foreground',
  'ring',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
]

function canonicalSemanticColorVariable(variableName) {
  return variableName.startsWith('applique-')
    ? variableName
    : `applique-${variableName}`
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertString(value, label) {
  assert(
    typeof value === 'string' && value.trim().length > 0,
    `${label} must be a non-empty string`
  )
}

function assertUniqueStrings(values, label) {
  assert(Array.isArray(values), `${label} must be an array`)

  const seen = new Set()
  for (const [index, value] of values.entries()) {
    assertString(value, `${label}[${index}]`)
    assert(!seen.has(value), `${label} contains duplicate "${value}"`)
    seen.add(value)
  }
}

function dependencyParts(dependency, label) {
  assertString(dependency, label)

  const versionSeparator = dependency.startsWith('@')
    ? dependency.indexOf('@', 1)
    : dependency.lastIndexOf('@')

  assert(
    versionSeparator > 0,
    `${label} must pin an exact package version, got "${dependency}"`
  )

  const packageName = dependency.slice(0, versionSeparator)
  const version = dependency.slice(versionSeparator + 1)
  const validPackageName = packageName.startsWith('@')
    ? /^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/i.test(packageName)
    : /^[a-z0-9][a-z0-9._-]*$/i.test(packageName)

  assert(
    validPackageName,
    `${label} has an invalid package name "${packageName}"`
  )
  assert(
    EXACT_SEMVER_PATTERN.test(version),
    `${label} must use an exact semantic version, got "${dependency}"`
  )

  return { packageName, version }
}

function assertSameStringSet(actual, expected, label) {
  const actualValues = [...actual].sort()
  const expectedValues = [...expected].sort()

  assert(
    JSON.stringify(actualValues) === JSON.stringify(expectedValues),
    `${label} mismatch: expected [${expectedValues.join(
      ', '
    )}], got [${actualValues.join(', ')}]`
  )
}

function availabilityStatus(item) {
  if (item.meta && item.meta.status === 'deprecated') return 'deprecated'
  if (item.meta && item.meta.status === 'unsupported') return 'unsupported'
  if (
    item.type === 'registry:theme' &&
    item.cssVars &&
    typeof item.cssVars === 'object'
  ) {
    return 'installable'
  }
  if (Array.isArray(item.files) && item.files.length > 0) return 'installable'
  return null
}

function assertSafeRelativePath(value, label) {
  assertString(value, label)
  assert(!path.isAbsolute(value), `${label} must be relative`)

  const normalized = value.replace(/\\/g, '/')
  const segments = normalized.split('/')

  assert(!segments.includes('..'), `${label} must not contain ".."`)
  assert(
    !segments.includes(''),
    `${label} must not contain empty path segments`
  )
}

function isExplicitFilelessItem(item) {
  return Boolean(
    item &&
      item.meta &&
      ((item.meta.status === 'deprecated' &&
        item.meta.upstream &&
        item.meta.upstream.fileless === true) ||
        (item.meta.status === 'unsupported' &&
          item.meta.compatibility &&
          item.meta.compatibility.requiredReact === '>=19' &&
          item.meta.upstream &&
          item.meta.upstream.excluded === true))
  )
}

function validateDependencies(item, label, options = {}) {
  const { dependencyPins, requireKnownDependencyPins = false } = options

  for (const field of ['dependencies', 'devDependencies']) {
    if (item[field] !== undefined) {
      assertUniqueStrings(item[field], `${label}.${field}`)

      for (const [index, dependency] of item[field].entries()) {
        const dependencyLabel = `${label}.${field}[${index}]`
        const { packageName, version } = dependencyParts(
          dependency,
          dependencyLabel
        )

        if (!dependencyPins) continue

        const hasReviewedPin = Object.prototype.hasOwnProperty.call(
          dependencyPins,
          packageName
        )
        assert(
          hasReviewedPin || !requireKnownDependencyPins,
          `${dependencyLabel} has no reviewed dependency pin for ${packageName}`
        )
        if (hasReviewedPin) {
          assert(
            dependencyPins[packageName] === version,
            `${dependencyLabel} must match reviewed pin ${packageName}@${dependencyPins[packageName]}`
          )
        }
      }
    }
  }

  if (item.registryDependencies === undefined) return

  assertUniqueStrings(
    item.registryDependencies,
    `${label}.registryDependencies`
  )

  for (const [index, dependency] of item.registryDependencies.entries()) {
    if (!/^https?:\/\//.test(dependency)) continue

    let dependencyUrl
    try {
      dependencyUrl = new URL(dependency)
    } catch (error) {
      throw new Error(
        `${label}.registryDependencies[${index}] is not a valid URL`
      )
    }

    const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])
    const isLocalHttp =
      dependencyUrl.protocol === 'http:' &&
      localHosts.has(dependencyUrl.hostname)

    assert(
      dependencyUrl.protocol === 'https:' || isLocalHttp,
      `${label}.registryDependencies[${index}] must use HTTPS (HTTP is allowed only for local testing)`
    )
    assert(
      !dependencyUrl.username && !dependencyUrl.password,
      `${label}.registryDependencies[${index}] must not contain credentials`
    )
    assert(
      dependencyUrl.pathname.endsWith('.json'),
      `${label}.registryDependencies[${index}] must reference a JSON item`
    )
  }
}

function validateFile(file, label, requireContent) {
  assert(
    file && typeof file === 'object' && !Array.isArray(file),
    `${label} must be an object`
  )
  assertSafeRelativePath(file.path, `${label}.path`)
  assertString(file.type, `${label}.type`)
  assert(
    TYPE_PATTERN.test(file.type),
    `${label}.type must be a shadcn registry type`
  )

  if (file.target !== undefined) {
    assertSafeRelativePath(file.target, `${label}.target`)
  }

  if (requireContent) {
    assert(
      typeof file.content === 'string' && file.content.length > 0,
      `${label}.content must contain the installable source`
    )
  } else if (file.content !== undefined) {
    assert(
      typeof file.content === 'string',
      `${label}.content must be a string when provided`
    )
  }
}

function validateAppliqueTheme(item, label, options = {}) {
  const { requireBuiltTheme = true } = options

  assert(
    item.type === 'registry:theme',
    `${label} must be a registry:theme item`
  )
  assert(
    item.tailwind === undefined,
    `${label} must not contain obsolete Tailwind 3 configuration`
  )
  assert(
    item.cssVars &&
      item.cssVars.theme &&
      typeof item.cssVars.theme === 'object' &&
      !Array.isArray(item.cssVars.theme),
    `${label} must contain cssVars.theme`
  )
  if (requireBuiltTheme) {
    assert(
      item.cssVars.light &&
        typeof item.cssVars.light === 'object' &&
        !Array.isArray(item.cssVars.light),
      `${label} must contain generated cssVars.light`
    )
  }
  assert(
    item.cssVars.dark === undefined,
    `${label} must remain light-only until Applique defines dark tokens`
  )
  assert(
    Array.isArray(item.dependencies) &&
      item.dependencies.includes('@fontsource-variable/hanken-grotesk@5.3.0'),
    `${label} must install the pinned Hanken Grotesk variable font`
  )
  assert(
    item.css &&
      item.css['@import "@fontsource-variable/hanken-grotesk"'] &&
      item.css[
        '@custom-variant dark (&:where([data-applique-color-scheme="dark"], [data-applique-color-scheme="dark"] *))'
      ] &&
      item.css[
        '@custom-variant applique-dark (&:where([data-applique-color-scheme="dark"], [data-applique-color-scheme="dark"] *))'
      ],
    `${label} must install the font import and scoped dark variants`
  )
  if (requireBuiltTheme) {
    assert(
      item.css['[data-applique-component][data-slot=\'button\']'] &&
        item.css[
          "input[data-applique-component][data-slot='input']"
        ],
      `${label} must include the scoped legacy-host compatibility rules`
    )
  } else {
    assert(
      item.meta?.build?.cssFrom === 'src/host-compat.json',
      `${label} must generate scoped legacy-host compatibility rules`
    )
  }

  for (const variableName of APPLIQUE_SEMANTIC_COLOR_VARS) {
    const canonicalVariable = canonicalSemanticColorVariable(variableName)
    if (requireBuiltTheme) {
      const lightValue = item.cssVars.light[canonicalVariable]
      assert(
        /^#[0-9a-f]{6}$/i.test(lightValue || ''),
        `${label}.cssVars.light.${canonicalVariable} must be an exact hex color`
      )
      if (canonicalVariable !== variableName) {
        assert(
          item.cssVars.light[variableName] === undefined,
          `${label}.cssVars.light must not publish collision-prone --${variableName}`
        )
      }
    }
    assert(
      item.cssVars.theme[`color-${variableName}`] ===
        `var(--${canonicalVariable})`,
      `${label}.cssVars.theme.color-${variableName} must map to var(--${canonicalVariable})`
    )
  }

  if (requireBuiltTheme) {
    assert(
      item.cssVars.light['applique-primary'].toLowerCase() === '#5232d0',
      `${label}.cssVars.light.applique-primary must match the Applique Figma token #5232d0`
    )

    for (const [variableName, lightValue] of Object.entries(
      item.cssVars.light
    )) {
      if (
        APPLIQUE_SEMANTIC_COLOR_VARS.includes(variableName) ||
        APPLIQUE_SEMANTIC_COLOR_VARS.some(
          (semanticVariable) =>
            canonicalSemanticColorVariable(semanticVariable) === variableName
        )
      ) {
        continue
      }

      assert(
        item.cssVars.theme[variableName] === lightValue,
        `${label}.cssVars.theme.${variableName} must preserve the exact light token value`
      )
    }
  }

  for (const [variableName, themeValue] of Object.entries(item.cssVars.theme)) {
    assertString(themeValue, `${label}.cssVars.theme.${variableName}`)
    assert(
      !/hsl\s*\(\s*var\s*\(/i.test(themeValue),
      `${label}.cssVars.theme.${variableName} contains an obsolete hsl(var(...)) wrapper`
    )

    const variableReference = themeValue.match(/^var\(\s*--([a-z0-9-]+)\s*\)$/i)
    assert(
      !variableReference || variableReference[1] !== variableName,
      `${label}.cssVars.theme.${variableName} cannot reference itself`
    )
  }
}

function validateItem(item, label, options = {}) {
  const {
    dependencyPins,
    requireContent = false,
    requireBuiltTheme = true,
    requireKnownDependencyPins = false,
    requireSchema = false,
  } = options

  assert(
    item && typeof item === 'object' && !Array.isArray(item),
    `${label} must be an object`
  )
  assertString(item.name, `${label}.name`)
  assert(
    NAME_PATTERN.test(item.name),
    `${label}.name must be a lowercase kebab-case name`
  )
  assertString(item.type, `${label}.type`)
  assert(
    TYPE_PATTERN.test(item.type),
    `${label}.type must be a shadcn registry type`
  )

  if (requireSchema) {
    assert(
      item.$schema === REGISTRY_ITEM_SCHEMA,
      `${label} must use ${REGISTRY_ITEM_SCHEMA}`
    )
  } else if (item.$schema !== undefined) {
    assert(
      item.$schema === REGISTRY_ITEM_SCHEMA,
      `${label} must use ${REGISTRY_ITEM_SCHEMA}`
    )
  }

  validateDependencies(item, label, {
    dependencyPins,
    requireKnownDependencyPins,
  })

  if (item.files !== undefined) {
    assert(Array.isArray(item.files), `${label}.files must be an array`)

    const filePaths = new Set()
    for (const [index, file] of item.files.entries()) {
      const fileLabel = `${label}.files[${index}]`
      validateFile(file, fileLabel, requireContent)
      assert(
        !filePaths.has(file.path),
        `${label}.files contains duplicate path "${file.path}"`
      )
      filePaths.add(file.path)
    }
  }

  const hasFiles = Array.isArray(item.files) && item.files.length > 0
  const hasThemePayload =
    item.type === 'registry:theme' &&
    (item.css !== undefined || item.cssVars !== undefined)

  assert(
    hasFiles || hasThemePayload || isExplicitFilelessItem(item),
    `${label} must contain files, a theme payload, or explicit fileless metadata`
  )

  if (item.cssVars !== undefined) {
    assert(
      item.cssVars &&
        typeof item.cssVars === 'object' &&
        !Array.isArray(item.cssVars),
      `${label}.cssVars must be an object`
    )
    assert(
      Object.keys(item.cssVars).length > 0,
      `${label}.cssVars must not be empty`
    )
  }

  if (item.name === 'applique-theme') {
    validateAppliqueTheme(item, label, { requireBuiltTheme })
  }
}

function validateCatalog(catalog, label, options = {}) {
  assert(
    catalog && typeof catalog === 'object' && !Array.isArray(catalog),
    `${label} must be an object`
  )
  assert(
    catalog.$schema === REGISTRY_SCHEMA,
    `${label} must use ${REGISTRY_SCHEMA}`
  )
  assertString(catalog.name, `${label}.name`)
  assert(
    NAME_PATTERN.test(catalog.name),
    `${label}.name must be a lowercase kebab-case name`
  )
  assert(Array.isArray(catalog.items), `${label}.items must be an array`)
  assert(catalog.items.length > 0, `${label}.items must not be empty`)

  const names = new Set()
  for (const [index, item] of catalog.items.entries()) {
    const itemLabel = `${label}.items[${index}]`
    validateItem(item, itemLabel, options)
    assert(
      !names.has(item.name),
      `${label}.items contains duplicate name "${item.name}"`
    )
    names.add(item.name)
  }
}

function collectJsonFiles(directory) {
  const files = []

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath)
    }
  }

  return files.sort()
}

function readJson(filePath) {
  let source
  try {
    source = fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    throw new Error(`could not read ${filePath}: ${error.message}`)
  }

  try {
    return JSON.parse(source)
  } catch (error) {
    throw new Error(`${filePath} is not valid JSON: ${error.message}`)
  }
}

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex')
}

function validateDependencyPins(lock) {
  assert(
    lock.dependencyPins &&
      typeof lock.dependencyPins === 'object' &&
      !Array.isArray(lock.dependencyPins),
    'snapshot lock must contain dependencyPins'
  )

  for (const [packageName, version] of Object.entries(lock.dependencyPins)) {
    dependencyParts(
      `${packageName}@${version}`,
      `dependencyPins.${packageName}`
    )
  }

  for (const [packageName, version] of Object.entries(
    FOUNDATION_DEPENDENCY_PINS
  )) {
    if (lock.dependencyPins[packageName] !== undefined) {
      assert(
        lock.dependencyPins[packageName] === version,
        `snapshot pin for ${packageName} must match the foundation pin ${version}`
      )
    }
  }

  return {
    ...lock.dependencyPins,
    ...FOUNDATION_DEPENDENCY_PINS,
  }
}

function validateSnapshotDocument(lock) {
  assert(lock.cliVersion === '4.16.0', 'snapshot must pin shadcn CLI 4.16.0')
  assert(lock.style === 'base-nova', 'snapshot must use base-nova')
  assert(
    lock.itemCount === EXPECTED_UI_ENTRIES,
    `snapshot must index exactly ${EXPECTED_UI_ENTRIES} UI items`
  )
  assert(Array.isArray(lock.items), 'snapshot lock must contain an items array')
  assert(
    lock.items.length === EXPECTED_UI_ENTRIES + EXPECTED_SUPPORT_HOOKS,
    `snapshot must contain ${EXPECTED_UI_ENTRIES} UI items and ${EXPECTED_SUPPORT_HOOKS} support hook`
  )

  const dependencyPins = validateDependencyPins(lock)

  const names = new Set()
  const itemsByName = new Map()
  let deprecatedUiItems = 0
  let installableUiItems = 0
  let supportHooks = 0
  let unsupportedUiItems = 0
  let uiItems = 0

  for (const item of lock.items) {
    assertString(item.name, 'snapshot item.name')
    assert(!names.has(item.name), `duplicate snapshot item ${item.name}`)
    names.add(item.name)
    itemsByName.set(item.name, item)
    assert(
      item.type === 'registry:ui' || item.type === 'registry:hook',
      `${item.name} snapshot type must be registry:ui or registry:hook`
    )
    assert(
      Array.isArray(item.dependencies),
      `${item.name} must list dependencies`
    )
    assert(
      Array.isArray(item.registryDependencies),
      `${item.name} must list registryDependencies`
    )
    validateDependencies(item, `snapshot.${item.name}`, {
      dependencyPins,
      requireKnownDependencyPins: true,
    })

    if (item.type === 'registry:ui') {
      uiItems += 1
    } else {
      supportHooks += 1
      assert(
        item.name === 'use-mobile',
        'use-mobile must be the only support hook in the snapshot'
      )
      assert(
        item.status === 'installable',
        'the use-mobile support hook must remain installable'
      )
    }

    assertSafeRelativePath(item.upstreamPath, `${item.name}.upstreamPath`)
    assertString(item.upstreamSha256, `${item.name}.upstreamSha256`)
    const upstreamPath = path.resolve(PACKAGE_DIR, item.upstreamPath)
    const upstreamRelative = path.relative(PACKAGE_DIR, upstreamPath)
    assert(
      upstreamRelative &&
        !upstreamRelative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(upstreamRelative),
      `${item.name}.upstreamPath escapes the package`
    )
    assert(fs.existsSync(upstreamPath), `${item.name} upstream JSON is missing`)
    assert(
      sha256(JSON.stringify(readJson(upstreamPath))) === item.upstreamSha256,
      `${item.name} upstream JSON does not match the pinned snapshot hash`
    )

    if (item.status === 'deprecated') {
      deprecatedUiItems += 1
      assert(
        item.type === 'registry:ui',
        'only a UI item may be deprecated in the snapshot'
      )
      assert(
        item.name === 'form',
        'only Form may be a deprecated snapshot item'
      )
      assert(item.sourcePath === null, 'deprecated Form must remain fileless')
      assert(
        item.sourceSha256 === null,
        'deprecated Form must not claim a source hash'
      )
      continue
    }

    if (item.status === 'unsupported') {
      unsupportedUiItems += 1
      assert(
        item.type === 'registry:ui',
        'only a UI item may be unsupported in the snapshot'
      )
      assert(
        item.name === 'message-scroller',
        'only Message Scroller may be excluded from the React 18 baseline'
      )
      assert(
        item.sourcePath === null,
        'unsupported Message Scroller must not publish source'
      )
      assert(
        item.sourceSha256 === null,
        'unsupported Message Scroller must not claim a source hash'
      )
      assert(
        Array.isArray(item.dependencies) && item.dependencies.length === 0,
        'unsupported Message Scroller must not publish React 19 dependencies'
      )
      continue
    }

    assert(item.status === 'installable', `${item.name} has invalid status`)
    if (item.type === 'registry:ui') installableUiItems += 1
    assertSafeRelativePath(item.sourcePath, `${item.name}.sourcePath`)
    assertString(item.sourceSha256, `${item.name}.sourceSha256`)
    const sourcePath = path.resolve(PACKAGE_DIR, item.sourcePath)
    const relativeToPackage = path.relative(PACKAGE_DIR, sourcePath)
    assert(
      relativeToPackage &&
        !relativeToPackage.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relativeToPackage),
      `${item.name}.sourcePath escapes the package`
    )
    assert(fs.existsSync(sourcePath), `${item.name} source is missing`)
    assert(
      sha256(fs.readFileSync(sourcePath, 'utf8')) === item.sourceSha256,
      `${item.name} source does not match the pinned snapshot hash`
    )
  }

  for (const item of lock.items) {
    for (const dependency of item.registryDependencies) {
      assert(
        names.has(dependency) ||
          FOUNDATION_ITEM_NAMES.has(dependency) ||
          INTERNAL_UPSTREAM_ITEM_NAME_SET.has(dependency),
        `${item.name} references unknown pinned registry item ${dependency}`
      )
    }
  }

  assert(names.has('use-mobile'), 'snapshot must include use-mobile')
  assert(
    uiItems === EXPECTED_UI_ENTRIES,
    `snapshot must contain ${EXPECTED_UI_ENTRIES} UI items, got ${uiItems}`
  )
  assert(
    installableUiItems === EXPECTED_INSTALLABLE_UI_ENTRIES,
    `snapshot must contain ${EXPECTED_INSTALLABLE_UI_ENTRIES} installable UI items, got ${installableUiItems}`
  )
  assert(
    deprecatedUiItems === 1,
    'snapshot must contain one deprecated UI item (Form)'
  )
  assert(
    unsupportedUiItems === 1,
    'snapshot must contain one React 18-incompatible UI item (Message Scroller)'
  )
  assert(
    supportHooks === EXPECTED_SUPPORT_HOOKS,
    `snapshot must contain ${EXPECTED_SUPPORT_HOOKS} support hook, got ${supportHooks}`
  )

  return {
    dependencyPins,
    installableUiItems,
    itemsByName,
    lock,
    supportHooks,
    uiItems,
  }
}

function validatePinnedSnapshot() {
  assert(
    fs.existsSync(SNAPSHOT_LOCK_PATH),
    `missing shadcn snapshot lock: ${SNAPSHOT_LOCK_PATH}`
  )

  return validateSnapshotDocument(readJson(SNAPSHOT_LOCK_PATH))
}

function itemStringArray(item, field) {
  return item[field] === undefined ? [] : item[field]
}

function manifestNameForPinnedItem(name) {
  return INTERNAL_UPSTREAM_ITEM_NAMES.get(name) || name
}

function manifestDependenciesForPinnedItem(pinnedItem) {
  return pinnedItem.registryDependencies.map(manifestNameForPinnedItem)
}

function pinnedItemForSourceItem(snapshot, name, sourceItem) {
  if (sourceItem.meta && sourceItem.meta.status === 'facade') return undefined

  return snapshot.itemsByName.get(
    UPSTREAM_NAMES_BY_INTERNAL_ITEM.get(name) || name
  )
}

function indexItems(items, label) {
  const indexed = new Map()

  for (const item of items) {
    assert(!indexed.has(item.name), `${label} contains duplicate ${item.name}`)
    indexed.set(item.name, item)
  }

  return indexed
}

function validateSourceManifest(manifest, snapshot) {
  validateCatalog(manifest, 'source registry.json', {
    dependencyPins: snapshot.dependencyPins,
    requireBuiltTheme: false,
    requireKnownDependencyPins: true,
  })

  assert(
    manifest.items.length === EXPECTED_MANIFEST_ENTRIES,
    `source registry must contain ${EXPECTED_MANIFEST_ENTRIES} items (${EXPECTED_UI_ENTRIES} UI, ${EXPECTED_SUPPORT_HOOKS} support hook, ${EXPECTED_FOUNDATION_ENTRIES} registry foundations, and ${EXPECTED_OWNED_FACADE_ENTRIES} owned facade)`
  )
  assert(
    manifest.meta && typeof manifest.meta === 'object',
    'source registry must contain metadata'
  )
  assert(
    EXACT_SEMVER_PATTERN.test(manifest.meta.version || ''),
    'source registry meta.version must be an exact semantic version'
  )
  assert(
    manifest.meta.upstream &&
      manifest.meta.upstream.cliVersion === snapshot.lock.cliVersion &&
      manifest.meta.upstream.style === snapshot.lock.style &&
      manifest.meta.upstream.itemCount === EXPECTED_UI_ENTRIES,
    'source registry upstream metadata must match the pinned UI snapshot'
  )

  const itemsByName = indexItems(manifest.items, 'source registry')
  const expectedNames = new Set([
    ...[...snapshot.itemsByName.keys()].map(manifestNameForPinnedItem),
    ...FOUNDATION_ITEM_NAMES,
    ...OWNED_FACADE_CONTRACTS.keys(),
  ])
  assertSameStringSet(
    itemsByName.keys(),
    expectedNames,
    'source registry item names'
  )

  for (const [name, type] of FOUNDATION_ITEM_TYPES) {
    const item = itemsByName.get(name)
    assert(item.type === type, `${name} must remain a ${type} foundation`)
    assert(
      item.meta && item.meta.status === 'foundation',
      `${name} must retain foundation status`
    )
    assert(
      availabilityStatus(item) === 'installable',
      `${name} foundation must remain installable`
    )
  }

  for (const [name, contract] of OWNED_FACADE_CONTRACTS) {
    const item = itemsByName.get(name)
    const label = `source registry owned facade ${name}`

    assert(item.type === 'registry:component', `${label} has an invalid type`)
    assert(
      item.meta && item.meta.status === 'facade',
      `${label} must retain facade status`
    )
    assert(
      availabilityStatus(item) === 'installable',
      `${label} must remain installable`
    )
    assert(
      Array.isArray(item.categories) && item.categories.includes('facade'),
      `${label} must be categorized as a facade`
    )
    assertSameStringSet(
      itemStringArray(item, 'dependencies'),
      contract.dependencies || [],
      `${label} npm dependencies`
    )
    assertSameStringSet(
      itemStringArray(item, 'registryDependencies'),
      contract.registryDependencies,
      `${label} registry dependencies`
    )
    assert(
      item.files.length === 1 &&
        item.files[0].path === contract.sourcePath &&
        item.files[0].target === contract.target &&
        item.files[0].type === 'registry:component',
      `${label} source or installation target differs from its reviewed contract`
    )
    assert(
      !(item.meta && item.meta.upstream),
      `${label} must not claim to be pinned upstream source`
    )
    const compatibility = item.meta && item.meta.compatibility
    const migrationStatus = compatibility && compatibility.migrationStatus
    const unresolvedProps = compatibility && compatibility.unresolvedProps
    assert(
      migrationStatus === undefined || migrationStatus === 'testing',
      `${label} has an invalid compatibility migrationStatus`
    )
    if (migrationStatus === 'testing') {
      assert(
        Array.isArray(unresolvedProps) &&
          unresolvedProps.length > 0 &&
          unresolvedProps.every(
            (propName) => typeof propName === 'string' && propName.length > 0
          ),
        `${label} must list unresolvedProps while migrationStatus is testing`
      )
    } else {
      assert(
        unresolvedProps === undefined,
        `${label} must use migrationStatus testing when unresolvedProps are listed`
      )
    }
    assert(
      JSON.stringify(
        (item.meta && item.meta.build && item.meta.build.publicExports) || []
      ) === JSON.stringify(contract.publicExports || []),
      `${label} public barrel exports differ from its reviewed contract`
    )
  }

  for (const [name, pinnedItem] of snapshot.itemsByName) {
    const manifestName = manifestNameForPinnedItem(name)
    const manifestItem = itemsByName.get(manifestName)
    const label = `source registry item ${manifestName}`

    assert(
      manifestItem.type === pinnedItem.type,
      `${label} type must match the snapshot`
    )
    assert(
      availabilityStatus(manifestItem) === pinnedItem.status,
      `${label} availability must match snapshot status ${pinnedItem.status}`
    )
    assertSameStringSet(
      itemStringArray(manifestItem, 'dependencies'),
      pinnedItem.dependencies,
      `${label} dependencies`
    )
    assertSameStringSet(
      itemStringArray(manifestItem, 'registryDependencies'),
      manifestDependenciesForPinnedItem(pinnedItem),
      `${label} registryDependencies`
    )

    const expectedSourcePaths = pinnedItem.sourcePath
      ? [pinnedItem.sourcePath]
      : []
    assertSameStringSet(
      itemStringArray(manifestItem, 'files').map((file) => file.path),
      expectedSourcePaths,
      `${label} source paths`
    )

    const upstream = manifestItem.meta && manifestItem.meta.upstream
    assert(upstream, `${label} must contain upstream metadata`)
    assert(
      upstream.cliVersion === snapshot.lock.cliVersion &&
        upstream.style === snapshot.lock.style &&
        upstream.sourceSha256 === pinnedItem.sourceSha256 &&
        upstream.upstreamSha256 === pinnedItem.upstreamSha256,
      `${label} upstream metadata must match the snapshot`
    )

    const internalName = INTERNAL_UPSTREAM_ITEM_NAMES.get(name)
    if (internalName) {
      assert(
        manifestItem.meta.status === 'internal',
        `${label} must retain internal status`
      )
      assert(
        Array.isArray(manifestItem.categories) &&
          manifestItem.categories.includes('internal'),
        `${label} must be categorized as internal`
      )
      assert(
        manifestItem.files.length === 1 &&
          manifestItem.files[0].target ===
            `@components/applique/internal/${name}.tsx`,
        `${label} must install under the Applique internal directory`
      )
    }
  }

  for (const item of manifest.items) {
    for (const dependency of itemStringArray(item, 'registryDependencies')) {
      assert(
        itemsByName.has(dependency),
        `${item.name} references unknown source registry item ${dependency}`
      )
    }
  }

  const usedDependencyPins = new Set()
  for (const item of manifest.items) {
    for (const field of ['dependencies', 'devDependencies']) {
      for (const [index, dependency] of itemStringArray(
        item,
        field
      ).entries()) {
        usedDependencyPins.add(
          dependencyParts(
            dependency,
            `source registry item ${item.name}.${field}[${index}]`
          ).packageName
        )
      }
    }
  }
  assertSameStringSet(
    usedDependencyPins,
    Object.keys(snapshot.dependencyPins),
    'source registry dependency pin coverage'
  )

  return {
    items: manifest.items.length,
    itemsByName,
  }
}

function registryDependencyName(dependency, label) {
  if (!/^https?:\/\//.test(dependency)) return dependency

  const dependencyUrl = new URL(dependency)
  const fileName = path.posix.basename(dependencyUrl.pathname)
  assert(fileName.endsWith('.json'), `${label} must reference a JSON item`)

  let name
  try {
    name = decodeURIComponent(fileName.slice(0, -'.json'.length))
  } catch (error) {
    throw new Error(`${label} contains an invalid encoded item name`)
  }

  assert(
    NAME_PATTERN.test(name),
    `${label} contains invalid registry item name "${name}"`
  )
  return name
}

function normalizedRegistryDependencies(item, label) {
  return itemStringArray(
    item,
    'registryDependencies'
  ).map((dependency, index) =>
    registryDependencyName(
      dependency,
      `${label}.registryDependencies[${index}]`
    )
  )
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJson(entry)).join(',')}]`
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

function catalogComparableItem(item) {
  const comparable = JSON.parse(JSON.stringify(item))
  delete comparable.$schema

  if (comparable.meta) {
    delete comparable.meta.registryUrl
    delete comparable.meta.versionedRegistryUrl
  }

  return comparable
}

function validatePublishedContract(item, sourceItem, pinnedItem, label) {
  assert(item.type === sourceItem.type, `${label} type differs from the source`)
  assert(
    availabilityStatus(item) === availabilityStatus(sourceItem),
    `${label} availability differs from the source manifest`
  )
  assert(
    (item.meta && item.meta.status) ===
      (sourceItem.meta && sourceItem.meta.status),
    `${label} status differs from the source manifest`
  )
  assertSameStringSet(
    itemStringArray(item, 'dependencies'),
    itemStringArray(sourceItem, 'dependencies'),
    `${label} dependencies`
  )
  assertSameStringSet(
    itemStringArray(item, 'devDependencies'),
    itemStringArray(sourceItem, 'devDependencies'),
    `${label} devDependencies`
  )
  assertSameStringSet(
    normalizedRegistryDependencies(item, label),
    itemStringArray(sourceItem, 'registryDependencies'),
    `${label} registryDependencies`
  )
  assertSameStringSet(
    itemStringArray(item, 'files')
      .map((file) => file.target)
      .filter((target) => target !== undefined),
    itemStringArray(sourceItem, 'files')
      .map((file) => file.target)
      .filter((target) => target !== undefined),
    `${label} file targets`
  )

  if (pinnedItem) {
    assert(
      availabilityStatus(item) === pinnedItem.status,
      `${label} availability differs from snapshot status ${pinnedItem.status}`
    )
    const upstream = item.meta && item.meta.upstream
    assert(upstream, `${label} must contain upstream metadata`)
    assert(
      upstream.cliVersion === '4.16.0' &&
        upstream.style === 'base-nova' &&
        upstream.sourceSha256 === pinnedItem.sourceSha256 &&
        upstream.upstreamSha256 === pinnedItem.upstreamSha256,
      `${label} upstream metadata differs from the snapshot`
    )
  }
}

function documentsAtPrefix(documents, prefix) {
  const directDocuments = new Map()

  for (const [relativePath, document] of documents) {
    if (prefix && !relativePath.startsWith(prefix)) continue

    const suffix = prefix ? relativePath.slice(prefix.length) : relativePath
    if (!suffix || suffix.includes('/')) continue
    directDocuments.set(suffix, document)
  }

  return directDocuments
}

function validateCurrentPublishedSet(
  documents,
  prefix,
  manifest,
  sourceManifest,
  snapshot
) {
  const location = prefix || 'registry root/'
  const directDocuments = documentsAtPrefix(documents, prefix)
  const expectedFiles = new Set([
    'registry.json',
    ...manifest.items.map((item) => `${item.name}.json`),
  ])
  assertSameStringSet(
    directDocuments.keys(),
    expectedFiles,
    `${location} JSON files`
  )

  const catalog = directDocuments.get('registry.json')
  validateCatalog(catalog, `${location}registry.json`, {
    dependencyPins: snapshot.dependencyPins,
    requireKnownDependencyPins: true,
  })
  assert(
    catalog.name === manifest.name && catalog.homepage === manifest.homepage,
    `${location} catalog identity differs from the source manifest`
  )
  assert(
    catalog.meta && catalog.meta.registryVersion === manifest.meta.version,
    `${location} catalog version differs from the source manifest`
  )

  const catalogItems = indexItems(catalog.items, `${location} catalog`)
  assertSameStringSet(
    catalogItems.keys(),
    sourceManifest.itemsByName.keys(),
    `${location} catalog item names`
  )

  const publishedItems = new Map()
  for (const [name, sourceItem] of sourceManifest.itemsByName) {
    const itemFile = `${name}.json`
    const standaloneItem = directDocuments.get(itemFile)
    const catalogItem = catalogItems.get(name)

    validateItem(standaloneItem, `${location}${itemFile}`, {
      dependencyPins: snapshot.dependencyPins,
      requireContent: standaloneItem.type !== 'registry:theme',
      requireKnownDependencyPins: true,
      requireSchema: true,
    })
    validatePublishedContract(
      standaloneItem,
      sourceItem,
      pinnedItemForSourceItem(snapshot, name, sourceItem),
      `${location}${itemFile}`
    )
    validatePublishedContract(
      catalogItem,
      sourceItem,
      pinnedItemForSourceItem(snapshot, name, sourceItem),
      `${location}registry.json item ${name}`
    )
    assert(
      stableJson(catalogComparableItem(catalogItem)) ===
        stableJson(catalogComparableItem(standaloneItem)),
      `${location} catalog item ${name} differs from ${itemFile}`
    )
    publishedItems.set(name, standaloneItem)
  }

  return publishedItems
}

function validateRegistryDirectory(directory, options = {}) {
  const { manifest, snapshot } = options
  const registryDirectory = path.resolve(directory)

  assert(
    fs.existsSync(registryDirectory),
    `registry directory does not exist: ${registryDirectory}`
  )
  assert(
    fs.statSync(registryDirectory).isDirectory(),
    `registry path is not a directory: ${registryDirectory}`
  )

  const rootCatalogPath = path.join(registryDirectory, 'registry.json')
  assert(
    fs.existsSync(rootCatalogPath),
    `missing discovery catalog: ${rootCatalogPath}`
  )

  const jsonFiles = collectJsonFiles(registryDirectory)
  assert(jsonFiles.length > 1, 'registry must contain a catalog and item files')

  const documents = new Map()
  let catalogCount = 0
  let itemCount = 0

  for (const filePath of jsonFiles) {
    const relativePath = path
      .relative(registryDirectory, filePath)
      .replace(/\\/g, '/')
    const document = readJson(filePath)
    documents.set(relativePath, document)

    if (path.basename(filePath) === 'registry.json') {
      validateCatalog(document, relativePath)
      catalogCount += 1
      continue
    }

    validateItem(document, relativePath, {
      requireContent: document.type !== 'registry:theme',
      requireSchema: true,
    })

    const expectedName = path.basename(filePath, '.json')
    assert(
      document.name === expectedName,
      `${relativePath}.name must match its filename "${expectedName}"`
    )
    itemCount += 1
  }

  assert(catalogCount > 0, 'registry must contain at least one catalog')
  assert(itemCount > 0, 'registry must contain at least one installable item')

  let publishedItems
  if (manifest || snapshot) {
    assert(
      manifest && snapshot,
      'current registry reconciliation requires both manifest and snapshot'
    )
    const sourceManifest =
      options.sourceManifest || validateSourceManifest(manifest, snapshot)
    const rootItems = validateCurrentPublishedSet(
      documents,
      '',
      manifest,
      sourceManifest,
      snapshot
    )
    const versionPrefix = `v${manifest.meta.version}/`
    const versionItems = validateCurrentPublishedSet(
      documents,
      versionPrefix,
      manifest,
      sourceManifest,
      snapshot
    )

    for (const name of sourceManifest.itemsByName.keys()) {
      assert(
        stableJson(rootItems.get(name)) === stableJson(versionItems.get(name)),
        `current and ${versionPrefix} payloads differ for ${name}`
      )
    }
    publishedItems = rootItems.size
  }

  return {
    directory: registryDirectory,
    files: jsonFiles.length,
    catalogs: catalogCount,
    items: itemCount,
    publishedItems,
  }
}

if (require.main === module) {
  try {
    const snapshot = validatePinnedSnapshot()
    const manifest = readJson(SOURCE_MANIFEST_PATH)
    const sourceManifest = validateSourceManifest(manifest, snapshot)
    const result = validateRegistryDirectory(
      process.argv[2] || DEFAULT_REGISTRY_DIR,
      { manifest, snapshot, sourceManifest }
    )
    console.log(
      `[registry] valid: ${sourceManifest.items} current items (${snapshot.installableUiItems}/${snapshot.uiItems} pinned UI sources installable, ${snapshot.supportHooks}/${EXPECTED_SUPPORT_HOOKS} support hook installable, ${EXPECTED_FOUNDATION_ENTRIES} registry foundations, ${EXPECTED_OWNED_FACADE_ENTRIES} owned facade); ${result.items} published item documents in ${result.catalogs} catalogs (${result.files} JSON files)`
    )
  } catch (error) {
    console.error(`[registry] validation failed: ${error.message}`)
    process.exitCode = 1
  }
}

module.exports = {
  validateRegistryDirectory,
  validateCatalog,
  validateItem,
  validatePinnedSnapshot,
  validateSnapshotDocument,
  validateSourceManifest,
}
