/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{ts,tsx}',
    './packages/shadcn-primitives/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Colors use the <alpha-value> placeholder so Tailwind opacity modifiers
      // (e.g. bg-primary/90) work correctly with CSS custom properties.
      colors: {
        border:      'hsl(var(--border, var(--aui-border)) / <alpha-value>)',
        input:       'hsl(var(--input, var(--aui-input)) / <alpha-value>)',
        ring:        'hsl(var(--ring, var(--aui-ring)) / <alpha-value>)',
        background:  'hsl(var(--background, var(--aui-background)) / <alpha-value>)',
        foreground:  'hsl(var(--foreground, var(--aui-foreground)) / <alpha-value>)',
        primary: {
          DEFAULT:    'hsl(var(--primary, var(--aui-primary)) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground, var(--aui-primary-foreground)) / <alpha-value>)',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary, var(--aui-primary)) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground, var(--aui-primary-foreground)) / <alpha-value>)',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive, var(--aui-destructive)) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground, var(--aui-destructive-foreground)) / <alpha-value>)',
        },
        warning: {
          DEFAULT:    'hsl(var(--aui-warning) / <alpha-value>)',
          foreground: 'hsl(var(--aui-warning-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT:    'hsl(var(--aui-success) / <alpha-value>)',
          foreground: 'hsl(var(--aui-success-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted, var(--aui-muted)) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground, var(--aui-muted-foreground)) / <alpha-value>)',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent, var(--aui-accent)) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground, var(--aui-accent-foreground)) / <alpha-value>)',
        },
        'outline-border': 'hsl(var(--outline-border) / <alpha-value>)',
        'outline-foreground': 'hsl(var(--outline-foreground) / <alpha-value>)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius, var(--aui-radius))',
        lg:      'var(--radius, var(--aui-radius))',
        md:      'calc(var(--radius, var(--aui-radius)) - 2px)',
        sm:      'calc(var(--radius, var(--aui-radius)) - 4px)',
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
      },
      spacing: {
        '1': 'var(--spacing-1)',
        '1.5': 'var(--spacing-1-5)',
        '2': 'var(--spacing-2)',
        '2.5': 'var(--spacing-2-5)',
        '3': 'var(--spacing-3)',
        '4': 'var(--spacing-4)',
        '5': 'var(--spacing-5)',
        '6': 'var(--spacing-6)',
        '8': 'var(--spacing-8)',
        '10': 'var(--spacing-10)',
        '12': 'var(--spacing-12)',
        '16': 'var(--spacing-16)',
        '32': 'var(--spacing-32)',
      },
      scale: {
        '98': '0.98',
      },
      ringOffsetColor: {
        background: 'hsl(var(--background, var(--aui-background)))',
      },
      keyframes: {
        'button-press': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':       { transform: 'scale(0.97)' },
        },
      },
      animation: {
        'button-press': 'button-press 150ms ease-in-out',
      },
    },
  },
  plugins: [],
}
