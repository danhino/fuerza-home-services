import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { t, useLanguageStore } from '../../src/i18n';
import RoleCard from '../../src/components/stitch_ui/RoleCard';
import {
    StitchColors,
    StitchTypography,
    StitchSpacing,
    StitchRadius,
} from '../../src/theme/stitchTokens';

/**
 * Role Selection Launch Screen
 *
 * 1 : 1 match with Stitch frame "Role Selection Launch Screen"
 * (screen 492c026c623d483b98926282cf1ae0b0).
 *
 * Structure:
 *   SafeAreaView (bg: bgLight)
 *   ├── langToggle [functional — not in Stitch]
 *   ├── HEADER  (centered logo + brand text)
 *   ├── WELCOME (title + subtitle)
 *   ├── MAIN    (two RoleCards, gap-5)
 *   └── FOOTER  ("Already have an account?" + "Log in")
 */

// Hero images from the Stitch export
const HOMEOWNER_IMAGE =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB08PRNZHcahlohjP_Vw4YutGMzY7LZ71Z1jb7NnX8IvXiddzRhbCQHGD1txPH9PdXMteVJaUZ6nJhC5zPVaN-AC5pXfOy1wMrwsd4uOyk6XnGBdHi1pqzjGj0UjhRM01CqU-nuoS8s3ByrPSjId2sBpM0GaXB48uS7kdx6jfT42yp96TaQE8Y0HqtAYtQbQz6nHzeE2H2lBijp24ylz74NNHLe5eAUe8P6bvp_77pFXnhr_-QXSR_txtMA34O55_-Qk9hgDu4N9gmn';

const PROFESSIONAL_IMAGE =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCBT77XqzdKSIs7l-TKaPTfUORZqcNE2mvGMUnN48bs2U0Ei3QmxrDivzdjhIEugdBObT31PfHw7J2AD3BKs3iWzpQx7JkWcAXE0TwUQ8kYfofRrN3cSxN3R7gk-DMN312ch7H_xuD_6PUFJzISYGXSSa5pDOGfr216Mgwb7pwgnsF6vFMpw4ediZOAMH_hfURO6uL_mxKvXeoWWDLXkDCLjWDMw3b7dtQGyOAvs3CrYgbwgNJ8aCyK1ePtruqHz_yoySnuy5hrf2zi';

export default function RoleSelectionScreen() {
    const router = useRouter();
    const { language, setLanguage } = useLanguageStore();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'es' : 'en');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                {/* Language toggle — functional requirement, not in Stitch */}
                <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
                    <Ionicons name="language" size={18} color={StitchColors.primary} />
                    <Text style={styles.langText}>
                        {language === 'en' ? 'Español' : 'English'}
                    </Text>
                </TouchableOpacity>

                {/* ── HEADER — logo + brand ─────────────────────────── */}
                <View style={styles.header}>
                    <View style={styles.logoIcon}>
                        <Ionicons name="construct" size={24} color="#fff" />
                    </View>
                    <Text style={styles.brandText}>Fuerza</Text>
                </View>

                {/* ── WELCOME — title + subtitle ────────────────────── */}
                <View style={styles.welcome}>
                    <Text style={styles.welcomeTitle}>{t('roleSelect.title')}</Text>
                    <Text style={styles.welcomeSubtitle}>
                        {t('roleSelect.subtitle')}
                    </Text>
                </View>

                {/* ── MAIN — role cards ──────────────────────────────── */}
                <View style={styles.cardsContainer}>
                    <RoleCard
                        imageUri={HOMEOWNER_IMAGE}
                        badgeLabel="HOMEOWNER"
                        badgeVariant="primary"
                        title={t('roleSelect.needService')}
                        description={t('roleSelect.needServiceDesc')}
                        onPress={() =>
                            router.push({
                                pathname: '/(auth)/register',
                                params: { role: 'CUSTOMER' },
                            })
                        }
                    />
                    <RoleCard
                        imageUri={PROFESSIONAL_IMAGE}
                        badgeLabel="PROFESSIONAL"
                        badgeVariant="emerald"
                        title={t('roleSelect.provideService')}
                        description={t('roleSelect.provideServiceDesc')}
                        onPress={() =>
                            router.push({
                                pathname: '/(auth)/register',
                                params: { role: 'TECHNICIAN' },
                            })
                        }
                    />
                </View>

                {/* ── FOOTER — login link ───────────────────────────── */}
                <View style={styles.footer}>
                    <View style={styles.loginRow}>
                        <Text style={styles.loginPrompt}>
                            {t('roleSelect.alreadyHaveAccount')}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.loginLink}>Log in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Styles — all values from stitchTokens ──────────────────
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: StitchColors.bgLight,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },

    /* Language toggle — functional, styled to blend with Stitch palette */
    langToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 6,
        marginTop: 4,
        marginRight: StitchSpacing.sectionPadding,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: StitchRadius.lg,
        backgroundColor: StitchColors.primaryTint,
    },
    langText: {
        color: StitchColors.primary,
        fontWeight: '600',
        fontSize: 13,
    },

    /* HEADER — matches Stitch <header> */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: StitchSpacing.sectionPadding,      // p-6
        paddingTop: StitchSpacing.sectionPadding,              // pt-12 is handled by SafeAreaView + this
        gap: StitchSpacing.gap2,                                // gap-2
    },
    logoIcon: {
        width: 40,
        height: 40,
        borderRadius: StitchRadius.xl,                          // rounded-xl = 12
        backgroundColor: StitchColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandText: {
        ...StitchTypography.brand,                              // text-2xl font-extrabold tracking-tight
    },

    /* WELCOME — matches Stitch <div class="px-6 py-4 text-center"> */
    welcome: {
        paddingHorizontal: StitchSpacing.sectionPadding,        // px-6
        paddingVertical: 16,                                     // py-4
        alignItems: 'center',
    },
    welcomeTitle: {
        ...StitchTypography.h1,                                  // text-3xl font-bold tracking-tight
        textAlign: 'center',
    },
    welcomeSubtitle: {
        ...StitchTypography.body,                                // text-base text-[#4c739a] leading-relaxed
        textAlign: 'center',
        marginTop: StitchSpacing.mt2,                            // mt-2
    },

    /* MAIN — role cards container */
    cardsContainer: {
        flex: 1,                                                  // pushes footer to bottom (≈ Stitch mt-auto)
        paddingHorizontal: StitchSpacing.sectionPadding,         // p-6
        paddingBottom: StitchSpacing.headerTopPadding,            // pb-12
        gap: StitchSpacing.cardGap,                              // gap-5
    },

    /* FOOTER — matches Stitch <footer> */
    footer: {
        alignItems: 'center',
        paddingHorizontal: StitchSpacing.sectionPadding,         // p-6
        paddingBottom: StitchSpacing.bottomPadding,               // pb-10
        gap: StitchSpacing.gap4,                                  // gap-4
    },
    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: StitchSpacing.gap2,                                  // gap-2
    },
    loginPrompt: {
        ...StitchTypography.sm,                                   // text-sm text-[#4c739a]
    },
    loginLink: {
        ...StitchTypography.link,                                 // text-sm font-bold text-primary
    },
});
