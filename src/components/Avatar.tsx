import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, fontSizes } from '../theme';

// ─── Size tokens ────────────────────────────────────────────────────────────────

type AvatarSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZE_MAP: Record<AvatarSizeToken, { px: number; radius: number }> = {
  xs:   { px: 28, radius: 8 },
  sm:   { px: 36, radius: 10 },
  md:   { px: 40, radius: 12 },
  lg:   { px: 48, radius: 14 },
  xl:   { px: 56, radius: 16 },
  '2xl': { px: 96, radius: 24 },
};

// ─── Props ──────────────────────────────────────────────────────────────────────

interface AvatarProps {
  /** Image URL as string, or Xano-style { url: string } object. */
  source?: string | { url: string } | null;
  /** Full name — used to derive initials. */
  name?: string;
  /** Predefined size token OR explicit pixel number. Default: 'md' (40px). */
  size?: AvatarSizeToken | number;
  /** Override auto-derived initials. */
  initials?: string;
  /** Icon node instead of initials when no image. */
  fallbackIcon?: React.ReactNode;
  /** Static image fallback (e.g. app logo). */
  fallbackImage?: ImageSourcePropType;
  /** Border: color string → 2.5px border; or { width, color } for full control. */
  border?: string | { width: number; color: string };
  /** Shadow preset. Default: 'none'. */
  shadow?: 'none' | 'sm' | 'md';
  /** Opacity on the entire avatar (for staleness/inactive). Default: 1. */
  opacity?: number;
  /** 0–1 progress value. Renders the segmented SVG ring. */
  progress?: number;
  /** Stroke width for progress ring. Default: 2.5. */
  progressStrokeWidth?: number;
  /** Override default borderRadius (size * 0.28). */
  borderRadius?: number;
  /** When true, avatar fills its parent container (ignores size for dimensions, still uses size for font/radius). */
  fill?: boolean;
  /** Additional style on the outermost container. */
  style?: ViewStyle;
  /** Persistent hex colour for the initials-fallback background. When omitted
   *  (or when this user has no assigned hex), the avatar falls back to the
   *  default green gradient. Matches the WeWeb onboarding palette. */
  hexColour?: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function resolveImageUrl(source: AvatarProps['source']): string | null {
  if (!source) return null;
  if (typeof source === 'string') return source || null;
  if (typeof source === 'object' && 'url' in source) return source.url || null;
  return null;
}

function deriveInitials(name?: string, override?: string): string {
  if (override) return override;
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() || '?';
}

function resolveBorder(border?: AvatarProps['border']): { width: number; color: string } | null {
  if (!border) return null;
  if (typeof border === 'string') return { width: 2.5, color: border };
  return border;
}

function getFontSize(px: number): number {
  if (px <= 28) return fontSizes.xs;
  if (px <= 40) return fontSizes.sm;
  if (px <= 48) return fontSizes.base;
  if (px <= 56) return fontSizes.lg;
  return fontSizes['3xl'];
}

const SHADOW_SM: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 3,
};

const SHADOW_MD: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 4,
};

// ─── Progress Ring (ported from ProgressAvatar) ─────────────────────────────────

function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const midX = x + w / 2;
  return [
    `M ${midX} ${y}`,
    `L ${x + w - r} ${y}`,
    `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `L ${x + w} ${y + h - r}`,
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `L ${x + r} ${y + h}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `L ${x} ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    `Z`,
  ].join(' ');
}

function ProgressRing({
  totalSize,
  avatarBorderRadius,
  strokeWidth,
  progress,
}: {
  totalSize: number;
  avatarBorderRadius: number;
  strokeWidth: number;
  progress: number;
}) {
  const gap = 3;
  const ringRadius = avatarBorderRadius + gap + strokeWidth / 2;
  const ringSize = totalSize - strokeWidth;

  const straightH = ringSize - 2 * ringRadius;
  const straightV = ringSize - 2 * ringRadius;
  const cornerArc = (Math.PI / 2) * ringRadius;
  const perimeter = 2 * straightH + 2 * straightV + 4 * cornerArc;

  const segmentLength = perimeter / 4;
  const gapLength = 5;
  const arcLength = segmentLength - gapLength;

  const filledSegments = progress >= 1 ? 4
    : progress > 0.75 ? 4
    : progress > 0.5 ? 3
    : progress > 0.25 ? 2
    : progress > 0 ? 1
    : 0;

  const pathD = roundedRectPath(strokeWidth / 2, strokeWidth / 2, ringSize, ringSize, ringRadius);

  return (
    <Svg width={totalSize} height={totalSize} style={StyleSheet.absoluteFill}>
      {[0, 1, 2, 3].map((i) => (
        <Path
          key={i}
          d={pathD}
          fill="none"
          stroke={i < filledSegments ? colors.primary : '#C5C5BF'}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${perimeter - arcLength}`}
          strokeDashoffset={-(i * segmentLength + gapLength / 2)}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

// ─── Avatar Component ───────────────────────────────────────────────────────────

function Avatar({
  source,
  name,
  size = 'md',
  initials: initialsOverride,
  fallbackIcon,
  fallbackImage,
  border,
  shadow = 'none',
  opacity = 1,
  progress,
  progressStrokeWidth = 2.5,
  borderRadius: borderRadiusOverride,
  fill,
  style,
  hexColour,
}: AvatarProps) {
  // Resolve size
  const token = typeof size === 'string' ? SIZE_MAP[size] : null;
  const px = token?.px ?? (size as number);
  const defaultRadius = token?.radius ?? Math.round(px * 0.28);
  const radius = borderRadiusOverride ?? defaultRadius;

  // Resolve image
  const imageUrl = resolveImageUrl(source);

  // Resolve border
  const borderSpec = resolveBorder(border);

  // Resolve shadow
  const shadowStyle = shadow === 'sm' ? SHADOW_SM : shadow === 'md' ? SHADOW_MD : undefined;

  // Progress ring sizing
  const hasProgress = progress != null;
  const ringGap = 3;
  const totalSize = hasProgress ? px + (progressStrokeWidth + ringGap) * 2 : px;

  // Border adds to the outer size when present
  const borderWidth = borderSpec?.width ?? 0;
  const outerSize = hasProgress ? totalSize : px + borderWidth * 2;

  // Inner content
  const initials = deriveInitials(name, initialsOverride);
  const fontSize = getFontSize(px);

  // In fill mode, content stretches to 100%; otherwise uses fixed px dimensions
  const contentSize = fill
    ? { width: '100%' as const, height: '100%' as const, borderRadius: radius }
    : { width: px, height: px, borderRadius: radius };

  const renderContent = () => {
    if (imageUrl) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={contentSize}
          resizeMode="cover"
        />
      );
    }
    if (fallbackImage) {
      return (
        <Image
          source={fallbackImage}
          style={contentSize}
          resizeMode="cover"
        />
      );
    }
    if (fallbackIcon) {
      return (
        <View style={[styles.fallback, contentSize, { backgroundColor: colors.primary }]}>
          {fallbackIcon}
        </View>
      );
    }
    // Initials fallback — solid hex background when assigned, gradient otherwise.
    if (hexColour) {
      return (
        <View style={[styles.fallback, contentSize, { backgroundColor: hexColour }]}>
          <Text style={[styles.initialsText, { fontSize }]}>{initials}</Text>
        </View>
      );
    }
    return (
      <LinearGradient
        colors={['#91A27D', '#6B7D5A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fallback, contentSize]}
      >
        <Text style={[styles.initialsText, { fontSize }]}>{initials}</Text>
      </LinearGradient>
    );
  };

  return (
    <View
      style={[
        styles.outer,
        fill
          ? { width: '100%', height: '100%', opacity }
          : { width: outerSize, height: outerSize, opacity },
        style,
      ]}
    >
      {hasProgress && (
        <ProgressRing
          totalSize={totalSize}
          avatarBorderRadius={radius}
          strokeWidth={progressStrokeWidth}
          progress={progress!}
        />
      )}
      <View
        style={[
          styles.inner,
          { borderRadius: borderSpec ? radius + borderSpec.width : radius },
          fill && { width: '100%', height: '100%' },
          borderSpec && {
            borderWidth: borderSpec.width,
            borderColor: borderSpec.color,
          },
          shadowStyle,
        ]}
      >
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    overflow: 'hidden',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontFamily: fonts.bodyBold,
    color: colors.textOnPrimary,
  },
});

export default React.memo(Avatar);
