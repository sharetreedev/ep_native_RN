import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import Button from '../../components/Button';
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
    const [countryPickerVisible, setCountryPickerVisible] = useState(false);
    const selectedCountryLabel = COUNTRIES.find((c) => c.value === country)?.label || '';

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Auth'>>();
    const { login, signup, loginWithMicrosoft, isLoading, error } = useAuth();

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
            Alert.alert('Configuration Error', 'EXPO_PUBLIC_MICROSOFT_CLIENT_ID is not set in your .env file.');
            return;
        }
        await promptMsAsync();
    }

    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'signup' : 'login');
    };

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
                                <TextInput
                                    style={styles.input}
                                    onChangeText={setFirstName}
                                    value={firstName}
                                    placeholder="First Name"
                                    placeholderTextColor={colors.textPlaceholder}
                                />
                                <TextInput
                                    style={styles.input}
                                    onChangeText={setLastName}
                                    value={lastName}
                                    placeholder="Last Name"
                                    placeholderTextColor={colors.textPlaceholder}
                                />
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
                            style={[styles.input, styles.inputLast]}
                            onChangeText={setPassword}
                            value={password}
                            secureTextEntry
                            placeholder="Password"
                            placeholderTextColor={colors.textPlaceholder}
                            autoCapitalize="none"
                        />

                        <Button
                            title={mode === 'login' ? 'Sign in' : 'Sign up'}
                            onPress={handleAuth}
                            loading={isLoading}
                            style={styles.mainButton}
                        />

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

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.line} />
                        </View>

                        <Button
                            title="Sign in with Microsoft"
                            onPress={handleMicrosoftLogin}
                            variant="secondary"
                            style={styles.ssoButton}
                        />

                        <Button
                            title="Sign in via mobile"
                            onPress={() => navigation.navigate('MobileSignIn')}
                            variant="secondary"
                            style={styles.mobileButton}
                        />
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
    modeToggle: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    modeToggleText: {
        color: colors.primary,
        fontFamily: fonts.bodySemiBold,
        fontSize: fontSizes.sm,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        marginHorizontal: spacing.base,
        color: colors.textMuted,
        fontFamily: fonts.bodyMedium,
        fontSize: fontSizes.xs,
    },
    ssoButton: {
        marginBottom: spacing.base,
    },
    mobileButton: {
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
});


