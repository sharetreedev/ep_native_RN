import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import { useGroups } from '../../hooks/useGroups';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../theme';
import ModalPicker from '../../components/ModalPicker';
import { useSafeEdges } from '../../contexts/MHFRContext';

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

// Build hour options: 1–12 with AM/PM
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i >= 12 ? 'PM' : 'AM';
  const display = i % 12 || 12;
  return { label: `${display}:00 ${ampm}`, value: i };
});

export default function RemindersScreen() {
  const safeEdges = useSafeEdges(['top']);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refreshUser } = useAuth();
  const { updateReminderSettings, isLoading } = useUser();
  const { fetchAll: fetchGroups } = useGroups();

  // Determine if user already has custom settings
  const hasExistingCustom = !!user?.reminderFrequency && user.reminderFrequency !== 'NONE';

  const [isCustom, setIsCustom] = useState(hasExistingCustom);
  const [frequency, setFrequency] = useState(hasExistingCustom ? (user?.reminderFrequency ?? 'DAILY') : 'DAILY');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedHour, setSelectedHour] = useState(user?.reminderHour ?? 11);

  const [frequencyPickerVisible, setFrequencyPickerVisible] = useState(false);
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [hourPickerVisible, setHourPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  const selectedFrequencyLabel =
    FREQUENCIES.find((f) => f.value === frequency)?.label || 'Daily';

  const selectedDayLabel =
    DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.label || 'Monday';

  const selectedHourLabel =
    HOUR_OPTIONS.find((h) => h.value === selectedHour)?.label || '11:00 AM';

  const handleSave = async () => {
    try {
      const finalFrequency = isCustom ? frequency : 'NONE';
      const days = frequency === 'WEEKLY' && isCustom ? [selectedDay] : [];

      await updateReminderSettings({
        frequency: finalFrequency,
        days,
        hour: isCustom ? selectedHour : 0,
        min: 0,
        is_custom: isCustom,
      });
      await refreshUser();
      Alert.alert('Success', 'Reminder settings saved.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save reminder settings.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={safeEdges}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Reminders</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>
          Your default reminder notifications are set by the group you belong to. Turn on custom reminders below to set your own schedule.
        </Text>

        {/* Custom toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.toggleLabel}>Custom Reminder</Text>
            <Text style={styles.toggleHint}>Set your own frequency and time</Text>
          </View>
          <Switch
            value={isCustom}
            onValueChange={setIsCustom}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>

        {/* Custom settings — only shown when toggle is on */}
        {isCustom && (
          <View style={styles.customSection}>
            {/* Frequency */}
            <Text style={styles.sectionLabel}>Frequency</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setFrequencyPickerVisible(true)}
            >
              <Text style={styles.dropdownText}>{selectedFrequencyLabel}</Text>
              <ChevronDown color={colors.textMuted} size={18} />
            </TouchableOpacity>

            {/* Day picker — only for Weekly */}
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

            {/* Time picker */}
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
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>Save</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  backButton: { width: 24, alignItems: 'flex-start' as const },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.base, paddingBottom: 100 },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
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
    fontSize: fontSizes.base,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  toggleHint: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  customSection: {
    marginBottom: spacing.base,
  },
  sectionLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bodySemiBold,
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
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
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
