import { create } from 'zustand';
import * as Location from 'expo-location';
import { socketService } from '../services/socket.service';
import { useAuthStore } from './useAuthStore';

interface LocationState {
    location: Location.LocationObject | null;
    subscription: Location.LocationSubscription | null;
    startTracking: () => Promise<void>;
    stopTracking: () => void;
    setLocation: (location: Location.LocationObject) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
    location: null,
    subscription: null,
    setLocation: (location) => set({ location }),
    startTracking: async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                console.warn('[Location] Permission to access location was denied');
                return;
            }

            // Stop any existing subscription
            get().stopTracking();

            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000, // Update every 5 seconds
                    distanceInterval: 10, // Update every 10 meters
                },
                (location) => {
                    set({ location });

                    // If technician, emit location to server
                    const user = useAuthStore.getState().user;
                    if (user && user.role === 'TECHNICIAN') {
                        socketService.emit('technician:location', {
                            techId: user.id,
                            lat: location.coords.latitude,
                            lng: location.coords.longitude,
                            trade: (user as any).trade || 'PLUMBER',
                        });
                    }
                }
            );

            set({ subscription });
        } catch (error) {
            // In Expo Go, NSLocation*UsageDescription keys aren't available
            // so location requests will throw. Log and continue gracefully.
            console.warn('[Location] Failed to start tracking (expected in Expo Go):', error);
        }
    },
    stopTracking: () => {
        const { subscription } = get();
        if (subscription) {
            subscription.remove();
            set({ subscription: null });
        }
    },
}));
