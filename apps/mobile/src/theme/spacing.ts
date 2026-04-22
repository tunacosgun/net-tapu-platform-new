/**
 * NetTapu Mobile — Spacing, Radius & Shadow Tokens
 *
 * 4pt base grid. Professional, precise spacing inspired by sahibinden/Linear.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,

  // Semantic
  screenPadding: 20,
  sectionGap: 32,
  cardPadding: 16,
  cardGap: 12,
  listGap: 12,
};

/**
 * Sharper, more professional radii — sahibinden-style
 */
export const BorderRadius = {
  xs: 3,
  sm: 5,
  md: 8,
  lg: 10,
  xl: 14,
  full: 9999,
};

/**
 * Tight, clean shadows — no heavy drop shadows
 */
export const Shadows = {
  xs: {
    shadowColor: '#17110F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#17110F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#17110F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#17110F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  xl: {
    shadowColor: '#17110F',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 14,
  },
  brand: {
    shadowColor: '#515D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  brandGlow: {
    shadowColor: '#515D2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
};
