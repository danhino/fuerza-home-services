/**
 * locationTracking.ts — Background location tracking for online technicians.
 *
 * Uses expo-task-manager + expo-location to track technician positions
 * and emit them via Socket.io so customers see real-time locations.
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, Linking, Platform } from 'react-native';
import { socketService } from './socket.service';

const LOCATION_TASK = 'background-location-task';

// ── Background task definition ──────────────────────────────────────────
// Must be defined at module level (outside any component).
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
    if (error) {
        // Code 1 = permission denied — ignore silently, don't crash
        if (error.code !== 1) {
            console.error('[Location] Background task error:', error);
        }
        return;
    }
    if (!data) return;

    const { locations } = data as { locations: Location.LocationObject[] };
    if (!locations?.length) return;

    const { latitude, longitude } = locations[0].coords;
    socketService.emit('location_update', {
        lat: latitude,
        lng: longitude,
        isOnline: true,
        timestamp: locations[0].timestamp,
    });
});

// ── Permission helpers ──────────────────────────────────────────────────

async function requestForegroundPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
}

async function requestBackgroundPermission(): Promise<boolean> {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
}

function showPermissionDeniedAlert(isSpanish: boolean) {
    Alert.alert(
        isSpanish ? 'Ubicación Requerida' : 'Location Required',
        isSpanish
            ? 'Fuerza necesita acceso a tu ubicación para mostrar a los clientes qué tan cerca estás. Por favor habilítalo en Configuración.'
            : 'Fuerza needs location access to show customers how close you are. Please enable it in Settings.',
        [
            { text: isSpanish ? 'Cancelar' : 'Cancel', style: 'cancel' },
            {
                text: isSpanish ? 'Abrir Configuración' : 'Open Settings',
                onPress: () => Linking.openSettings(),
            },
        ]
    );
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Start background location tracking.
 * Returns true if started successfully, false if permissions denied.
 */
export async function startLocationTracking(isSpanish = false): Promise<boolean> {
    // 1. Request foreground permission
    const foreground = await requestForegroundPermission();
    if (!foreground) {
        showPermissionDeniedAlert(isSpanish);
        return false;
    }

    // 2. Request background permission
    const background = await requestBackgroundPermission();
    if (!background) {
        showPermissionDeniedAlert(isSpanish);
        return false;
    }

    // 3. Check if already tracking
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (isTracking) {
        console.log('[Location] Already tracking — skipping start');
        return true;
    }

    // 4. Start background updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 8000,       // every 8 seconds
        distanceInterval: 20,     // or every 20 meters
        showsBackgroundLocationIndicator: true,
        foregroundService: {
            notificationTitle: "Fuerza — You're Online",
            notificationBody: 'Accepting nearby job requests',
            notificationColor: '#FF6B2C',
        },
    });

    console.log('[Location] Background tracking started');
    return true;
}

/**
 * Stop background location tracking and notify the server.
 */
export async function stopLocationTracking(): Promise<void> {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (isTracking) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK);
        console.log('[Location] Background tracking stopped');
    }

    // Tell server this technician is offline
    socketService.emit('technician_offline', {});
}

/**
 * Check if background location tracking is currently active.
 */
export async function isTrackingActive(): Promise<boolean> {
    return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
}
