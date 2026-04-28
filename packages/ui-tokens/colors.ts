// packages/ui-tokens/colors.ts
// Identidade Vellovy: Plum (roxo profundo) + Rose (rosé suave)
// FONTE ÚNICA DE VERDADE — todo componente consome daqui

export const colors = {
  // Brand primária — Plum (roxo profundo)
  primary: {
    50:  '#F5F0FF',
    100: '#EDE0FF',
    200: '#D9C0FF',
    300: '#BB8FEF',
    400: '#7B4F8E',  // ← Plum principal
    500: '#6A3D7A',
    600: '#572F65',
    700: '#432250',
    800: '#2C1654',  // ← Noir (sidebar, headers)
    900: '#1A0B35',
  },

  // Brand secundária — Rose (rosé suave)
  rose: {
    50:  '#FFF5F8',
    100: '#FFE8EF',
    200: '#FFD0DF',
    300: '#F4A7BC',
    400: '#C4879A',  // ← Rose principal
    500: '#B0707F',
    600: '#955A6A',
    700: '#7A4556',
    800: '#5E3040',
    900: '#3D1E2A',
  },

  // Neutros (cinza fria — não compete com o roxo)
  neutral: {
    0:   '#FFFFFF',
    50:  '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D1D1D6',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },

  // Semântica
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error:   '#EF4444',
    info:    '#3B82F6',
  },

  // Texto
  text: {
    primary:   '#2C1654',  // Noir — quase-preto com tom roxo
    secondary: '#6B5B7A',  // Txt-muted com identidade
    disabled:  '#A1A1AA',
    inverse:   '#FFFFFF',
    rose:      '#C4879A',  // Destaques suaves
  },

  // Superfícies
  surface: {
    page:    '#FAFAFA',
    card:    '#FFFFFF',
    soft:    '#FAF8FF',    // Lavender muito suave
    overlay: 'rgba(44, 22, 84, 0.45)',
  },
} as const;

export type Colors = typeof colors;
