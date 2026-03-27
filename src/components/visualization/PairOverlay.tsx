import React from 'react';
import { View, Text } from 'react-native';

interface PairOverlayProps {
    userNames: string[];
}

export default function PairOverlay({ userNames }: PairOverlayProps) {
    if (!userNames || userNames.length === 0) return null;
    return (
        <View className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center bg-black/5 rounded-[24px]">
            <View className="flex-row items-center justify-center space-x-1">
                {userNames.slice(0, 2).map((name, i) => (
                    <View key={i} className="w-6 h-6 rounded-full border-2 border-white bg-indigo-500 items-center justify-center">
                        <Text className="text-[8px] font-bold text-white">{name[0]}</Text>
                    </View>
                ))}
                {userNames.length > 2 && (
                    <View className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 items-center justify-center">
                        <Text className="text-[8px] font-bold text-gray-600">+{userNames.length - 2}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}
