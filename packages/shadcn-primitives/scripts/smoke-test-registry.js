#!/usr/bin/env node

/*
 * Installs the generated registry into an isolated Tailwind 3 + TypeScript
 * consumer using the real, pinned shadcn CLI. The fixture is created under the
 * operating system temporary directory and removed after the test.
 */

const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const SHADCN_CLI_VERSION = '4.16.0'
const packageDir = path.resolve(__dirname, '..')
const generatorPath = path.join(__dirname, 'generate-registry.js')

function assert(condition, message) {
  if (!condition) throw new Error(message)
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

function createConsumer(consumerDirectory) {
  writeJson(path.join(consumerDirectory, 'package.json'), {
    name: 'applique-registry-smoke',
    private: true,
    version: '0.0.0',
    type: 'module',
    dependencies: {
      react: '18.3.1',
      'react-dom': '18.3.1',
    },
    devDependencies: {
      '@types/react': '18.3.3',
      '@types/react-dom': '18.3.0',
      autoprefixer: '10.4.20',
      postcss: '8.4.41',
      tailwindcss: '3.4.17',
      typescript: '5.6.3',
      vite: '5.4.8',
    },
  })

  writeJson(path.join(consumerDirectory, 'components.json'), {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'new-york',
    rsc: false,
    tsx: true,
    tailwind: {
      config: 'tailwind.config.cjs',
      css: 'src/index.css',
      baseColor: 'slate',
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
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      skipLibCheck: true,
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
    path.join(consumerDirectory, 'tailwind.config.cjs'),
    `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
  )

  writeText(
    path.join(consumerDirectory, 'src/index.css'),
    `@tailwind base;
@tailwind components;
@tailwind utilities;
`
  )

  writeText(
    path.join(consumerDirectory, 'src/smoke.tsx'),
    `import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export function RegistrySmoke() {
  return (
    <div>
      <Button intent="outline">Registry button</Button>
      <Button asChild intent="link">
        <a href="/">Registry link</a>
      </Button>
      <Checkbox aria-label="Registry checkbox" defaultChecked />
    </div>
  )
}
`
  )
}

function assertInstalledConsumer(consumerDirectory) {
  for (const relativePath of [
    'src/lib/utils.ts',
    'src/components/ui/button.tsx',
    'src/components/ui/checkbox.tsx',
  ]) {
    assert(
      fs.existsSync(path.join(consumerDirectory, relativePath)),
      `shadcn did not install ${relativePath}`
    )
  }

  const buttonSource = fs.readFileSync(
    path.join(consumerDirectory, 'src/components/ui/button.tsx'),
    'utf8'
  )
  assert(
    buttonSource.includes('intent: {'),
    'installed Button is not the Applique registry source'
  )
  assert(
    buttonSource.includes("import { Slot } from '@radix-ui/react-slot'"),
    'installed Button does not implement asChild composition'
  )

  const compiledCss = fs.readFileSync(
    path.join(consumerDirectory, 'dist.css'),
    'utf8'
  )
  for (const utility of [
    '.border-outline-border',
    '.text-outline-foreground',
    '.rounded-xxs',
    '.h-9',
    '.px-2\\.5',
  ]) {
    assert(
      compiledCss.includes(utility),
      `Tailwind did not emit expected utility ${utility}`
    )
  }
}

async function main() {
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

    createConsumer(consumerDirectory)

    await run(
      'pnpm',
      [
        'dlx',
        `shadcn@${SHADCN_CLI_VERSION}`,
        'add',
        `${registryBaseUrl}/button.json`,
        `${registryBaseUrl}/checkbox.json`,
        '--yes',
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
        '--config',
        'tailwind.config.cjs',
        '--minify',
      ],
      { cwd: consumerDirectory }
    )

    assertInstalledConsumer(consumerDirectory)
    console.log(
      `[registry] smoke test passed with shadcn@${SHADCN_CLI_VERSION}`
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
