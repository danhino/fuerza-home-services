import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import es from './es';

type TranslationKey = keyof typeof en;
type Language = 'en' | 'es';

const translations: Record<Language, Record<string, string>> = { en, es };

// ── Zustand Store ────────────────────────────────────

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
    loadLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
    language: 'en',
    setLanguage: async (lang: Language) => {
        set({ language: lang });
        await AsyncStorage.setItem('preferredLanguage', lang);
    },
    loadLanguage: async () => {
        const saved = await AsyncStorage.getItem('preferredLanguage');
        if (saved === 'en' || saved === 'es') {
            set({ language: saved });
        }
    },
}));

// ── Helper function ──────────────────────────────────

export function t(key: string, params?: Record<string, string | number>): string {
    const lang = useLanguageStore.getState().language;
    let translation = translations[lang]?.[key] ?? translations['en']?.[key] ?? key;

    if (params) {
        Object.entries(params).forEach(([k, value]) => {
            translation = translation.replace(`{${k}}`, String(value));
        });
    }

    return translation;
}
