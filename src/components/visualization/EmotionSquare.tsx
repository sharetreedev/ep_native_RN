import React from 'react';
import { View, Text } from 'react-native';
import { Emotion } from './emotions';
import { getEmotionLabelContrast } from '../../lib/emotionUtils';
import { MappedEmotion } from '../../hooks/useEmotionStates';

interface EmotionSquareProps {
    emotion: Emotion | MappedEmotion;
    // These props are kept for API compatibility but touch is now handled
    // by the coordinate Pressables in PulseGrid that sit above this view.
    onPress?: (emotion: Emotion) => void;
    onLongPress?: (emotion: Emotion) => void;
    selected?: boolean;
}

export default function EmotionSquare({ emotion, selected }: EmotionSquareProps) {
    const isMapped = 'emotionColour' in emotion;
    const backgroundColor = isMapped && emotion.emotionColour ? emotion.emotionColour : undefined;

    return (
        <View
            style={backgroundColor ? { backgroundColor } : {}}
            className={`${!backgroundColor ? emotion.color : ''} w-full h-full rounded-[24px] shadow-sm overflow-hidden relative ${selected ? 'border-4 border-white' : ''}`}
        >
            {/* Emotion name centred — non-interactive, coordinate Pressables sit above */}
            <View className="absolute inset-0 justify-center items-center" pointerEvents="none">
                <Text
                    className={`font-bold text-xs text-center ${getEmotionLabelContrast(emotion.id) === 'light' ? 'text-white' : 'text-gray-900'}`}
                >
                    {emotion.name.charAt(0).toUpperCase() + emotion.name.slice(1).toLowerCase()}
                </Text>
            </View>
        </View>
    );
}
