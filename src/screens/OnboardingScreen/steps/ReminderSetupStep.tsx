import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../../theme';
import { styles as sharedStyles } from '../styles';
import ModalPicker from '../../../components/ModalPicker';
import { useAuth } from '../../../contexts/AuthContext';
import { useUser } from '../../../hooks/useUser';
import {
  getEffectiveReminderSettings,
  formatReminderTime,
  formatReminderFrequency,
} from '../../../lib/reminderSettings';
import {
  hasNotificationPermission,
  requestNotificationPermission,
} from '../../../lib/notificationPermission';
import { logger } from '../../../lib/logger';

const FREQUENCIES = [
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekdays', value: 'WEEKDAYS' },
  { label: 'Weekly', value: 'WEEKLY' },
];

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i >= 12 ? 'PM' : 'AM';
  const display = i % 12 || 12;
  return { label: `${display}:00 ${ampm}`, value: i };
});

interface ReminderSetupStepProps {
  onComplete: () => void;
  isSubmitting?: boolean;
}

export default function ReminderSetupStep({ onComplete, isSubmitting }: ReminderSetupStepProps) {
  const { user } = useAuth();
  const { updateReminderSettings, isLoading } = useUser();

  // Effective baseline — user override, falling through to group, then default.
  // Used to pre-populate the form and surface the "Using your team's schedule"
  // information row when a group provides the default.
  const effective = getEffectiveReminderSettings(user, user?.groups as any[]);

  // Custom toggle defaults OFF — when off, the user is using the group/default
  // schedule. The form below the toggle is interactive only when on.
  const [isCustom, setIsCustom] = useState(false);
  const [frequency, setFrequency] = useState<string>(
    effective.frequency === 'NONE' ? 'WEEKDAYS' : effective.frequency
  );
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedHour, setSelectedHour] = useState<number>(effective.hour);

  const [frequencyPickerVisible, setFrequencyPickerVisible] = useState(false);
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [hourPickerVisible, setHourPickerVisible] = useState(false);
  const [savingPermission, setSavingPermission] = useState(false);

  const selectedFrequencyLabel =
    FREQUENCIES.find((f) => f.value === frequency)?.label || 'Daily';
  const selectedDayLabel =
    DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.label || 'Monday';
  const selectedHourLabel =
    HOUR_OPTIONS.find((h) => h.value === selectedHour)?.label || '11:00 AM';

  const handleSave = useCallback(async () => {
    setSavingPermission(true);
    try {
      // When the user picks the group/default schedule (toggle OFF), persist
      // their custom reminder as NONE so the server-side reminder job uses
      // the group schedule instead. When the toggle is ON, write their
      // custom frequency.
      const finalFrequency = isCustom ? frequency : 'NONE';
      const days = !isCustom
        ? []
        : frequency === 'WEEKLY'
          ? [selectedDay]
          : frequency === 'WEEKDAYS'
            ? [1, 2, 3, 4, 5]
            : frequency === 'DAILY'
              ? [0, 1, 2, 3, 4, 5, 6]
              : [];

      await updateReminderSettings({
        frequency: finalFrequency,
        days,
        hour: isCustom ? selectedHour : 0,
        min: 0,
        is_custom: isCustom,
      });

      // Now ask for OS push permission so the schedule actually fires.
      // We deliberately ask AFTER the user commits to a schedule — the
      // permission dialog has more context this way and is easier to grant.
      const granted = await hasNotificationPermission();
      if (!granted) {
        logger.info('[ReminderSetup] requesting notification permission');
        await requestNotificationPermission();
      }
    } catch (e) {
      logger.error('[ReminderSetup] save failed', e);
      Alert.alert('Error', 'Could not save your reminder settings. Please try again.');
      setSavingPermission(false);
      return;
    }

    setSavingPermission(false);
    onComplete();
  }, [
    isCustom,
    frequency,
    selectedDay,
    selectedHour,
    updateReminderSettings,
    onComplete,
  ]);

  const isBusy = savingPermission || isLoading || !!isSubmitting;

  return (
    <SafeAreaView style={sharedStyles.container}>
      <ScrollView contentContainerStyle={sharedStyles.scrollContent}>
        <View style={sharedStyles.headerRow}>
          <Image source={require('../../../../assets/Logo.png')} style={sharedStyles.logo} />
          <Text style={sharedStyles.brandName}>Emotional Pulse</Text>
        </View>

        <Text style={sharedStyles.heading}>Keep up the Pulse with reminders</Text>
        <Text style={sharedStyles.body}>
          Set a regular time to check in. We'll send you a gentle nudge so it
          becomes part of your routine.
        </Text>

        {/* Group / default summary — shows what they're getting by default,
            so they understand the consequence of leaving Custom off. */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            {effective.source === 'group'
              ? `Using ${effective.groupName ?? 'your group'}'s schedule`
              : effective.source === 'user'
                ? 'Your saved schedule'
                : 'Default schedule'}
          </Text>
          <Text style={styles.summaryValue}>
            {formatReminderFrequency(effective.frequency)}
            {effective.frequency !== 'NONE' && ` at ${formatReminderTime(effective.hour, effective.min)}`}
          </Text>
        </View>

        {/* Custom toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.toggleLabel}>Turn on Custom Reminders</Text>
            <Text style={styles.toggleHint}>Set your own frequency and time</Text>
          </View>
          <Switch
            value={isCustom}
            onValueChange={setIsCustom}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>

        {/* Custom settings — only interactive when toggle is on */}
        {isCustom && (
          <View style={styles.customSection}>
            <Text style={styles.sectionLabel}>Frequency</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setFrequencyPickerVisible(true)}
            >
              <Text style={styles.dropdownText}>{selectedFrequencyLabel}</Text>
              <ChevronDown color={colors.textMuted} size={18} />
            </TouchableOpacity>

            {frequency === 'WEEKLY' && (
              <>
                <Text style={styles.sectionLabel}>Day</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setDayPickerVisible(true)}
                >
                  <Text style={styles.dropdownText}>{selectedDayLabel}</Text>
                  <ChevronDown color={colors.textMuted} size={18} />
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.sectionLabel}>Time</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setHourPickerVisible(true)}
            >
              <Text style={styles.dropdownText}>{selectedHourLabel}</Text>
              <ChevronDown color={colors.textMuted} size={18} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, isBusy && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <ModalPicker
        visible={frequencyPickerVisible}
        onDismiss={() => setFrequencyPickerVisible(false)}
        data={FREQUENCIES}
        selectedValue={frequency}
        onSelect={(item) => {
          setFrequency(item.value as string);
          setFrequencyPickerVisible(false);
        }}
      />
      <ModalPicker
        visible={dayPickerVisible}
        onDismiss={() => setDayPickerVisible(false)}
        data={DAYS_OF_WEEK}
        selectedValue={selectedDay}
        onSelect={(item) => {
          setSelectedDay(item.value as number);
          setDayPickerVisible(false);
        }}
      />
      <ModalPicker
        visible={hourPickerVisible}
        onDismiss={() => setHourPickerVisible(false)}
        data={HOUR_OPTIONS}
        selectedValue={selectedHour}
        onSelect={(item) => {
          setSelectedHour(item.value as number);
          setHourPickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  toggleTextWrap: {
    flex: 1,
    marginRight: spacing.base,
  },
  toggleLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  toggleHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  customSection: {
    marginBottom: spacing.base,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginBottom: spacing.base,
  },
  dropdownText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginTop: spacing.base,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
  },
});
