import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated as RNAnimated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import {
  ChevronRight,
  User,
  AlertTriangle,
  GraduationCap,
  Camera,
  Bell,
  Blend,
  Activity,
  UsersRound,
} from 'lucide-react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Avatar from '../../../components/Avatar';
import { colors, fonts, fontSizes, borderRadius } from '../../../theme';
import type { ThingsToDoAction, ThingsToDoIcon } from '../../../hooks/useThingsToDo';

const ICON_SIZE = 22;
const SNAP_HEIGHT_RATIO = 0.85; // sheet covers ~85% of screen
const SWIPE_DISTANCE_THRESHOLD = 120; // px dragged down before we commit to closing
const SWIPE_VELOCITY_THRESHOLD = 0.8; // px/ms flick speed that also commits to closing

const ICON_FOR: Record<ThingsToDoIcon, React.ComponentType<any>> = {
  user: User,
  alert: AlertTriangle,
  graduation: GraduationCap,
  camera: Camera,
  bell: Bell,
  blend: Blend,
  activity: Activity,
  group: UsersRound,
};

type Props = {
  visible: boolean;
  actions: ThingsToDoAction[];
  onClose: () => void;
};

export default function ThingsToDoSheet({ visible, actions, onClose }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const sheetHeight = Math.round(windowHeight * SNAP_HEIGHT_RATIO);

  const backdropAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(sheetHeight)).current;

  // Drive the open/close animation off `visible`. Keeping the Modal mounted
  // while the close animation runs would feel cleaner, but RN's Modal
  // unmounts its children when visible flips false — so we just animate
  // open and let RN handle the dismiss.
  useEffect(() => {
    if (!visible) return;
    backdropAnim.setValue(0);
    slideAnim.setValue(sheetHeight);
    if (reduceMotion) {
      backdropAnim.setValue(1);
      slideAnim.setValue(0);
      return;
    }
    RNAnimated.parallel([
      RNAnimated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      RNAnimated.spring(slideAnim, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [visible, sheetHeight, backdropAnim, slideAnim, reduceMotion]);

  const handleClose = useCallback(() => {
    if (reduceMotion) {
      onClose();
      return;
    }
    RNAnimated.parallel([
      RNAnimated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      RNAnimated.timing(slideAnim, { toValue: sheetHeight, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }, [backdropAnim, slideAnim, sheetHeight, onClose, reduceMotion]);

  const handleActionPress = useCallback(
    (action: ThingsToDoAction) => {
      // Close first so the sheet doesn't sit open over the destination.
      if (reduceMotion) {
        onClose();
        action.onPress();
        return;
      }
      RNAnimated.parallel([
        RNAnimated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        RNAnimated.timing(slideAnim, { toValue: sheetHeight, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        onClose();
        action.onPress();
      });
    },
    [backdropAnim, slideAnim, sheetHeight, onClose, reduceMotion],
  );

  // Swipe-down-to-close, scoped to the top grabber/title area so the list
  // below keeps its normal scroll gesture. Drives `slideAnim` directly while
  // dragging; on release either commits to close (distance or flick) or
  // springs back to rest.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 4,
        onPanResponderMove: (_, gs) => {
          if (gs.dy >= 0) slideAnim.setValue(gs.dy);
        },
        onPanResponderRelease: (_, gs) => {
          const shouldClose =
            gs.dy > SWIPE_DISTANCE_THRESHOLD || gs.vy > SWIPE_VELOCITY_THRESHOLD;
          if (shouldClose) {
            if (reduceMotion) {
              onClose();
              return;
            }
            RNAnimated.parallel([
              RNAnimated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
              RNAnimated.timing(slideAnim, { toValue: sheetHeight, duration: 200, useNativeDriver: true }),
            ]).start(() => onClose());
          } else if (reduceMotion) {
            slideAnim.setValue(0);
          } else {
            RNAnimated.spring(slideAnim, {
              toValue: 0,
              tension: 65,
              friction: 10,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          if (reduceMotion) {
            slideAnim.setValue(0);
          } else {
            RNAnimated.spring(slideAnim, {
              toValue: 0,
              tension: 65,
              friction: 10,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [backdropAnim, slideAnim, sheetHeight, onClose, reduceMotion],
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.container}>
        <RNAnimated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessibilityLabel="Close" />
        </RNAnimated.View>

        <RNAnimated.View
          style={[
            styles.sheet,
            { height: sheetHeight, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View {...panResponder.panHandlers}>
            <View style={styles.handle} />
            <Text style={styles.title}>Safety Checklist</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {actions.map((action) => {
              const Icon = ICON_FOR[action.icon];
              return (
                <TouchableOpacity
                  key={action.id}
                  style={styles.row}
                  activeOpacity={0.85}
                  onPress={() => handleActionPress(action)}
                  accessibilityRole="button"
                  accessibilityLabel={`${action.mainText}. ${action.subText}`}
                >
                  {action.avatar ? (
                    <Avatar
                      source={action.avatar.source}
                      name={action.avatar.name}
                      hexColour={action.avatar.hexColour}
                      size={44}
                      borderRadius={16}
                    />
                  ) : (
                    <View style={[styles.iconAvatar, { backgroundColor: action.bgColor }]}>
                      <Icon size={ICON_SIZE} color="white" strokeWidth={2} />
                    </View>
                  )}
                  <View style={styles.rowText}>
                    <Text style={styles.rowMain}>{action.mainText}</Text>
                    <Text style={styles.rowSub}>{action.subText}</Text>
                  </View>
                  <ChevronRight size={22} color={colors.textPrimary} strokeWidth={2.5} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  iconAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowMain: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  rowSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
