/**
 * NetTapu Design System — Color Tokens
 *
 * Palette: Olive Green (#515D2B) + Charcoal + White
 * Professional, information-dense visual language aligned with the
 * NetTapu web brand (sahibinden-inspired).
 */
export const Colors = {
  light: {
    primary:       '#515d2b',   /* brand olive */
    primaryDark:   '#414a24',
    primaryLight:  '#8e9d3f',
    primaryBg:     '#f4f6ec',
    primaryMuted:  '#e5eaca',
    accent:        '#b8894d',   /* gold */
    accentBg:      '#fbf5ea',
    accentLight:   '#d6b474',
    background:    '#ffffff',
    surface:       '#ffffff',
    card:          '#ffffff',
    elevated:      '#ffffff',
    text:          '#1f1f1c',   /* ink-800 */
    textSecondary: '#3a3a35',   /* ink-600 */
    textMuted:     '#6b6b6b',
    textInverse:   '#ffffff',
    border:        '#e6e6e6',
    borderLight:   '#f0f0f0',
    error:         '#c0392b',
    errorBg:       '#fdecea',
    warning:       '#c07a1a',
    warningBg:     '#fef6e7',
    success:       '#16a34a',
    successBg:     '#f0fdf4',
    info:          '#1f4c8a',
    infoBg:        '#eaf1fb',
    overlay:       'rgba(17,17,16,0.45)',
    tabBar:        'rgba(255,255,255,0.96)',
    tabBarBorder:  'rgba(17,17,16,0.06)',
    skeleton:      '#f4f4f4',
    statusActive:  '#15803d',
    statusSold:    '#912415',
    statusDeposit: '#92520c',
    statusReserved:'#6d28d9',
    statusDraft:   '#6b6b6b',
    statusLive:    '#c0392b',
  },
  dark: {
    primary:       '#aebb66',   /* brand-300 (brighter on dark) */
    primaryDark:   '#8e9d3f',
    primaryLight:  '#ccd49b',
    primaryBg:     'rgba(174,187,102,0.08)',
    primaryMuted:  'rgba(174,187,102,0.15)',
    accent:        '#d6b474',
    accentBg:      'rgba(214,180,116,0.10)',
    accentLight:   '#e8d4a8',
    background:    '#121210',   /* ink-900 */
    surface:       '#1f1f1c',   /* ink-800 */
    card:          '#2c2c28',   /* ink-700 */
    elevated:      '#3a3a35',   /* ink-600 */
    text:          '#f6f6f5',
    textSecondary: '#d1d1cd',
    textMuted:     '#a9a9a2',
    textInverse:   '#1f1f1c',
    border:        '#3a3a35',
    borderLight:   'rgba(255,255,255,0.06)',
    error:         '#e6736a',
    errorBg:       'rgba(230,115,106,0.1)',
    warning:       '#e0a458',
    warningBg:     'rgba(224,164,88,0.1)',
    success:       '#4ade80',
    successBg:     'rgba(74,222,128,0.1)',
    info:          '#93b4e0',
    infoBg:        'rgba(147,180,224,0.1)',
    overlay:       'rgba(0,0,0,0.62)',
    tabBar:        'rgba(18,18,16,0.92)',
    tabBarBorder:  'rgba(255,255,255,0.06)',
    skeleton:      '#2c2c28',
    statusActive:  '#4ade80',
    statusSold:    '#e6736a',
    statusDeposit: '#e0a458',
    statusReserved:'#c084fc',
    statusDraft:   '#a9a9a2',
    statusLive:    '#e6736a',
  },
};

export type ThemeColors = typeof Colors.light;
