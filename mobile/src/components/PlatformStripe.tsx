/**
 * PlatformStripe — platform-split wrapper around @stripe/stripe-react-native.
 *
 * Import StripeProvider/useStripe from here instead of the package directly.
 * On web, Metro resolves PlatformStripe.web.tsx instead — the native package
 * imports React Native internals (codegenNativeComponent) that break web
 * bundling.
 */
export { StripeProvider, useStripe } from '@stripe/stripe-react-native';
