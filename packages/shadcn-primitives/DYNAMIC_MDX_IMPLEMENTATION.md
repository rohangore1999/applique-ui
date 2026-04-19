# Dynamic MDX File Selection - Implementation Summary

## What Changed

Modified the dev server to support dynamic MDX file selection based on a third argument.

### Before
```bash
npm run start shadcn-primitives         # Always loads index.mdx
npm run start shadcn-primitives button  # Still loads index.mdx (argument ignored)
```

### After
```bash
npm run start shadcn-primitives button    # Loads button.mdx
npm run start shadcn-primitives checkbox  # Loads checkbox.mdx
npm run start shadcn-primitives          # Falls back to index.mdx
```

---

## Modified File

**`tools/start-dev-server.js`**

### Changes Made

1. **Added `subComponent` parameter** (line 23):
   ```javascript
   const subComponent = process.argv[3] // Optional: button, checkbox, etc.
   ```

2. **Made `entryFile` dynamic** (line 25):
   ```javascript
   let entryFile = './docs/index.mdx' // Changed from const to let
   ```

3. **Updated `start()` function** to accept `subComponent` and dynamically select MDX file:
   ```javascript
   async function start(component, subComponent, port = ...) {
     // ... existing component selection logic ...
     
     // NEW: Dynamic MDX file selection
     if (subComponent) {
       const subComponentMdx = `./docs/${subComponent}.mdx`
       const subComponentPath = Path.resolve(getPackageDir(component), subComponentMdx)
       if (Fs.existsSync(subComponentPath)) {
         entryFile = subComponentMdx
         console.log(`Starting dev server for ${component} - ${subComponent}`)
       } else {
         console.log(`Warning: ${subComponent}.mdx not found, falling back to index.mdx`)
         console.log(`Starting dev server for ${component}`)
       }
     } else {
       console.log('Starting dev server for ' + component)
     }
     
     createComponentsFile(component)
     startWebpackDevServer(component, port)
   }
   ```

---

## Created Files

**`packages/shadcn-primitives/docs/button.mdx`**
```mdx
import ButtonShowcase from './ButtonShowcase'

<ButtonShowcase />
```

**`packages/shadcn-primitives/docs/checkbox.mdx`**
```mdx
import CheckboxShowcase from './CheckboxShowcase'

<CheckboxShowcase />
```

**`packages/shadcn-primitives/docs/index.mdx`** (kept as fallback)
```mdx
import CheckboxShowcase from './CheckboxShowcase'

<CheckboxShowcase />
```

---

## How It Works

### Command Pattern
```bash
npm run start <package> [subcomponent]
```

### Logic Flow

1. **Parse arguments**:
   - `process.argv[2]` = package name (`shadcn-primitives`)
   - `process.argv[3]` = optional subcomponent (`button`, `checkbox`, etc.)

2. **Check if subcomponent MDX exists**:
   - Looks for `./docs/${subComponent}.mdx`
   - If exists: Use it as `entryFile`
   - If not exists: Fall back to `./docs/index.mdx`

3. **Console output**:
   - With subcomponent: `"Starting dev server for shadcn-primitives - button"`
   - Without subcomponent: `"Starting dev server for shadcn-primitives"`
   - Not found: `"Warning: xyz.mdx not found, falling back to index.mdx"`

---

## Testing Results

### ✅ Test 1: Button Component
```bash
npm run start shadcn-primitives button
```
**Output**: "Starting dev server for shadcn-primitives - button"
**Result**: Successfully loads `button.mdx` and displays ButtonShowcase
**Status**: ✅ PASSED

### ✅ Test 2: Checkbox Component
```bash
npm run start shadcn-primitives checkbox
```
**Output**: "Starting dev server for shadcn-primitives - checkbox"
**Result**: Successfully loads `checkbox.mdx` and displays CheckboxShowcase
**Status**: ✅ PASSED

### ✅ Test 3: Fallback to index.mdx
```bash
npm run start shadcn-primitives
```
**Output**: "Starting dev server for shadcn-primitives"
**Result**: Successfully loads `index.mdx` (CheckboxShowcase by default)
**Status**: ✅ PASSED

---

## Benefits

1. **Component Isolation**: Each primitive component has its own MDX file
2. **Easy Testing**: Switch between components with a single command
3. **Scalable**: Add new components by simply creating a new MDX file
4. **Backward Compatible**: Falls back to `index.mdx` if no subcomponent specified
5. **No Code Changes**: Existing components continue to work without changes

---

## Usage Examples

```bash
# View button showcase
npm run start shadcn-primitives button

# View checkbox showcase
npm run start shadcn-primitives checkbox

# View default (index.mdx)
npm run start shadcn-primitives

# Future: input showcase
npm run start shadcn-primitives input

# Future: select showcase
npm run start shadcn-primitives select
```

---

## File Structure

```
packages/shadcn-primitives/docs/
├── button.mdx           → ButtonShowcase
├── checkbox.mdx         → CheckboxShowcase
├── index.mdx            → Default fallback (currently CheckboxShowcase)
├── ButtonShowcase.tsx   → Button examples component
├── CheckboxShowcase.tsx → Checkbox examples component
└── Overview.mdx         → Package overview
```

---

## Future Enhancements

1. **Auto-discovery**: List all available MDX files in interactive mode
2. **Interactive subcomponent selection**: If invalid subcomponent, show available options
3. **Multi-component view**: Support viewing multiple components at once
4. **Hot MDX switching**: Switch between MDX files without restarting server

---

## Console Output Examples

### Button
```
> node tools/start-dev-server shadcn-primitives button

Starting dev server for shadcn-primitives - button
webpack 5.74.0 compiled successfully in 42s
```

### Checkbox
```
> node tools/start-dev-server shadcn-primitives checkbox

Starting dev server for shadcn-primitives - checkbox
webpack 5.74.0 compiled successfully in 43s
```

### Invalid Subcomponent
```
> node tools/start-dev-server shadcn-primitives input

Warning: input.mdx not found, falling back to index.mdx
Starting dev server for shadcn-primitives
webpack 5.74.0 compiled successfully in 41s
```

---

## Implementation Status

✅ **COMPLETED** - Dynamic MDX selection working for both button and checkbox components
✅ **TESTED** - All three scenarios verified and working
✅ **DOCUMENTED** - Complete documentation provided
✅ **BACKWARD COMPATIBLE** - Existing workflows unchanged

---

## Next Steps

When adding new primitive components:

1. Create the component in `src/` (e.g., `src/input.tsx`)
2. Export from `src/index.ts`
3. Create showcase component (e.g., `docs/InputShowcase.tsx`)
4. Create MDX file (e.g., `docs/input.mdx`)
5. Test: `npm run start shadcn-primitives input`

That's it! No dev server modifications needed.
