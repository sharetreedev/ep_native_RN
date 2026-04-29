/**
 * Pulse 4.0 — Design System Tokens
 *
 * ALL colours, typography, spacing, and border-radius values used across
 * the app MUST be sourced from this file.  Never hard-code hex strings or
 * magic numbers in screens/components.
 *
 * See /mobile/DESIGN_SYSTEM.md for full documentation.
 */

// ─── Colours ───────────────────────────────────────────────────────────────────

export const colors = {
    /** Core brand green — use wherever a "green" element appears */
    primary: '#91A27D',
    primaryLight: 'rgba(145, 162, 125, 0.2)',
    /** Dark forest green — headings on tinted backgrounds */
    darkForest: '#30442B',

    /** Destructive / negative actions */
    destructive: '#D08A6E',
    destructiveLight: 'rgba(208, 138, 110, 0.15)',

    /** Alerts / warnings */
    alert: '#FDA33A',
    alertLight: 'rgba(253, 163, 58, 0.15)',

    /** App background (alias: cream in Tailwind) */
    background: '#EDE9E4',

    /** Card / feature accents (support, lessons, etc.) */
    supportCardStart: '#FFFFFF',
    supportCardEnd: '#FFFFFF',
    primaryGradientEnd: '#A8B896',
    /** Slight gradient for Check In card (primary → subtle lighter) */
    checkInGradientEnd: '#9BAE88',
    supportCardText: '#1F2937',
    /** Lessons: calmer blue for learning */
    lessonCardStart: '#FFFFFF',
    lessonCardEnd: '#FFFFFF',
    lessonCardText: '#1F2937',

    /** Surface colours (cards, modals, inputs) */
    surface: '#FFFFFF',
    surfaceMuted: '#F3F0EB',

    /** Text hierarchy */
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    textPlaceholder: '#9CA3AF',
    textOnPrimary: '#FFFFFF',

    /** Borders & dividers */
    border: '#E5E7EB',
    borderLight: '#D1D1CB',

    /** Valerie / chat */
    accent: '#9333EA',
    accentLight: '#F3E8FF',
    chatBubbleUser: '#16A34A',

    /** Notifications */
    notificationUnreadBg: '#EFF6FF',
    notificationDot: '#3B82F6',

    /** Profile / stats */
    profileCardPositive: '#D1E7D2',
    profileCardNeutral: '#EAD4CD',
    profileFrom: '#C2410C',
    profileTo: '#16A34A',

    /** Charts — Outlook & Pulse line charts */
    chartOutlookFrom: '#91A27D',
    chartPulseFrom: '#30442B',

    /** Warning (replaces ad-hoc #E5B800) */
    warning: '#E5B800',

    /** Emergency / AI MHFR dark-forest gradient */
    mhfrGradientFrom: '#5A6B4A',
    mhfrGradientTo: '#3D4F32',

    /** Emotional Colours */
    emotional: {
        enraged: "#D94F16",
        angry: "#E68A64",
        excited: "#9ACD67",
        ecstatic: "#68A63C",
        overwhelmed: "#E69164",
        strained: "#F2C2B3",
        engaged: "#DAEFCC",
        happy: "#9ACD67",
        anxious: "#D1D5DB",
        flat: "#E5E7EB",
        reflective: "#D1E3F2",
        content: "#93C5FD",
        depressed: "#9CA3AF",
        sad: "#CBD5E1",
        calm: "#93C5FD",
        blissful: "#60A5FA",
    },

    /** Misc */
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

// ─── Typography ────────────────────────────────────────────────────────────────

export const fonts = {
    /** Use for all headings (h1-h6, screen titles, card headers) */
    heading: 'Quicksand_700Bold',
    headingSemiBold: 'Quicksand_600SemiBold',
    headingMedium: 'Quicksand_500Medium',
    headingRegular: 'Quicksand_400Regular',

    /** Use for all body copy, labels, buttons, inputs */
    body: 'Manrope_400Regular',
    bodyMedium: 'Manrope_500Medium',
    bodySemiBold: 'Manrope_600SemiBold',
    bodyBold: 'Manrope_700Bold',

    /** Display serif — used for the v2 emotion carousel headlines.
     *  RN doesn't auto-derive italic glyphs from `fontStyle: 'italic'` for
     *  custom fonts, so the italic variant is exposed as its own family.
     *  `display`/`displayItalic` use Playfair Medium (500); the heavier
     *  semibold variants (600) are also loaded for emphasis. */
    display: 'PlayfairDisplay_500Medium',
    displayItalic: 'PlayfairDisplay_500Medium_Italic',
    displayBold: 'PlayfairDisplay_600SemiBold',
    displayBoldItalic: 'PlayfairDisplay_600SemiBold_Italic',
} as const;

export const fontSizes = {
    xs: 14,
    sm: 14,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
} as const;

// ─── Spacing ───────────────────────────────────────────────────────────────────

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
} as const;

// ─── Border Radius ─────────────────────────────────────────────────────────────

export const borderRadius = {
    sm: 8,
    md: 12,
    button: 16,
    lg: 20,
    xl: 24,
    full: 999,
} as const;

// ─── Button Styles ─────────────────────────────────────────────────────────────

export const buttonStyles = {
    /** Solid primary — green bg, white text */
    primary: {
        container: {
            backgroundColor: colors.primary,
            borderRadius: borderRadius.button,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            minHeight: 56,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },
        text: {
            color: colors.textOnPrimary,
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.base,
            fontWeight: '700' as const,
        },
        disabled: {
            opacity: 0.5,
        },
    },

    /** Outline secondary — transparent bg, primary border & text */
    secondary: {
        container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: borderRadius.button,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },
        text: {
            color: colors.primary,
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.base,
            fontWeight: '700' as const,
        },
        disabled: {
            opacity: 0.5,
        },
    },
} as const;

// ─── Pill Tab Styles ──────────────────────────────────────────────────────────

export const pillTabStyles = {
    row: {
        flexDirection: 'row' as const,
        gap: 8,
    },
    pill: {
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
    },
    pillActive: {
        backgroundColor: colors.primary,
    },
    pillLabel: {
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.md,
        color: colors.textSecondary,
    },
    pillLabelActive: {
        color: colors.textOnPrimary,
    },
} as const;


