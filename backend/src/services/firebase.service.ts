import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Load service account from backend root
const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
if (fs.existsSync(serviceAccountPath) && !admin.apps.length) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
} else if (!admin.apps.length) {
    console.warn('[Firebase] firebase-service-account.json not found — push notifications disabled');
}

/**
 * Send a push notification to a single device.
 * Handles both Expo push tokens (ExponentPushToken[...]) and raw FCM tokens.
 * Never throws — failed push should never break the main request flow.
 */
export const sendPushNotification = async (
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<void> => {
    try {
        if (pushToken.startsWith('ExponentPushToken')) {
            // Use Expo's push API for Expo tokens
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: pushToken,
                    title,
                    body,
                    data: data ?? {},
                    sound: 'default',
                    priority: 'high',
                }),
            });
            const result = await response.json();
            if (result.data?.status === 'error') {
                console.error('[Push] Expo push error:', result.data.message);
            }
        } else {
            // Use Firebase Admin for raw FCM tokens
            if (!admin.apps.length) {
                console.warn('[Push] Firebase not initialized — cannot send FCM notification');
                return;
            }
            await admin.messaging().send({
                token: pushToken,
                notification: { title, body },
                data: data ?? {},
                apns: {
                    payload: { aps: { sound: 'default', badge: 1 } },
                },
            });
        }
    } catch (error) {
        console.error('[Push] notification error:', error);
        // Never throw — a failed push notification should never break the main request flow
    }
};
