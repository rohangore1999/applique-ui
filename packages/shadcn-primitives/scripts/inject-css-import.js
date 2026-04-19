#!/usr/bin/env node
/*
 * Prepends `import './styles.css'` (ESM) and `require('./styles.css')` (CJS)
 * to the built dist bundles so consumers get the CSS automatically when they
 * import from the package — no explicit `import '.../styles.css'` needed.
 *
 * Run after both rollup (JS) and tailwindcss (CSS) builds complete.
 */
const fs = require('fs')
const path = require('path')

const dist = path.join(__dirname, '..', 'dist')
const esm = path.join(dist, 'shadcn-primitives.esm.js')
const cjs = path.join(dist, 'shadcn-primitives.cjs.js')
const cssPath = path.join(dist, 'styles.css')

if (!fs.existsSync(cssPath)) {
  console.error('[inject-css] dist/styles.css missing — run `npm run build:css` first')
  process.exit(1)
}

const esmHeader = "import './styles.css';\n"
const cjsHeader = "require('./styles.css');\n"

for (const [p, hdr, label] of [
  [esm, esmHeader, 'ESM'],
  [cjs, cjsHeader, 'CJS'],
]) {
  if (!fs.existsSync(p)) {
    console.warn(`[inject-css] ${label} bundle missing at ${p}, skipping`)
    continue
  }
  const content = fs.readFileSync(p, 'utf8')
  if (content.startsWith(hdr)) {
    console.log(`[inject-css] ${label} already has CSS import, skipping`)
    continue
  }
  fs.writeFileSync(p, hdr + content)
  console.log(`[inject-css] prepended CSS import to ${label}`)
}
