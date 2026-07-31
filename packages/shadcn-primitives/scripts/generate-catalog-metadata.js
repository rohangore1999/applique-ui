#!/usr/bin/env node

/*
 * Generates the static catalogue metadata and vendors the pinned shadcn Base
 * examples used by the catalogue. Normal catalogue builds do not access the
 * network; this script is an explicit snapshot/update tool.
 *
 * Usage:
 *   node scripts/generate-catalog-metadata.js
 *   node scripts/generate-catalog-metadata.js --metadata-only
 *   node scripts/generate-catalog-metadata.js \
 *     --examples-dir /private/tmp/shadcn-examples-base \
 *     --fetch-missing
 */

const fs = require('fs')
const https = require('https')
const path = require('path')
const ts = require('typescript')

const packageDirectory = path.resolve(__dirname, '..')
const repositoryDirectory = path.resolve(packageDirectory, '..', '..')
const sourceDirectory = path.join(packageDirectory, 'src')
const catalogDirectory = path.join(packageDirectory, 'catalog')
const generatedDirectory = path.join(catalogDirectory, 'generated')
const previewDirectory = path.join(catalogDirectory, 'previews', 'base')
const componentMappingsPath = path.join(
  catalogDirectory,
  'component-mappings.json'
)

const UPSTREAM_COMMIT = '705ce5961080264830471ddd885c01b907706068'
const UPSTREAM_BASE = 'base'
const UPSTREAM_STYLE = 'nova'
const DEFAULT_EXAMPLES_DIRECTORY = '/private/tmp/shadcn-examples-base'

const directExampleSlugs = [
  'accordion',
  'alert-dialog',
  'alert',
  'aspect-ratio',
  'attachment',
  'avatar',
  'badge',
  'breadcrumb',
  'bubble',
  'button-group',
  'button',
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
  'drawer',
  'dropdown-menu',
  'empty',
  'field',
  'hover-card',
  'input-group',
  'input-otp',
  'input',
  'item',
  'kbd',
  'label',
  'marker',
  'menubar',
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
  'toggle-group',
  'toggle',
  'tooltip',
]

// These upstream examples depend on the shadcn docs application's AI helpers.
// Keep the catalogue self-contained with small source-backed examples instead.
const localBasePreviewSlugs = ['message']
const standaloneLocalPreviewSlugs = ['direction']
const localPreviewSlugs = [
  ...localBasePreviewSlugs,
  ...standaloneLocalPreviewSlugs,
]
const deprecatedSlugs = ['form']
const incompatibleSlugs = ['message-scroller']
const unavailableSlugs = [...deprecatedSlugs, ...incompatibleSlugs]
const expectedComponentSlugs = [
  ...directExampleSlugs,
  ...localPreviewSlugs,
  ...unavailableSlugs,
].sort()

const titleOverrides = {
  'alert-dialog': 'Alert Dialog',
  'aspect-ratio': 'Aspect Ratio',
  'button-group': 'Button Group',
  'context-menu': 'Context Menu',
  'dropdown-menu': 'Dropdown Menu',
  'hover-card': 'Hover Card',
  'input-group': 'Input Group',
  'input-otp': 'Input OTP',
  'message-scroller': 'Message Scroller',
  'native-select': 'Native Select',
  'navigation-menu': 'Navigation Menu',
  'radio-group': 'Radio Group',
  'scroll-area': 'Scroll Area',
  'toggle-group': 'Toggle Group',
}

const categories = {
  Inputs: new Set([
    'attachment',
    'button',
    'button-group',
    'calendar',
    'checkbox',
    'combobox',
    'field',
    'form',
    'input',
    'input-group',
    'input-otp',
    'label',
    'native-select',
    'radio-group',
    'select',
    'slider',
    'switch',
    'textarea',
    'toggle',
    'toggle-group',
  ]),
  Feedback: new Set([
    'alert',
    'progress',
    'skeleton',
    'sonner',
    'spinner',
    'toast',
  ]),
  Overlays: new Set([
    'alert-dialog',
    'context-menu',
    'dialog',
    'drawer',
    'dropdown-menu',
    'hover-card',
    'popover',
    'sheet',
    'tooltip',
  ]),
  Navigation: new Set([
    'breadcrumb',
    'command',
    'menubar',
    'navigation-menu',
    'pagination',
    'sidebar',
    'tabs',
  ]),
  'Data display': new Set([
    'avatar',
    'badge',
    'bubble',
    'carousel',
    'chart',
    'item',
    'kbd',
    'marker',
    'message',
    'message-scroller',
    'table',
  ]),
  Layout: new Set([
    'accordion',
    'aspect-ratio',
    'card',
    'collapsible',
    'direction',
    'empty',
    'resizable',
    'scroll-area',
    'separator',
  ]),
}

const descriptions = {
  direction:
    'Provides direction context for components that support left-to-right and right-to-left layouts.',
  form:
    'Deprecated upstream entry retained for discovery only. Use Field and native form composition.',
  'message-scroller':
    'Unavailable in the React 18 baseline because the upstream primitive requires React 19.',
  toast:
    'Displays temporary notifications through the Base UI toast primitive.',
}

function parseArguments(argv) {
  const options = {
    examplesDirectory: DEFAULT_EXAMPLES_DIRECTORY,
    fetchMissing: false,
    metadataOnly: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--fetch-missing') {
      options.fetchMissing = true
      continue
    }

    if (argument === '--metadata-only') {
      options.metadataOnly = true
      continue
    }

    if (argument === '--examples-dir') {
      const value = argv[index + 1]
      if (!value) throw new Error('--examples-dir requires a path')
      options.examplesDirectory = path.resolve(value)
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${argument}`)
  }

  return options
}

function titleFromSlug(slug) {
  if (titleOverrides[slug]) return titleOverrides[slug]

  return slug
    .split('-')
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function categoryForSlug(slug) {
  for (const [category, slugs] of Object.entries(categories)) {
    if (slugs.has(slug)) return category
  }

  return 'Components'
}

function descriptionForSlug(slug) {
  if (descriptions[slug]) return descriptions[slug]

  return `${titleFromSlug(
    slug
  )} from the pinned shadcn Base catalogue, styled through Applique semantic tokens.`
}

function normalizeTypeText(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function propertyName(member, sourceFile) {
  if (!member.name) return 'unknown'
  return member.name.getText(sourceFile).replace(/^['"]|['"]$/g, '')
}

function collectTypeSurface(
  typeNode,
  sourceFile,
  declarations,
  seen = new Set()
) {
  const ownedProps = []
  const propSources = []

  function visit(node) {
    if (!node) return

    if (ts.isParenthesizedTypeNode(node)) {
      visit(node.type)
      return
    }

    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
      for (const type of node.types) visit(type)
      return
    }

    if (ts.isTypeLiteralNode(node)) {
      for (const member of node.members) {
        if (!ts.isPropertySignature(member) && !ts.isMethodSignature(member)) {
          continue
        }

        ownedProps.push({
          name: propertyName(member, sourceFile),
          optional: Boolean(member.questionToken),
          type: member.type
            ? normalizeTypeText(member.type.getText(sourceFile))
            : ts.isMethodSignature(member)
            ? normalizeTypeText(member.getText(sourceFile))
            : 'unknown',
        })
      }
      return
    }

    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
      const referencedName = node.typeName.text
      const declaration = declarations.get(referencedName)

      if (declaration && !seen.has(referencedName)) {
        seen.add(referencedName)

        if (ts.isTypeAliasDeclaration(declaration)) {
          visit(declaration.type)
          return
        }

        if (ts.isInterfaceDeclaration(declaration)) {
          for (const member of declaration.members) {
            if (
              !ts.isPropertySignature(member) &&
              !ts.isMethodSignature(member)
            ) {
              continue
            }

            ownedProps.push({
              name: propertyName(member, sourceFile),
              optional: Boolean(member.questionToken),
              type: member.type
                ? normalizeTypeText(member.type.getText(sourceFile))
                : normalizeTypeText(member.getText(sourceFile)),
            })
          }

          for (const clause of declaration.heritageClauses || []) {
            for (const type of clause.types) {
              propSources.push(normalizeTypeText(type.getText(sourceFile)))
            }
          }
          return
        }
      }
    }

    propSources.push(normalizeTypeText(node.getText(sourceFile)))
  }

  visit(typeNode)

  return {
    ownedProps,
    propSources: [...new Set(propSources)],
  }
}

function declarationName(statement) {
  if (
    (ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement)) &&
    statement.name
  ) {
    return statement.name.text
  }

  return null
}

function exportedModifier(node) {
  return Boolean(
    node.modifiers &&
      node.modifiers.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
      )
  )
}

function functionSignature(name, declaration, sourceFile) {
  const typeParameters = declaration.typeParameters
    ? `<${declaration.typeParameters
        .map((parameter) => normalizeTypeText(parameter.getText(sourceFile)))
        .join(', ')}>`
    : ''
  const parameters = declaration.parameters
    .map((parameter, index) => {
      const parameterName = ts.isIdentifier(parameter.name)
        ? parameter.name.text
        : index === 0
        ? 'props'
        : `argument${index + 1}`
      const optional = parameter.questionToken ? '?' : ''
      const type = parameter.type
        ? normalizeTypeText(parameter.type.getText(sourceFile))
        : 'unknown'

      return `${parameterName}${optional}: ${type}`
    })
    .join(', ')
  const returnType = declaration.type
    ? `: ${normalizeTypeText(declaration.type.getText(sourceFile))}`
    : ''

  return `function ${name}${typeParameters}(${parameters})${returnType}`
}

function variableSignature(name, declaration, sourceFile) {
  if (declaration.type) {
    return `const ${name}: ${normalizeTypeText(
      declaration.type.getText(sourceFile)
    )}`
  }

  if (declaration.initializer && ts.isCallExpression(declaration.initializer)) {
    return `const ${name} = ${normalizeTypeText(
      declaration.initializer.expression.getText(sourceFile)
    )}(…)`
  }

  return `const ${name}`
}

function exportKind(name, declaration) {
  if (name.startsWith('use')) return 'hook'
  if (/^[A-Z]/.test(name)) return 'component'
  if (declaration && ts.isTypeAliasDeclaration(declaration)) return 'type'
  if (declaration && ts.isInterfaceDeclaration(declaration)) return 'type'
  return 'utility'
}

function extractModuleApi(filePath) {
  if (!fs.existsSync(filePath)) {
    return []
  }

  const source = fs.readFileSync(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const declarations = new Map()
  const exportedNames = []

  for (const statement of sourceFile.statements) {
    const name = declarationName(statement)
    if (name) {
      declarations.set(name, statement)
      if (exportedModifier(statement)) {
        exportedNames.push({ exportedName: name, localName: name })
      }
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue
        declarations.set(declaration.name.text, declaration)

        if (exportedModifier(statement)) {
          exportedNames.push({
            exportedName: declaration.name.text,
            localName: declaration.name.text,
          })
        }
      }
    }

    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        exportedNames.push({
          exportedName: element.name.text,
          localName: element.propertyName
            ? element.propertyName.text
            : element.name.text,
        })
      }
    }
  }

  const seen = new Set()
  const exports = []

  for (const { exportedName, localName } of exportedNames) {
    if (seen.has(exportedName)) continue
    seen.add(exportedName)

    const declaration = declarations.get(localName)
    let signature = `export ${exportedName}`
    let props = { ownedProps: [], propSources: [] }

    if (declaration && ts.isFunctionDeclaration(declaration)) {
      signature = functionSignature(exportedName, declaration, sourceFile)
      props = collectTypeSurface(
        declaration.parameters[0] && declaration.parameters[0].type,
        sourceFile,
        declarations
      )
    } else if (declaration && ts.isVariableDeclaration(declaration)) {
      signature = variableSignature(exportedName, declaration, sourceFile)

      const initializer = declaration.initializer
      if (
        initializer &&
        ts.isCallExpression(initializer) &&
        ts.isIdentifier(initializer.expression) &&
        initializer.expression.text === 'withReact18Ref' &&
        initializer.arguments[0] &&
        ts.isIdentifier(initializer.arguments[0])
      ) {
        const implementation = declarations.get(initializer.arguments[0].text)

        if (implementation && ts.isFunctionDeclaration(implementation)) {
          signature = functionSignature(
            exportedName,
            implementation,
            sourceFile
          )
          props = collectTypeSurface(
            implementation.parameters[0] &&
              implementation.parameters[0].type,
            sourceFile,
            declarations
          )
        }
      } else if (
        initializer &&
        ts.isCallExpression(initializer) &&
        initializer.arguments[0] &&
        (ts.isArrowFunction(initializer.arguments[0]) ||
          ts.isFunctionExpression(initializer.arguments[0]))
      ) {
        props = collectTypeSurface(
          initializer.arguments[0].parameters[0] &&
            initializer.arguments[0].parameters[0].type,
          sourceFile,
          declarations
        )
      } else {
        props = collectTypeSurface(declaration.type, sourceFile, declarations)
      }
    } else if (declaration && ts.isInterfaceDeclaration(declaration)) {
      signature = `interface ${exportedName}`
      props = collectTypeSurface(
        ts.factory.createTypeReferenceNode(localName),
        sourceFile,
        declarations
      )
    } else if (declaration && ts.isTypeAliasDeclaration(declaration)) {
      signature = `type ${exportedName} = ${normalizeTypeText(
        declaration.type.getText(sourceFile)
      )}`
      props = collectTypeSurface(declaration.type, sourceFile, declarations)
    }

    exports.push({
      kind: exportKind(exportedName, declaration),
      name: exportedName,
      ownedProps: props.ownedProps,
      propSources: props.propSources,
      signature,
    })
  }

  return exports.sort((left, right) => {
    const kindOrder = { component: 0, hook: 1, utility: 2, type: 3 }
    return (
      (kindOrder[left.kind] ?? 9) - (kindOrder[right.kind] ?? 9) ||
      left.name.localeCompare(right.name)
    )
  })
}

function extractCandidateSlugs(document) {
  const candidates = []

  function visit(value, key) {
    if (Array.isArray(value)) {
      if (['components', 'items', 'names'].includes(key)) {
        for (const item of value) {
          if (typeof item === 'string') candidates.push(item)
          if (item && typeof item.name === 'string') candidates.push(item.name)
        }
      }

      for (const item of value) visit(item, '')
      return
    }

    if (!value || typeof value !== 'object') return
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      visit(nestedValue, nestedKey)
    }
  }

  visit(document, '')
  return candidates
}

function slugsFromPinnedIndex() {
  const candidates = [
    path.join(packageDirectory, 'upstream-lock.json'),
    path.join(packageDirectory, 'shadcn-upstream-lock.json'),
    path.join(packageDirectory, 'shadcn-base-nova.lock.json'),
    path.join(packageDirectory, 'upstream', 'base-nova', 'index.json'),
    path.join(packageDirectory, 'registry', 'base-nova', 'index.json'),
  ]

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue

    try {
      const document = JSON.parse(fs.readFileSync(candidate, 'utf8'))
      const supported = new Set(expectedComponentSlugs)
      const slugs = [
        ...new Set(
          extractCandidateSlugs(document).filter((slug) => supported.has(slug))
        ),
      ]
      const expectedAvailableSlugs = expectedComponentSlugs.filter(
        (slug) => !unavailableSlugs.includes(slug)
      )

      if (expectedAvailableSlugs.every((slug) => slugs.includes(slug))) {
        return {
          path: path.relative(repositoryDirectory, candidate),
          slugs: [...new Set([...slugs, ...unavailableSlugs])].sort(),
        }
      }
    } catch (error) {
      console.warn(
        `[catalog] ignored unreadable pinned index ${candidate}: ${error.message}`
      )
    }
  }

  return {
    path: null,
    slugs: expectedComponentSlugs,
  }
}

function transformExample(source) {
  return source
    .replace(
      /@\/registry\/bases\/base\/components\/example/g,
      '../../compat/example'
    )
    .replace(/@\/registry\/bases\/base\/ui\/([a-z0-9-]+)/g, '../../../src/$1')
    .replace(
      /@\/app\/\(create\)\/components\/icon-placeholder/g,
      '../../compat/icon-placeholder'
    )
    .replace(/from "next\/link"/g, 'from "../../compat/next-link"')
    .replace(/from "next\/image"/g, 'from "../../compat/next-image"')
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
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
          reject(new Error(`${url} returned HTTP ${response.statusCode}`))
          return
        }

        response.setEncoding('utf8')
        let body = ''
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => resolve(body))
      })
      .on('error', reject)
  })
}

async function vendorExamples(options) {
  fs.mkdirSync(previewDirectory, { recursive: true })

  for (const slug of directExampleSlugs) {
    const localPath = path.join(options.examplesDirectory, `${slug}.tsx`)
    let source

    if (fs.existsSync(localPath)) {
      source = fs.readFileSync(localPath, 'utf8')
    } else {
      if (!options.fetchMissing) {
        throw new Error(
          `Missing ${localPath}. Re-run with --fetch-missing to read the pinned upstream example.`
        )
      }

      const url =
        `https://raw.githubusercontent.com/shadcn-ui/ui/${UPSTREAM_COMMIT}` +
        `/apps/v4/registry/bases/base/examples/${slug}-example.tsx`
      source = await fetchText(url)
    }

    const outputPath = path.join(previewDirectory, `${slug}.tsx`)
    const output = transformExample(source)
    fs.writeFileSync(outputPath, output.endsWith('\n') ? output : `${output}\n`)
  }
}

function serializeTypeScript(value) {
  return JSON.stringify(value, null, 2)
}

function loadCatalogueMappings() {
  const document = JSON.parse(fs.readFileSync(componentMappingsPath, 'utf8'))
  if (!document || !Array.isArray(document.mappings)) {
    throw new Error('catalog/component-mappings.json must contain mappings[]')
  }

  const validKinds = new Set([
    'direct',
    'composition',
    'no-equivalent',
    'ambiguous',
  ])
  const validReviews = new Set(['proposed', 'approved'])
  const validPropKinds = new Set([
    'forwarded',
    'mapped',
    'composition-owned',
    'unsupported',
    'needs-review',
  ])
  const knownShadcn = new Set(expectedComponentSlugs)
  const legacyComponentsDirectory = path.join(repositoryDirectory, 'components')
  const knownApplique = new Set(
    fs
      .readdirSync(legacyComponentsDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  )
  const seenIds = new Set()
  const referencedApplique = new Set()

  for (const [index, mapping] of document.mappings.entries()) {
    const label = `component-mappings.json mappings[${index}]`
    if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
      throw new Error(`${label} must be an object`)
    }
    if (typeof mapping.id !== 'string' || !/^[a-z0-9-]+$/.test(mapping.id)) {
      throw new Error(`${label}.id must be a kebab-case string`)
    }
    if (seenIds.has(mapping.id)) {
      throw new Error(`${label}.id duplicates ${mapping.id}`)
    }
    seenIds.add(mapping.id)

    if (!validKinds.has(mapping.kind)) {
      throw new Error(`${label}.kind is not a supported migration strategy`)
    }
    if (!validReviews.has(mapping.review)) {
      throw new Error(`${label}.review must be proposed or approved`)
    }
    if (typeof mapping.summary !== 'string' || !mapping.summary.trim()) {
      throw new Error(`${label}.summary must be a non-empty string`)
    }

    for (const side of ['applique', 'shadcn']) {
      const values = mapping[side]
      if (
        !Array.isArray(values) ||
        values.some((value) => typeof value !== 'string' || !value)
      ) {
        throw new Error(`${label}.${side} must be an array of component slugs`)
      }
      if (new Set(values).size !== values.length) {
        throw new Error(`${label}.${side} must not contain duplicate slugs`)
      }
    }

    for (const slug of mapping.applique) {
      if (!knownApplique.has(slug)) {
        throw new Error(
          `${label}.applique references unknown component ${slug}`
        )
      }
      referencedApplique.add(slug)
    }
    for (const slug of mapping.shadcn) {
      if (!knownShadcn.has(slug)) {
        throw new Error(`${label}.shadcn references unknown component ${slug}`)
      }
    }

    const hasApplique = mapping.applique.length > 0
    const hasShadcn = mapping.shadcn.length > 0
    if (mapping.kind === 'direct') {
      if (mapping.applique.length !== 1 || mapping.shadcn.length !== 1) {
        throw new Error(
          `${label} direct mappings require one component per side`
        )
      }
    } else if (mapping.kind === 'composition') {
      if (!hasApplique || mapping.shadcn.length < 2) {
        throw new Error(
          `${label} composition mappings require Applique source and multiple shadcn targets`
        )
      }
    } else if (mapping.kind === 'ambiguous') {
      if (!hasApplique || mapping.shadcn.length < 2) {
        throw new Error(
          `${label} ambiguous mappings require Applique source and multiple possible targets`
        )
      }
    } else if (hasApplique === hasShadcn) {
      throw new Error(
        `${label} no-equivalent mappings require exactly one populated side`
      )
    }

    if (mapping.propMappings !== undefined) {
      if (
        !Array.isArray(mapping.propMappings) ||
        mapping.propMappings.length === 0
      ) {
        throw new Error(`${label}.propMappings must be a non-empty array`)
      }

      const seenPropIds = new Set()
      const seenSourceProps = new Set()

      for (const [propIndex, propMapping] of mapping.propMappings.entries()) {
        const propLabel = `${label}.propMappings[${propIndex}]`
        if (
          !propMapping ||
          typeof propMapping !== 'object' ||
          Array.isArray(propMapping)
        ) {
          throw new Error(`${propLabel} must be an object`)
        }
        if (
          typeof propMapping.id !== 'string' ||
          !/^[a-z0-9-]+$/.test(propMapping.id)
        ) {
          throw new Error(`${propLabel}.id must be a kebab-case string`)
        }
        if (seenPropIds.has(propMapping.id)) {
          throw new Error(`${propLabel}.id duplicates ${propMapping.id}`)
        }
        seenPropIds.add(propMapping.id)

        if (!validPropKinds.has(propMapping.kind)) {
          throw new Error(`${propLabel}.kind is not a supported prop strategy`)
        }
        if (
          typeof propMapping.summary !== 'string' ||
          !propMapping.summary.trim()
        ) {
          throw new Error(`${propLabel}.summary must be a non-empty string`)
        }
        if (
          !Array.isArray(propMapping.from) ||
          propMapping.from.length === 0 ||
          propMapping.from.some(
            (source) => typeof source !== 'string' || !source.trim()
          )
        ) {
          throw new Error(`${propLabel}.from must list source prop names`)
        }
        if (new Set(propMapping.from).size !== propMapping.from.length) {
          throw new Error(`${propLabel}.from must not contain duplicates`)
        }
        for (const source of propMapping.from) {
          if (seenSourceProps.has(source)) {
            throw new Error(
              `${propLabel}.from duplicates source prop ${source} in this component mapping`
            )
          }
          seenSourceProps.add(source)
        }

        if (!Array.isArray(propMapping.targets)) {
          throw new Error(`${propLabel}.targets must be an array`)
        }
        for (const [targetIndex, target] of propMapping.targets.entries()) {
          const targetLabel = `${propLabel}.targets[${targetIndex}]`
          if (
            !target ||
            typeof target !== 'object' ||
            Array.isArray(target) ||
            typeof target.component !== 'string' ||
            !target.component
          ) {
            throw new Error(`${targetLabel} must identify a component`)
          }
          if (!knownShadcn.has(target.component)) {
            throw new Error(
              `${targetLabel} references unknown component ${target.component}`
            )
          }
          if (!mapping.shadcn.includes(target.component)) {
            throw new Error(
              `${targetLabel} must reference a component from its parent mapping`
            )
          }
          if (
            target.prop !== undefined &&
            (typeof target.prop !== 'string' || !target.prop.trim())
          ) {
            throw new Error(`${targetLabel}.prop must be a non-empty string`)
          }
        }

        if (propMapping.kind === 'forwarded') {
          if (
            propMapping.from.length !== 1 ||
            propMapping.targets.length !== 1 ||
            propMapping.targets[0].prop !== propMapping.from[0]
          ) {
            throw new Error(
              `${propLabel} forwarded props require one same-named source and target prop`
            )
          }
        } else if (
          ['mapped', 'composition-owned'].includes(propMapping.kind) &&
          propMapping.targets.length === 0
        ) {
          throw new Error(`${propLabel} requires at least one registry target`)
        } else if (
          propMapping.kind === 'unsupported' &&
          propMapping.targets.length > 0
        ) {
          throw new Error(`${propLabel} unsupported props cannot have targets`)
        }

        if (propMapping.valueMap !== undefined) {
          if (
            propMapping.kind !== 'mapped' ||
            !propMapping.valueMap ||
            typeof propMapping.valueMap !== 'object' ||
            Array.isArray(propMapping.valueMap) ||
            Object.keys(propMapping.valueMap).length === 0 ||
            Object.entries(propMapping.valueMap).some(
              ([source, target]) =>
                !source || typeof target !== 'string' || !target
            )
          ) {
            throw new Error(
              `${propLabel}.valueMap is only valid as a non-empty string map on mapped props`
            )
          }
        }
      }

      if (
        mapping.review === 'approved' &&
        mapping.propMappings.some(({ kind }) => kind === 'needs-review')
      ) {
        throw new Error(
          `${label} cannot be approved while prop mappings still need review`
        )
      }
    }
  }

  const unclassified = [...knownApplique].filter(
    (slug) => !referencedApplique.has(slug)
  )
  if (unclassified.length > 0) {
    throw new Error(
      `component-mappings.json does not classify: ${unclassified
        .sort()
        .join(', ')}`
    )
  }

  return document.mappings
}

function writeGeneratedMetadata() {
  const pinned = slugsFromPinnedIndex()
  const mappings = loadCatalogueMappings()
  const components = pinned.slugs.map((slug) => {
    const sourcePath = path.join(sourceDirectory, `${slug}.tsx`)
    const unavailable = unavailableSlugs.includes(slug)
    const sourceAvailable = !unavailable && fs.existsSync(sourcePath)

    return {
      api: {
        exports: sourceAvailable ? extractModuleApi(sourcePath) : [],
      },
      availability: deprecatedSlugs.includes(slug)
        ? 'deprecated'
        : incompatibleSlugs.includes(slug)
        ? 'incompatible'
        : 'registry',
      category: categoryForSlug(slug),
      description: descriptionForSlug(slug),
      name: titleFromSlug(slug),
      previewProvenance: directExampleSlugs.includes(slug)
        ? 'Pinned official Base example'
        : localPreviewSlugs.includes(slug)
        ? 'Local minimal example'
        : 'Unavailable',
      registryStatus: sourceAvailable ? 'ready' : 'unavailable',
      slug,
      sourceAvailable,
      sourcePath: sourceAvailable ? `src/${slug}.tsx` : null,
      upstream: {
        base: UPSTREAM_BASE,
        commit: UPSTREAM_COMMIT,
        style: UPSTREAM_STYLE,
      },
    }
  })

  fs.mkdirSync(generatedDirectory, { recursive: true })
  const metadataSource = `/* This file is generated by scripts/generate-catalog-metadata.js. */\n\nexport const generatedCatalogueComponents = ${serializeTypeScript(
    components
  )} as const\n\nexport const generatedCatalogueMappings = ${serializeTypeScript(
    mappings
  )} as const\n\nexport const generatedCatalogueSource = ${JSON.stringify(
    pinned.path || `embedded pinned Base index @ ${UPSTREAM_COMMIT}`
  )} as const\n`
  fs.writeFileSync(
    path.join(generatedDirectory, 'components.generated.ts'),
    metadataSource
  )

  const previewEntries = [
    ...[...directExampleSlugs, ...localBasePreviewSlugs].map(
      (slug) =>
        `  ${JSON.stringify(slug)}: () => import('../previews/base/${slug}'),`
    ),
    `  direction: () => import('../previews/direction-preview'),`,
  ].join('\n')
  const loaderSource = `/* This file is generated by scripts/generate-catalog-metadata.js. */\n\nimport type * as React from 'react'\n\nexport type PreviewModule = { default: React.ComponentType }\n\nexport const previewLoaders: Partial<\n  Record<string, () => Promise<PreviewModule>>\n> = {\n${previewEntries}\n}\n`
  fs.writeFileSync(
    path.join(generatedDirectory, 'preview-loaders.generated.ts'),
    loaderSource
  )

  console.log(
    `[catalog] generated ${components.length} component metadata records and ${
      mappings.length
    } migration mappings from ${pinned.path || 'the embedded pinned index'}`
  )
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (!options.metadataOnly) {
    await vendorExamples(options)
  }
  writeGeneratedMetadata()
  if (!options.metadataOnly) {
    console.log(
      `[catalog] vendored ${directExampleSlugs.length} pinned Base previews`
    )
  }
}

main().catch((error) => {
  console.error(`[catalog] ${error.message}`)
  process.exitCode = 1
})
