import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { colors, fonts, fontSizes, borderRadius, spacing } from '../../theme';
import Button from '../../components/Button';

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [country, setCountry] = useState('');

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Auth'>>();
    const { login, signup, loginWithMicrosoft, isLoading, error } = useAuth();

    async function handleAuth() {
        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please enter your email and password.');
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
        // This is a placeholder for actual Microsoft SSO integration logic
        // which typically requires expo-auth-session or similar.
        Alert.alert('Microsoft SSO', 'Microsoft SSO requires additional configuration.');
        // Example call: await loginWithMicrosoft('azure-token', 'tenant-id');
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
                                <TextInput
                                    style={styles.input}
                                    onChangeText={setCountry}
                                    value={country}
                                    placeholder="Country"
                                    placeholderTextColor={colors.textPlaceholder}
                                />
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
    }
});


