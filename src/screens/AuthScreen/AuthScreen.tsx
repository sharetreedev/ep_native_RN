import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { auth as authApi } from '../../api';
import { ChevronDown, Check } from 'lucide-react-native';
import * as Sentry from '@sentry/react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import Button from '../../components/Button';
import BottomSheet from '../../components/BottomSheet';
import ModalPicker from '../../components/ModalPicker';
import { COUNTRIES } from '../../constants/countries';

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
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [country, setCountry] = useState('');
    const [over17, setOver17] = useState(false);
    const [countryPickerVisible, setCountryPickerVisible] = useState(false);
    const selectedCountryLabel = COUNTRIES.find((c) => c.value === country)?.label || '';

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Auth'>>();
    const { login, signup, loginWithMicrosoft, loginWithApple, isLoading, error } = useAuth();

    const [forgotLoading, setForgotLoading] = useState(false);
    const [otherSignInVisible, setOtherSignInVisible] = useState(false);

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
                await login(email, password);
            } else {
                if (!firstName || !lastName || !country) {
                    Alert.alert('Missing Fields', 'Please fill in all required fields.');
                    return;
                }
                if (!over17) {
                    Alert.alert(
                        'Age confirmation required',
                        'Emotional Pulse is intended for people aged 17 and over. Please confirm before continuing.',
                    );
                    return;
                }
                await signup({
                    email,
                    password,
                    firstName,
                    lastName,
                    country,
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

            await loginWithApple({
                identityToken: credential.identityToken,
                rawNonce,
                authorizationCode: credential.authorizationCode,
                firstName: credential.fullName?.givenName,
                lastName: credential.fullName?.familyName,
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

    const closeOtherSignIn = () => setOtherSignInVisible(false);

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

                        {mode === 'signup' && (
                            <>
                                <View style={styles.nameRow}>
                                    <TextInput
                                        style={[styles.input, styles.nameInput]}
                                        onChangeText={setFirstName}
                                        value={firstName}
                                        placeholder="First Name"
                                        placeholderTextColor={colors.textPlaceholder}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.nameInput, styles.nameInputLast]}
                                        onChangeText={setLastName}
                                        value={lastName}
                                        placeholder="Last Name"
                                        placeholderTextColor={colors.textPlaceholder}
                                    />
                                </View>
                                <TouchableOpacity
                                    style={styles.countryPicker}
                                    onPress={() => setCountryPickerVisible(true)}
                                >
                                    <Text
                                        style={[
                                            styles.countryPickerText,
                                            !selectedCountryLabel && styles.countryPickerPlaceholder,
                                        ]}
                                    >
                                        {selectedCountryLabel || 'Country'}
                                    </Text>
                                    <ChevronDown color={colors.textMuted} size={18} />
                                </TouchableOpacity>

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
                            </>
                        )}

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
                            style={[styles.input, mode === 'login' ? null : styles.inputLast]}
                            onChangeText={setPassword}
                            value={password}
                            secureTextEntry
                            placeholder="Password"
                            placeholderTextColor={colors.textPlaceholder}
                            autoCapitalize="none"
                        />

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
                            loading={isLoading}
                            style={styles.mainButton}
                        />

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

                        {hasAlternativeSignIn && (
                            <Button
                                title={mode === 'login' ? 'Sign in another way' : 'Sign up another way'}
                                onPress={() => setOtherSignInVisible(true)}
                                variant="secondary"
                            />
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <ModalPicker
                visible={countryPickerVisible}
                onDismiss={() => setCountryPickerVisible(false)}
                data={COUNTRIES}
                selectedValue={country}
                onSelect={(item) => {
                    setCountry(item.value as string);
                    setCountryPickerVisible(false);
                }}
            />
            <BottomSheet
                visible={otherSignInVisible}
                onDismiss={closeOtherSignIn}
                title={mode === 'login' ? 'More ways to sign in' : 'More ways to sign up'}
            >
                {hasMicrosoft && (
                    <Button
                        title={mode === 'login' ? 'Sign in with Microsoft' : 'Sign up with Microsoft'}
                        onPress={() => {
                            closeOtherSignIn();
                            handleMicrosoftLogin();
                        }}
                        variant="secondary"
                        style={styles.sheetButton}
                    />
                )}

                {hasMobile && (
                    <Button
                        title="Sign in with Mobile"
                        onPress={() => {
                            closeOtherSignIn();
                            navigation.navigate('MobileSignIn');
                        }}
                        variant="secondary"
                        style={styles.sheetButton}
                    />
                )}

                {hasApple && (
                    <AppleAuthentication.AppleAuthenticationButton
                        buttonType={
                            mode === 'login'
                                ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                                : AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                        }
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                        cornerRadius={borderRadius.button}
                        style={styles.sheetAppleButton}
                        onPress={() => {
                            closeOtherSignIn();
                            handleAppleLogin();
                        }}
                    />
                )}

                <TouchableOpacity
                    onPress={closeOtherSignIn}
                    style={styles.sheetCancel}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                >
                    <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
            </BottomSheet>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.base,
    },
    card: {
        padding: spacing.xl,
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
        fontFamily: fonts.bodyBold,
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
        marginBottom: spacing.base,
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
        marginBottom: spacing.xl,
    },
    modeToggleText: {
        color: colors.primary,
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.sm,
    },
    sheetButton: {
        marginBottom: spacing.base,
    },
    sheetAppleButton: {
        height: 48,
        marginBottom: spacing.base,
    },
    sheetCancel: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
        marginTop: spacing.xs,
    },
    sheetCancelText: {
        color: colors.textMuted,
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.sm,
    },
    nameRow: {
        flexDirection: 'row',
    },
    nameInput: {
        flex: 1,
        marginRight: spacing.sm,
    },
    nameInputLast: {
        marginRight: 0,
    },
    countryPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.button,
        padding: spacing.base,
        marginBottom: spacing.base,
    },
    countryPickerText: {
        fontSize: fontSizes.base,
        fontFamily: fonts.body,
        color: colors.textPrimary,
    },
    countryPickerPlaceholder: {
        color: colors.textPlaceholder,
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


