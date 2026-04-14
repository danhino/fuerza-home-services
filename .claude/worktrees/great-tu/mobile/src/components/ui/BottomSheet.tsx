/**
 * BottomSheet — Slide-up modal with drag-to-dismiss.
 *
 * Uses React Native Animated API + PanResponder.
 * No external dependencies.
 */
import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Animated,
    PanResponder,
    TouchableWithoutFeedback,
    Dimensions,
    ViewStyle,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BottomSheetProps {
    /** Whether the sheet is visible */
    visible: boolean;
    /** Close handler */
    onClose: () => void;
    /** Content */
    children: React.ReactNode;
    /** Snap point heights (default: [400]) */
    snapPoints?: number[];
    /** Optional title in the header */
    title?: string;
    /** Style override for the sheet container */
    style?: ViewStyle;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 100;

// ─── Component ───────────────────────────────────────────────────────────────

export function BottomSheet({
    visible,
    onClose,
    children,
    snapPoints = [400],
    title,
    style,
}: BottomSheetProps) {
    const theme = useTheme();
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const sheetHeight = snapPoints[0];

    // Animate in/out
    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 25,
                    stiffness: 200,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: SCREEN_HEIGHT,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, translateY, overlayOpacity]);

    const handleDismiss = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    }, [translateY, overlayOpacity, onClose]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
                    handleDismiss();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        damping: 25,
                        stiffness: 200,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleDismiss}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                style={styles.wrapper}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Overlay */}
                <TouchableWithoutFeedback onPress={handleDismiss}>
                    <Animated.View
                        style={[
                            styles.overlay,
                            {
                                backgroundColor: theme.colors.overlay,
                                opacity: overlayOpacity,
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                {/* Sheet */}
                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            height: sheetHeight,
                            backgroundColor: theme.colors.surfaceElevated,
                            borderTopLeftRadius: theme.radius.lg,
                            borderTopRightRadius: theme.radius.lg,
                            transform: [{ translateY }],
                        },
                        theme.shadow.modal,
                        style,
                    ]}
                >
                    {/* Handle */}
                    <View {...panResponder.panHandlers} style={styles.handleArea}>
                        <View
                            style={[
                                styles.handle,
                                { backgroundColor: theme.colors.border },
                            ]}
                        />
                    </View>

                    {/* Title */}
                    {title && (
                        <Text
                            style={[
                                theme.typography.titleLg,
                                {
                                    color: theme.colors.textPrimary,
                                    paddingHorizontal: theme.spacing.lg,
                                    paddingBottom: theme.spacing.md,
                                },
                            ]}
                        >
                            {title}
                        </Text>
                    )}

                    {/* Content */}
                    <View style={[styles.content, { paddingHorizontal: theme.spacing.lg }]}>
                        {children}
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        overflow: 'hidden',
    },
    handleArea: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
    },
    content: {
        flex: 1,
    },
});
