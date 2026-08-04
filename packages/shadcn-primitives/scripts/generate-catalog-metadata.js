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
const clientUsageExamplesPath = path.join(
  catalogDirectory,
  'client-usage-examples.json'
)
const registryManifestPath = path.join(packageDirectory, 'registry.json')

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
// These pinned shadcn modules remain available to facades and prop analysis,
// but their public catalogue slot is owned by the corresponding Applique
// facade. Keeping this explicit prevents a raw primitive and facade from
// appearing as two public versions of the same component.
const internalPrimitiveSlugs = new Set([
  'accordion',
  'avatar',
  'badge',
  'button',
  'button-group',
  'tabs',
  'tooltip',
])
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

function publicFacadeSlug(item) {
  return item.name.replace(/^applique-/, '')
}

function facadePreviewSlug(item) {
  return item.name.startsWith('applique-')
    ? item.name
    : `applique-${item.name}`
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

const resolvedTypeFormatFlags =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope

const propOriginPrecedence = {
  applique: 0,
  shadcn: 0,
  primitive: 1,
  dependency: 2,
  native: 3,
}

const propOriginTieBreak = {
  applique: 0,
  shadcn: 1,
  primitive: 2,
  dependency: 3,
  native: 4,
}

function isPathInside(directory, filePath) {
  const relativePath = path.relative(directory, filePath)

  return (
    relativePath === '' ||
    (!relativePath.startsWith(`..${path.sep}`) &&
      relativePath !== '..' &&
      !path.isAbsolute(relativePath))
  )
}

function propOriginForDeclaration(declaration) {
  if (!declaration) return 'dependency'

  const filePath = path.resolve(declaration.getSourceFile().fileName)
  if (isPathInside(sourceDirectory, filePath)) {
    return isPathInside(path.join(sourceDirectory, 'facades'), filePath)
      ? 'applique'
      : 'shadcn'
  }

  const normalizedPath = filePath.split(path.sep).join('/')
  if (normalizedPath.includes('/node_modules/@base-ui/react/')) {
    return 'primitive'
  }
  if (normalizedPath.includes('/node_modules/@types/react/')) {
    return 'native'
  }

  return 'dependency'
}

function propSymbolMetadata(symbol, checker) {
  const declarations = symbol.getDeclarations() || []
  const candidates = declarations.length
    ? declarations.map((declaration, index) => ({
        index,
        origin: propOriginForDeclaration(declaration),
      }))
    : [{ index: 0, origin: 'dependency' }]

  candidates.sort(
    (left, right) =>
      propOriginPrecedence[left.origin] - propOriginPrecedence[right.origin] ||
      propOriginTieBreak[left.origin] - propOriginTieBreak[right.origin] ||
      left.index - right.index
  )

  const description = normalizeTypeText(
    ts.displayPartsToString(symbol.getDocumentationComment(checker))
  )

  return {
    description: description || undefined,
    origin: candidates[0].origin,
    precedence: propOriginPrecedence[candidates[0].origin],
    tieBreak: propOriginTieBreak[candidates[0].origin],
  }
}

function createCatalogueTypeAnalysis() {
  const configPath = path.join(packageDirectory, 'tsconfig.json')
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  if (configFile.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n')
    )
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    packageDirectory,
    undefined,
    configPath
  )
  if (parsedConfig.errors.length > 0) {
    throw new Error(
      parsedConfig.errors
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        )
        .join('\n')
    )
  }

  const program = ts.createProgram({
    options: parsedConfig.options,
    projectReferences: parsedConfig.projectReferences,
    rootNames: parsedConfig.fileNames,
  })

  return {
    checker: program.getTypeChecker(),
    program,
  }
}

function createPropDefinitionRegistry() {
  const definitions = []
  const definitionIds = new Map()
  let componentCount = 0
  let propReferenceCount = 0

  return {
    definitions,
    internMany(props) {
      componentCount += 1

      return props.map((prop) => {
        const definition = {
          name: prop.name,
          type: prop.type,
          optional: prop.optional,
          origin: prop.origin,
          ...(prop.description ? { description: prop.description } : {}),
        }
        const key = JSON.stringify(definition)
        let id = definitionIds.get(key)

        if (id === undefined) {
          id = definitions.length
          definitions.push(definition)
          definitionIds.set(key, id)
        }

        propReferenceCount += 1
        return id
      })
    },
    stats() {
      return {
        componentCount,
        definitionCount: definitions.length,
        propReferenceCount,
      }
    },
  }
}

function resolveAliasedSymbol(symbol, checker) {
  let resolved = symbol
  const seen = new Set()

  while (
    resolved &&
    resolved.flags & ts.SymbolFlags.Alias &&
    !seen.has(resolved)
  ) {
    seen.add(resolved)
    resolved = checker.getAliasedSymbol(resolved)
  }

  return resolved
}

function flattenUnionTypes(type) {
  if (!type.isUnion()) return [type]
  return type.types.flatMap(flattenUnionTypes)
}

function componentPropTypes(exportSymbol, sourceFile, checker) {
  const resolvedSymbol = resolveAliasedSymbol(exportSymbol, checker)
  if (!resolvedSymbol) return []

  const location =
    resolvedSymbol.valueDeclaration ||
    resolvedSymbol.declarations?.[0] ||
    sourceFile
  const exportType = checker.getTypeOfSymbolAtLocation(resolvedSymbol, location)
  const signatures = [
    ...checker.getSignaturesOfType(exportType, ts.SignatureKind.Call),
    ...checker.getSignaturesOfType(exportType, ts.SignatureKind.Construct),
  ]
  const propTypes = []
  const seenTypes = new Set()

  for (const signature of signatures) {
    const propSymbol = signature.parameters[0]
    if (!propSymbol) continue

    const propLocation =
      propSymbol.valueDeclaration || propSymbol.declarations?.[0] || location
    const signatureProps = checker.getTypeOfSymbolAtLocation(
      propSymbol,
      propLocation
    )

    for (const type of flattenUnionTypes(signatureProps)) {
      if (seenTypes.has(type)) continue
      seenTypes.add(type)
      propTypes.push(type)
    }
  }

  return propTypes
}

function resolvedComponentProps(exportSymbol, sourceFile, checker) {
  const propTypes = componentPropTypes(exportSymbol, sourceFile, checker)
  if (propTypes.length === 0) return []

  const propsByName = new Map()

  propTypes.forEach((propType, typeIndex) => {
    const apparentType = checker.getApparentType(propType)

    for (const symbol of checker.getPropertiesOfType(apparentType)) {
      const name = symbol.getName()
      const declaration =
        symbol.valueDeclaration || symbol.declarations?.[0] || sourceFile
      const propertyType =
        checker.getTypeOfPropertyOfType(apparentType, name) ||
        checker.getTypeOfSymbolAtLocation(symbol, declaration)
      const type = normalizeTypeText(
        checker.typeToString(propertyType, sourceFile, resolvedTypeFormatFlags)
      )
      const metadata = propSymbolMetadata(symbol, checker)
      if (metadata.origin === 'native' && /\bBaseUIEvent\b/.test(type)) {
        metadata.origin = 'primitive'
        metadata.precedence = propOriginPrecedence.primitive
        metadata.tieBreak = propOriginTieBreak.primitive
      }
      const optional = Boolean(
        symbol.flags & ts.SymbolFlags.Optional ||
          symbol.declarations?.some((item) => item.questionToken)
      )
      let prop = propsByName.get(name)

      if (!prop) {
        prop = {
          candidates: [],
          name,
          optional: false,
          presentIn: new Set(),
          types: new Set(),
        }
        propsByName.set(name, prop)
      }

      prop.candidates.push(metadata)
      prop.optional ||= optional
      prop.presentIn.add(typeIndex)
      prop.types.add(type || 'unknown')
    }
  })

  return [...propsByName.values()]
    .map((prop) => {
      prop.candidates.sort(
        (left, right) =>
          left.precedence - right.precedence || left.tieBreak - right.tieBreak
      )
      const bestMetadata = prop.candidates[0]
      const description = prop.candidates.find(
        (candidate) =>
          candidate.precedence === bestMetadata.precedence &&
          candidate.tieBreak === bestMetadata.tieBreak &&
          candidate.description
      )?.description

      return {
        name: prop.name,
        type: [...prop.types].sort().join(' | '),
        optional: prop.optional || prop.presentIn.size < propTypes.length,
        origin: bestMetadata.origin,
        ...(description ? { description } : {}),
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}

function propertyName(member, sourceFile) {
  if (!member.name) return 'unknown'
  return member.name.getText(sourceFile).replace(/^['"]|['"]$/g, '')
}

function memberTypeText(member, sourceFile) {
  if (ts.isMethodSignature(member)) {
    const typeParameters = member.typeParameters?.length
      ? `<${member.typeParameters
          .map((parameter) => parameter.getText(sourceFile))
          .join(', ')}>`
      : ''
    const parameters = member.parameters
      .map((parameter) => parameter.getText(sourceFile))
      .join(', ')
    const returnType = member.type ? member.type.getText(sourceFile) : 'unknown'

    return normalizeTypeText(
      `${typeParameters}(${parameters}) => ${returnType}`
    )
  }

  return member.type
    ? normalizeTypeText(member.type.getText(sourceFile))
    : 'unknown'
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
          type: memberTypeText(member, sourceFile),
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
              type: memberTypeText(member, sourceFile),
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
  if (declaration && ts.isTypeAliasDeclaration(declaration)) return 'type'
  if (declaration && ts.isInterfaceDeclaration(declaration)) return 'type'
  if (/^[A-Z]/.test(name)) return 'component'
  return 'utility'
}

function extractModuleApi(filePath, typeAnalysis, propDefinitions) {
  if (!fs.existsSync(filePath)) {
    return []
  }

  const source = fs.readFileSync(filePath, 'utf8')
  const sourceFile =
    typeAnalysis.program.getSourceFile(path.resolve(filePath)) ||
    ts.createSourceFile(
      filePath,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    )
  const moduleSymbol = typeAnalysis.checker.getSymbolAtLocation(sourceFile)
  const exportedSymbols = new Map(
    moduleSymbol
      ? typeAnalysis.checker
          .getExportsOfModule(moduleSymbol)
          .map((symbol) => [symbol.getName(), symbol])
      : []
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
      const forwardRefProps =
        initializer &&
        ts.isCallExpression(initializer) &&
        /(?:^|\.)forwardRef$/.test(
          initializer.expression.getText(sourceFile)
        ) &&
        initializer.typeArguments &&
        initializer.typeArguments[1]

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
            implementation.parameters[0] && implementation.parameters[0].type,
            sourceFile,
            declarations
          )
        }
      } else if (forwardRefProps) {
        props = collectTypeSurface(forwardRefProps, sourceFile, declarations)
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

    const kind = exportKind(exportedName, declaration)
    const apiExport = {
      acceptedPropIds: [],
      kind,
      name: exportedName,
      ownedProps: props.ownedProps,
      propSources: props.propSources,
      signature,
    }

    if (kind === 'component') {
      const exportSymbol = exportedSymbols.get(exportedName)
      const acceptedProps = exportSymbol
        ? resolvedComponentProps(exportSymbol, sourceFile, typeAnalysis.checker)
        : []

      apiExport.acceptedPropIds = propDefinitions.internMany(acceptedProps)
    }

    exports.push(apiExport)
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

function serializePropDefinitions(definitions) {
  return `[
${definitions
  .map((definition) => `  ${JSON.stringify(definition)}`)
  .join(',\n')}
]`
}

function serializeComponentMetadata(components) {
  return serializeTypeScript(components).replace(
    /"acceptedPropIds": \[\s*([\d,\s]*)\]/g,
    (_match, values) => {
      const ids = values.match(/\d+/g) || []
      return `"acceptedPropIds": [${ids.join(', ')}]`
    }
  )
}

function loadOwnedFacades() {
  const manifest = JSON.parse(fs.readFileSync(registryManifestPath, 'utf8'))

  return manifest.items
    .filter((item) => item.meta && item.meta.status === 'facade')
    .map((item) => {
      if (
        item.type !== 'registry:component' ||
        !Array.isArray(item.files) ||
        item.files.length !== 1
      ) {
        throw new Error(
          `Owned facade ${item.name} must be a single-file registry:component`
        )
      }

      const sourcePath = path.join(packageDirectory, item.files[0].path)
      const publicSlug = publicFacadeSlug(item)
      const previewSlug = facadePreviewSlug(item)
      const previewPath = path.join(
        catalogDirectory,
        'previews',
        `${previewSlug}-preview.tsx`
      )
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Owned facade source is missing: ${item.files[0].path}`)
      }
      if (!fs.existsSync(previewPath)) {
        throw new Error(
          `Owned facade preview is missing: ${path.relative(
            packageDirectory,
            previewPath
          )}`
        )
      }

      return { item, previewPath, previewSlug, publicSlug, sourcePath }
    })
    .sort((left, right) => left.item.name.localeCompare(right.item.name))
}

function clientImportPath(target, slug) {
  if (typeof target !== 'string' || target.length === 0) {
    throw new Error(`Registry item ${slug} does not define a client target`)
  }
  if (target.includes('/internal/') || target.includes('applique-internal-')) {
    throw new Error(`Public client contract ${slug} exposes an internal target`)
  }

  const withoutExtension = target.replace(/\.(?:[jt]sx?)$/, '')
  if (withoutExtension.startsWith('@ui/')) {
    return `@/components/ui/${withoutExtension.slice('@ui/'.length)}`
  }
  if (withoutExtension.startsWith('@components/')) {
    return `@/components/${withoutExtension.slice('@components/'.length)}`
  }

  throw new Error(
    `Registry item ${slug} uses unsupported public target ${target}`
  )
}

function validateUsageSource(slug, source) {
  const sourceFile = ts.createSourceFile(
    `${slug}.tsx`,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  if (sourceFile.parseDiagnostics.length > 0) {
    const diagnostic = sourceFile.parseDiagnostics[0]
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      '\n'
    )
    throw new Error(`Client usage example ${slug} is invalid TSX: ${message}`)
  }

  const declaredNames = new Set()
  const collectBinding = (name) => {
    if (ts.isIdentifier(name)) {
      declaredNames.add(name.text)
      return
    }
    for (const element of name.elements || []) {
      if (!ts.isOmittedExpression(element)) collectBinding(element.name)
    }
  }
  const collectDeclarations = (node) => {
    if (ts.isImportDeclaration(node) && node.importClause) {
      if (node.importClause.name) declaredNames.add(node.importClause.name.text)
      const bindings = node.importClause.namedBindings
      if (bindings && ts.isNamespaceImport(bindings)) {
        declaredNames.add(bindings.name.text)
      } else if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          declaredNames.add(element.name.text)
        }
      }
    } else if (ts.isVariableDeclaration(node)) {
      collectBinding(node.name)
    } else if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
      node.name
    ) {
      declaredNames.add(node.name.text)
    }
    if (ts.isFunctionLike(node)) {
      for (const parameter of node.parameters) collectBinding(parameter.name)
    }
    ts.forEachChild(node, collectDeclarations)
  }
  collectDeclarations(sourceFile)

  const jsxRoots = new Set()
  const collectJsxRoots = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      let tag = node.tagName
      while (ts.isPropertyAccessExpression(tag)) tag = tag.expression
      if (ts.isIdentifier(tag) && /^[A-Z]/.test(tag.text)) jsxRoots.add(tag.text)
    }
    ts.forEachChild(node, collectJsxRoots)
  }
  collectJsxRoots(sourceFile)
  const missingJsxRoots = [...jsxRoots].filter(
    (name) => !declaredNames.has(name)
  )
  if (missingJsxRoots.length > 0) {
    throw new Error(
      `Client usage example ${slug} uses JSX without an import: ${missingJsxRoots.join(
        ', '
      )}`
    )
  }
}

function addClientContracts(components, registryManifest) {
  if (!fs.existsSync(clientUsageExamplesPath)) {
    throw new Error('catalog/client-usage-examples.json is missing')
  }

  const recipes = JSON.parse(
    fs.readFileSync(clientUsageExamplesPath, 'utf8')
  )
  if (!recipes || typeof recipes !== 'object' || Array.isArray(recipes)) {
    throw new Error('catalog/client-usage-examples.json must be an object')
  }

  const publicSlugs = new Set(components.map((component) => component.slug))
  const recipeSlugs = Object.keys(recipes)
  const missing = [...publicSlugs].filter((slug) => !recipes[slug])
  const extra = recipeSlugs.filter((slug) => !publicSlugs.has(slug))
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `Client usage coverage mismatch (missing: ${
        missing.join(', ') || 'none'
      }; extra: ${extra.join(', ') || 'none'})`
    )
  }

  const registryItems = new Map(
    registryManifest.items.map((item) => [item.name, item])
  )

  return components.map((component) => {
    const recipe = recipes[component.slug]
    if (!recipe || typeof recipe !== 'object' || Array.isArray(recipe)) {
      throw new Error(`Client usage recipe ${component.slug} must be an object`)
    }

    if (!component.sourceAvailable) {
      if (
        typeof recipe.unavailableReason !== 'string' ||
        recipe.unavailableReason.trim().length === 0
      ) {
        throw new Error(
          `Unavailable component ${component.slug} needs unavailableReason`
        )
      }
      if (
        recipe.replacement !== undefined &&
        (typeof recipe.replacement !== 'string' ||
          !publicSlugs.has(recipe.replacement))
      ) {
        throw new Error(
          `Unavailable component ${component.slug} has an unknown replacement`
        )
      }

      return {
        ...component,
        clientContract: {
          basicUsage: null,
          importPath: null,
          note: null,
          registryTarget: null,
          replacement: recipe.replacement || null,
          unavailableReason: recipe.unavailableReason.trim(),
        },
      }
    }

    if (!Array.isArray(recipe.exports) || recipe.exports.length === 0) {
      throw new Error(`Client usage recipe ${component.slug} needs exports[]`)
    }
    if (
      typeof recipe.jsx !== 'string' ||
      recipe.jsx.trim().length === 0
    ) {
      throw new Error(`Client usage recipe ${component.slug} needs JSX`)
    }

    const knownExports = new Map(
      component.api.exports.map((item) => [item.name, item.kind])
    )
    const usedExports = new Set()
    for (const exportedName of recipe.exports) {
      if (typeof exportedName !== 'string' || exportedName.length === 0) {
        throw new Error(
          `Client usage recipe ${component.slug} has an invalid export`
        )
      }
      if (!knownExports.has(exportedName)) {
        throw new Error(
          `Client usage recipe ${component.slug} references unknown export ${exportedName}`
        )
      }
      if (usedExports.has(exportedName)) {
        throw new Error(
          `Client usage recipe ${component.slug} repeats export ${exportedName}`
        )
      }
      usedExports.add(exportedName)
    }

    const item = registryItems.get(component.slug)
    const target = item?.files?.[0]?.target
    const importPath = clientImportPath(target, component.slug)
    const externalImports = recipe.externalImports || []
    if (
      !Array.isArray(externalImports) ||
      externalImports.some(
        (line) => typeof line !== 'string' || !line.startsWith('import ')
      )
    ) {
      throw new Error(
        `Client usage recipe ${component.slug} has invalid externalImports`
      )
    }

    const setup = typeof recipe.setup === 'string' ? recipe.setup.trim() : ''
    const usageSource = `${setup}\n${recipe.jsx}`
    const referencedExports = recipe.exports.filter((exportedName) =>
      new RegExp(`\\b${exportedName}\\b`).test(usageSource)
    )
    if (referencedExports.length === 0) {
      throw new Error(
        `Client usage recipe ${component.slug} does not use a public export`
      )
    }
    const componentImport = `import { ${referencedExports
      .map((exportedName) =>
        knownExports.get(exportedName) === 'type'
          ? `type ${exportedName}`
          : exportedName
      )
      .join(', ')} } from "${importPath}"`
    const indent = (source, spaces) => {
      const prefix = ' '.repeat(spaces)
      return source
        .split('\n')
        .map((line) => (line.length > 0 ? `${prefix}${line}` : line))
        .join('\n')
    }
    const exampleBody = [
      'export function BasicExample() {',
      ...(setup ? [indent(setup, 2), ''] : []),
      '  return (',
      indent(recipe.jsx.trim(), 4),
      '  )',
      '}',
    ].join('\n')
    const basicUsage = [
      ...externalImports,
      componentImport,
      exampleBody,
    ]
      .filter(Boolean)
      .join('\n\n')

    if (basicUsage.includes('applique-internal-') || basicUsage.includes('/internal/')) {
      throw new Error(
        `Client usage recipe ${component.slug} exposes an internal primitive`
      )
    }
    validateUsageSource(component.slug, basicUsage)

    if (recipe.note !== undefined && typeof recipe.note !== 'string') {
      throw new Error(`Client usage recipe ${component.slug} has invalid note`)
    }

    return {
      ...component,
      clientContract: {
        basicUsage,
        importPath,
        note: recipe.note?.trim() || null,
        registryTarget: target,
        replacement: null,
        unavailableReason: null,
      },
    }
  })
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

    if (mapping.appliqueApi !== undefined) {
      throw new Error(
        `${label}.appliqueApi is generated from legacy documentation and must not be configured manually`
      )
    }
    if (mapping.mainShadcnProps !== undefined) {
      if (
        !Array.isArray(mapping.mainShadcnProps) ||
        mapping.mainShadcnProps.length === 0 ||
        mapping.mainShadcnProps.some(
          (propName) =>
            typeof propName !== 'string' ||
            propName.trim() !== propName ||
            !propName
        )
      ) {
        throw new Error(
          `${label}.mainShadcnProps must be a non-empty array of trimmed prop names`
        )
      }
      if (
        new Set(mapping.mainShadcnProps).size !== mapping.mainShadcnProps.length
      ) {
        throw new Error(`${label}.mainShadcnProps must not contain duplicates`)
      }
      if (mapping.shadcn.length === 0) {
        throw new Error(
          `${label}.mainShadcnProps requires at least one shadcn component`
        )
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

function normalizedComponentName(value) {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function loadLegacyDocumentedApi(componentSlug) {
  const dataPath = path.join(
    repositoryDirectory,
    'components',
    componentSlug,
    'docs',
    'data.js'
  )
  if (!fs.existsSync(dataPath)) {
    throw new Error(
      `Legacy API documentation is missing for Applique component ${componentSlug}`
    )
  }

  const source = fs.readFileSync(dataPath, 'utf8')
  const match = source.match(/const json = (\{.*\})\s*export default json/s)
  if (!match) {
    throw new Error(
      `Legacy API documentation has an unsupported format: ${path.relative(
        repositoryDirectory,
        dataPath
      )}`
    )
  }

  let document
  try {
    document = JSON.parse(match[1])
  } catch (error) {
    throw new Error(
      `Legacy API documentation is not valid JSON for ${componentSlug}: ${error.message}`
    )
  }

  const expectedName = normalizedComponentName(componentSlug)
  const exportName = Object.keys(document).find(
    (name) => normalizedComponentName(name) === expectedName
  )
  const api = exportName ? document[exportName] : undefined
  if (!api || !Array.isArray(api.data)) {
    throw new Error(
      `Legacy API documentation does not contain a primary ${componentSlug} export`
    )
  }

  const seenProps = new Set()
  const props = api.data.map((prop, index) => {
    const label = `${componentSlug} documented prop[${index}]`
    if (
      !prop ||
      typeof prop !== 'object' ||
      Array.isArray(prop) ||
      typeof prop.name !== 'string' ||
      !prop.name ||
      typeof prop.type !== 'string' ||
      !prop.type ||
      typeof prop.description !== 'string'
    ) {
      throw new Error(`${label} is invalid`)
    }
    if (!Object.prototype.hasOwnProperty.call(prop, 'default')) {
      throw new Error(`${label} is missing its documented default`)
    }
    if (seenProps.has(prop.name)) {
      throw new Error(`${label} duplicates ${prop.name}`)
    }
    seenProps.add(prop.name)

    return {
      name: prop.name,
      type: prop.type,
      default: prop.default,
      description: prop.description,
    }
  })

  return {
    component: componentSlug,
    props,
  }
}

function enrichCatalogueMappings(
  mappings,
  upstreamComponents,
  facadeComponents,
  definitions
) {
  const upstreamBySlug = new Map(
    upstreamComponents.map((component) => [component.slug, component])
  )
  const facadesBySlug = new Map(
    facadeComponents.map((component) => [component.slug, component])
  )

  return mappings.map((mapping) => {
    const mainShadcnProps = mapping.mainShadcnProps || []
    const availableShadcnProps = new Set()
    const appliqueApi = mapping.applique.map(loadLegacyDocumentedApi)

    for (const componentSlug of mapping.shadcn) {
      const component = upstreamBySlug.get(componentSlug)
      for (const apiExport of component?.api.exports || []) {
        if (apiExport.kind !== 'component') continue
        for (const id of apiExport.acceptedPropIds) {
          availableShadcnProps.add(definitions[id].name)
        }
      }
    }

    for (const propName of mainShadcnProps) {
      if (!availableShadcnProps.has(propName)) {
        throw new Error(
          `Mapping ${mapping.id}.mainShadcnProps references unresolved shadcn prop ${propName}`
        )
      }
    }

    const facade = facadesBySlug.get(mapping.id)
    if (facade) {
      const expectedExport = normalizedComponentName(mapping.id)
      const facadeExport =
        facade.api.exports.find(
          (apiExport) =>
            apiExport.kind === 'component' &&
            normalizedComponentName(apiExport.name) === expectedExport
        ) ||
        facade.api.exports.find((apiExport) => apiExport.kind === 'component')
      if (!facadeExport) {
        throw new Error(
          `Owned facade ${mapping.id} does not expose a component`
        )
      }

      // Compound facades keep documented child props on child exports such as
      // Tabs.Tab and BreadCrumb.Item. Validate the complete public component
      // surface instead of incorrectly requiring every prop on the root.
      const availableFacadeProps = new Set(
        facade.api.exports
          .filter((apiExport) => apiExport.kind === 'component')
          .flatMap((apiExport) => apiExport.acceptedPropIds || [])
          .map((id) => definitions[id].name)
      )

      for (const api of appliqueApi) {
        for (const prop of api.props) {
          const propMapping = (mapping.propMappings || []).find((item) =>
            item.from.includes(prop.name)
          )
          if (
            !propMapping ||
            propMapping.kind === 'unsupported' ||
            propMapping.kind === 'needs-review'
          ) {
            continue
          }
          if (!availableFacadeProps.has(prop.name)) {
            throw new Error(
              `Owned facade ${mapping.id} does not accept documented Applique prop ${prop.name}`
            )
          }
        }
      }

      for (const propName of mainShadcnProps) {
        if (!availableFacadeProps.has(propName)) {
          throw new Error(
            `Owned facade ${mapping.id} does not accept curated shadcn prop ${propName}`
          )
        }
      }
    }

    return {
      ...mapping,
      appliqueApi,
      mainShadcnProps,
    }
  })
}

function validateResolvedPropMetadata(
  components,
  definitions,
  upstreamComponents,
  facadeComponents
) {
  const validOrigins = new Set([
    'applique',
    'shadcn',
    'primitive',
    'dependency',
    'native',
  ])

  definitions.forEach((definition, index) => {
    if (
      !definition ||
      typeof definition.name !== 'string' ||
      typeof definition.type !== 'string' ||
      typeof definition.optional !== 'boolean' ||
      !validOrigins.has(definition.origin)
    ) {
      throw new Error(`Resolved prop definition ${index} is invalid`)
    }
    if (/\/Users\/|\.pnpm\//.test(definition.type)) {
      throw new Error(
        `Resolved prop ${definition.name} leaks a local filesystem path`
      )
    }
  })

  for (const component of components) {
    for (const apiExport of component.api.exports) {
      if (!Array.isArray(apiExport.acceptedPropIds)) {
        throw new Error(
          `${component.slug}.${apiExport.name} is missing acceptedPropIds`
        )
      }
      if (
        apiExport.kind === 'component' &&
        apiExport.acceptedPropIds.length === 0
      ) {
        throw new Error(
          `${component.slug}.${apiExport.name} did not resolve any named props`
        )
      }
      for (const id of apiExport.acceptedPropIds) {
        if (!Number.isInteger(id) || !definitions[id]) {
          throw new Error(
            `${component.slug}.${apiExport.name} references invalid prop ${id}`
          )
        }
      }
    }
  }

  function requireProp(
    sourceComponents,
    componentSlug,
    exportName,
    propName,
    origin
  ) {
    const component = sourceComponents.find(
      (item) => item.slug === componentSlug
    )
    const apiExport = component?.api.exports.find(
      (item) => item.name === exportName
    )
    const prop = apiExport?.acceptedPropIds
      .map((id) => definitions[id])
      .find((item) => item.name === propName)

    if (!prop || prop.origin !== origin) {
      throw new Error(
        `${componentSlug}.${exportName} must expose ${origin} prop ${propName}`
      )
    }
  }

  requireProp(upstreamComponents, 'button', 'Button', 'variant', 'shadcn')
  requireProp(upstreamComponents, 'button', 'Button', 'render', 'primitive')
  requireProp(upstreamComponents, 'button', 'Button', 'onClick', 'primitive')
  requireProp(facadeComponents, 'avatar', 'Avatar', 'name', 'applique')
  requireProp(facadeComponents, 'avatar', 'Avatar', 'size', 'applique')
  requireProp(
    facadeComponents,
    'input-checkbox',
    'InputCheckbox',
    'value',
    'applique'
  )
  requireProp(
    facadeComponents,
    'input-checkbox',
    'InputCheckbox',
    'checked',
    'primitive'
  )
  requireProp(facadeComponents, 'input-number', 'InputNumber', 'type', 'applique')
  requireProp(
    facadeComponents,
    'input-number',
    'InputNumber',
    'onChange',
    'applique'
  )
  requireProp(facadeComponents, 'input-number', 'InputNumber', 'min', 'native')
  requireProp(
    facadeComponents,
    'input-radio',
    'InputRadio',
    'options',
    'applique'
  )
  requireProp(
    facadeComponents,
    'input-radio',
    'InputRadio',
    'defaultValue',
    'applique'
  )
  requireProp(facadeComponents, 'input-text', 'InputText', 'type', 'applique')
  requireProp(
    facadeComponents,
    'input-text',
    'InputText',
    'onChange',
    'applique'
  )
  requireProp(
    facadeComponents,
    'input-text',
    'InputText',
    'autoFocus',
    'native'
  )
  requireProp(facadeComponents, 'accordion', 'Accordion', 'active', 'applique')
  requireProp(
    facadeComponents,
    'accordion',
    'Accordion',
    'onChange',
    'applique'
  )
  requireProp(
    facadeComponents,
    'accordion',
    'AccordionItem',
    'title',
    'applique'
  )
  requireProp(facadeComponents, 'badge', 'Badge', 'type', 'applique')
  requireProp(facadeComponents, 'badge', 'Badge', 'variant', 'applique')
  requireProp(facadeComponents, 'badge', 'Badge', 'onClose', 'applique')
  requireProp(
    facadeComponents,
    'bread-crumb',
    'BreadCrumb',
    'className',
    'native'
  )
  requireProp(
    facadeComponents,
    'input-text-area',
    'InputTextArea',
    'noResize',
    'applique'
  )
  requireProp(
    facadeComponents,
    'input-text-area',
    'InputTextArea',
    'onChange',
    'applique'
  )
  requireProp(facadeComponents, 'tabs', 'Tabs', 'activeIndex', 'applique')
  requireProp(facadeComponents, 'tabs', 'Tabs', 'onChange', 'applique')
  requireProp(facadeComponents, 'tabs', 'Tab', 'title', 'applique')
  requireProp(
    facadeComponents,
    'tooltip',
    'Tooltip',
    'renderContent',
    'applique'
  )
  requireProp(facadeComponents, 'tooltip', 'Tooltip', 'position', 'applique')
  requireProp(facadeComponents, 'tooltip', 'Tooltip', 'dark', 'applique')
}

function writeGeneratedMetadata() {
  const pinned = slugsFromPinnedIndex()
  const configuredMappings = loadCatalogueMappings()
  const typeAnalysis = createCatalogueTypeAnalysis()
  const propDefinitions = createPropDefinitionRegistry()
  const registryManifest = JSON.parse(
    fs.readFileSync(registryManifestPath, 'utf8')
  )
  const upstreamComponents = pinned.slugs.map((slug) => {
    const sourcePath = path.join(sourceDirectory, `${slug}.tsx`)
    const unavailable = unavailableSlugs.includes(slug)
    const sourceAvailable = !unavailable && fs.existsSync(sourcePath)

    return {
      api: {
        exports: sourceAvailable
          ? extractModuleApi(sourcePath, typeAnalysis, propDefinitions)
          : [],
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
  const ownedFacades = loadOwnedFacades()
  const facadeComponents = ownedFacades.map(
    ({ item, publicSlug, sourcePath }) => ({
      api: {
        exports: extractModuleApi(sourcePath, typeAnalysis, propDefinitions),
      },
      availability: 'registry',
      category: 'Applique facade',
      description: item.description,
      name: titleFromSlug(publicSlug),
      previewProvenance: 'Applique-owned facade example',
      registryStatus:
        item.meta?.compatibility?.migrationStatus === 'testing'
          ? 'testing'
          : 'ready',
      slug: publicSlug,
      sourceAvailable: true,
      sourcePath: item.files[0].path,
      upstream: {
        base: 'applique',
        commit: UPSTREAM_COMMIT,
        style: 'facade',
      },
    })
  )
  const publicComponents = [
    ...upstreamComponents.filter(
      (component) => !internalPrimitiveSlugs.has(component.slug)
    ),
    ...facadeComponents,
  ]
  const publicSlugs = new Set()
  for (const component of publicComponents) {
    if (publicSlugs.has(component.slug)) {
      throw new Error(`Duplicate public catalogue component ${component.slug}`)
    }
    publicSlugs.add(component.slug)
  }

  validateResolvedPropMetadata(
    [...upstreamComponents, ...facadeComponents],
    propDefinitions.definitions,
    upstreamComponents,
    facadeComponents
  )
  const mappings = enrichCatalogueMappings(
    configuredMappings,
    upstreamComponents,
    facadeComponents,
    propDefinitions.definitions
  )
  const components = addClientContracts(publicComponents, registryManifest)

  fs.mkdirSync(generatedDirectory, { recursive: true })
  const metadataSource = `/* This file is generated by scripts/generate-catalog-metadata.js. */\n\nexport const generatedCataloguePropDefinitions = ${serializePropDefinitions(
    propDefinitions.definitions
  )} as const\n\nexport const generatedCatalogueComponents = ${serializeComponentMetadata(
    components
  )} as const\n\nexport const generatedCatalogueMappings = ${serializeTypeScript(
    mappings
  )} as const\n\nexport const generatedCatalogueSource = ${JSON.stringify(
    pinned.path || `embedded pinned Base index @ ${UPSTREAM_COMMIT}`
  )} as const\n\nexport const generatedRegistryVersion = ${JSON.stringify(
    registryManifest.meta.version
  )} as const\n`
  fs.writeFileSync(
    path.join(generatedDirectory, 'components.generated.ts'),
    metadataSource
  )

  const previewEntries = [
    ...[...directExampleSlugs, ...localBasePreviewSlugs]
      .filter((slug) => !internalPrimitiveSlugs.has(slug))
      .map(
        (slug) =>
          `  ${JSON.stringify(slug)}: () => import('../previews/base/${slug}'),`
      ),
    `  direction: () => import('../previews/direction-preview'),`,
    ...ownedFacades.map(
      ({ previewSlug, publicSlug }) =>
        `  ${JSON.stringify(publicSlug)}: () => import('../previews/${
          previewSlug
        }-preview'),`
    ),
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
  const propStats = propDefinitions.stats()
  console.log(
    `[catalog] resolved ${propStats.propReferenceCount} accepted prop references across ${propStats.componentCount} component exports into ${propStats.definitionCount} shared definitions`
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
