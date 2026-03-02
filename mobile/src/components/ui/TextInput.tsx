/**
 * TextInput — Styled form input with label, error state, and icon slots.
 */
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput as RNTextInput,
    StyleSheet,
    ViewStyle,
    TextInputProps as RNTextInputProps,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
    /** Label displayed above the input */
    label?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Current value */
    value?: string;
    /** Change handler */
    onChangeText?: (text: string) => void;
    /** Error message displayed below the input */
    error?: string;
    /** Password field */
    secureTextEntry?: boolean;
    /** Icon element on the left */
    leftIcon?: React.ReactNode;
    /** Icon element on the right */
    rightIcon?: React.ReactNode;
    /** Keyboard type */
    keyboardType?: RNTextInputProps['keyboardType'];
    /** Override container style */
    style?: ViewStyle;
    /** Whether the input is disabled */
    editable?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TextInput({
    label,
    placeholder,
    value,
    onChangeText,
    error,
    secureTextEntry,
    leftIcon,
    rightIcon,
    keyboardType,
    style,
    editable = true,
    ...rest
}: TextInputProps) {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);

    const handleFocus = useCallback(() => setFocused(true), []);
    const handleBlur = useCallback(() => setFocused(false), []);

    const borderColor = error
        ? theme.colors.borderError
        : focused
            ? theme.colors.borderFocused
            : theme.colors.border;

    const inputBg = editable ? theme.colors.surface : theme.colors.surfaceDisabled;

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text
                    style={[
                        theme.typography.label,
                        { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs },
                    ]}
                >
                    {label}
                </Text>
            )}

            <View
                style={[
                    styles.inputRow,
                    {
                        backgroundColor: inputBg,
                        borderColor,
                        borderRadius: theme.radius.md,
                        borderWidth: focused ? 2 : 1,
                        paddingHorizontal: theme.spacing.md,
                        minHeight: 48,
                    },
                ]}
            >
                {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

                <RNTextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    editable={editable}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={[
                        styles.input,
                        theme.typography.bodyLg,
                        { color: theme.colors.textPrimary },
                    ]}
                    accessibilityLabel={label || placeholder}
                    {...rest}
                />

                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </View>

            {error && (
                <Text
                    style={[
                        theme.typography.caption,
                        {
                            color: theme.colors.error,
                            marginTop: theme.spacing.xs,
                        },
                    ]}
                >
                    {error}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        paddingVertical: 0,
    },
    iconLeft: {
        marginRight: 10,
    },
    iconRight: {
        marginLeft: 10,
    },
});
