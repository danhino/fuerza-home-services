/**
 * Fuerza Home Services — useTheme Hook
 *
 * Returns the current Theme object based on the device's color scheme
 * and the user's stored preference (light | dark | system).
 */
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, Theme } from '../constants/Theme';
import { useThemeStore } from '../store/useThemeStore';

/**
 * Returns the resolved Theme object.
 *
 * Respects the user-level preference from `useThemeStore`:
 * - `'system'` → follows the device's color scheme
 * - `'light'` / `'dark'` → explicit override
 *
 * @example
 * ```tsx
 * const { colors, typography, spacing } = useTheme();
 * return <Text style={[typography.titleLg, { color: colors.textPrimary }]}>Hello</Text>;
 * ```
 */
export function useTheme(): Theme {
    const systemScheme = useColorScheme();
    const preference = useThemeStore((s) => s.preference);

    const mode =
        preference === 'system'
            ? (systemScheme ?? 'light')
            : preference;

    return useMemo(() => getTheme(mode as 'light' | 'dark'), [mode]);
}
