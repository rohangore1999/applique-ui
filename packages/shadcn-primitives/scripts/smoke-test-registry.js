#!/usr/bin/env node

/*
 * Installs every source-bearing UI item from the generated registry into an
 * isolated React 19 + Tailwind 4 consumer using the pinned shadcn CLI.
 *
 * This catches missing registry dependencies, stale import aliases, incomplete
 * npm dependency metadata, TypeScript incompatibilities, and token/CSS issues
 * before the static registry is published.
 */

const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const SHADCN_CLI_VERSION = '4.16.0'
const REACT_VERSION = '19.2.8'
const REACT_TYPES_VERSION = '19.2.18'
const REACT_DOM_TYPES_VERSION = '19.2.4'
const TAILWIND_VERSION = '4.3.3'
const TYPESCRIPT_VERSION = '5.9.2'

const packageDir = path.resolve(__dirname, '..')
const manifestPath = path.join(packageDir, 'registry.json')
const generatorPath = path.join(__dirname, 'generate-registry.js')

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

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || packageDir,
      env: {
        ...process.env,
        CI: '1',
      },
      stdio: 'inherit',
    })

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
      item.type === 'registry:ui' &&
      Array.isArray(item.files) &&
      item.files.length > 0
  )
}

function consumerPathForTarget(target) {
  const aliases = {
    '@hooks/': 'src/hooks/',
    '@lib/': 'src/lib/',
    '@ui/': 'src/components/ui/',
  }

  for (const [alias, replacement] of Object.entries(aliases)) {
    if (target.startsWith(alias)) {
      return `${replacement}${target.slice(alias.length)}`
    }
  }

  throw new Error(`Smoke test does not understand registry target ${target}`)
}

function importPathForTarget(target) {
  if (target.startsWith('@ui/')) {
    return `@/components/ui/${target
      .slice('@ui/'.length)
      .replace(/\.tsx?$/, '')}`
  }
  if (target.startsWith('@hooks/')) {
    return `@/hooks/${target.slice('@hooks/'.length).replace(/\.tsx?$/, '')}`
  }
  if (target.startsWith('@lib/')) {
    return `@/lib/${target.slice('@lib/'.length).replace(/\.tsx?$/, '')}`
  }

  throw new Error(`Smoke test does not understand registry target ${target}`)
}

function createConsumer(consumerDirectory, manifest) {
  writeJson(path.join(consumerDirectory, 'package.json'), {
    name: 'applique-registry-smoke',
    private: true,
    version: '0.0.0',
    type: 'module',
    dependencies: {
      react: REACT_VERSION,
      'react-dom': REACT_VERSION,
    },
    devDependencies: {
      '@tailwindcss/cli': TAILWIND_VERSION,
      '@types/react': REACT_TYPES_VERSION,
      '@types/react-dom': REACT_DOM_TYPES_VERSION,
      tailwindcss: TAILWIND_VERSION,
      typescript: TYPESCRIPT_VERSION,
    },
  })

  writeJson(path.join(consumerDirectory, 'components.json'), {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'base-nova',
    rsc: false,
    tsx: true,
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
      ui: '@/components/ui',
      lib: '@/lib',
      hooks: '@/hooks',
    },
  })

  writeJson(path.join(consumerDirectory, 'tsconfig.json'), {
    compilerOptions: {
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
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src'],
  })

  writeText(
    path.join(consumerDirectory, 'src/index.css'),
    '@import "tailwindcss";\n'
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

  writeText(
    path.join(consumerDirectory, 'src/smoke.tsx'),
    `${imports.join('\n')}

export const registryModules = [
  ${moduleNames.join(',\n  ')},
]
`
  )
}

function assertInstalledConsumer(consumerDirectory, manifest) {
  const expectedPaths = new Set(['src/lib/utils.ts'])

  for (const item of sourceItems(manifest)) {
    for (const file of item.files) {
      expectedPaths.add(consumerPathForTarget(file.target))
    }
  }

  const hook = manifest.items.find((item) => item.name === 'use-mobile')
  for (const file of hook?.files || []) {
    expectedPaths.add(consumerPathForTarget(file.target))
  }

  for (const relativePath of expectedPaths) {
    const absolutePath = path.join(consumerDirectory, relativePath)
    assert(
      fs.existsSync(absolutePath),
      `shadcn did not install ${relativePath}`
    )

    if (!absolutePath.endsWith('.ts') && !absolutePath.endsWith('.tsx')) {
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
      !source.includes('dark: ".dark"') && !source.includes("dark: '.dark'"),
      `${relativePath} contains an unscoped .dark selector`
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
    ['color-primary', 'primary'],
    ['color-primary-foreground', 'primary-foreground'],
    ['color-outline-border', 'outline-border'],
    ['color-sidebar-ring', 'sidebar-ring'],
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
    /--primary\s*:\s*#5232d0\b/i.test(installedCss),
    'installed CSS does not contain the exact Applique primary token'
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
    !/hsl\s*\(\s*var\s*\(/i.test(installedCss),
    'installed CSS contains an obsolete hsl(var(...)) wrapper'
  )
  assert(
    !/--([a-z0-9-]+)\s*:\s*var\(\s*--\1\s*\)/i.test(installedCss),
    'installed CSS contains a circular Tailwind theme variable'
  )

  const compiledCss = fs.readFileSync(
    path.join(consumerDirectory, 'dist.css'),
    'utf8'
  )

  for (const expectedCss of [
    '--primary:#5232d0',
    '.bg-primary',
    '.text-primary-foreground',
    '.rounded-lg',
    'Hanken Grotesk Variable',
    '[data-applique-color-scheme=dark]',
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
}

async function main() {
  const manifest = readJson(manifestPath)
  const components = sourceItems(manifest)

  assert(
    components.length >= 61,
    `Expected at least 61 source-bearing UI items, found ${components.length}`
  )

  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'applique-registry-smoke-')
  )
  const hostDirectory = path.join(temporaryRoot, 'host')
  const registryDirectory = path.join(hostDirectory, 'registry')
  const consumerDirectory = path.join(temporaryRoot, 'consumer')
  fs.mkdirSync(hostDirectory, { recursive: true })
  fs.mkdirSync(consumerDirectory, { recursive: true })

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

    createConsumer(consumerDirectory, manifest)

    const itemUrls = components.map(
      (item) => `${registryBaseUrl}/${encodeURIComponent(item.name)}.json`
    )

    await run(
      'pnpm',
      [
        'dlx',
        `shadcn@${SHADCN_CLI_VERSION}`,
        'add',
        ...itemUrls,
        '--yes',
        '--overwrite',
        '--cwd',
        consumerDirectory,
      ],
      { cwd: consumerDirectory }
    )

    await run(
      'pnpm',
      ['exec', 'tsc', '--noEmit', '--project', 'tsconfig.json'],
      { cwd: consumerDirectory }
    )
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

    assertInstalledConsumer(consumerDirectory, manifest)
    console.log(
      `[registry] smoke test passed for ${components.length} components with shadcn@${SHADCN_CLI_VERSION}`
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
