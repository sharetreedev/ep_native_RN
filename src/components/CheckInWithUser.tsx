import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { MessageCircleMore, X } from 'lucide-react-native';
import { colors, fonts, fontSizes, borderRadius } from '../theme';
import { logger } from '../lib/logger';

// Appended to every reminder so the recipient always gets a deep link back
// into the app — kept in sync with the on-screen footer preview below.
const MESSAGE_FOOTER =
  'Take a moment to check in and let them know how you are. → Open App: https://app.emotionalpulse.ai';

interface CheckInWithUserProps {
  firstName: string;
  fullName?: string;
  currentUserFirstName?: string;
  pairsUserId: number;
  /** Recipient's mobile number — required to open the native SMS draft. */
  phoneNumber?: string | null;
  /**
   * Legacy server-side (Twilio) reminder sender. No longer called — reminders
   * now open the user's own Messages app to avoid per-SMS Twilio cost. Kept
   * optional so existing call sites compile and a future "reminder sent" log
   * can be wired back in without re-plumbing.
   */
  onSendReminder?: (pairsUserId: number, message: string) => Promise<void>;
}

export default function CheckInWithUser({ firstName, fullName, currentUserFirstName, phoneNumber }: CheckInWithUserProps) {
  const defaultMessage = `Hey ${firstName}, I noticed you haven't checked in on the Emotional Pulse App for a while. How have you been feeling? - ${currentUserFirstName || ''}`.trim();
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);

  // Keep message in sync when props update (e.g. API data arrives after mount)
  useEffect(() => {
    setMessage(defaultMessage);
  }, [firstName, currentUserFirstName]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const recipient = (phoneNumber || '').replace(/[^\d+]/g, '');
    if (!recipient) {
      Alert.alert('No phone number', `We don't have a mobile number for ${fullName || firstName}, so we can't open a message.`);
      return;
    }

    setSending(true);
    try {
      const body = `${message.trim()}\n\n${MESSAGE_FOOTER}`;
      // iOS expects `&body=`, Android expects `?body=` after the number.
      const separator = Platform.OS === 'ios' ? '&' : '?';
      const url = `sms:${recipient}${separator}body=${encodeURIComponent(body)}`;

      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Messaging unavailable', 'This device can’t send text messages.');
        return;
      }
      await Linking.openURL(url);
      setMessage(defaultMessage);
      setModalVisible(false);
    } catch (err) {
      logger.error(err);
      Alert.alert('Could not open Messages', 'Something went wrong opening your messaging app. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.badge} onPress={() => setModalVisible(true)}>
        <MessageCircleMore color={colors.primary} size={14} />
        <Text style={styles.badgeText}>Reach Out</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <MessageCircleMore color={colors.primary} size={20} />
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle}>Reach out to</Text>
                    <Text style={styles.cardTitleName}>{fullName || firstName}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleClose} hitSlop={8}>
                  <X color={colors.textSecondary} size={20} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={280}
              />

              <Text style={styles.footerNote}>
                The following will be added to the end of the message:
              </Text>
              <Text style={styles.footerAppend}>
                Take a moment to check in and let them know how you are. {'\u2192'} Open App: https://app.emotionalpulse.ai
              </Text>

              <TouchableOpacity
                style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!message.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.sendText}>Open in Messages</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    minHeight: 32,
    backgroundColor: colors.primaryLight,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.primary,
    marginLeft: 4,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 24,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  cardTitleWrap: {
    marginLeft: 8,
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  cardTitleName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  footerNote: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  footerAppend: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
    marginBottom: 24,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.button,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.textOnPrimary,
  },
});
