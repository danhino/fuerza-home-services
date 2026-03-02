/**
 * Hook to resolve a single color value from the current theme.
 *
 * Prefer `useTheme()` for full theme access. Use this hook when you
 * only need to override a single color via props.
 *
 * @example
 * ```tsx
 * const bgColor = useThemeColor({}, 'background');
 * const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'textPrimary');
 * ```
 */
import { useColorScheme } from 'react-native';
import { Colors, ColorToken } from '../constants/Colors';
import { useThemeStore } from '../store/useThemeStore';

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: ColorToken
): string {
    const systemTheme = useColorScheme() ?? 'light';
    const preference = useThemeStore((s) => s.preference);
    const theme = preference === 'system' ? systemTheme : preference;
    const colorFromProps = props[theme as 'light' | 'dark'];

    if (colorFromProps) {
        return colorFromProps;
    }

    return Colors[theme as 'light' | 'dark'][colorName];
}
