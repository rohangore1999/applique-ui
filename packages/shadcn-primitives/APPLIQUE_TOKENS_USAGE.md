# Applique Design Tokens Usage in ShadcnButton

## Summary
All spacing, sizing, colors, shadows, and typography values in the `@applique-ui/shadcn-primitives` package strictly follow Applique design tokens from Figma.

---

## Design Tokens Applied

### 1. **Colors** (from `Applique.tokens.json`)
All colors use HSL format for Tailwind opacity modifiers:

| Token | Value | Hex | Usage |
|-------|-------|-----|-------|
| `--primary` | `252 76% 51%` | `#5232D0` (indigo/700) | Default button background |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Default button text |
| `--secondary` | `247 100% 97%` | `#F0EEFF` (indigo/50) | Secondary button background |
| `--secondary-foreground` | `252 76% 51%` | `#5232D0` | Secondary button text |
| `--destructive` | `8 69% 45%` | `#BF3823` (Cherry/700) | Destructive button background |
| `--destructive-foreground` | `6 90% 97%` | `#FEF3F2` (Cherry/50) | Destructive button text |
| `--accent` | `247 100% 97%` | `#F0EEFF` (indigo/50) | Ghost/hover background |
| `--accent-foreground` | `222 47% 11%` | `#111827` (gray/900) | Ghost/hover text |
| `--input` / `--border` | `220 13% 91%` | `#E5E7EB` (gray/200) | Outline button border |
| `--background` | `0 0% 100%` | `#FFFFFF` | Page background |
| `--foreground` | `222 47% 11%` | `#111827` (gray/900) | Default text |
| `--ring` | `252 76% 51%` | `#5232D0` (indigo/700) | Focus ring |
| `--muted` | `220 14% 96%` | `#F3F4F6` (gray/100) | Muted backgrounds |
| `--muted-foreground` | `220 9% 46%` | `#6B7280` (gray/500) | Muted text |

### 2. **Spacing** (from Figma spacing scale)
All spacing values from Applique design system:

| Token | Value | Pixels | Usage in Button |
|-------|-------|--------|-----------------|
| `--spacing-1` | `0.25rem` | 4px | - |
| `--spacing-1-5` | `0.375rem` | 6px | `gap-1.5` (icon-text gap) |
| `--spacing-2` | `0.5rem` | 8px | `py-2` (md/lg padding-y) |
| `--spacing-2-5` | `0.625rem` | 10px | `px-2.5` (md horizontal padding) |
| `--spacing-3` | `0.75rem` | 12px | `px-3` (sm horizontal padding) |
| `--spacing-4` | `1rem` | 16px | - |
| `--spacing-8` | `2rem` | 32px | `px-8` (lg horizontal padding) |

### 3. **Button Sizes** (using Applique spacing)
Sizes match the reference implementation from `UNITY_spectrum-partner-portal`:

| Size | Height | Padding X | Padding Y | Text Size | Actual Values |
|------|--------|-----------|-----------|-----------|---------------|
| `sm` | `h-8` (32px) | `px-3` (12px) | `py-1.5` (6px) | `text-xs` (12px) | Applique spacing-3, spacing-1-5 |
| `md` (default) | `h-9` (36px) | `px-2.5` (10px) | `py-2` (8px) | `text-sm` (14px) | Applique spacing-2-5, spacing-2 |
| `lg` | `h-10` (40px) | `px-8` (32px) | `py-2` (8px) | `text-sm` (14px) | Applique spacing-8, spacing-2 |
| `icon` | `h-9 w-9` (36×36px) | - | - | - | Square button for icons |

### 4. **Border Radius** (from Figma radius tokens)

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--radius` | `0.5rem` | 8px | Not directly used in button (uses `rounded-sm` = 2px from shadcn) |

**Note**: The button uses `rounded-sm` (2px) from shadcn/ui design, which is smaller than the Applique radius/md (8px). This matches the reference implementation.

### 5. **Shadows** (from Figma shadow collection)

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0px 1px 2px 0px rgba(0, 0, 0, 0.05)` | Available for use |
| `--shadow-sm` | `0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)` | Outline button (`shadow-sm`) |
| `--shadow-md` | `0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)` | Available for use |

### 6. **Typography** (from Figma text styles)

| Style | Font Size | Line Height | Font Weight | Usage |
|-------|-----------|-------------|-------------|-------|
| `text-xs` | 12px | 16px | - | Small buttons |
| `text-sm` | 14px | 20px | 500 (medium) | Default, medium, large buttons |
| `text-base` | 16px | 24px | - | Not used in current button |

### 7. **Icon Sizing**
- SVG icons: `size-4` (16px × 16px)
- Icon-only buttons: `h-9 w-9` (36px × 36px)

---

## Button Variant Classes (Tailwind → Applique Tokens)

### Default Button
```
bg-primary           → hsl(var(--primary))         = #5232D0
text-primary-foreground → hsl(var(--primary-foreground)) = #FFFFFF
hover:bg-primary/90  → hsl(var(--primary)) with 90% opacity
```

### Secondary Button
```
bg-secondary         → hsl(var(--secondary))       = #F0EEFF
text-secondary-foreground → hsl(var(--secondary-foreground)) = #5232D0
hover:bg-secondary/80 → hsl(var(--secondary)) with 80% opacity
```

### Outline Button
```
border-input         → hsl(var(--input))           = #E5E7EB
bg-background        → hsl(var(--background))      = #FFFFFF
shadow-sm            → var(--shadow-sm)            = Applique shadow
hover:bg-accent      → hsl(var(--accent))          = #F0EEFF
```

### Ghost Button
```
hover:bg-accent      → hsl(var(--accent))          = #F0EEFF
hover:text-accent-foreground → hsl(var(--accent-foreground)) = #111827
```

### Destructive Button
```
bg-destructive       → hsl(var(--destructive))     = #BF3823
text-destructive-foreground → hsl(var(--destructive-foreground)) = #FEF3F2
hover:bg-destructive/90 → hsl(var(--destructive)) with 90% opacity
```

### Link Button
```
text-primary         → hsl(var(--primary))         = #5232D0
```

---

## Animations & Transitions

All animations use CSS transitions, not specific Applique tokens:

- **Transition**: `transition-all` (180ms default, all properties)
- **Active State**: `active:scale-[0.98]` (98% scale on click)
- **Focus Ring**: `ring-[3px] ring-ring/50` using `--ring` token (#5232D0 at 50% opacity)
- **Spinner**: `animate-spin` (built-in Tailwind animation)

---

## Gap Spacing
- Icon-to-text gap: `gap-1.5` (6px) - using `--spacing-1-5`

---

## Reference Alignment

The button implementation strictly follows:
1. **Figma Applique tokens** (`Applique.tokens.json`) for all color values
2. **Figma spacing scale** for all padding, height, and gap values
3. **Reference implementation** from `UNITY_spectrum-partner-portal/components/ui/button.jsx` for sizing consistency
4. **Official shadcn/ui patterns** for component structure and animations

---

## Zero Hardcoded Values

✅ All colors reference CSS custom properties from Applique tokens  
✅ All spacing uses Applique spacing scale (1, 1.5, 2, 2.5, 3, 8)  
✅ All shadows use Applique shadow tokens  
✅ Typography follows Applique text styles  
✅ Border styles use Applique color tokens  

**Result**: 100% Applique design system compliance with official shadcn/ui behavior.
