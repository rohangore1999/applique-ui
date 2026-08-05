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
const ts = require('typescript')

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
              /^[a-z0-9]+(?:-{1,2}[a-z0-9]+)*$/.test(variableName),
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

    if (build && build.cssFrom) {
      assert(
        item.type === 'registry:theme',
        `${item.name} can only use cssFrom for a registry:theme item`
      )
      assert(
        typeof build.cssFrom === 'string' && build.cssFrom.length > 0,
        `${item.name} cssFrom must be a source JSON path`
      )
      const cssRules = readJson(resolveSourcePath(build.cssFrom))
      assert(
        cssRules &&
          typeof cssRules === 'object' &&
          !Array.isArray(cssRules) &&
          Object.keys(cssRules).length > 0,
        `${item.name} cssFrom must contain at least one CSS rule`
      )
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

function sourceContainsJsx(sourceFile) {
  let containsJsx = false

  function visit(node) {
    if (
      ts.isJsxElement(node) ||
      ts.isJsxSelfClosingElement(node) ||
      ts.isJsxFragment(node)
    ) {
      containsJsx = true
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return containsJsx
}

function hasClassicReactBinding(sourceFile) {
  return sourceFile.statements.some((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== 'react'
    ) {
      return false
    }

    const importClause = statement.importClause
    if (!importClause || importClause.isTypeOnly) return false
    if (importClause.name && importClause.name.text === 'React') return true

    return Boolean(
      importClause.namedBindings &&
        ts.isNamespaceImport(importClause.namedBindings) &&
        importClause.namedBindings.name.text === 'React'
    )
  })
}

function ensureClassicReactBinding(content, target) {
  if (!target.endsWith('.tsx')) return content

  const sourceFile = ts.createSourceFile(
    target,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  if (!sourceContainsJsx(sourceFile) || hasClassicReactBinding(sourceFile)) {
    return content
  }

  const newline = content.includes('\r\n') ? '\r\n' : '\n'
  const lines = content.split(/\r?\n/)
  let insertionIndex = lines[0] && lines[0].startsWith('#!') ? 1 : 0

  while (
    insertionIndex < lines.length &&
    /^['"][^'"]+['"];?$/.test(lines[insertionIndex].trim())
  ) {
    insertionIndex += 1
  }

  if (insertionIndex > 0 && lines[insertionIndex] === '') {
    insertionIndex += 1
  }

  lines.splice(insertionIndex, 0, 'import * as React from "react"')
  return lines.join(newline)
}

function applyRegistryHostIsolation(content, target, itemName) {
  if (!target.endsWith('.tsx')) return content

  let output = content
    // Every registry-owned primitive receives a collision-resistant marker.
    // Keep this as a generated-source transform so the pinned upstream files
    // remain byte-for-byte comparable with shadcn.
    .replace(
      /(\s)data-slot=(?=["'{])/g,
      '$1data-applique-component=""$1data-slot='
    )
    // Base Nova uses this generic attribute for icon placement. Legacy Unity
    // also renders [data-icon] through a pseudo-element, so namespace it.
    .replace(/\bdata-icon=(?=["'{])/g, 'data-applique-icon-position=')
    .replace(
      /\[icon=(inline-(?:start|end))\]/g,
      '[applique-icon-position=$1]'
    )
    // Preserve the reviewed size in clients that use html { font-size: 10px }.
    .replace(/text-\[0\.8rem\]/g, 'text-[12.8px]')
    // useRender creates data-slot from its state object rather than a literal
    // JSX attribute, so add the same marker to that state contract.
    .replace(
      /(state:\s*\{\r?\n)(\s+)(slot:)/g,
      "$1$2'applique-component': true,\n$2$3"
    )

  for (const variableName of [...APPLIQUE_SEMANTIC_COLOR_VARS]
    .filter((name) => canonicalSemanticColorVariable(name) !== name)
    .sort((left, right) => right.length - left.length)) {
    const escapedVariableName = variableName.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    )
    output = output.replace(
      new RegExp(`var\\(\\s*--${escapedVariableName}\\s*\\)`, 'g'),
      `var(--${canonicalSemanticColorVariable(variableName)})`
    )
  }

  if (itemName === 'applique-internal-button') {
    const buttonRootPattern =
      /(data-applique-component=""\s+data-slot="button"\r?\n)(\s+)(className=)/
    assert(
      buttonRootPattern.test(output),
      `${itemName} host isolation could not find the Button root`
    )
    output = output.replace(
      buttonRootPattern,
      '$1$2data-variant={variant}\n$2data-size={size}\n$2$3'
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

    // Registry consumers receive only the namespaced semantic variables.
    // The generic aliases remain in tokens.css solely for this package's
    // source build; publishing them would allow host --primary/--border
    // variables to leak back into copied components.
    for (const variableName of APPLIQUE_SEMANTIC_COLOR_VARS) {
      const canonicalVariable = canonicalSemanticColorVariable(variableName)
      if (canonicalVariable !== variableName) delete lightCssVars[variableName]
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

    if (build.cssFrom) {
      generated.css = {
        ...(generated.css || {}),
        ...readJson(resolveSourcePath(build.cssFrom)),
      }
    }
  } else if (item.files.length > 0) {
    generated.files = item.files.map((file) => {
      const source = fs.readFileSync(resolveSourcePath(file.path), 'utf8')
      const target = file.target
      const mappedContent = applyImportMap(source, build.importMap, item.name)
      const isolatedContent = applyRegistryHostIsolation(
        mappedContent,
        target,
        item.name
      )
      const content = ensureClassicReactBinding(isolatedContent, target)

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
        const canonicalVariable = canonicalSemanticColorVariable(variableName)
        assert(
          item.cssVars.light[canonicalVariable] !== undefined,
          `applique-theme is missing namespaced light token "${canonicalVariable}"`
        )
        assert(
          item.cssVars.theme[`color-${variableName}`] ===
            `var(--${canonicalVariable})`,
          `applique-theme must map color-${variableName} to var(--${canonicalVariable})`
        )
        assert(
          /^#[0-9a-f]{6}$/i.test(item.cssVars.light[canonicalVariable]),
          `applique-theme light token "${canonicalVariable}" must remain an exact hex color`
        )

        if (canonicalVariable !== variableName) {
          assert(
            item.cssVars.light[variableName] === undefined,
            `applique-theme must not publish collision-prone --${variableName}`
          )
        }
      }

      for (const [variableName, value] of Object.entries(item.cssVars.light)) {
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
      assert(
        !/(^|\s)data-slot=(?=["'{])/m.test(
          file.content.replace(
            /data-applique-component=""\s+data-slot=/g,
            'data-applique-component="" '
          )
        ),
        `${item.name} contains an unmarked data-slot attribute`
      )
      assert(
        !/data-icon=["']inline-(?:start|end)["']|\[icon=inline-(?:start|end)\]/.test(
          file.content
        ),
        `${item.name} contains a collision-prone icon-position attribute`
      )
      for (const variableName of APPLIQUE_SEMANTIC_COLOR_VARS) {
        const canonicalVariable = canonicalSemanticColorVariable(variableName)
        if (canonicalVariable === variableName) continue
        assert(
          !file.content.includes(`var(--${variableName})`),
          `${item.name} contains unnamespaced var(--${variableName})`
        )
      }
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

function managedOutputFiles(outputDir, version) {
  const candidates = []
  const directories = [outputDir, path.join(outputDir, `v${version}`)]

  for (const directory of directories) {
    if (!fs.existsSync(directory)) continue

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue
      candidates.push(path.join(directory, entry.name))
    }
  }

  return candidates
}

function staleOutputFiles(outputDir, files, version) {
  const expected = new Set(
    [...files.keys()].map((relativePath) => path.resolve(outputDir, relativePath))
  )

  return managedOutputFiles(outputDir, version).filter(
    (filePath) => !expected.has(path.resolve(filePath))
  )
}

function writeOutputs(outputDir, files, version) {
  for (const staleFile of staleOutputFiles(outputDir, files, version)) {
    fs.unlinkSync(staleFile)
    console.log(`[registry] removed ${path.relative(repoDir, staleFile)}`)
  }

  for (const [relativePath, content] of files) {
    const destination = path.join(outputDir, relativePath)
    writeFileAtomically(destination, content)
    console.log(`[registry] wrote ${path.relative(repoDir, destination)}`)
  }
}

function checkOutputs(outputDir, files, version) {
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

  for (const staleFile of staleOutputFiles(outputDir, files, version)) {
    differences.push(`${path.relative(outputDir, staleFile)} is unexpected`)
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
    checkOutputs(outputDir, files, version)
  } else {
    writeOutputs(outputDir, files, version)
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
