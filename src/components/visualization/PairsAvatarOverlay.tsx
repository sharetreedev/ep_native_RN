import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import EmotionBadge from '../EmotionBadge';
import Avatar from '../Avatar';
import { colors, fonts, fontSizes } from '../../theme';

export type StalenessLevel = 'fresh' | 'stale24' | 'stale48';

export interface OverlayUser {
  /** Unique key for deduplication (e.g. pair record id) */
  id: string;
  /** User id for navigation */
  userId: string;
  /** Pair record id for navigation to UserProfile */
  pairsId?: number;
  name: string;
  avatarUrl?: string | null;
  /** Persistent hex colour used for the initials fallback when `avatarUrl` is empty. */
  hexColour?: string | null;
  isCurrentUser?: boolean;
  /** How stale the user's last check-in is */
  staleness?: StalenessLevel;
}

export interface CoordinateUsers {
  row: number; // 0-7
  col: number; // 0-7
  users: OverlayUser[];
}

interface PairsAvatarOverlayProps {
  /** Users grouped by their 8x8 coordinate position */
  points: CoordinateUsers[];
  /** Called when a user is pressed (single avatar or from modal) */
  onUserPress: (user: OverlayUser) => void;
  /** Resolves a grid position to its emotion info (for modal badge) */
  getEmotionInfo?: (row: number, col: number) => { name: string; colour: string } | undefined;
  /** Called when an empty cell is pressed (no avatars/orbs) */
  onCellPress?: (row: number, col: number) => void;
}

/**
 * 8x8 overlay that renders user avatars at their coordinate positions.
 * Designed to sit on top of PulseGrid alongside/replacing CoordinatesGrid.
 *
 * - Single user at a coordinate: shows their avatar (tappable → profile)
 * - Multiple users at same coordinate: shows a purple orb with count
 *   (tappable → modal listing users, styled like GroupsScreen selector)
 */
export default function PairsAvatarOverlay({
  points,
  onUserPress,
  getEmotionInfo,
  onCellPress,
}: PairsAvatarOverlayProps) {
  const [modalUsers, setModalUsers] = useState<OverlayUser[] | null>(null);
  const [modalEmotion, setModalEmotion] = useState<{ name: string; colour: string } | undefined>();

  // Build lookup: "row-col" → users (deduplicate by id)
  const gridMap: Record<string, OverlayUser[]> = {};
  points.forEach((p) => {
    const key = `${p.row}-${p.col}`;
    if (!gridMap[key]) gridMap[key] = [];
    p.users.forEach((u) => {
      if (!gridMap[key].some((existing) => existing.id === u.id)) {
        gridMap[key].push(u);
      }
    });
  });

  const renderSingleAvatar = (user: OverlayUser, size: 'full' | 'compact') => {
    const avatarOpacity = user.staleness === 'stale48' ? 0.5 : user.staleness === 'stale24' ? 0.75 : 1;
    const isStale = user.staleness === 'stale24' || user.staleness === 'stale48';
    const wrapStyle = size === 'compact' ? styles.avatarWrapCompact : styles.avatarWrap;
    const borderRadius = size === 'compact' ? 10 : 16;
    return (
      <TouchableOpacity
        key={user.id}
        style={wrapStyle}
        onPress={() => onUserPress(user)}
        activeOpacity={0.7}
      >
        <Avatar
          source={user.avatarUrl}
          name={user.name}
          hexColour={user.hexColour}
          fill
          borderRadius={borderRadius}
          opacity={avatarOpacity}
          border={isStale ? { width: 2, color: '#FDA33A' } : undefined}
          shadow={size === 'compact' ? 'sm' : 'md'}
        />
      </TouchableOpacity>
    );
  };

  const renderOrb = (row: number, col: number, users: OverlayUser[], size: 'full' | 'compact') => {
    const wrapStyle = size === 'compact' ? styles.avatarWrapCompact : styles.avatarWrap;
    return (
      <TouchableOpacity
        key={`orb-${row}-${col}`}
        style={wrapStyle}
        onPress={() => {
          setModalUsers(users);
          setModalEmotion(getEmotionInfo?.(row, col));
        }}
        activeOpacity={0.7}
      >
        <View style={styles.orbContainer}>
          <Svg width="140%" height="140%" viewBox="0 0 40 40" style={styles.orbSvg}>
            <Defs>
              <RadialGradient id={`glow-${row}-${col}`} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#A855F7" stopOpacity="0.6" />
                <Stop offset="50%" stopColor="#7C3AED" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="20" cy="20" r={19} fill={`url(#glow-${row}-${col})`} />
          </Svg>
          <Svg width="140%" height="140%" viewBox="0 0 40 40" style={styles.orbSvg}>
            <Defs>
              <RadialGradient id={`core-${row}-${col}`} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#C084FC" stopOpacity="0.85" />
                <Stop offset="70%" stopColor="#A855F7" stopOpacity="0.7" />
                <Stop offset="100%" stopColor="#7C3AED" stopOpacity="0.4" />
              </RadialGradient>
            </Defs>
            <Circle cx="20" cy="20" r={14} fill={`url(#core-${row}-${col})`} />
          </Svg>
          <Text style={size === 'compact' ? styles.orbTextCompact : styles.orbText}>{users.length}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCell = (row: number, col: number) => {
    const key = `${row}-${col}`;
    const users = gridMap[key];

    const cellStyle = [
      styles.cell,
      {
        borderRightWidth: col < 7 ? (col === 3 ? 1.5 : 0.5) : 0,
        borderBottomWidth: row < 7 ? (row === 3 ? 1.5 : 0.5) : 0,
        borderRightColor: col === 3 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)',
        borderBottomColor: row === 3 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)',
      },
    ];

    if (!users || users.length === 0) {
      if (onCellPress) {
        return (
          <TouchableOpacity key={key} style={cellStyle} onPress={() => onCellPress(row, col)} activeOpacity={0.7} />
        );
      }
      return <View key={key} style={cellStyle} />;
    }

    // Separate current user from pairs
    const me = users.find((u) => u.isCurrentUser);
    const others = users.filter((u) => !u.isCurrentUser);

    // Only current user at this coordinate
    if (me && others.length === 0) {
      return (
        <View key={key} style={cellStyle}>
          {renderSingleAvatar(me, 'full')}
        </View>
      );
    }

    // Only pairs (no current user) — single or orb
    if (!me) {
      if (others.length === 1) {
        return (
          <View key={key} style={cellStyle}>
            {renderSingleAvatar(others[0], 'full')}
          </View>
        );
      }
      return (
        <View key={key} style={cellStyle}>
          {renderOrb(row, col, others, 'full')}
        </View>
      );
    }

    // Current user + pairs share this coordinate — show both compact side-by-side
    return (
      <View key={key} style={cellStyle}>
        <View style={styles.sharedCell}>
          {renderSingleAvatar(me, 'compact')}
          {others.length === 1
            ? renderSingleAvatar(others[0], 'compact')
            : renderOrb(row, col, others, 'compact')
          }
        </View>
      </View>
    );
  };

  const rows = [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <>
      <View style={styles.grid} pointerEvents="box-none">
        {rows.map((row) => (
          <View key={`row-${row}`} style={styles.row}>
            {cols.map((col) => renderCell(row, col))}
          </View>
        ))}
      </View>

      {/* Users-at-coordinate modal */}
      <Modal
        visible={modalUsers !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalUsers(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setModalUsers(null)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pairs Checked In as</Text>
              {modalEmotion && (
                <EmotionBadge emotionName={modalEmotion.name} emotionColour={modalEmotion.colour} size="small" />
              )}
            </View>
            <ScrollView style={styles.modalScroll} bounces={false} showsVerticalScrollIndicator>
              {modalUsers?.map((user, index) => {
                const opacity = user.staleness === 'stale48' ? 0.5 : user.staleness === 'stale24' ? 0.75 : 1;
                const isStale = user.staleness === 'stale24' || user.staleness === 'stale48';
                const initial = user.name?.charAt(0)?.toUpperCase() || '?';
                return (
                  <TouchableOpacity
                    key={`${user.id}-${index}`}
                    style={[styles.modalItem, { opacity }]}
                    onPress={() => {
                      setModalUsers(null);
                      onUserPress(user);
                    }}
                  >
                    <Avatar
                      source={user.avatarUrl}
                      name={user.name}
                      hexColour={user.hexColour}
                      size="sm"
                      border={isStale ? { width: 2, color: colors.alert } : undefined}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={styles.modalName}>
                      {user.name}{user.isCurrentUser ? ' (You)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Single avatar — fills most of the cell
  avatarWrap: {
    width: '92%',
    aspectRatio: 1,
  },

  // Compact variants for shared-coordinate cells
  avatarWrapCompact: {
    width: '58%',
    aspectRatio: 1,
  },

  // Side-by-side layout when current user shares coordinate with pairs
  sharedCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: 2,
  },


  // Density orb for multiple users (matches GlobalPulse style)
  orbContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  orbSvg: {
    position: 'absolute',
  },
  orbText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  orbTextCompact: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Modal (styled like GroupsScreen favourite selector)
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  modalTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  modalScroll: {
    maxHeight: 280,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  modalName: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
});
