/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';

import { Colors } from '../constants/Colors';
import { useThemeStore } from '../store/useThemeStore';

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
    const systemTheme = useColorScheme() ?? 'light';
    const preference = useThemeStore((s) => s.preference);
    const theme = preference === 'system' ? systemTheme : preference;
    const colorFromProps = props[theme];

    if (colorFromProps) {
        return colorFromProps;
    } else {
        return Colors[theme][colorName];
    }
}
