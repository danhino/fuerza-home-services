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
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    setIsOnline: (val: boolean) => void;
}

import { socketService } from '../services/socket.service';

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    login: (token, user) => {
        set({ token, user, isAuthenticated: true });
        socketService.connect();
    },
    logout: () => {
        socketService.disconnect();
        set({ token: null, user: null, isAuthenticated: false });
    },
    setIsOnline: (val) => set((state) => ({
        user: state.user ? { ...state.user, isOnline: val } : null,
    })),
}));
