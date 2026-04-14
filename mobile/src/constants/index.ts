/**
 * Fuerza Home Services — Constants Barrel Export
 *
 * Single import point for all design tokens and theme utilities.
 *
 * @example
 * ```ts
 * import { Colors, Typography, Spacing, Radius, Shadow, getTheme } from '@/constants';
 * ```
 */

// Colors
export { Colors, BrandColors, StatusColors, ServiceColors, Brand, Palette } from './Colors';
export type { ColorToken, ThemeColors } from './Colors';

// Typography
export {
    Typography,
    FontSize,
    LineHeight,
    FontWeight,
    FontFamily,
    LetterSpacing,
} from './Typography';
export type { TypographyToken } from './Typography';

// Spacing, Layout, Radius, Shadow
export { Spacing, Layout, Radius, Shadow, ZIndex, Elevation } from './Spacing';
export type { SpacingToken, RadiusToken, ShadowToken } from './Spacing';

// Theme
export { lightTheme, darkTheme, getTheme } from './Theme';
export type { Theme } from './Theme';

// Config
export { API_URL, SOCKET_URL } from './Config';
