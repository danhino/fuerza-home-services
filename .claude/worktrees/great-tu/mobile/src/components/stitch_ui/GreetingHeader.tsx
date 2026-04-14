import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { Palette } from '../../constants/Colors';

interface GreetingHeaderProps {
    greeting: string;
    userName: string;
    showNotification?: boolean;
    onNotificationPress?: () => void;
    textColor?: string;
}

export function GreetingHeader({
    greeting,
    userName,
    showNotification = true,
    onNotificationPress,
    textColor = Palette.textPrimary,
}: GreetingHeaderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.textBlock}>
                <Text style={[styles.greeting, { color: textColor, opacity: 0.6 }]}>{greeting}</Text>
                <Text style={[styles.userName, { color: textColor }]}>{userName}</Text>
            </View>
            {showNotification && (
                <TouchableOpacity style={styles.bell} onPress={onNotificationPress} activeOpacity={0.7}>
                    <Ionicons name="notifications-outline" size={24} color={textColor} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPaddingH,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    textBlock: { flex: 1 },
    greeting: {
        ...Typography.bodySm,
        marginBottom: 2,
    },
    userName: {
        ...Typography.displaySm,
    },
    bell: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Palette.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
