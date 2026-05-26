import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { auth as authApi } from '../../api';
import { logger } from '../../lib/logger';
import { readAppleNameCache, writeAppleNameCache } from '../../auth/appleNameCache';
import { presentIntercom } from '../../lib/intercom';
import { Check, HelpCircle, Smartphone } from 'lucide-react-native';
import * as Sentry from '@sentry/react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import Button from '../../components/Button';

/**
 * The Microsoft 4-square logo, rendered as SVG so we don't pull in another
 * dependency or asset just for one icon. Colours from the official MS
 * identity guide.
 */
function MicrosoftIcon({ size = 20 }: { size?: number }) {
  const half = size / 2;
  const gap = Math.max(1, Math.round(size * 0.04));
  const square = half - gap / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={square} height={square} fill="#F25022" />
      <Rect x={half + gap / 2} y={0} width={square} height={square} fill="#7FBA00" />
      <Rect x={0} y={half + gap / 2} width={square} height={square} fill="#00A4EF" />
      <Rect x={half + gap / 2} y={half + gap / 2} width={square} height={square} fill="#FFB900" />
    </Svg>
  );
}

/**
 * The Apple logo as SVG, used by our custom Apple sign-in button so we can
 * align it with the other provider buttons. Apple's brand guide allows
 * custom buttons as long as the visual elements (logo, label, contrast,
 * minimum height) are respected.
 */
function AppleIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </Svg>
  );
}

/**
 * A consistent OAuth/alternative-auth button. Brand icon hard-left at the
 * button's leading edge, label centred in the remaining space. Used by
 * Microsoft, Mobile, and Apple so all three line up visually.
 *
 * Variants:
 *   - `light` (default) — white surface, soft border, dark text. Used for
 *     Microsoft and Mobile.
 *   - `dark` — black surface, no border, white text. Used for Apple so the
 *     button reads as the Apple-brand button it represents.
 */
function AuthProviderButton({
  icon,
  label,
  onPress,
  disabled,
  variant = 'light',
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'light' | 'dark';
}) {
  const isDark = variant === 'dark';
  return (
    <TouchableOpacity
      style={[
        authButtonStyles.container,
        isDark && authButtonStyles.containerDark,
        disabled && authButtonStyles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={authButtonStyles.iconWrap}>{icon}</View>
      <Text style={[authButtonStyles.label, isDark && authButtonStyles.labelDark]}>
        {label}
      </Text>
      {/* Right-side spacer matches iconWrap width so the label stays
          visually centred between the two edges. */}
      <View style={authButtonStyles.iconWrap} />
    </TouchableOpacity>
  );
}

WebBrowser.maybeCompleteAuthSession();

const MICROSOFT_CLIENT_ID = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID ?? '';
const MICROSOFT_TENANT = 'common';

const microsoftDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT}/oauth2/v2.0/token`,
};

type AuthMode = 'login' | 'signup';

/** Basic RFC 5322-friendly email pattern — good enough for client-side UX validation. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [over17, setOver17] = useState(false);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Auth'>>();
    const { login, signup, loginWithMicrosoft, loginWithApple, isLoading, error } = useAuth();

    const [forgotLoading, setForgotLoading] = useState(false);
    const [checkingMigration, setCheckingMigration] = useState(false);
    const insets = useSafeAreaInsets();

    const [appleAvailable, setAppleAvailable] = useState(false);
    useEffect(() => {
        if (Platform.OS !== 'ios') return;
        AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
    }, []);

    // Microsoft OAuth PKCE flow
    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'emotionalpulse', path: 'auth' });

    const [msRequest, msResponse, promptMsAsync] = AuthSession.useAuthRequest(
        {
            clientId: MICROSOFT_CLIENT_ID,
            scopes: [
                'openid',
                'profile',
                'email',
                'offline_access',
                'https://graph.microsoft.com/User.Read',
            ],
            redirectUri,
            responseType: AuthSession.ResponseType.Code,
            usePKCE: true,
        },
        microsoftDiscovery,
    );

    useEffect(() => {
        if (msResponse?.type === 'success' && msRequest?.codeVerifier) {
            const { code } = msResponse.params;
            // Pass redirect URI as domain so the backend can use the correct
            // redirect_uri when exchanging the code with Microsoft.
            loginWithMicrosoft(code, msRequest.codeVerifier, redirectUri).catch((e) => {
                if (__DEV__) {
                    const body = e?.body ? JSON.stringify(e.body) : '';
                    const msg = [e?.message, body].filter(Boolean).join('\n\n');
                    Alert.alert('DEBUG: MS Login', msg || JSON.stringify(e));
                } else {
                    Alert.alert('Microsoft Login Failed', 'Something went wrong. Please try again.');
                }
            });
        } else if (msResponse?.type === 'error') {
            Alert.alert('Microsoft Login Failed', msResponse.error?.message ?? 'Authentication was cancelled.');
        }
    }, [msResponse]);

    async function handleAuth() {
        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please enter your email and password.');
            return;
        }
        if (!EMAIL_REGEX.test(email.trim())) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        if (mode === 'signup' && password.length < 8) {
            Alert.alert('Weak Password', 'Password must be at least 8 characters.');
            return;
        }

        try {
            if (mode === 'login') {
                // Migration pre-check: decides whether this email signs in
                // normally, needs an emailed-code migration, or has no
                // password account (mobile only). If the check itself fails
                // we fall back to a normal login so a flaky endpoint can
                // never lock out existing users.
                const trimmedEmail = email.trim();
                let migration: Awaited<ReturnType<typeof authApi.isMigratedUser>>;
                setCheckingMigration(true);
                try {
                    migration = await authApi.isMigratedUser(trimmedEmail);
                } catch {
                    // The pre-check is REQUIRED, not best-effort. A migrated
                    // user's old password is dead, so silently falling back to
                    // login() would guarantee a failed login and a confusing
                    // lockout for exactly the users this flow exists for.
                    // Surface a clear, retryable error and stop here.
                    Alert.alert(
                        'Connection problem',
                        "We couldn't verify your account just now. Please check your connection and try again.",
                    );
                    return;
                } finally {
                    setCheckingMigration(false);
                }

                // Observability at a critical branch point — the HTTP client
                // never logs 200 bodies, so without this we're blind to why
                // a given email routed to login vs email vs phone.
                logger.log('[AuthScreen] is_migrated_user1 →', JSON.stringify(migration));

                if (migration.response === 'phone') {
                    navigation.navigate('AccountNotFound', { email: trimmedEmail });
                    return;
                }
                if (migration.response === 'email') {
                    const migratedUserId = Number(migration.user);
                    if (!Number.isInteger(migratedUserId) || migratedUserId <= 0) {
                        Alert.alert(
                            'Something went wrong',
                            'We could not start your account migration. Please contact support.',
                        );
                        return;
                    }
                    try {
                        await authApi.generateCodeWithId('email', migratedUserId);
                    } catch {
                        Alert.alert(
                            'Could not send code',
                            'We could not send your verification code. Please try again.',
                        );
                        return;
                    }
                    navigation.navigate('MigrationVerify', {
                        email: trimmedEmail,
                        userId: migration.user,
                    });
                    return;
                }
                // 'login' (or any unexpected value): a non-migrated user has a
                // working password, so a normal login is the safe default.
                await login(email, password);
            } else {
                if (!over17) {
                    Alert.alert(
                        'Age confirmation required',
                        'Emotional Pulse is intended for people aged 17 and over. Please confirm before continuing.',
                    );
                    return;
                }
                // Name + country are no longer collected here. Empty
                // values are deliberate — AppleNameCaptureScreen gates
                // any authenticated user with an empty firstName and
                // collects {firstName, lastName, country, avatar} via
                // PATCH /user/update/profile before the rest of the app
                // can render. The gate fires for email signups too, not
                // just Apple sign-ins.
                await signup({
                    email,
                    password,
                    firstName: '',
                    lastName: '',
                    country: '',
                });
            }
        } catch (e) {
            Alert.alert(
                mode === 'login' ? 'Sign In Failed' : 'Sign Up Failed',
                error ?? 'Something went wrong. Please try again.'
            );
        }
    }

    async function handleMicrosoftLogin() {
        if (!MICROSOFT_CLIENT_ID) {
            Sentry.captureMessage('AuthScreen: Microsoft sign-in pressed but EXPO_PUBLIC_MICROSOFT_CLIENT_ID is not set');
            Alert.alert('Sign-in unavailable', 'Microsoft sign-in is temporarily unavailable. Please try email or another method.');
            return;
        }
        await promptMsAsync();
    }

    async function handleAppleLogin() {
        try {
            // Generate a raw nonce client-side and send its SHA-256 hash to Apple.
            // The hash is what Apple embeds in the identity token's `nonce` claim.
            // The backend re-hashes the raw nonce and verifies it matches the claim,
            // which prevents replay of a stolen identity token.
            const rawNonce = Crypto.randomUUID();
            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                rawNonce,
            );

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });

            if (!credential.identityToken) {
                Alert.alert('Apple Login Failed', 'Apple did not return an identity token. Please try again.');
                return;
            }

            // Apple only sends fullName on the FIRST authorization for this
            // app — every later credential.fullName is null. Persist it
            // immediately so a backend failure + retry doesn't lose it, and
            // merge a previously-cached name back in when Apple sends none.
            const credentialFirst = credential.fullName?.givenName ?? undefined;
            const credentialLast = credential.fullName?.familyName ?? undefined;
            if (credentialFirst || credentialLast) {
                await writeAppleNameCache(credential.user, {
                    firstName: credentialFirst,
                    lastName: credentialLast,
                });
            }
            const cachedName = await readAppleNameCache(credential.user);

            await loginWithApple({
                identityToken: credential.identityToken,
                rawNonce,
                authorizationCode: credential.authorizationCode,
                firstName: credentialFirst ?? cachedName?.firstName,
                lastName: credentialLast ?? cachedName?.lastName,
                email: credential.email,
                appleUserId: credential.user,
            });
        } catch (e: any) {
            // ERR_REQUEST_CANCELED fires when the user dismisses the Apple sheet —
            // treat as a silent no-op rather than surfacing an error.
            if (e?.code === 'ERR_REQUEST_CANCELED') return;
            if (__DEV__) {
                const body = e?.body ? JSON.stringify(e.body) : '';
                const msg = [e?.message, body].filter(Boolean).join('\n\n');
                Alert.alert('DEBUG: Apple Login', msg || JSON.stringify(e));
            } else {
                Alert.alert('Apple Login Failed', 'Something went wrong. Please try again.');
            }
        }
    }

    async function handleForgotPassword() {
        const trimmed = email.trim();
        if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
            Alert.alert(
                'Enter your email',
                'Type the email address for your account above, then tap "Forgot password?" again.',
            );
            return;
        }
        setForgotLoading(true);
        try {
            await authApi.requestPasswordReset(trimmed);
        } catch {
            // Swallow — we always show the same generic confirmation so the
            // response can't be used to probe which emails are registered.
        } finally {
            setForgotLoading(false);
            Alert.alert(
                'Check your inbox',
                "If an account exists for that email, we've sent a link to reset your password. The link may take a minute to arrive.",
            );
        }
    }

    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'signup' : 'login');
    };

    const hasMicrosoft = !!MICROSOFT_CLIENT_ID;
    const hasApple = Platform.OS === 'ios' && appleAvailable;
    const hasMobile = mode === 'login';
    const hasAlternativeSignIn = hasMicrosoft || hasApple || hasMobile;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        <Image
                            source={require('../../../assets/Logo.png')}
                            style={styles.logo}
                        />
                        <Text style={styles.title}>Emotional Pulse</Text>

                        <Text style={styles.subtitle}>
                            {mode === 'login' ? 'Welcome back' : 'Create your account'}
                        </Text>

                        {/* Name + country no longer collected here — see signup() call
                            for context. AppleNameCaptureScreen is the post-auth gate
                            that collects them. */}

                        <TextInput
                            style={styles.input}
                            onChangeText={setEmail}
                            value={email}
                            placeholder="email@address.com"
                            placeholderTextColor={colors.textPlaceholder}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            onChangeText={setPassword}
                            value={password}
                            secureTextEntry
                            placeholder="Password"
                            placeholderTextColor={colors.textPlaceholder}
                            autoCapitalize="none"
                        />

                        {mode === 'signup' && (
                            <TouchableOpacity
                                style={styles.ageCheckRow}
                                onPress={() => setOver17((prev) => !prev)}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: over17 }}
                                accessibilityLabel="I am 17 years of age or older"
                            >
                                <View style={[styles.checkbox, over17 && styles.checkboxChecked]}>
                                    {over17 && <Check color={colors.textOnPrimary} size={14} strokeWidth={3} />}
                                </View>
                                <Text style={styles.ageCheckText}>I am 17 years of age or older</Text>
                            </TouchableOpacity>
                        )}

                        {mode === 'login' && (
                            <TouchableOpacity
                                onPress={handleForgotPassword}
                                disabled={forgotLoading}
                                style={styles.forgotPasswordRow}
                                accessibilityRole="button"
                                accessibilityLabel="Forgot password"
                            >
                                <Text style={styles.forgotPasswordText}>
                                    {forgotLoading ? 'Sending…' : 'Forgot password?'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <Button
                            title={mode === 'login' ? 'Sign in' : 'Sign up'}
                            onPress={handleAuth}
                            loading={isLoading || checkingMigration}
                            style={styles.mainButton}
                        />

                        {hasAlternativeSignIn && (
                            <>
                                <View style={styles.dividerRow}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>
                                        Or {mode === 'login' ? 'sign in' : 'sign up'} with
                                    </Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                {hasMicrosoft && (
                                    <AuthProviderButton
                                        icon={<MicrosoftIcon size={20} />}
                                        label={mode === 'login' ? 'Sign in with Microsoft' : 'Sign up with Microsoft'}
                                        onPress={handleMicrosoftLogin}
                                    />
                                )}

                                {hasMobile && (
                                    <AuthProviderButton
                                        icon={<Smartphone size={20} color={colors.textPrimary} />}
                                        label="Sign in with Mobile"
                                        onPress={() => navigation.navigate('MobileSignIn')}
                                    />
                                )}

                                {hasApple && (
                                    <AuthProviderButton
                                        icon={<AppleIcon size={20} color="#FFFFFF" />}
                                        label={mode === 'login' ? 'Sign in with Apple' : 'Sign up with Apple'}
                                        onPress={handleAppleLogin}
                                        variant="dark"
                                    />
                                )}
                            </>
                        )}

                        {mode === 'signup' && (
                            <Text style={styles.legalText}>
                                By signing up you agree to our{' '}
                                <Text
                                    style={styles.legalLink}
                                    onPress={() => WebBrowser.openBrowserAsync('https://app.emotionalpulse.ai/terms')}
                                >
                                    Terms
                                </Text>
                                {' '}and{' '}
                                <Text
                                    style={styles.legalLink}
                                    onPress={() => WebBrowser.openBrowserAsync('https://app.emotionalpulse.ai/privacy')}
                                >
                                    Privacy Policy
                                </Text>
                                .
                            </Text>
                        )}

                        <TouchableOpacity
                            onPress={toggleMode}
                            style={styles.modeToggle}
                        >
                            <Text style={styles.modeToggleText}>
                                {mode === 'login'
                                    ? "Don't have an account? Sign up"
                                    : "Already have an account? Sign in"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <TouchableOpacity
                style={[styles.helpButton, { top: insets.top + spacing.xs }]}
                onPress={presentIntercom}
                accessibilityRole="button"
                accessibilityLabel="Get help"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <HelpCircle size={18} color={colors.textSecondary} />
                <Text style={styles.helpButtonText}>Help</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    helpButton: {
        // `top` is set inline using `insets.top + spacing.xs` so the button
        // sits below the iPhone notch / Android status bar instead of being
        // clipped by it. SafeAreaView applies the inset as padding to itself,
        // but absolutely-positioned children are still positioned relative
        // to the SafeAreaView's outer border, not the inset content area.
        position: 'absolute',
        right: spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    helpButtonText: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        // ~16px gutter on each side (mobile auth standard). Card adds
        // vertical breathing room only — no horizontal padding so inputs
        // span the full content width.
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.lg,
    },
    card: {
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.lg,
    },
    logo: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignSelf: 'center',
        marginBottom: spacing.base,
    },
    title: {
        fontSize: fontSizes['3xl'],
        // Quicksand bold — design-system heading font. Body fonts are
        // Manrope (used for everything else on this screen).
        fontFamily: fonts.heading,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: fontSizes.lg,
        fontFamily: fonts.bodyMedium,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.button,
        padding: spacing.base,
        marginBottom: spacing.base,
        fontSize: fontSizes.base,
        fontFamily: fonts.body,
        color: colors.textPrimary,
    },
    inputLast: {
        marginBottom: spacing.xl,
    },
    mainButton: {
        marginBottom: spacing.lg,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.base,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.borderLight,
    },
    dividerText: {
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.sm,
        color: colors.textMuted,
        marginHorizontal: spacing.sm,
    },
    forgotPasswordRow: {
        alignSelf: 'flex-end',
        marginTop: -spacing.sm,
        marginBottom: spacing.base,
        paddingVertical: spacing.xs,
    },
    forgotPasswordText: {
        color: colors.primary,
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.sm,
    },
    legalText: {
        fontFamily: fonts.body,
        fontSize: fontSizes.xs,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: spacing.base,
        paddingHorizontal: spacing.sm,
    },
    legalLink: {
        color: colors.primary,
        fontFamily: fonts.bodySemiBold,
    },
    modeToggle: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    modeToggleText: {
        color: colors.primary,
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.sm,
    },
    ageCheckRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.base,
        paddingVertical: 4,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        backgroundColor: colors.background,
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    ageCheckText: {
        flex: 1,
        fontFamily: fonts.body,
        fontSize: fontSizes.sm,
        color: colors.textPrimary,
    },
});

const authButtonStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        paddingHorizontal: spacing.base,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.button,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    containerDark: {
        backgroundColor: '#000000',
        borderColor: '#000000',
    },
    disabled: {
        opacity: 0.5,
    },
    iconWrap: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        flex: 1,
        textAlign: 'center',
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.base,
        color: colors.textPrimary,
    },
    labelDark: {
        color: '#FFFFFF',
    },
});
