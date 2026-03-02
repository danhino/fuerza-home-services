/**
 * Fuerza Home Services — Color Design Tokens
 *
 * Semantic color palette for light and dark themes.
 * Inspired by Uber/Taskrabbit visual language.
 */

// ─── Brand Primitives ────────────────────────────────────────────────────────

export const BrandColors = {
    navy: '#0F1923',
    orange: '#FF6B2C',
    orangeLight: '#FF8A56',
    orangeDark: '#E55A1B',
    white: '#FFFFFF',
    black: '#000000',
} as const;

// ─── Semantic Status Colors ──────────────────────────────────────────────────

export const StatusColors = {
    success: '#22C55E',
    successLight: '#DCFCE7',
    successDark: '#16A34A',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    infoDark: '#2563EB',
} as const;

// ─── Service Category Colors ────────────────────────────────────────────────

export const ServiceColors = {
    plumbing: '#3B82F6',
    electrical: '#F59E0B',
    hvac: '#22C55E',
    pool: '#06B6D4',
} as const;

// ─── Light Theme ─────────────────────────────────────────────────────────────

const LightColors = {
    // Core
    primary: BrandColors.navy,
    accent: BrandColors.orange,
    accentPressed: BrandColors.orangeDark,
    accentDisabled: '#FFB899',

    // Backgrounds
    background: '#F8F9FA',
    backgroundSecondary: '#F1F3F5',
    backgroundTertiary: '#E9ECEF',

    // Surfaces
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfacePressed: '#F1F3F5',
    surfaceDisabled: '#F8F9FA',

    // Text
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    textOnAccent: '#FFFFFF',
    textDisabled: '#D1D5DB',
    textLink: BrandColors.orange,

    // Borders
    border: '#E5E7EB',
    borderFocused: BrandColors.orange,
    borderError: '#EF4444',
    borderLight: '#F3F4F6',

    // Icons
    icon: '#6B7280',
    iconPrimary: '#111827',
    iconAccent: BrandColors.orange,
    iconInverse: '#FFFFFF',
    iconDisabled: '#D1D5DB',

    // Tab Bar
    tabBar: '#FFFFFF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: BrandColors.orange,

    // Overlays & Misc
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.25)',
    shimmer: '#E5E7EB',
    divider: '#F3F4F6',
    skeleton: '#E5E7EB',

    // Status
    ...StatusColors,

    // Service categories
    ...ServiceColors,

    // ── Legacy aliases (backward compat — prefer new names above) ──
    /** @deprecated use `textPrimary` */
    text: '#111827',
    /** @deprecated use `surface` */
    card: '#FFFFFF',
    /** @deprecated use `accent` */
    tint: BrandColors.orange,
} as const;

// ─── Dark Theme ──────────────────────────────────────────────────────────────

const DarkColors = {
    // Core
    primary: BrandColors.white,
    accent: BrandColors.orange,
    accentPressed: BrandColors.orangeLight,
    accentDisabled: '#7A3A1A',

    // Backgrounds
    background: '#0F1923',
    backgroundSecondary: '#162029',
    backgroundTertiary: '#1C2733',

    // Surfaces
    surface: '#1C2733',
    surfaceElevated: '#243341',
    surfacePressed: '#2D3D4D',
    surfaceDisabled: '#162029',

    // Text
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    textInverse: '#111827',
    textOnAccent: '#FFFFFF',
    textDisabled: '#4B5563',
    textLink: BrandColors.orangeLight,

    // Borders
    border: '#2D3D4D',
    borderFocused: BrandColors.orange,
    borderError: '#EF4444',
    borderLight: '#1C2733',

    // Icons
    icon: '#9CA3AF',
    iconPrimary: '#F9FAFB',
    iconAccent: BrandColors.orange,
    iconInverse: '#111827',
    iconDisabled: '#4B5563',

    // Tab Bar
    tabBar: '#0F1923',
    tabIconDefault: '#6B7280',
    tabIconSelected: BrandColors.orange,

    // Overlays & Misc
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
    shimmer: '#2D3D4D',
    divider: '#1C2733',
    skeleton: '#2D3D4D',

    // Status
    ...StatusColors,

    // Service categories
    ...ServiceColors,

    // ── Legacy aliases (backward compat — prefer new names above) ──
    /** @deprecated use `textPrimary` */
    text: '#F9FAFB',
    /** @deprecated use `surface` */
    card: '#1C2733',
    /** @deprecated use `accent` */
    tint: BrandColors.orange,
} as const;

// ─── Exports ─────────────────────────────────────────────────────────────────

export type ColorToken = keyof typeof LightColors;
export type ThemeColors = typeof LightColors;

export const Colors = {
    light: LightColors,
    dark: DarkColors,
    brand: BrandColors,
    status: StatusColors,
    service: ServiceColors,
} as const;

// ─── Legacy Compat (prefer new tokens above) ────────────────────────────────

/** @deprecated Use `BrandColors` or theme `colors.accent` instead */
export const Brand = {
    primary: '#0F1923',
    light: BrandColors.orange,
    success: StatusColors.success,
    warning: StatusColors.warning,
    info: '#3B82F6',
    danger: StatusColors.error,
} as const;

/** @deprecated Use theme `colors.*` tokens instead */
export const Palette = {
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    surface: '#F8F9FA',
    surfaceElevated: '#FFFFFF',
    border: '#E5E7EB',
    darkText: '#F9FAFB',
    darkBackground: '#0F1923',
    darkSurface: '#1C2733',
    darkBorder: '#2D3D4D',
} as const;
