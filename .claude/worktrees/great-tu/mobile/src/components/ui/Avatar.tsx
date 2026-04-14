/**
 * Avatar — Circular image or initials fallback with optional online indicator.
 */
import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
    /** Image URI */
    uri?: string | null;
    /** Full name — used for initials fallback */
    name?: string;
    /** Size preset */
    size?: AvatarSize;
    /** Show online indicator dot */
    online?: boolean;
}

// ─── Size Presets ────────────────────────────────────────────────────────────

const SIZE_MAP: Record<AvatarSize, { container: number; font: number; dot: number; dotBorder: number }> = {
    sm: { container: 32, font: 12, dot: 8, dotBorder: 1.5 },
    md: { container: 40, font: 15, dot: 10, dotBorder: 2 },
    lg: { container: 56, font: 20, dot: 12, dotBorder: 2 },
    xl: { container: 80, font: 28, dot: 16, dotBorder: 3 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic pastel-ish hue from a name string */
function getAvatarColor(name?: string): string {
    if (!name) return '#9CA3AF';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 50%, 40%)`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Avatar({ uri, name, size = 'md', online }: AvatarProps) {
    const theme = useTheme();
    const [imgError, setImgError] = useState(false);
    const dims = SIZE_MAP[size];

    const showImage = !!uri && !imgError;

    return (
        <View style={{ width: dims.container, height: dims.container }}>
            <View
                style={[
                    styles.circle,
                    {
                        width: dims.container,
                        height: dims.container,
                        borderRadius: dims.container / 2,
                        backgroundColor: showImage ? theme.colors.backgroundTertiary : getAvatarColor(name),
                    },
                ]}
            >
                {showImage ? (
                    <Image
                        source={{ uri }}
                        style={{
                            width: dims.container,
                            height: dims.container,
                            borderRadius: dims.container / 2,
                        }}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <Text
                        style={[
                            styles.initials,
                            {
                                fontSize: dims.font,
                                color: '#FFFFFF',
                            },
                        ]}
                    >
                        {getInitials(name)}
                    </Text>
                )}
            </View>

            {online && (
                <View
                    style={[
                        styles.dot,
                        {
                            width: dims.dot,
                            height: dims.dot,
                            borderRadius: dims.dot / 2,
                            borderWidth: dims.dotBorder,
                            borderColor: theme.colors.surface,
                            backgroundColor: theme.colors.success,
                            bottom: 0,
                            right: 0,
                        },
                    ]}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    circle: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    initials: {
        fontWeight: '600',
        textAlign: 'center',
    },
    dot: {
        position: 'absolute',
    },
});
