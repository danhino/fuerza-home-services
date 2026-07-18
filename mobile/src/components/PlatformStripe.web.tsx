/**
 * PlatformStripe.web — web stand-in for @stripe/stripe-react-native.
 *
 * The native Stripe SDK cannot run on web. StripeProvider becomes a
 * passthrough, and the PaymentSheet functions throw — callers already
 * catch that and fall back (same path as Expo Go without the native module).
 */
import React from 'react';

export function StripeProvider(props: { children?: React.ReactNode } & Record<string, unknown>) {
    return <>{props.children}</>;
}

export function useStripe() {
    const unavailable = async (): Promise<never> => {
        throw new Error('Stripe payments are not available on web — use the mobile app');
    };
    return {
        initPaymentSheet: unavailable,
        presentPaymentSheet: unavailable,
    };
}
