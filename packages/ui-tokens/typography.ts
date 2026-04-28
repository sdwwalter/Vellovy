// packages/ui-tokens/typography.ts

export const typography = {
  fontFamily: {
    display: '"Playfair Display", Georgia, serif',     // Títulos premium
    body:    '"DM Sans", system-ui, sans-serif',       // Corpo e UI
    mono:    '"Fira Code", monospace',                  // Código/valores
  },
  scale: {
    xs:   { size: '0.75rem',  weight: 400, lineHeight: '1rem' },
    sm:   { size: '0.875rem', weight: 400, lineHeight: '1.25rem' },
    base: { size: '1rem',     weight: 400, lineHeight: '1.5rem' },
    lg:   { size: '1.125rem', weight: 500, lineHeight: '1.75rem' },
    xl:   { size: '1.25rem',  weight: 600, lineHeight: '1.75rem' },
    '2xl': { size: '1.5rem',  weight: 700, lineHeight: '2rem' },
    '3xl': { size: '1.875rem', weight: 700, lineHeight: '2.25rem' },
    '4xl': { size: '2.25rem', weight: 800, lineHeight: '2.5rem' },
  },
} as const;

export type Typography = typeof typography;
