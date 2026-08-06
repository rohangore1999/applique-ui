#!/usr/bin/env node

/*
 * Structural gate connecting component-mappings.json to registry facade
 * metadata and source-derived TypeScript prop APIs.
 *
 * This cannot prove runtime semantics. Prop precedence, callback order and
 * cancellation, DOM targets, and absent-value behavior remain the job of
 * focused component specs.
 */

const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const packageDirectory = path.resolve(__dirname, '..')
const repositoryDirectory = path.resolve(packageDirectory, '..', '..')
const mappingsPath = path.join(
  packageDirectory,
  'catalog',
  'component-mappings.json'
)
const registryPath = path.join(packageDirectory, 'registry.json')
const tsconfigPath = path.join(packageDirectory, 'tsconfig.json')
const resolvedKinds = new Set(['forwarded', 'mapped', 'composition-owned'])

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function loadDocumentedProps(componentSlug) {
  const filePath = path.join(
    repositoryDirectory,
    'components',
    componentSlug,
    'docs',
    'data.js'
  )
  if (!fs.existsSync(filePath)) {
    throw new Error(`Legacy documentation is missing: ${filePath}`)
  }

  const source = fs.readFileSync(filePath, 'utf8')
  const match = source.match(/const json = (\{.*\})\s*export default json/s)
  if (!match) {
    throw new Error(
      `Legacy documentation has an unsupported format: ${filePath}`
    )
  }

  const document = JSON.parse(match[1])
  return Object.entries(document)
    .map(([exportName, component]) => ({
      exportName: component.name || exportName,
      props: new Set(
        Array.isArray(component.data)
          ? component.data.map((prop) => prop.name)
          : []
      ),
    }))
    .filter((component) => component.props.size > 0)
}

function createFacadeApiReader() {
  const config = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
  if (config.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, '\n')
    )
  }

  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    packageDirectory
  )
  if (parsed.errors.length > 0) {
    throw new Error(
      parsed.errors
        .map((error) =>
          ts.flattenDiagnosticMessageText(error.messageText, '\n')
        )
        .join('\n')
    )
  }

  const program = ts.createProgram(parsed.fileNames, parsed.options)
  const checker = program.getTypeChecker()

  return function readFacadeProps(sourcePath) {
    const sourceFile = program.getSourceFile(
      path.join(packageDirectory, sourcePath)
    )
    if (!sourceFile || !sourceFile.symbol) {
      throw new Error(
        `Facade source is not part of tsconfig.json: ${sourcePath}`
      )
    }

    const propsByExport = new Map()
    for (let symbol of checker.getExportsOfModule(sourceFile.symbol)) {
      const exportName = symbol.name
      if (symbol.flags & ts.SymbolFlags.Alias) {
        symbol = checker.getAliasedSymbol(symbol)
      }
      const declaration = symbol.valueDeclaration
      if (!declaration) continue

      const exportType = checker.getTypeOfSymbolAtLocation(symbol, declaration)
      const props = new Set()
      for (const signature of exportType.getCallSignatures()) {
        const parameter = signature.parameters[0]
        if (!parameter) continue
        const parameterDeclaration =
          parameter.valueDeclaration ||
          parameter.declarations?.[0] ||
          declaration
        const parameterType = checker.getTypeOfSymbolAtLocation(
          parameter,
          parameterDeclaration
        )
        for (const prop of checker.getPropertiesOfType(parameterType)) {
          props.add(prop.name)
        }
      }
      if (props.size > 0) propsByExport.set(exportName, props)
    }

    if (propsByExport.size === 0) {
      throw new Error(
        `Facade exposes no callable component props: ${sourcePath}`
      )
    }
    return propsByExport
  }
}

function resolveFacadeProps(
  item,
  mapping,
  documentedExportName,
  propsByExport
) {
  const aliasedExportName =
    mapping.legacyDocumentationExportAliases?.[documentedExportName] ||
    documentedExportName

  if (propsByExport.has(aliasedExportName)) {
    return propsByExport.get(aliasedExportName)
  }

  const legacyComponent = item.meta?.compatibility?.legacyComponent
  const nestedExportName = legacyComponent
    ? `${legacyComponent}${documentedExportName}`
    : undefined

  return nestedExportName ? propsByExport.get(nestedExportName) : undefined
}

function sourceCoversProp(source, prop) {
  return source === prop || source.startsWith(`${prop}.`)
}

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function unresolvedLabelMatches(label, propMapping) {
  const normalizedLabel = normalize(label)
  if (normalizedLabel.includes(normalize(propMapping.id))) return true

  return propMapping.from.some((source) => {
    const sourceLeaf = source.split('.').pop()
    return (
      normalizedLabel.endsWith(normalize(source)) ||
      normalizedLabel.endsWith(normalize(sourceLeaf))
    )
  })
}

function main() {
  const registry = readJson(registryPath)
  const mappings = readJson(mappingsPath).mappings
  const mappingsById = new Map(mappings.map((mapping) => [mapping.id, mapping]))
  const facadeItems = registry.items.filter(
    (item) => item.meta?.status === 'facade'
  )
  const facadesByName = new Map(facadeItems.map((item) => [item.name, item]))
  const readFacadeProps = createFacadeApiReader()
  const failures = []

  const reviewMappings = (name) =>
    (mappingsById.get(name)?.propMappings || []).filter(
      (propMapping) => propMapping.kind === 'needs-review'
    )

  for (const item of facadeItems) {
    const mapping = mappingsById.get(item.name)
    if (!mapping) {
      failures.push(`${item.name}: registered facade has no component mapping`)
      continue
    }
    if (
      !Array.isArray(mapping.propMappings) ||
      mapping.propMappings.length === 0
    ) {
      failures.push(`${item.name}: component mapping has no prop contract`)
      continue
    }

    const facadeFile = item.files?.find((file) =>
      file.path.startsWith('src/facades/')
    )
    if (!facadeFile) {
      failures.push(`${item.name}: registry item has no facade source file`)
      continue
    }

    let propsByExport
    try {
      propsByExport = readFacadeProps(facadeFile.path)
    } catch (error) {
      failures.push(`${item.name}: ${error.message}`)
      continue
    }

    const documentedComponents = []
    const ignoredDocumentedExports = new Set(
      mapping.legacyDocumentationIgnoredExports || []
    )
    for (const componentSlug of mapping.applique || []) {
      try {
        documentedComponents.push(
          ...loadDocumentedProps(componentSlug).filter(
            (component) =>
              !ignoredDocumentedExports.has(component.exportName)
          )
        )
      } catch (error) {
        failures.push(`${item.name}: ${error.message}`)
      }
    }

    for (const documentedComponent of documentedComponents) {
      const acceptedProps = resolveFacadeProps(
        item,
        mapping,
        documentedComponent.exportName,
        propsByExport
      )
      if (!acceptedProps) {
        failures.push(
          `${item.name}: documented ${documentedComponent.exportName} has no matching callable facade export`
        )
        continue
      }

      for (const documentedProp of documentedComponent.props) {
        const contracts = mapping.propMappings.filter((propMapping) =>
          propMapping.from.some((source) =>
            sourceCoversProp(source, documentedProp)
          )
        )
        if (contracts.length === 0) {
          failures.push(
            `${item.name}: documented ${documentedComponent.exportName}.${documentedProp} is missing from the mapping contract`
          )
        } else if (
          contracts.some((contract) => resolvedKinds.has(contract.kind)) &&
          !acceptedProps.has(documentedProp)
        ) {
          failures.push(
            `${item.name}: mapped ${documentedComponent.exportName}.${documentedProp} is missing from its facade TypeScript API`
          )
        }
      }
    }

    const compatibility = item.meta.compatibility || {}
    const isTesting = compatibility.migrationStatus === 'testing'
    const localReviewMappings = reviewMappings(item.name)
    const effectiveReviewMappings = [...localReviewMappings]
    for (const dependencyName of item.registryDependencies || []) {
      if (facadesByName.has(dependencyName)) {
        effectiveReviewMappings.push(...reviewMappings(dependencyName))
      }
    }
    const unresolvedProps = compatibility.unresolvedProps || []

    if (!isTesting && localReviewMappings.length > 0) {
      failures.push(
        `${
          item.name
        }: non-testing facade has needs-review mappings: ${localReviewMappings
          .map((contract) => contract.id)
          .join(', ')}`
      )
    }
    if (!isTesting && unresolvedProps.length > 0) {
      failures.push(`${item.name}: non-testing facade declares unresolvedProps`)
    }
    if (isTesting && effectiveReviewMappings.length === 0) {
      failures.push(
        `${item.name}: testing facade has no mapped release blocker`
      )
    }
    if (isTesting && unresolvedProps.length === 0) {
      failures.push(
        `${item.name}: testing facade does not declare unresolvedProps`
      )
    }

    for (const contract of effectiveReviewMappings) {
      if (
        !unresolvedProps.some((label) =>
          unresolvedLabelMatches(label, contract)
        )
      ) {
        failures.push(
          `${item.name}: needs-review mapping ${contract.id} is absent from registry unresolvedProps`
        )
      }
    }
    for (const label of unresolvedProps) {
      if (
        !effectiveReviewMappings.some((contract) =>
          unresolvedLabelMatches(label, contract)
        )
      ) {
        failures.push(
          `${item.name}: registry unresolved prop "${label}" has no needs-review mapping`
        )
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Facade contract validation failed:\n- ${failures.join('\n- ')}`
    )
  }

  console.log(
    `[facade-contracts] ${facadeItems.length} facades have mapping coverage, source API coverage, and aligned release blockers.`
  )
  console.log(
    '[facade-contracts] Structural only: runtime precedence, callbacks, DOM behavior, and absent values still require component specs.'
  )
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
