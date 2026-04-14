/**
 * Fuerza Home Services — Spacing, Radius & Shadow Design Tokens
 *
 * Consistent spatial rhythm and elevation system.
 */
import { Platform, ViewStyle } from 'react-native';

// ─── Spacing Scale ───────────────────────────────────────────────────────────

export const Spacing = {
    /** 4px — tight inline gaps, icon margins */
    xs: 4,
    /** 8px — compact element spacing */
    sm: 8,
    /** 12px — standard inner padding */
    md: 12,
    /** 16px — default container padding */
    lg: 16,
    /** 20px — comfortable section spacing */
    xl: 20,
    /** 24px — prominent section gaps */
    '2xl': 24,
    /** 32px — large section dividers */
    '3xl': 32,
    /** 40px — major layout gaps */
    '4xl': 40,
    /** 48px — screen-level spacing */
    '5xl': 48,
    /** 64px — hero/header spacing */
    '6xl': 64,

    // ── Legacy aliases ──
    /** @deprecated use `Layout.screenPaddingH` */
    screenPaddingH: 16,
    /** @deprecated use `Layout.screenPaddingV` */
    screenPaddingV: 24,
    /** @deprecated use `Layout.cardPadding` */
    cardPadding: 16,
    /** @deprecated use `'2xl'` */
    xxl: 32,
} as const;

// ─── Layout Constants ────────────────────────────────────────────────────────

export const Layout = {
    /** Horizontal screen padding */
    screenPaddingH: 16,
    /** Vertical screen padding */
    screenPaddingV: 24,
    /** Card internal padding */
    cardPadding: 16,
    /** Card internal padding large */
    cardPaddingLg: 20,
    /** Minimum touch target (accessibility) */
    hitSlop: 44,
    /** Tab bar height */
    tabBarHeight: 64,
    /** Header height */
    headerHeight: 56,
    /** Bottom sheet handle height */
    bottomSheetHandle: 24,
    /** Max content width (tablets) */
    maxContentWidth: 560,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const Radius = {
    /** 6px — subtle rounding (badges, chips) */
    sm: 6,
    /** 10px — standard cards, inputs */
    md: 10,
    /** 16px — prominent cards, modals */
    lg: 16,
    /** 24px — pills, floating buttons */
    xl: 24,
    /** Full circle */
    full: 9999,
    /** @deprecated use `md` — kept for backward compat */
    default: 10,
} as const;

// ─── Shadows / Elevation ─────────────────────────────────────────────────────

const createShadow = (
    offsetY: number,
    opacity: number,
    radius: number,
    elevation: number
): ViewStyle => ({
    ...Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: offsetY },
            shadowOpacity: opacity,
            shadowRadius: radius,
        },
        android: {
            elevation,
        },
    }),
});

export const Shadow = {
    /** No shadow */
    none: {} as ViewStyle,

    /** Subtle card shadow — lists, cards */
    card: createShadow(1, 0.08, 4, 2),

    /** Medium shadow — dropdowns, popovers */
    medium: createShadow(2, 0.12, 8, 4),

    /** Strong shadow — modals, bottom sheets */
    modal: createShadow(4, 0.16, 16, 8),

    /** Floating shadow — FABs, floating CTAs */
    floating: createShadow(8, 0.2, 24, 12),
} as const;

// ─── Z-Index Layers ──────────────────────────────────────────────────────────

export const ZIndex = {
    base: 0,
    card: 1,
    sticky: 10,
    dropdown: 20,
    overlay: 30,
    modal: 40,
    toast: 50,
} as const;

export type SpacingToken = keyof typeof Spacing;
export type RadiusToken = keyof typeof Radius;
export type ShadowToken = keyof typeof Shadow;

// ─── Legacy Compat ───────────────────────────────────────────────────────────

/** @deprecated Use `Shadow` instead */
export const Elevation = {
    none: Shadow.none,
    low: Shadow.card,
    medium: Shadow.medium,
    high: Shadow.floating,
} as const;
