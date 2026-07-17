import * as admin from 'firebase-admin';

/**
 * Resolve the Firebase service account.
 * Production (Railway): FIREBASE_SERVICE_ACCOUNT env var holds the minified JSON —
 * the firebase-service-account.json file is gitignored and never deployed.
 * Local development: falls back to the JSON file in the backend root.
 */
function getServiceAccount(): admin.ServiceAccount | null {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as admin.ServiceAccount;
        } catch (e) {
            console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e);
            throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT environment variable');
        }
    }

    // Local development fallback — file must exist
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require('../../firebase-service-account.json') as admin.ServiceAccount;
    } catch (e) {
        console.warn('[Firebase] firebase-service-account.json not found. Push notifications disabled.');
        return null;
    }
}

const serviceAccount = getServiceAccount();

if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
} else if (!serviceAccount) {
    console.warn('[Firebase] Firebase not initialized — push notifications will be skipped.');
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
    // Expo tokens are delivered via Expo's push API and don't need Firebase Admin;
    // only raw FCM tokens require an initialized Firebase app.
    if (!pushToken.startsWith('ExponentPushToken') && !admin.apps.length) {
        console.warn('[Firebase] Skipping push — Firebase not initialized');
        return;
    }

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
