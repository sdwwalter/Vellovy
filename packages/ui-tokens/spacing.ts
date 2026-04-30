// packages/ui-tokens/spacing.ts
// Base 4px — consistente em todas as plataformas

export const spacing = {
  0:  '0',
  1:  '0.25rem',   // 4px
  2:  '0.5rem',    // 8px
  3:  '0.75rem',   // 12px
  4:  '1rem',      // 16px
  5:  '1.25rem',   // 20px
  6:  '1.5rem',    // 24px
  8:  '2rem',      // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
} as const;

export const radius = {
  sm:   '0.25rem',
  md:   '0.5rem',
  lg:   '0.75rem',
  xl:   '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

export const shadow = {
  sm:      '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md:      '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg:      '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl:      '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  premium: '0 4px 24px -4px rgba(123, 79, 142, 0.18)',
  glow:    '0 0 20px rgba(123, 79, 142, 0.15)',
} as const;

export const transition = {
  fast:   'all 0.15s ease',
  normal: 'all 0.25s ease',
  slow:   'all 0.4s ease',
  spring: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;
