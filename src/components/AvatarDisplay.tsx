import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle, ImageSourcePropType } from 'react-native';
import { colors, fonts, fontSizes } from '../theme';

interface AvatarDisplayProps {
  imageUrl?: string | null;
  fallbackText?: string;
  fallbackTextColor?: string;
  fallbackIcon?: React.ReactNode;
  fallbackImage?: ImageSourcePropType;
  size: number;
  borderRadius?: number;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  style?: ViewStyle;
}

export default function AvatarDisplay({
  imageUrl,
  fallbackText,
  fallbackTextColor,
  fallbackIcon,
  fallbackImage,
  size,
  borderRadius = size * 0.25,
  backgroundColor = colors.primaryLight,
  borderWidth,
  borderColor,
  style,
}: AvatarDisplayProps) {
  const imageStyle = {
    width: size,
    height: size,
    borderRadius,
    ...(borderWidth != null && { borderWidth, borderColor }),
  };

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={[imageStyle as ImageStyle, style as ImageStyle]} resizeMode="cover" />;
  }

  if (fallbackImage) {
    return <Image source={fallbackImage} style={[imageStyle as ImageStyle, style as ImageStyle]} />;
  }

  const fontSize = size <= 28
    ? fontSizes.xs
    : size <= 40
      ? fontSizes.sm
      : size <= 48
        ? fontSizes.base
        : fontSizes['3xl'];

  return (
    <View
      style={[
        styles.fallbackContainer,
        { width: size, height: size, borderRadius, backgroundColor },
        borderWidth != null && { borderWidth, borderColor },
        style,
      ]}
    >
      {fallbackIcon ?? (
        <Text style={[styles.fallbackText, { fontSize }, fallbackTextColor != null && { color: fallbackTextColor }]}>
          {fallbackText || '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallbackText: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
});
