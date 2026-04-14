import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Register for push notifications and return the Expo push token.
 * Returns null if not on a physical device or permission is denied.
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    if (!Device.isDevice) {
        console.log('[Push] Push notifications require a physical device');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('[Push] Push notification permission denied');
        return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
        console.log('[Push] No EAS project ID found — skipping push token');
        return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
};

/**
 * Set up notification handlers and return a cleanup function.
 * Tapping a notification navigates to the relevant screen.
 */
export const setupNotificationHandlers = (
    router: any
): (() => void) => {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
        } as Notifications.NotificationBehavior),
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
            const { jobId, screen } = response.notification.request.content.data as any;
            if (jobId && screen === 'job-detail') {
                router.push({
                    pathname: '/(tabs)/job-detail',
                    params: { jobId },
                });
            } else if (jobId && screen === 'tracking') {
                router.push({
                    pathname: '/(tabs)/tracking',
                    params: { jobId },
                });
            }
        }
    );

    // Return cleanup function
    return () => subscription.remove();
};
