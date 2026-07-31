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

const fs = require('fs')
const path = require('path')

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
    hasFiles || hasThemePayload,
    `${label} must contain files or a theme payload`
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
    const result = validateRegistryDirectory(
      process.argv[2] || DEFAULT_REGISTRY_DIR
    )
    console.log(
      `[registry] valid: ${result.items} items in ${result.catalogs} catalogs (${result.files} JSON files)`
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
}
