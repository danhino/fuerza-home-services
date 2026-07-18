/**
 * PlatformMap.web — web stand-in for react-native-maps.
 *
 * react-native-maps is native-only (it imports React Native internals that
 * fail web bundling). This module keeps the same surface so screens render
 * a friendly placeholder instead of a map on web.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

export class Marker extends React.Component<any> {
    render() {
        return null;
    }
}

export class Callout extends React.Component<any> {
    render() {
        return null;
    }
}

export default class MapView extends React.Component<any> {
    animateToRegion(_region: unknown, _duration?: number) {
        // no-op on web
    }

    render() {
        const { style } = this.props;
        return (
            <View style={[styles.placeholder, style]}>
                <Text style={styles.placeholderText}>
                    Live map is available in the mobile app
                </Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: '#e8ecef',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: '#6b7280',
        fontSize: 14,
    },
});
