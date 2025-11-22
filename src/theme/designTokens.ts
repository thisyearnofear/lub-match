/**
 * UNIFIED DESIGN TOKENS
 * Single source of truth for all design decisions
 * Aligns with romantic + playful + accessible brand ethos
 */

// ============================================================================
// COLOR PALETTE - Semantic naming for brand consistency
// ============================================================================
export const colors = {
  // Primary: Romantic pink/rose gradient
  primary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    300: '#f472b6',
    400: '#ec4899',
    500: '#db2777',
    600: '#be185d',
  },

  // Secondary: Playful purple/blue
  secondary: {
    50: '#f3f0ff',
    100: '#ede9fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
  },

  // Semantic: Success/Warning/Error with consistent palette
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',

  // Neutral: For text, borders, backgrounds
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Dark mode support
  dark: {
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff',
  },

  // Semantic/Interactive states
  interactive: {
    hover: 'rgba(236, 72, 153, 0.1)',
    active: 'rgba(236, 72, 153, 0.2)',
    disabled: 'rgba(107, 114, 128, 0.4)',
  },
} as const;

// ============================================================================
// TYPOGRAPHY - Consistent text hierarchy and readability
// ============================================================================
export const typography = {
  fontFamily: {
    display: "var(--font-playfair-display), serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    mono: "'Monaco', 'Menlo', monospace",
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
} as const;

// ============================================================================
// SPACING - Consistent rhythm and alignment
// ============================================================================
export const spacing = {
  0: '0px',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
} as const;

// ============================================================================
// BORDER RADIUS - Playful, not clinical
// ============================================================================
export const borderRadius = {
  xs: '0.25rem', // Minimal, crisp
  sm: '0.375rem',
  base: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem', // Primary interaction radius - romantic, playful
  full: '9999px', // Fully rounded buttons
} as const;

// ============================================================================
// SHADOWS - Layering without being heavy
// ============================================================================
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  glow: '0 0 20px rgba(236, 72, 153, 0.3)',
  'glow-lg': '0 0 40px rgba(236, 72, 153, 0.4)',
} as const;

// ============================================================================
// ANIMATIONS & TRANSITIONS - Playful motion that feels responsive
// ============================================================================
export const transitionDurations = {
  fastest: '50ms',
  faster: '100ms',
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '700ms',
} as const;

export const transitionEasings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

export const transitions = {
  duration: transitionDurations,
  easing: transitionEasings,
  property: (
    duration: keyof typeof transitionDurations,
    easing: keyof typeof transitionEasings = 'easeInOut'
  ) => `all ${transitionDurations[duration]} ${transitionEasings[easing]}`,
} as const;

export const animations = {
  // Framer Motion variants - reusable animation patterns
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  },

  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  },

  scaleIn: {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
  },

  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity },
    },
  },

  bounce: {
    animate: {
      y: [0, -10, 0],
      transition: { duration: 1, repeat: Infinity },
    },
  },

  heartbeat: {
    animate: {
      scale: [1, 1.1, 1],
      transition: { duration: 0.6, repeat: Infinity, delay: 0.1 },
    },
  },

  shimmer: {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: { duration: 2, repeat: Infinity, ease: 'linear' },
    },
  },

  float: {
    animate: {
      y: [0, -10, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
  },

  slideInRight: {
    hidden: { x: 100, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.4 } },
  },

  slideInLeft: {
    hidden: { x: -100, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.4 } },
  },
} as const;

// ============================================================================
// COMPONENT VARIANTS - Pre-configured design patterns
// ============================================================================
export const componentVariants = {
  button: {
    primary: {
      background: `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.primary[600]} 100%)`,
      color: colors.neutral[0],
      hoverOpacity: 0.9,
      shadow: shadows.md,
    },
    secondary: {
      background: `linear-gradient(135deg, ${colors.secondary[400]} 0%, ${colors.secondary[600]} 100%)`,
      color: colors.neutral[0],
      hoverOpacity: 0.9,
      shadow: shadows.md,
    },
    ghost: {
      background: 'transparent',
      color: colors.primary[400],
      border: `2px solid ${colors.primary[400]}`,
      hoverBackground: colors.interactive.hover,
    },
    disabled: {
      background: colors.neutral[200],
      color: colors.neutral[400],
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },

  card: {
    base: {
      background: colors.neutral[0],
      border: `1px solid ${colors.neutral[200]}`,
      borderRadius: borderRadius.lg,
      shadow: shadows.sm,
      transition: transitions.property('base'),
    },
    hovered: {
      shadow: shadows.md,
      border: `1px solid ${colors.primary[300]}`,
    },
    selected: {
      borderColor: colors.primary[400],
      boxShadow: `inset 0 0 0 2px ${colors.primary[400]}`,
    },
  },

  input: {
    base: {
      background: colors.neutral[0],
      border: `1px solid ${colors.neutral[300]}`,
      borderRadius: borderRadius.md,
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: typography.fontSize.base,
      transition: transitions.property('base'),
    },
    focus: {
      borderColor: colors.primary[400],
      boxShadow: `0 0 0 3px ${colors.primary[50]}, 0 0 0 1px ${colors.primary[400]}`,
    },
    error: {
      borderColor: colors.error,
      boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.1)`,
    },
  },

  notification: {
    success: {
      background: `${colors.success}15`,
      border: `1px solid ${colors.success}40`,
      color: colors.success,
      icon: '✓',
    },
    warning: {
      background: `${colors.warning}15`,
      border: `1px solid ${colors.warning}40`,
      color: colors.warning,
      icon: '⚠',
    },
    error: {
      background: `${colors.error}15`,
      border: `1px solid ${colors.error}40`,
      color: colors.error,
      icon: '✕',
    },
    info: {
      background: `${colors.secondary[400]}15`,
      border: `1px solid ${colors.secondary[400]}40`,
      color: colors.secondary[600],
      icon: 'ℹ',
    },
  },
} as const;

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX SCALE - Predictable stacking context
// ============================================================================
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  backdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  notification: 800,
  floating: 900,
  max: 9999,
} as const;

// ============================================================================
// ACCESSIBILITY - Inclusive defaults
// ============================================================================
export const a11y = {
  focusRing: `0 0 0 3px ${colors.primary[100]}, 0 0 0 1px ${colors.primary[400]}`,
  focusRingOffset: spacing[2],
  reduceMotionPreference: '@media (prefers-reduced-motion: reduce)',
  minTouchTarget: '44px', // WCAG minimum for touch targets
} as const;

// ============================================================================
// UTILITY HELPERS
// ============================================================================
export const createGradient = (from: string, to: string) =>
  `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;

export const createFocusStyles = () => ({
  outline: 'none',
  boxShadow: a11y.focusRing,
});

export const createDisabledStyles = () => ({
  opacity: 0.6,
  cursor: 'not-allowed',
  pointerEvents: 'none',
});

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  animations,
  componentVariants,
  breakpoints,
  zIndex,
  a11y,
} as const;
