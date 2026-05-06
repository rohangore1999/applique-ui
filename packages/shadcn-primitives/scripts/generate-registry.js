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

// Rewrite package-relative imports to the consumer's alias paths
// e.g. './utils' → '@/lib/utils' (matches shadcn's components.json alias convention)
const buttonContent = read('button.tsx').replace(
  /from ['"]\.\/utils['"]/g,
  "from '@/lib/utils'"
)

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
      path: 'components/ui/button.tsx',
      content: buttonContent,
      type: 'registry:ui',
    },
  ],
})

console.log('[registry] done')
