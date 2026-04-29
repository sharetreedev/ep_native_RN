import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MainTabParamList } from '../types/navigation';
import MyPulseScreen from '../screens/MyPulseScreen/MyPulseScreen';
import { Home, Activity, Hand } from 'lucide-react-native';
import { colors, fonts } from '../theme';
import { useMyPulseVersion } from '../hooks/useMyPulseVersion';

import PulseNavigator from './PulseNavigator';
import EmergencyServicesScreen from '../screens/EmergencyServicesScreen/EmergencyServicesScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createMaterialTopTabNavigator<MainTabParamList>();

export default function TabNavigator() {
    const insets = useSafeAreaInsets();
    const { version: pulseVersion } = useMyPulseVersion();
    // Track which tab is currently active so we can scope the v2 tab-bar
    // restyle to "user is actually looking at v2 MyPulse" — not just
    // "v2 is enabled in settings".
    const [activeRoute, setActiveRoute] = useState<keyof MainTabParamList>('MyPulse');
    const isViewingV2 = pulseVersion === 'v2' && activeRoute === 'MyPulse';

    return (
        <Tab.Navigator
            id="MainTabs"
            tabBarPosition="bottom"
            screenListeners={{
                state: (e) => {
                    const state = (e.data as { state?: { index: number; routes: { name: string }[] } } | undefined)?.state;
                    const name = state?.routes[state.index]?.name as keyof MainTabParamList | undefined;
                    if (name) setActiveRoute(name);
                },
            }}
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: isViewingV2 ? '#FFFFFF' : colors.background,
                    borderTopWidth: isViewingV2 ? StyleSheet.hairlineWidth : 0,
                    borderTopColor: isViewingV2 ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                    paddingBottom: insets.bottom,
                    paddingHorizontal: 4,
                    height: 60 + insets.bottom,
                },
                tabBarIndicatorStyle: {
                    backgroundColor: colors.primary,
                    top: 0,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontFamily: fonts.bodySemiBold,
                    textTransform: 'none',
                    marginTop: 0,
                },
                swipeEnabled: true,
                lazy: true,
            }}
        >
            <Tab.Screen
                name="MyPulse"
                component={MyPulseScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="Pulse"
                component={PulseNavigator}
                options={{
                    tabBarLabel: 'Pulse',
                    tabBarIcon: ({ color }) => <Activity color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="GetSupport"
                component={EmergencyServicesScreen}
                options={{
                    tabBarLabel: 'Get Support',
                    tabBarIcon: ({ color }) => <Hand color={color} size={24} />,
                }}
            />
        </Tab.Navigator>
    );
}
