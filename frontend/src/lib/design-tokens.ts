/**
 * Design Token System
 * Centralized TypeScript definitions for all design system values
 * Replaces scattered CSS variables with a single source of truth
 */

export const designTokens = {
  // Color System
  colors: {
    // Surface & Backgrounds
    surface: '#faf8f5',
    surfaceCard: '#ffffff',
    surfaceSunken: '#f5f3f0',
    surfaceHover: '#f0ede9',

    // Text & Ink
    ink: '#2d2420',
    inkSecondary: '#6b6359',
    inkPlaceholder: '#9d9391',

    // Borders & Dividers
    border: '#e5e1dc',
    borderLight: '#f0ede9',

    // Accent & Interactive
    accent: '#5b21b6',
    accentHover: '#7c3aed',
    accentActive: '#4c1d95',
    accentSubtle: '#ede9fe',

    // Role-based Colors
    roleAdmin: {
      bg: '#6d28d9',
      bgHover: '#7c3aed',
      text: '#f3e8ff',
      bgSubtle: '#ede9fe',
      border: '#c4b5fd',
    },
    roleTeacher: {
      bg: '#0d9488',
      bgHover: '#14b8a6',
      text: '#ccfbf1',
      bgSubtle: '#f0fdfa',
      border: '#99f6e4',
    },
    roleStudent: {
      bg: '#b45309',
      bgHover: '#d97706',
      text: '#fef3c7',
      bgSubtle: '#fffbeb',
      border: '#fde68a',
    },

    // Status Colors
    success: '#059669',
    successSubtle: '#d1fae5',
    warning: '#f59e0b',
    warningSubtle: '#fef3c7',
    danger: '#dc2626',
    dangerSubtle: '#fee2e2',
    info: '#0891b2',
    infoSubtle: '#cffafe',
  },

  // Typography System
  typography: {
    // Font Families (supporting RTL/LTR)
    fontFamilies: {
      display: 'Cairo, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      body: 'Cairo, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      code: 'Menlo, Monaco, "Courier New", monospace',
    },

    // Font Sizes
    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },

    // Font Weights
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    // Line Heights
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },

  // Spacing System (8px base unit)
  spacing: {
    '0': '0',
    '0.5': '0.125rem', // 2px
    '1': '0.25rem', // 4px
    '1.5': '0.375rem', // 6px
    '2': '0.5rem', // 8px
    '2.5': '0.625rem', // 10px
    '3': '0.75rem', // 12px
    '3.5': '0.875rem', // 14px
    '4': '1rem', // 16px
    '5': '1.25rem', // 20px
    '6': '1.5rem', // 24px
    '7': '1.75rem', // 28px
    '8': '2rem', // 32px
    '9': '2.25rem', // 36px
    '10': '2.5rem', // 40px
    '12': '3rem', // 48px
    '14': '3.5rem', // 56px
    '16': '4rem', // 64px
    '20': '5rem', // 80px
    '24': '6rem', // 96px
  },

  // Border Radius System
  radius: {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    full: '9999px',
  },

  // Shadow System
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  // Transitions & Animations
  transitions: {
    durations: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    timings: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Z-Index System
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    modal: 1050,
    tooltip: 1070,
  },

  // Breakpoints for Responsive Design
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

/**
 * Design Token Type Definitions
 * Enables type-safe token usage throughout the application
 */
export type DesignTokens = typeof designTokens;
export type ColorTokens = typeof designTokens.colors;
export type SpacingTokens = typeof designTokens.spacing;
export type TypographyTokens = typeof designTokens.typography;
export type ShadowTokens = typeof designTokens.shadows;
export type RadiusTokens = typeof designTokens.radius;
export type TransitionTokens = typeof designTokens.transitions;
export type ZIndexTokens = typeof designTokens.zIndex;
export type BreakpointTokens = typeof designTokens.breakpoints;

/**
 * Helper functions for common token access patterns
 */

/**
 * Get a token value safely with fallback
 */
export function getToken<T extends keyof DesignTokens>(
  category: T,
  key: string
): string | undefined {
  const tokens = designTokens[category];
  return (tokens as any)?.[key];
}

/**
 * Get color token by role (admin, teacher, student)
 */
export function getRoleColors(role: 'admin' | 'teacher' | 'student') {
  const roleKey = `role${role.charAt(0).toUpperCase() + role.slice(1)}` as keyof ColorTokens;
  return designTokens.colors[roleKey] as any;
}

/**
 * Create CSS variable from token value
 */
export function createCSSVariable(category: keyof DesignTokens, key: string): string {
  const suffix = key.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `var(--color-${category}-${suffix})`;
}
