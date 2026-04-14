import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MainTabParamList } from '../types/navigation';
import MyPulseScreen from '../screens/MyPulseScreen/MyPulseScreen';
import { Home, Activity, Hand } from 'lucide-react-native';
import { colors, fonts } from '../theme';

import PulseNavigator from './PulseNavigator';
import EmergencyServicesScreen from '../screens/EmergencyServicesScreen/EmergencyServicesScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createMaterialTopTabNavigator<MainTabParamList>();

export default function TabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            id="MainTabs"
            tabBarPosition="bottom"
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopWidth: 0,
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
