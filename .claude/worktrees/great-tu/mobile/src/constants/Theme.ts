/**
 * Fuerza Home Services — Theme Object
 *
 * Combines all design tokens into a single typed theme object,
 * scoped by color scheme (light / dark).
 */
import { Colors, ThemeColors, BrandColors, StatusColors, ServiceColors } from './Colors';
import {
    Typography,
    FontSize,
    LineHeight,
    FontWeight,
    FontFamily,
    LetterSpacing,
} from './Typography';
import { Spacing, Layout, Radius, Shadow, ZIndex } from './Spacing';

// ─── Theme Shape ─────────────────────────────────────────────────────────────

export interface Theme {
    /** 'light' | 'dark' */
    mode: 'light' | 'dark';
    /** Whether the theme is dark mode */
    isDark: boolean;

    /** Semantic color tokens (scoped to current mode) */
    colors: ThemeColors;
    /** Brand color primitives (mode-independent) */
    brand: typeof BrandColors;
    /** Status colors (mode-independent) */
    status: typeof StatusColors;
    /** Service category colors (mode-independent) */
    service: typeof ServiceColors;

    /** Pre-composed text styles */
    typography: typeof Typography;
    /** Font size primitives */
    fontSize: typeof FontSize;
    /** Line height primitives */
    lineHeight: typeof LineHeight;
    /** Font weight primitives */
    fontWeight: typeof FontWeight;
    /** Font family primitives */
    fontFamily: typeof FontFamily;
    /** Letter spacing primitives */
    letterSpacing: typeof LetterSpacing;

    /** Spacing scale */
    spacing: typeof Spacing;
    /** Layout constants */
    layout: typeof Layout;
    /** Border radius tokens */
    radius: typeof Radius;
    /** Shadow / elevation tokens */
    shadow: typeof Shadow;
    /** Z-index layers */
    zIndex: typeof ZIndex;
}

// ─── Theme Factory ───────────────────────────────────────────────────────────

const createTheme = (mode: 'light' | 'dark'): Theme => ({
    mode,
    isDark: mode === 'dark',
    colors: Colors[mode] as unknown as ThemeColors,
    brand: BrandColors,
    status: StatusColors,
    service: ServiceColors,
    typography: Typography,
    fontSize: FontSize,
    lineHeight: LineHeight,
    fontWeight: FontWeight,
    fontFamily: FontFamily,
    letterSpacing: LetterSpacing,
    spacing: Spacing,
    layout: Layout,
    radius: Radius,
    shadow: Shadow,
    zIndex: ZIndex,
});

// ─── Pre-built Themes ────────────────────────────────────────────────────────

export const lightTheme: Theme = createTheme('light');
export const darkTheme: Theme = createTheme('dark');

/**
 * Returns the pre-built theme for the given mode.
 * Uses singletons to avoid re-creating theme objects on every render.
 */
export const getTheme = (mode: 'light' | 'dark'): Theme =>
    mode === 'dark' ? darkTheme : lightTheme;
