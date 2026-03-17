import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface User {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    role: 'CUSTOMER' | 'TECHNICIAN' | 'BOTH';
    preferredLanguage?: 'en' | 'es';
    isOnline?: boolean;
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    login: (accessToken: string, user: User, refreshToken?: string) => void;
    logout: () => void;
    clearTokens: () => void;
    setIsOnline: (val: boolean) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
}

import { socketService } from '../services/socket.service';

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    login: (accessToken, user, refreshToken) => {
        set({ accessToken, refreshToken: refreshToken ?? null, user, isAuthenticated: true });
        socketService.connect();
    },
    logout: () => {
        socketService.disconnect();
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
    },
    clearTokens: () => {
        socketService.disconnect();
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
    },
    setIsOnline: (val) => set((state) => ({
        user: state.user ? { ...state.user, isOnline: val } : null,
    })),
    setTokens: (accessToken, refreshToken) => set({
        accessToken,
        refreshToken,
    }),
}));
