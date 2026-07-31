#!/usr/bin/env node
/*
 * Builds the public Applique shadcn registry from registry.json.
 *
 * The source manifest contains source file paths and small, explicit build
 * instructions in item.meta.build. Generated files always preserve TS/TSX;
 * this script does not attempt source-to-source type stripping.
 *
 * Usage:
 *   node scripts/generate-registry.js
 *   node scripts/generate-registry.js --check
 *   node scripts/generate-registry.js --base-url http://localhost:4173/registry
 *
 * Environment overrides:
 *   APPLIQUE_REGISTRY_BASE_URL
 *   APPLIQUE_REGISTRY_VERSION
 *   APPLIQUE_REGISTRY_OUTPUT_DIR
 */

const fs = require('fs')
const path = require('path')

const REGISTRY_SCHEMA = 'https://ui.shadcn.com/schema/registry.json'
const REGISTRY_ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json'
const ITEM_TYPES = new Set([
  'registry:lib',
  'registry:block',
  'registry:component',
  'registry:ui',
  'registry:hook',
  'registry:theme',
  'registry:page',
  'registry:file',
  'registry:style',
  'registry:base',
  'registry:font',
  'registry:item',
])
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

const packageDir = path.resolve(__dirname, '..')
const repoDir = path.resolve(packageDir, '..', '..')
const manifestPath = path.join(packageDir, 'registry.json')

function parseArguments(argv) {
  const options = {
    check: false,
    baseUrl: process.env.APPLIQUE_REGISTRY_BASE_URL,
    version: process.env.APPLIQUE_REGISTRY_VERSION,
    outputDir: process.env.APPLIQUE_REGISTRY_OUTPUT_DIR,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--check') {
      options.check = true
      continue
    }

    if (argument === '--help' || argument === '-h') {
      options.help = true
      continue
    }

    const optionNames = {
      '--base-url': 'baseUrl',
      '--version': 'version',
      '--output': 'outputDir',
    }
    const optionName = optionNames[argument]

    if (!optionName) {
      throw new Error(`Unknown option: ${argument}`)
    }

    const value = argv[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`${argument} requires a value`)
    }

    options[optionName] = value
    index += 1
  }

  return options
}

function printHelp() {
  console.log(`Build the Applique shadcn registry.

Options:
  --check             Validate generated files without changing them.
  --base-url <url>    Public registry root URL.
  --version <semver>  Registry release version.
  --output <path>     Output directory, relative to the repository root.
  --help              Show this help.
`)
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Cannot read JSON from ${filePath}: ${error.message}`)
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
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

function normalizeBaseUrl(value) {
  assert(value, 'A registry base URL is required')

  let parsed
  try {
    parsed = new URL(value)
  } catch (error) {
    throw new Error(`Invalid registry base URL "${value}": ${error.message}`)
  }

  assert(
    parsed.protocol === 'https:' || parsed.protocol === 'http:',
    'Registry base URL must use http or https'
  )

  return value.replace(/\/+$/, '')
}

function normalizeVersion(value) {
  assert(value, 'A registry version is required')
  const normalized = value.startsWith('v') ? value.slice(1) : value

  assert(
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(normalized),
    `Registry version "${value}" must be a semantic version`
  )

  return normalized
}

function resolveOutputDirectory(value) {
  if (!value) {
    return path.join(repoDir, 'docs', 'registry')
  }

  return path.isAbsolute(value) ? value : path.resolve(repoDir, value)
}

function resolveSourcePath(relativePath) {
  assert(
    typeof relativePath === 'string' && relativePath.length > 0,
    'Registry source file path must be a non-empty string'
  )

  const absolutePath = path.resolve(packageDir, relativePath)
  const relativeToPackage = path.relative(packageDir, absolutePath)

  assert(
    relativeToPackage &&
      !relativeToPackage.startsWith(`..${path.sep}`) &&
      relativeToPackage !== '..' &&
      !path.isAbsolute(relativeToPackage),
    `Registry source path escapes the package: ${relativePath}`
  )
  assert(
    fs.existsSync(absolutePath),
    `Registry source file is missing: ${relativePath}`
  )
  assert(
    fs.statSync(absolutePath).isFile(),
    `Registry source path is not a file: ${relativePath}`
  )

  return absolutePath
}

function validateManifest(manifest) {
  assert(
    manifest.$schema === REGISTRY_SCHEMA,
    `registry.json must use ${REGISTRY_SCHEMA}`
  )
  assert(
    typeof manifest.name === 'string' && manifest.name.length > 0,
    'registry.json must have a name'
  )
  assert(
    typeof manifest.homepage === 'string' && manifest.homepage.length > 0,
    'registry.json must have a homepage'
  )
  assert(
    Array.isArray(manifest.items),
    'registry.json must have an items array'
  )
  assert(
    manifest.items.length > 0,
    'registry.json must contain at least one item'
  )

  const names = new Set()

  for (const item of manifest.items) {
    assert(
      typeof item.name === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(item.name),
      `Registry item has an invalid name: ${item.name}`
    )
    assert(!names.has(item.name), `Duplicate registry item: ${item.name}`)
    names.add(item.name)

    assert(
      ITEM_TYPES.has(item.type),
      `${item.name} has an invalid type: ${item.type}`
    )
    assert(Array.isArray(item.files), `${item.name} must declare a files array`)
    assert(
      item.files.length > 0 || isExplicitFilelessItem(item),
      `${item.name} must declare source files unless it is an explicitly fileless registry entry`
    )

    for (const file of item.files) {
      assert(ITEM_TYPES.has(file.type), `${item.name} has an invalid file type`)
      resolveSourcePath(file.path)
    }

    const build = item.meta && item.meta.build
    if (build && build.cssVarsFrom) {
      assert(
        item.type === 'registry:theme',
        `${item.name} can only use cssVarsFrom for a registry:theme item`
      )
      resolveSourcePath(build.cssVarsFrom)

      if (build.themeVarsFromLight !== undefined) {
        assert(
          Array.isArray(build.themeVarsFromLight),
          `${item.name} themeVarsFromLight must be an array`
        )

        const themeVariableNames = new Set()
        for (const variableName of build.themeVarsFromLight) {
          assert(
            typeof variableName === 'string' &&
              /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variableName),
            `${item.name} has an invalid themeVarsFromLight entry: ${variableName}`
          )
          assert(
            !themeVariableNames.has(variableName),
            `${item.name} has a duplicate themeVarsFromLight entry: ${variableName}`
          )
          themeVariableNames.add(variableName)
        }
      }
    } else {
      assert(
        !build || build.themeVarsFromLight === undefined,
        `${item.name} can only use themeVarsFromLight with cssVarsFrom`
      )

      for (const file of item.files) {
        assert(
          typeof file.target === 'string' && file.target.length > 0,
          `${item.name}:${file.path} must declare a target`
        )
      }
    }

    for (const dependency of item.registryDependencies || []) {
      assert(dependency !== item.name, `${item.name} cannot depend on itself`)
    }
  }

  for (const item of manifest.items) {
    for (const dependency of item.registryDependencies || []) {
      if (!dependency.includes('://') && !dependency.startsWith('@')) {
        assert(
          names.has(dependency),
          `${item.name} references unknown local registry item: ${dependency}`
        )
      }
    }
  }
}

function stripCssComments(css) {
  let output = ''
  let index = 0

  while (index < css.length) {
    if (css[index] === '/' && css[index + 1] === '*') {
      const commentEnd = css.indexOf('*/', index + 2)
      assert(commentEnd !== -1, 'Unterminated CSS comment in token source')
      index = commentEnd + 2
      continue
    }

    output += css[index]
    index += 1
  }

  return output
}

function extractCssBlock(css, selector) {
  const source = stripCssComments(css)
  let selectorIndex = source.indexOf(selector)

  while (selectorIndex !== -1) {
    let openBrace = selectorIndex + selector.length
    while (/\s/.test(source[openBrace])) openBrace += 1

    if (source[openBrace] !== '{') {
      selectorIndex = source.indexOf(selector, selectorIndex + selector.length)
      continue
    }

    let depth = 1
    let quote = null
    let escaped = false

    for (let index = openBrace + 1; index < source.length; index += 1) {
      const character = source[index]

      if (quote) {
        if (escaped) {
          escaped = false
        } else if (character === '\\') {
          escaped = true
        } else if (character === quote) {
          quote = null
        }
        continue
      }

      if (character === '"' || character === "'") {
        quote = character
      } else if (character === '{') {
        depth += 1
      } else if (character === '}') {
        depth -= 1
        if (depth === 0) {
          return source.slice(openBrace + 1, index)
        }
      }
    }

    throw new Error(`Unterminated CSS block for selector ${selector}`)
  }

  throw new Error(`CSS selector ${selector} was not found`)
}

function splitCssDeclarations(block) {
  const declarations = []
  let start = 0
  let quote = null
  let escaped = false
  let parentheses = 0

  for (let index = 0; index < block.length; index += 1) {
    const character = block[index]

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (character === quote) {
        quote = null
      }
      continue
    }

    if (character === '"' || character === "'") {
      quote = character
    } else if (character === '(') {
      parentheses += 1
    } else if (character === ')') {
      parentheses = Math.max(0, parentheses - 1)
    } else if (character === ';' && parentheses === 0) {
      declarations.push(block.slice(start, index))
      start = index + 1
    }
  }

  if (block.slice(start).trim()) {
    declarations.push(block.slice(start))
  }

  return declarations
}

function parseCssVariables(css, selector) {
  const variables = {}
  const block = extractCssBlock(css, selector)

  for (const declaration of splitCssDeclarations(block)) {
    const colon = declaration.indexOf(':')
    if (colon === -1) continue

    const property = declaration.slice(0, colon).trim()
    const value = declaration.slice(colon + 1).trim()
    if (!property.startsWith('--') || !value) continue

    // shadcn's cssVars shape uses variable names without the CSS "--" prefix.
    variables[property.slice(2)] = value
  }

  assert(
    Object.keys(variables).length > 0,
    `No CSS custom properties found under ${selector}`
  )

  return variables
}

function applyImportMap(content, importMap, itemName) {
  let output = content

  for (const [source, target] of Object.entries(importMap || {})) {
    let replacements = 0

    for (const quote of ["'", '"']) {
      const search = `${quote}${source}${quote}`
      const replacement = `${quote}${target}${quote}`
      const parts = output.split(search)
      replacements += parts.length - 1
      output = parts.join(replacement)
    }

    assert(
      replacements > 0,
      `${itemName} import map could not find module specifier "${source}"`
    )
  }

  return output
}

function targetToRegistryPath(target) {
  const aliases = {
    '@components/': 'components/',
    '@hooks/': 'hooks/',
    '@lib/': 'lib/',
    '@ui/': 'ui/',
  }

  for (const [alias, replacement] of Object.entries(aliases)) {
    if (target.startsWith(alias)) {
      return `${replacement}${target.slice(alias.length)}`
    }
  }

  return target
}

function validateTarget(target, itemName) {
  const registryPath = targetToRegistryPath(target).replace(/\\/g, '/')
  const normalized = path.posix.normalize(registryPath)

  assert(
    normalized !== '..' &&
      !normalized.startsWith('../') &&
      !path.posix.isAbsolute(normalized),
    `${itemName} has an unsafe target path: ${target}`
  )

  return normalized
}

function buildPublicMeta(meta, version) {
  const publicMeta = { ...(meta || {}) }
  delete publicMeta.build

  return {
    ...publicMeta,
    registryVersion: version,
  }
}

function buildRegistryItem(item, context) {
  const build = (item.meta && item.meta.build) || {}
  const generated = {
    $schema: REGISTRY_ITEM_SCHEMA,
    name: item.name,
    type: item.type,
  }

  for (const property of [
    'title',
    'description',
    'author',
    'dependencies',
    'devDependencies',
    'tailwind',
    'css',
    'envVars',
    'docs',
    'categories',
  ]) {
    if (item[property] !== undefined) {
      generated[property] = item[property]
    }
  }

  if (item.registryDependencies) {
    generated.registryDependencies = item.registryDependencies.map(
      (dependency) => {
        if (context.itemNames.has(dependency)) {
          return `${context.versionBaseUrl}/${encodeURIComponent(
            dependency
          )}.json`
        }
        return dependency
      }
    )
  }

  if (build.cssVarsFrom) {
    const css = fs.readFileSync(resolveSourcePath(build.cssVarsFrom), 'utf8')
    const configuredCssVars = item.cssVars || {}
    const lightCssVars = {
      ...(configuredCssVars.light || {}),
      ...parseCssVariables(css, build.selector || ':root'),
    }
    const themeVarsFromLight = {}

    for (const variableName of build.themeVarsFromLight || []) {
      assert(
        Object.prototype.hasOwnProperty.call(lightCssVars, variableName),
        `${item.name} cannot promote missing light variable "${variableName}" into cssVars.theme`
      )
      themeVarsFromLight[variableName] = lightCssVars[variableName]
    }

    generated.cssVars = {
      ...configuredCssVars,
      theme: {
        ...themeVarsFromLight,
        ...(configuredCssVars.theme || {}),
      },
      light: lightCssVars,
    }
  } else if (item.files.length > 0) {
    generated.files = item.files.map((file) => {
      const source = fs.readFileSync(resolveSourcePath(file.path), 'utf8')
      const content = applyImportMap(source, build.importMap, item.name)
      const target = file.target

      return {
        path: validateTarget(target, item.name),
        content: content.endsWith('\n') ? content : `${content}\n`,
        type: file.type,
        target,
      }
    })
  }

  generated.meta = buildPublicMeta(item.meta, context.version)

  return generated
}

function validateGeneratedItem(item) {
  assert(
    item.$schema === REGISTRY_ITEM_SCHEMA,
    `${item.name} must use the registry item schema`
  )
  assert(
    typeof item.name === 'string' && item.name.length > 0,
    'Item name is required'
  )
  assert(
    ITEM_TYPES.has(item.type),
    `${item.name} has an invalid generated type`
  )

  if (item.type === 'registry:theme') {
    assert(
      item.cssVars &&
        item.cssVars.light &&
        Object.keys(item.cssVars.light).length > 0,
      `${item.name} must contain light cssVars`
    )

    if (item.name === 'applique-theme') {
      assert(
        item.tailwind === undefined,
        'applique-theme must use Tailwind 4 cssVars.theme instead of tailwind.config'
      )
      assert(
        item.cssVars.theme && Object.keys(item.cssVars.theme).length > 0,
        'applique-theme must contain Tailwind 4 cssVars.theme mappings'
      )

      for (const variableName of APPLIQUE_SEMANTIC_COLOR_VARS) {
        assert(
          item.cssVars.light[variableName] !== undefined,
          `applique-theme is missing exact light token "${variableName}"`
        )
        assert(
          item.cssVars.theme[`color-${variableName}`] ===
            `var(--${variableName})`,
          `applique-theme must map color-${variableName} to var(--${variableName})`
        )
      }

      for (const [variableName, value] of Object.entries(item.cssVars.light)) {
        if (APPLIQUE_SEMANTIC_COLOR_VARS.includes(variableName)) {
          assert(
            /^#[0-9a-f]{6}$/i.test(value),
            `applique-theme light token "${variableName}" must remain an exact hex color`
          )
          continue
        }

        assert(
          item.cssVars.theme[variableName] === value,
          `applique-theme must promote "${variableName}" into cssVars.theme with its exact value`
        )
      }

      for (const [variableName, value] of Object.entries(item.cssVars.theme)) {
        assert(
          !/hsl\s*\(\s*var\s*\(/i.test(value),
          `applique-theme cssVars.theme "${variableName}" contains an obsolete hsl(var(...)) wrapper`
        )

        const variableReference = value.match(/^var\(\s*--([a-z0-9-]+)\s*\)$/i)
        assert(
          !variableReference || variableReference[1] !== variableName,
          `applique-theme cssVars.theme "${variableName}" cannot reference itself`
        )
      }
    }
  } else if (!isExplicitFilelessItem(item)) {
    assert(
      Array.isArray(item.files) && item.files.length > 0,
      `${item.name} must contain generated files`
    )

    for (const file of item.files) {
      assert(
        typeof file.content === 'string',
        `${item.name} file content is missing`
      )
      assert(
        file.path.endsWith('.ts') || file.path.endsWith('.tsx'),
        `${item.name} must publish TypeScript source`
      )
      assert(file.target, `${item.name} generated file target is missing`)
    }
  }
}

function createCatalog(manifest, items, context, versioned) {
  const catalogItems = items.map((item) => {
    const catalogItem = JSON.parse(JSON.stringify(item))
    delete catalogItem.$schema
    catalogItem.meta = {
      ...(catalogItem.meta || {}),
      registryUrl: `${context.baseUrl}/${catalogItem.name}.json`,
      versionedRegistryUrl: `${context.versionBaseUrl}/${catalogItem.name}.json`,
    }
    return catalogItem
  })

  return {
    $schema: REGISTRY_SCHEMA,
    name: manifest.name,
    homepage: manifest.homepage,
    meta: {
      registryVersion: context.version,
      registryBaseUrl: versioned ? context.versionBaseUrl : context.baseUrl,
    },
    items: catalogItems,
  }
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function expectedOutputFiles(manifest, items, context) {
  const files = new Map()
  const versionDirectory = `v${context.version}`

  for (const item of items) {
    const content = serialize(item)
    files.set(`${item.name}.json`, content)
    files.set(path.posix.join(versionDirectory, `${item.name}.json`), content)
  }

  files.set(
    'registry.json',
    serialize(createCatalog(manifest, items, context, false))
  )
  files.set(
    path.posix.join(versionDirectory, 'registry.json'),
    serialize(createCatalog(manifest, items, context, true))
  )

  return files
}

function writeFileAtomically(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.${process.pid}.tmp`
  fs.writeFileSync(temporaryPath, content)
  fs.renameSync(temporaryPath, filePath)
}

function writeOutputs(outputDir, files) {
  for (const [relativePath, content] of files) {
    const destination = path.join(outputDir, relativePath)
    writeFileAtomically(destination, content)
    console.log(`[registry] wrote ${path.relative(repoDir, destination)}`)
  }
}

function checkOutputs(outputDir, files) {
  const differences = []

  for (const [relativePath, expected] of files) {
    const destination = path.join(outputDir, relativePath)

    if (!fs.existsSync(destination)) {
      differences.push(`${relativePath} is missing`)
      continue
    }

    const actual = fs.readFileSync(destination, 'utf8')
    if (actual !== expected) {
      differences.push(`${relativePath} is stale`)
    }
  }

  assert(
    differences.length === 0,
    `Generated registry is not current:\n- ${differences.join('\n- ')}`
  )
  console.log(`[registry] validated ${files.size} generated files`)
}

function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const manifest = readJson(manifestPath)
  validateManifest(manifest)

  const manifestMeta = manifest.meta || {}
  const version = normalizeVersion(options.version || manifestMeta.version)
  const baseUrl = normalizeBaseUrl(
    options.baseUrl || manifestMeta.registryBaseUrl || manifest.homepage
  )
  const context = {
    baseUrl,
    version,
    versionBaseUrl: `${baseUrl}/v${version}`,
    itemNames: new Set(manifest.items.map((item) => item.name)),
  }

  const items = manifest.items.map((item) => buildRegistryItem(item, context))
  for (const item of items) validateGeneratedItem(item)

  const outputDir = resolveOutputDirectory(options.outputDir)
  const files = expectedOutputFiles(manifest, items, context)

  if (options.check) {
    checkOutputs(outputDir, files)
  } else {
    writeOutputs(outputDir, files)
    console.log(
      `[registry] built ${items.length} items for v${version} (${baseUrl})`
    )
  }
}

try {
  main()
} catch (error) {
  console.error(`[registry] ${error.message}`)
  process.exitCode = 1
}
