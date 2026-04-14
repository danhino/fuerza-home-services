/**
 * stitchTokens.ts
 *
 * Exact design tokens extracted from the Stitch project
 * "Fuerza Home Services Layout" (ID 17258155030714227124).
 *
 * Source: tailwind.config inside the generated HTML export.
 *   primary:          "#137fec"
 *   background-light: "#f6f7f8"
 *   background-dark:  "#101922"
 *   font:             Inter
 *   roundness:        ROUND_EIGHT  →  DEFAULT 4, lg 8, xl 12, full 9999
 *   saturation:       3
 *   colorMode:        LIGHT
 *
 * Text palette colours come from the inline Tailwind classes in the
 * generated markup (text-[#0d141b], text-[#4c739a], etc.).
 */

// ── Colours ─────────────────────────────────────────────
export const StitchColors = {
    /** Brand primary — buttons, links, active accents */
    primary: '#137fec',
    /** 10 % opacity tint of primary (badge backgrounds) */
    primaryTint: 'rgba(19,127,236,0.10)',
    /** 50 % opacity tint of primary (hover borders — not used in RN) */
    primaryHalf: 'rgba(19,127,236,0.50)',

    /** Emerald accent — professional / technician surfaces */
    emerald100: '#D1FAE5',
    emerald700: '#047857',

    /** Light-mode background */
    bgLight: '#f6f7f8',
    /** Dark-mode background */
    bgDark: '#101922',

    /** Card / surface white */
    surface: '#ffffff',

    /** Primary text */
    textPrimary: '#0d141b',
    /** Secondary / muted text */
    textSecondary: '#4c739a',

    /** Card border */
    border: '#e2e8f0', // slate-200
} as const;

// ── Typography ──────────────────────────────────────────
export const StitchTypography = {
    /** Brand name — "Fuerza" */
    brand: {
        fontSize: 24,
        fontWeight: '800' as const,        // font-extrabold
        letterSpacing: -0.5,               // tracking-tight
        color: StitchColors.textPrimary,
    },
    /** Welcome heading — "Welcome to Fuerza" */
    h1: {
        fontSize: 30,                      // text-3xl
        fontWeight: '700' as const,        // font-bold
        letterSpacing: -0.5,
        color: StitchColors.textPrimary,
    },
    /** Card title — "I need a service" */
    h3: {
        fontSize: 20,                      // text-xl
        fontWeight: '700' as const,
        color: StitchColors.textPrimary,
    },
    /** Body / subtitle */
    body: {
        fontSize: 16,                      // text-base
        fontWeight: '400' as const,
        lineHeight: 24,                    // leading-relaxed
        color: StitchColors.textSecondary,
    },
    /** Small text — card descriptions */
    sm: {
        fontSize: 14,                      // text-sm
        fontWeight: '400' as const,
        lineHeight: 20,
        color: StitchColors.textSecondary,
    },
    /** Badge label */
    badge: {
        fontSize: 12,                      // text-xs
        fontWeight: '600' as const,        // font-semibold
        textTransform: 'uppercase' as const,
    },
    /** Bold link — "Log in" */
    link: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: StitchColors.primary,
    },
} as const;

// ── Spacing ─────────────────────────────────────────────
export const StitchSpacing = {
    /** p-5  →  20 */
    cardPadding: 20,
    /** p-6  →  24 */
    sectionPadding: 24,
    /** pt-12 →  48 */
    headerTopPadding: 48,
    /** gap-5 →  20 */
    cardGap: 20,
    /** pb-12 →  48, pb-10 → 40 */
    bottomPadding: 40,
    /** gap-2 →  8 */
    gap2: 8,
    /** mt-2  →  8 */
    mt2: 8,
    /** mt-1  →  4 */
    mt1: 4,
    /** gap-4 →  16 */
    gap4: 16,
} as const;

// ── Radii ───────────────────────────────────────────────
export const StitchRadius = {
    /** DEFAULT → 0.25rem = 4px */
    default: 4,
    /** lg → 0.5rem = 8px */
    lg: 8,
    /** xl → 0.75rem = 12px */
    xl: 12,
    /** full → 9999px */
    full: 9999,
} as const;

// ── Shadows ─────────────────────────────────────────────
export const StitchShadow = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    '2xl': {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.25,
        shadowRadius: 50,
        elevation: 24,
    },
} as const;
