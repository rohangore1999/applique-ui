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

function isFilelessDeprecatedItem(item) {
  return Boolean(
    item &&
      item.meta &&
      item.meta.status === 'deprecated' &&
      item.meta.upstream &&
      item.meta.upstream.fileless === true
  )
}

function validateDependencies(item, label) {
  for (const field of ['dependencies', 'devDependencies']) {
    if (item[field] !== undefined) {
      assertUniqueStrings(item[field], `${label}.${field}`)
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

function validateAppliqueTheme(item, label) {
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
      item.cssVars.light &&
      typeof item.cssVars.theme === 'object' &&
      typeof item.cssVars.light === 'object' &&
      !Array.isArray(item.cssVars.theme) &&
      !Array.isArray(item.cssVars.light),
    `${label} must contain cssVars.theme and cssVars.light`
  )
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

  for (const variableName of APPLIQUE_SEMANTIC_COLOR_VARS) {
    const lightValue = item.cssVars.light[variableName]
    assert(
      /^#[0-9a-f]{6}$/i.test(lightValue || ''),
      `${label}.cssVars.light.${variableName} must be an exact hex color`
    )
    assert(
      item.cssVars.theme[`color-${variableName}`] === `var(--${variableName})`,
      `${label}.cssVars.theme.color-${variableName} must map to var(--${variableName})`
    )
  }

  assert(
    item.cssVars.light.primary.toLowerCase() === '#5232d0',
    `${label}.cssVars.light.primary must match the Applique Figma token #5232d0`
  )

  for (const [variableName, lightValue] of Object.entries(item.cssVars.light)) {
    if (APPLIQUE_SEMANTIC_COLOR_VARS.includes(variableName)) continue

    assert(
      item.cssVars.theme[variableName] === lightValue,
      `${label}.cssVars.theme.${variableName} must preserve the exact light token value`
    )
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
  const { requireContent = false, requireSchema = false } = options

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

  validateDependencies(item, label)

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
    hasFiles || hasThemePayload || isFilelessDeprecatedItem(item),
    `${label} must contain files, a theme payload, or explicit fileless deprecated metadata`
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
    validateAppliqueTheme(item, label)
  }
}

function validateCatalog(catalog, label) {
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
    validateItem(item, itemLabel)
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

function validatePinnedSnapshot() {
  assert(
    fs.existsSync(SNAPSHOT_LOCK_PATH),
    `missing shadcn snapshot lock: ${SNAPSHOT_LOCK_PATH}`
  )
  const lock = readJson(SNAPSHOT_LOCK_PATH)
  assert(lock.cliVersion === '4.16.0', 'snapshot must pin shadcn CLI 4.16.0')
  assert(lock.style === 'base-nova', 'snapshot must use base-nova')
  assert(lock.itemCount === 62, 'snapshot must index exactly 62 UI items')
  assert(Array.isArray(lock.items), 'snapshot lock must contain an items array')

  const names = new Set()
  let deprecatedItems = 0
  let installableItems = 0
  for (const item of lock.items) {
    assertString(item.name, 'snapshot item.name')
    assert(!names.has(item.name), `duplicate snapshot item ${item.name}`)
    names.add(item.name)
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
      deprecatedItems += 1
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

    assert(item.status === 'installable', `${item.name} has invalid status`)
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
    installableItems += 1
  }

  assert(names.has('use-mobile'), 'snapshot must include use-mobile')
  assert(deprecatedItems === 1, 'snapshot must contain one deprecated item')
  assert(
    installableItems === 62,
    `snapshot must contain 62 installable source items, got ${installableItems}`
  )
  return { entries: lock.items.length, installableItems }
}

function validateRegistryDirectory(directory) {
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

  let catalogCount = 0
  let itemCount = 0

  for (const filePath of jsonFiles) {
    const relativePath = path
      .relative(registryDirectory, filePath)
      .replace(/\\/g, '/')
    const document = readJson(filePath)

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

  return {
    directory: registryDirectory,
    files: jsonFiles.length,
    catalogs: catalogCount,
    items: itemCount,
  }
}

if (require.main === module) {
  try {
    const snapshot = validatePinnedSnapshot()
    const result = validateRegistryDirectory(
      process.argv[2] || DEFAULT_REGISTRY_DIR
    )
    console.log(
      `[registry] valid: ${result.items} items in ${result.catalogs} catalogs (${result.files} JSON files); ${snapshot.installableItems}/${snapshot.entries} pinned sources installable`
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
}
