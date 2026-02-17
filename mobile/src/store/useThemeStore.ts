import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
    preference: ThemePreference;
    setPreference: (pref: ThemePreference) => void;
    loadPreference: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
    preference: 'system',
    setPreference: async (pref: ThemePreference) => {
        set({ preference: pref });
        await AsyncStorage.setItem('themePreference', pref);
    },
    loadPreference: async () => {
        const saved = await AsyncStorage.getItem('themePreference');
        if (saved === 'system' || saved === 'light' || saved === 'dark') {
            set({ preference: saved });
        }
    },
}));
