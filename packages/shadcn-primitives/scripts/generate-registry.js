#!/usr/bin/env node
/*
 * Generates shadcn registry JSON files from source files in src/.
 *
 * Reads:
 *   src/tokens.css  → registry/applique-theme.json  (cssVars)
 *   src/utils.ts    → registry/utils.json            (lib file)
 *   src/button.tsx  → registry/button.json           (ui component)
 *
 * Run: node scripts/generate-registry.js
 */

const fs = require('fs')
const path = require('path')

const srcDir = path.join(__dirname, '..', 'src')
const outDir = path.join(__dirname, '..', '..', '..', 'docs', 'registry')

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

// ─── Helpers ────────────────────────────────────────────────────────────────

function read(file) {
  return fs.readFileSync(path.join(srcDir, file), 'utf8')
}

function write(file, data) {
  const dest = path.join(outDir, file)
  fs.writeFileSync(dest, JSON.stringify(data, null, 2) + '\n')
  console.log(`[registry] wrote ${file}`)
}

/*
 * Parses CSS custom properties out of a :root { } block.
 * Returns { "--var-name": "value", ... }
 */
function parseCssVars(css) {
  const vars = {}
  // Strip comments
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rootMatch = stripped.match(/:root\s*\{([\s\S]*?)\}/)
  if (!rootMatch) return vars

  const lines = rootMatch[1].split('\n')
  for (const line of lines) {
    const match = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?)\s*;/)
    if (match) {
      vars[match[1]] = match[2].trim()
    }
  }
  return vars
}

// ─── 1. applique-theme.json ──────────────────────────────────────────────────

const tokensCss = read('tokens.css')
const cssVars = parseCssVars(tokensCss)

write('applique-theme.json', {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'applique-theme',
  type: 'registry:theme',
  cssVars: {
    light: cssVars,
  },
})

// ─── 2. utils.json ───────────────────────────────────────────────────────────

const utilsContent = read('utils.ts')

write('utils.json', {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'utils',
  type: 'registry:lib',
  dependencies: ['clsx', 'tailwind-merge'],
  files: [
    {
      path: 'lib/utils.ts',
      content: utilsContent,
      type: 'registry:lib',
    },
  ],
})

// ─── 3. button.json ──────────────────────────────────────────────────────────

/*
 * Converts TSX source to JSX for consumers with tsx:false in components.json.
 * Without this the shadcn CLI falls back to its own vanilla button when it
 * sees a .tsx file but the project is configured for .jsx.
 */
function tsxToJsx(content) {
  return content
    // rewrite package-relative import to consumer alias
    .replace(/from ['"]\.\/utils['"]/g, "from '@/lib/utils'")
    // remove TS-only import specifiers: `import { cva, type VariantProps }` → `import { cva }`
    .replace(/,\s*type\s+\w+/g, '')
    // remove `export interface ...` blocks (multi-line, ends at closing `}`)
    .replace(/^export interface[\s\S]*?^\}/m, '')
    // remove generic type params from forwardRef: `forwardRef<A, B>(` → `forwardRef(`
    .replace(/forwardRef<[^>]+>\(/g, 'forwardRef(')
    // remove inline TS types from destructured params: `{ className, intent, size, ...props }: ButtonProps`
    .replace(/\}\s*:\s*\w+Props\b/g, '}')
    // collapse multiple blank lines left behind by removed blocks
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n'
}

const buttonContent = tsxToJsx(read('button.tsx'))

write('button.json', {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'button',
  type: 'registry:ui',
  dependencies: ['class-variance-authority'],
  registryDependencies: [
    'https://rohangore1999.github.io/applique-ui/registry/applique-theme.json',
    'https://rohangore1999.github.io/applique-ui/registry/utils.json',
  ],
  files: [
    {
      path: 'components/ui/button.jsx',
      content: buttonContent,
      type: 'registry:ui',
      target: 'components/ui/button.jsx',
    },
  ],
})

console.log('[registry] done')
