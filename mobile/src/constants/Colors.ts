const tintColorLight = '#007AFF';
const tintColorDark = '#0a84ff';

/** Stitch UI spec §2.1 — semantic palette */
export const Brand = {
    primary: '#137FEC',
    light: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    info: '#5AC8FA',
    danger: '#E53935',
} as const;

export const Palette = {
    textPrimary: '#11181C',
    textSecondary: '#687076',
    surface: '#F5F5F5',
    surfaceElevated: '#FFFFFF',
    border: '#E0E0E0',
    darkText: '#ECEDEE',
    darkBackground: '#151718',
    darkSurface: '#2C2C2E',
    darkBorder: '#333333',
} as const;

export const Colors = {
    light: {
        text: '#11181C',
        background: '#fff',
        tint: tintColorLight,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,
        card: '#fff',
        border: '#ccc',
    },
    dark: {
        text: '#ECEDEE',
        background: '#151718',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,
        card: '#2c2c2e',
        border: '#333',
    },
};
