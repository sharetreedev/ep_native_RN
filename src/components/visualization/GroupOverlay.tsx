import React from 'react';
import { View, Text } from 'react-native';

interface GroupOverlayProps {
    count: number;
}

export default function GroupOverlay({ count }: GroupOverlayProps) {
    if (count <= 0) return null;
    return (
        <View className="absolute top-2 right-2 bg-white/90 rounded-full w-6 h-6 items-center justify-center shadow-sm">
            <Text className="text-[10px] font-bold text-indigo-600">{count}</Text>
        </View>
    );
}
