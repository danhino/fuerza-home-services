import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../../src/hooks/useThemeColor';
import { t, useLanguageStore } from '../../src/i18n';

export default function EarningsScreen() {
    const language = useLanguageStore((s) => s.language);
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <Text style={[styles.title, { color: textColor }]}>{t('tabs.earnings')}</Text>
            <Text style={[styles.placeholder, { color: textColor }]}>{t('earnings.comingSoon')}</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    placeholder: {
        fontSize: 15,
        opacity: 0.5,
    },
});
