import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../constants/Config';
import { useAuthStore } from '../store/useAuthStore';
import { Alert } from 'react-native';
import { router } from 'expo-router';

const api = axios.create({
    baseURL: API_URL,
});

// ── Request interceptor ────────────────────────
api.interceptors.request.use((config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// ── Response interceptor ──────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (!error.response) {
            Alert.alert('Connection Error', 'No internet connection');
            return Promise.reject(error);
        }

        const status = error.response.status;

        if (status === 401 && originalRequest) {
            if (originalRequest._retry) {
                useAuthStore.getState().clearTokens();
                router.replace('/(auth)/login');
                return Promise.reject(error);
            }

            originalRequest._retry = true;
            const refreshToken = useAuthStore.getState().refreshToken;

            if (!refreshToken) {
                useAuthStore.getState().clearTokens();
                router.replace('/(auth)/login');
                return Promise.reject(error);
            }

            try {
                const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                const newAccessToken = res.data.token;
                const newRefreshToken = res.data.refreshToken;

                useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } catch (err) {
                useAuthStore.getState().clearTokens();
                router.replace('/(auth)/login');
                return Promise.reject(err);
            }
        }

        if (status === 429) {
            Alert.alert('Rate Limit', 'Too many requests. Please wait.');
        }

        if (status >= 500) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }

        return Promise.reject(error);
    }
);

export default api;
