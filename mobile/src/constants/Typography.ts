/**
 * Typography tokens derived from Stitch UI spec §2.2 (Inter font family).
 * Usage: import { Typography } from '@/constants/Typography';
 */

export const Typography = {
    displayLg: { fontWeight: '700' as const, fontSize: 28, lineHeight: 34 },
    displaySm: { fontWeight: '600' as const, fontSize: 22, lineHeight: 28 },
    titleLg: { fontWeight: '600' as const, fontSize: 18, lineHeight: 24 },
    titleSm: { fontWeight: '500' as const, fontSize: 16, lineHeight: 22 },
    bodyLg: { fontWeight: '400' as const, fontSize: 16, lineHeight: 24 },
    bodySm: { fontWeight: '400' as const, fontSize: 14, lineHeight: 20 },
    caption: { fontWeight: '400' as const, fontSize: 12, lineHeight: 16 },
    button: { fontWeight: '600' as const, fontSize: 16, lineHeight: 20 },
};
