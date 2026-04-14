import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { Palette } from '../../constants/Colors';

interface ScreenHeaderProps {
    title: string;
    onBack?: () => void;
    rightAction?: React.ReactNode;
    textColor?: string;
}

export function ScreenHeader({ title, onBack, rightAction, textColor = Palette.textPrimary }: ScreenHeaderProps) {
    return (
        <View style={styles.container}>
            {onBack ? (
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
            ) : (
                <View style={styles.placeholder} />
            )}
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{title}</Text>
            {rightAction || <View style={styles.placeholder} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        minHeight: 48,
    },
    backBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...Typography.displaySm,
        flex: 1,
        textAlign: 'center',
    },
    placeholder: { width: 32 },
});
