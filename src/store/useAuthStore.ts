import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface User {
    id: string;
    name: string;
    role: 'CUSTOMER' | 'TECHNICIAN' | 'BOTH';
    preferredLanguage?: 'en' | 'es';
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
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
}));
