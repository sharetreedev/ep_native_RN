import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MainTabParamList } from '../types/navigation';
import MyPulseScreen from '../screens/MyPulseScreen/MyPulseScreen';
import { Blend, Activity, Users, Globe } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

import MyPairsScreen from '../screens/MyPairsScreen/MyPairsScreen';
import GlobalPulseScreen from '../screens/GlobalPulseScreen/GlobalPulseScreen';
import GroupsScreen from '../screens/GroupsScreen/GroupsScreen';
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
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingBottom: insets.bottom,
                    height: 60 + insets.bottom,
                },
                tabBarIndicatorStyle: {
                    backgroundColor: colors.primary,
                    top: 0,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontSize: fontSizes.xs,
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
                    tabBarLabel: 'My Pulse',
                    tabBarIcon: ({ color }) => <Activity color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="MyPairs"
                component={MyPairsScreen}
                options={{
                    tabBarLabel: 'Pairs',
                    tabBarIcon: ({ color }) => <Blend color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="Groups"
                component={GroupsScreen}
                options={{
                    tabBarLabel: 'Groups',
                    tabBarIcon: ({ color }) => <Users color={color} size={24} />,
                }}
            />
            <Tab.Screen
                name="GlobalPulse"
                component={GlobalPulseScreen}
                options={{
                    tabBarLabel: 'Global',
                    tabBarIcon: ({ color }) => <Globe color={color} size={24} />,
                }}
            />

        </Tab.Navigator>
    );
}
