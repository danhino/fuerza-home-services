/**
 * Fuerza Home Services — Typography Design Tokens
 *
 * System font stack (SF Pro on iOS, Roboto on Android).
 * Sizes, weights, and pre-composed text styles.
 */
import { Platform, TextStyle } from 'react-native';

// ─── Font Family ─────────────────────────────────────────────────────────────

export const FontFamily = {
    regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }) as string,
    medium: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'System' }) as string,
    semibold: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'System' }) as string,
    bold: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }) as string,
};

// ─── Font Sizes ──────────────────────────────────────────────────────────────

export const FontSize = {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
} as const;

// ─── Line Heights ────────────────────────────────────────────────────────────

export const LineHeight = {
    xs: 14,
    sm: 18,
    base: 20,
    md: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 42,
} as const;

// ─── Font Weights ────────────────────────────────────────────────────────────

export const FontWeight = {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
};

// ─── Letter Spacing ──────────────────────────────────────────────────────────

export const LetterSpacing = {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
} as const;

// ─── Pre-composed Text Styles ────────────────────────────────────────────────

export const Typography = {
    // Display — hero sections, large headers
    displayLg: {
        fontSize: FontSize['3xl'],
        lineHeight: LineHeight['3xl'],
        fontWeight: FontWeight.bold,
        letterSpacing: LetterSpacing.tight,
    } as TextStyle,

    displaySm: {
        fontSize: FontSize['2xl'],
        lineHeight: LineHeight['2xl'],
        fontWeight: FontWeight.bold,
        letterSpacing: LetterSpacing.tight,
    } as TextStyle,

    // Headings
    headingLg: {
        fontSize: FontSize.xl,
        lineHeight: LineHeight.xl,
        fontWeight: FontWeight.bold,
        letterSpacing: LetterSpacing.tight,
    } as TextStyle,

    headingSm: {
        fontSize: FontSize.lg,
        lineHeight: LineHeight.lg,
        fontWeight: FontWeight.semibold,
        letterSpacing: LetterSpacing.normal,
    } as TextStyle,

    // Titles — section headers, card titles
    titleLg: {
        fontSize: FontSize.md,
        lineHeight: LineHeight.md,
        fontWeight: FontWeight.semibold,
        letterSpacing: LetterSpacing.normal,
    } as TextStyle,

    titleSm: {
        fontSize: FontSize.base,
        lineHeight: LineHeight.base,
        fontWeight: FontWeight.medium,
        letterSpacing: LetterSpacing.normal,
    } as TextStyle,

    // Body — paragraphs, descriptions
    bodyLg: {
        fontSize: FontSize.base,
        lineHeight: LineHeight.base,
        fontWeight: FontWeight.regular,
        letterSpacing: LetterSpacing.normal,
    } as TextStyle,

    bodySm: {
        fontSize: FontSize.sm,
        lineHeight: LineHeight.sm,
        fontWeight: FontWeight.regular,
        letterSpacing: LetterSpacing.normal,
    } as TextStyle,

    // Caption — labels, metadata
    caption: {
        fontSize: FontSize.xs,
        lineHeight: LineHeight.xs,
        fontWeight: FontWeight.regular,
        letterSpacing: LetterSpacing.wide,
    } as TextStyle,

    captionMedium: {
        fontSize: FontSize.xs,
        lineHeight: LineHeight.xs,
        fontWeight: FontWeight.medium,
        letterSpacing: LetterSpacing.wide,
    } as TextStyle,

    // Button
    buttonLg: {
        fontSize: FontSize.md,
        lineHeight: LineHeight.md,
        fontWeight: FontWeight.semibold,
        letterSpacing: LetterSpacing.wide,
    } as TextStyle,

    buttonSm: {
        fontSize: FontSize.base,
        lineHeight: LineHeight.base,
        fontWeight: FontWeight.semibold,
        letterSpacing: LetterSpacing.normal,
    } as TextStyle,

    // Labels — form fields, tabs
    label: {
        fontSize: FontSize.sm,
        lineHeight: LineHeight.sm,
        fontWeight: FontWeight.medium,
        letterSpacing: LetterSpacing.normal,
    } as TextStyle,

    // Numeric — prices, stats, countdowns
    numeric: {
        fontSize: FontSize.lg,
        lineHeight: LineHeight.lg,
        fontWeight: FontWeight.bold,
        letterSpacing: LetterSpacing.tight,
        fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
    } as TextStyle,

    numericSm: {
        fontSize: FontSize.base,
        lineHeight: LineHeight.base,
        fontWeight: FontWeight.semibold,
        letterSpacing: LetterSpacing.normal,
        fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
    } as TextStyle,

    // ── Legacy aliases ──
    /** @deprecated use `buttonSm` */
    button: {
        fontSize: FontSize.base,
        lineHeight: LineHeight.base,
        fontWeight: FontWeight.semibold,
        letterSpacing: LetterSpacing.normal,
    } as TextStyle,
} as const;

export type TypographyToken = keyof typeof Typography;
