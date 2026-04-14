import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { colors, fonts, fontSizes } from '../theme';

export interface RecentCheckInPair {
  id: string;
  name: string;
  status: string | null;
  time: string;
  avatar: string;
}

const MOCK_PAIRS: RecentCheckInPair[] = [
  { id: '1', name: 'Sarah', status: 'happy', time: '2h ago', avatar: 'https://i.pravatar.cc/100?u=sarah' },
  { id: '2', name: 'Mike', status: 'strained', time: '4h ago', avatar: 'https://i.pravatar.cc/100?u=mike' },
  { id: '3', name: 'Jess', status: 'calm', time: '1d ago', avatar: 'https://i.pravatar.cc/100?u=jess' },
  { id: '4', name: 'Tom', status: null, time: '3d ago', avatar: 'https://i.pravatar.cc/100?u=tom' },
];

interface RecentCheckInsProps {
  pairs?: RecentCheckInPair[];
  onInvitePress?: () => void;
  onPairPress?: (pair: RecentCheckInPair) => void;
}

export default function RecentCheckIns({
  pairs = MOCK_PAIRS,
  onInvitePress,
  onPairPress,
}: RecentCheckInsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Check-ins</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {pairs.map((pair) => (
          <TouchableOpacity
            key={pair.id}
            style={styles.item}
            onPress={() => onPairPress?.(pair)}
            activeOpacity={0.8}
          >
            <Avatar
              source={pair.avatar}
              name={pair.name}
              size="xl"
              borderRadius={28}
              border={{ width: 2, color: pair.status ? colors.primary : colors.border }}
            />
            <Text style={styles.name}>{pair.name}</Text>
            <Text style={styles.time}>{pair.time}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.item} onPress={onInvitePress}>
          <View style={styles.inviteCircle}>
            <Text style={styles.invitePlus}>+</Text>
          </View>
          <Text style={styles.name}>Invite</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 32 },
  title: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  scroll: { flexDirection: 'row' },
  item: { alignItems: 'center', marginRight: 16 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarActive: { borderColor: colors.primary },
  avatarInactive: { borderColor: colors.border },
  avatarImage: { width: '100%', height: '100%' },
  name: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bodyMedium,
    color: colors.textPrimary,
    marginTop: 4,
  },
  time: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.body,
    color: colors.textPlaceholder,
  },
  inviteCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textPlaceholder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitePlus: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.body,
    color: colors.textPlaceholder,
  },
});
