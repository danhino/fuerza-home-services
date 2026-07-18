/**
 * PlatformMap — platform-split wrapper around react-native-maps.
 *
 * Import MapView/Marker/Callout from here instead of 'react-native-maps'
 * directly. On web, Metro resolves PlatformMap.web.tsx instead, which
 * provides stubs — react-native-maps imports React Native internals
 * (codegenNativeCommands) that break web bundling.
 */
export { default, Marker, Callout, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
