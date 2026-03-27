import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { Emotion } from '../constants/emotions';
import { getEmotionFromPleasantnessAndEnergy, getEmotionLabelContrast } from '../lib/emotionUtils';
import { colors, fonts, fontSizes, borderRadius } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDER_WIDTH = SCREEN_WIDTH - 80;
const SLIDER_HEIGHT = 300; // For vertical slider

type Step = 'pleasantness' | 'energy' | 'result';

interface CheckInSliderFlowProps {
    onComplete: (emotion: Emotion) => void;
    onCancel: () => void;
}

export default function CheckInSliderFlow({ onComplete, onCancel }: CheckInSliderFlowProps) {
    const [step, setStep] = useState<Step>('pleasantness');
    const [pleasantness, setPleasantness] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [matchedEmotion, setMatchedEmotion] = useState<Emotion | null>(null);

    // Animation values for slider thumbs
    const panX = useRef(new Animated.Value(0)).current;
    const panY = useRef(new Animated.Value(0)).current;

    // Page transition animation
    const slideAnim = useRef(new Animated.Value(0)).current; // 0 = step 1, 1 = step 2, 2 = step 3

    useEffect(() => {
        if (step === 'result') {
            calculateEmotion();
        }
    }, [step]);

    const calculateEmotion = () => {
        const emotion = getEmotionFromPleasantnessAndEnergy(pleasantness, energy);
        setMatchedEmotion(emotion);
    };

    const goToStep = (nextStep: Step) => {
        try {
            console.log('goToStep called:', nextStep);
            let toValue = 0;
            if (nextStep === 'energy') toValue = 1;
            if (nextStep === 'result') toValue = 2;

            console.log('Animating to:', toValue);

            // Fix: Ensure we are using the native driver safely or fallback
            Animated.timing(slideAnim, {
                toValue,
                duration: 300,
                useNativeDriver: true,
            }).start(({ finished }) => {
                console.log('Animation finished:', finished);
                if (finished) {
                    setStep(nextStep);
                }
            });
        } catch (error) {
            console.error('Crash in goToStep:', error);
        }
    };

    // --- Horizontal Slider Responder (Pleasantness) ---
    const panResponderX = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                let dx = gestureState.dx;
                // Clamp
                if (dx < -SLIDER_WIDTH / 2) dx = -SLIDER_WIDTH / 2;
                if (dx > SLIDER_WIDTH / 2) dx = SLIDER_WIDTH / 2;
                panX.setValue(dx);

                // Approximate value -4 to 4
                const val = Math.round((dx / (SLIDER_WIDTH / 2)) * 4);
                setPleasantness(val);
            },
            onPanResponderRelease: (_, gestureState) => {
                // Snap to value
                const dx = gestureState.dx;
                let val = Math.round((dx / (SLIDER_WIDTH / 2)) * 4);
                // Clamp val
                if (val < -4) val = -4;
                if (val > 4) val = 4;

                setPleasantness(val);

                // Auto advance if value is chosen (not 0, or user moved significantly)
                // The requirement: "user selects a value and touch end and value is not 0, auto swipe"
                // Let's interpret "not 0" strictly? Or just if interactions happened? 
                // Let's stick to "val !== 0"

                if (val !== 0) {
                    goToStep('energy');
                } else {
                    // Spring back to 0 visually if they left it at 0? 
                    // Or just stay.
                    Animated.spring(panX, {
                        toValue: 0,
                        useNativeDriver: false
                    }).start();
                    setPleasantness(0);
                }
            }
        })
    ).current;

    // --- Vertical Slider Responder (Energy) ---
    const panResponderY = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                let dy = gestureState.dy;
                // Clamp (Inverted: Up is negative dy, but High Energy is Top)
                // Let's say Top (-Height/2) is value 4. Bottom (Height/2) is value -4.
                if (dy < -SLIDER_HEIGHT / 2) dy = -SLIDER_HEIGHT / 2;
                if (dy > SLIDER_HEIGHT / 2) dy = SLIDER_HEIGHT / 2;
                panY.setValue(dy);

                // Map dy to Energy
                // dy = -150 -> Energy 4
                // dy = 150 -> Energy -4
                const val = Math.round((dy / (-SLIDER_HEIGHT / 2)) * 4);
                setEnergy(val);
            },
            onPanResponderRelease: (_, gestureState) => {
                const dy = gestureState.dy;
                let val = Math.round((dy / (-SLIDER_HEIGHT / 2)) * 4);
                if (val < -4) val = -4;
                if (val > 4) val = 4;

                setEnergy(val);

                if (val !== 0) {
                    goToStep('result');
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: false
                    }).start();
                    setEnergy(0);
                }
            }
        })
    ).current;

    // --- Render Helpers ---

    const getSliderColor = (val: number) => {
        // "fill colour uses primaruy colour" - assuming our active green?
        // Or varying color based on value? 
        // Instructions: "fill colour uses primaruy colour"
        return colors.primary;
    };

    return (
        <View className="flex-1 overflow-hidden">

            {/* Slider Pages Container */}
            <Animated.View
                style={{
                    flex: 1,
                    flexDirection: 'row',
                    width: SCREEN_WIDTH * 3,
                    transform: [{
                        translateX: slideAnim.interpolate({
                            inputRange: [0, 1, 2],
                            outputRange: [0, -SCREEN_WIDTH, -SCREEN_WIDTH * 2]
                        })
                    }]
                }}
            >
                {/* Step 1: Pleasantness */}
                <View style={{ width: SCREEN_WIDTH }} className="items-center justify-center -mt-20">
                    <Text className="text-2xl font-bold text-gray-800 mb-12">How pleasant are you feeling today?</Text>

                    {/* Emojis */}
                    <View className="flex-row justify-between w-full px-10 mb-2">
                        <Text className="text-2xl">😫</Text>
                        <Text className="text-2xl">😐</Text>
                        <Text className="text-2xl">😊</Text>
                    </View>

                    {/* Slider Track */}
                    <View className="h-6 bg-gray-200 rounded-full w-[80%] relative justify-center">

                        {/* Fill from Center */}
                        {/* We need a view that starts at center and grows L or R */}
                        <View style={{
                            position: 'absolute',
                            left: '50%',
                            height: '100%',
                            backgroundColor: colors.primary,
                            width: `${Math.abs(pleasantness) * (50 / 4)}%` as any, // 50% is max width each side
                            marginLeft: (pleasantness < 0 ? `-${Math.abs(pleasantness) * (50 / 4)}%` : 0) as any,
                            borderTopLeftRadius: pleasantness < 0 ? 999 : 0,
                            borderBottomLeftRadius: pleasantness < 0 ? 999 : 0,
                            borderTopRightRadius: pleasantness > 0 ? 999 : 0,
                            borderBottomRightRadius: pleasantness > 0 ? 999 : 0,
                        }} />

                        {/* Thumb */}
                        <Animated.View
                            {...panResponderX.panHandlers}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                marginLeft: -16, // Half thumb size
                                transform: [{ translateX: panX }]
                            }}
                        >
                            <View style={{
                                width: 32, // w-8
                                height: 32, // h-8
                                backgroundColor: colors.surface,
                                borderRadius: borderRadius.full,
                                shadowColor: colors.shadow,
                                shadowOffset: { width: 0, height: 2 }, // shadow-md
                                shadowOpacity: 0.25, // shadow-md
                                shadowRadius: 3.84, // shadow-md
                                elevation: 5, // shadow-md for Android
                                borderWidth: 1, // border
                                borderColor: colors.border,
                            }} />
                        </Animated.View>
                    </View>

                    <View className="flex-row justify-between w-full px-10 mt-4">
                        <Text className="text-gray-500 font-medium">Unpleasant</Text>
                        <Text className="text-gray-500 font-medium">Pleasant</Text>
                    </View>
                </View>

                {/* Step 2: Energy */}
                <View style={{ width: SCREEN_WIDTH }} className="items-center justify-center -mt-20">
                    <Text className="text-2xl font-bold text-gray-800 mb-12">How much energy do you have?</Text>

                    <Text className="text-gray-800 font-semibold mb-4">High Energy</Text>

                    {/* Vertical Slider Track */}
                    <View className="w-6 bg-gray-200 rounded-full h-[300px] relative items-center">

                        {/* Fill */}
                        <View style={{
                            position: 'absolute',
                            top: '50%',
                            width: '100%',
                            backgroundColor: colors.primary,
                            height: `${Math.abs(energy) * (50 / 4)}%` as any,
                            marginTop: (energy > 0 ? `-${Math.abs(energy) * (50 / 4)}%` : 0) as any, // Wait, High energy is UP (negative dy)
                            // If Energy > 0 (Up), we grow UP from center.

                            // Let's re-verify dy map.
                            // dy negative -> Energy Positive.
                            // marginTop needs to shift UP if energy positive.

                            // Actually 'top' is 50%.
                            // If Energy=4 (Top), we want height 50%, margin-top: -50%.

                            borderTopLeftRadius: energy > 0 ? 999 : 0,
                            borderTopRightRadius: energy > 0 ? 999 : 0,
                            borderBottomLeftRadius: energy < 0 ? 999 : 0,
                            borderBottomRightRadius: energy < 0 ? 999 : 0,
                        }} />

                        {/* Thumb */}
                        <Animated.View
                            {...panResponderY.panHandlers}
                            style={{
                                position: 'absolute',
                                top: '50%', // Start at center
                                marginTop: -16,
                                transform: [{ translateY: panY }]
                            }}
                        >
                            <View style={{
                                width: 32,
                                height: 32,
                                backgroundColor: colors.surface,
                                borderRadius: borderRadius.full,
                                shadowColor: colors.shadow,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }} />
                        </Animated.View>
                    </View>

                    <Text className="text-gray-800 font-semibold mt-4">Low Energy</Text>
                </View>

                {/* Step 3: Result */}
                <View style={{ width: SCREEN_WIDTH }} className="items-center justify-center -mt-20">
                    <Text className="text-sm text-gray-500 mb-2">Based on your pleasantness & energy levels</Text>
                    <Text className="text-2xl font-bold text-gray-800 mb-6">Your Emotional State is:</Text>

                    {matchedEmotion && (
                        <View className={`${matchedEmotion.color} px-8 py-4 rounded-xl shadow-sm mb-10`}>
                            <Text className={`text-2xl font-bold ${getEmotionLabelContrast(matchedEmotion.id) === 'light' ? 'text-white' : 'text-gray-900'}`}>
                                {matchedEmotion.name}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={() => matchedEmotion && onComplete(matchedEmotion)}
                        style={{ backgroundColor: colors.primary, width: '80%', paddingVertical: 16, borderRadius: borderRadius.button }}
                        className="shadow-sm"
                    >
                        <Text className="text-white text-center font-bold text-lg">Check In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onCancel} className="mt-6">
                        <Text className="text-gray-500 font-medium">Back</Text>
                    </TouchableOpacity>
                </View>

            </Animated.View>

            {/* Bottom Button for Manual Advance (Optional or for Step 1/2 if 0 selected) */}
            {step !== 'result' && (
                <View className="absolute bottom-4 w-full px-6">
                    <TouchableOpacity
                        onPress={() => {
                            if (step === 'pleasantness') goToStep('energy');
                            if (step === 'energy') goToStep('result');
                        }}
                        className="bg-gray-200 py-4 rounded-xl items-center"
                    >
                        <Text className="text-gray-500 font-bold text-lg">Continue</Text>
                    </TouchableOpacity>

                    {step === 'energy' && (
                        <TouchableOpacity onPress={() => goToStep('pleasantness')} className="items-center mt-4">
                            <Text className="text-gray-500 font-medium">{'< Back'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}
