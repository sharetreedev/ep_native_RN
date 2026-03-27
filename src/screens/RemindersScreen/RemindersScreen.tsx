import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
  TextInput,
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

const FREQUENCIES = [
  { label: 'None', value: 'NONE' },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekdays', value: 'WEEKDAYS' },
  { label: 'Weekly', value: 'WEEKLY' },
];

export default function RemindersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refreshUser } = useAuth();
  const { updateReminderSettings, isLoading } = useUser();
  const { activeGroups, fetchAll: fetchGroups } = useGroups();

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [frequency, setFrequency] = useState('NONE');
  const [hour, setHour] = useState('0');
  const [minute, setMinute] = useState('00');
  const [isCustom, setIsCustom] = useState(false);

  const [groupPickerVisible, setGroupPickerVisible] = useState(false);
  const [frequencyPickerVisible, setFrequencyPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  // Build a display-friendly group list from user's groups in auth context
  const groupOptions = (user?.groups || []).map((g, index) => ({
    id: g.id,
    label: g.groupName || `Group ${g.id}`,
  }));

  const selectedGroupLabel =
    groupOptions.find((g) => g.id === selectedGroupId)?.label || '';

  const selectedFrequencyLabel =
    FREQUENCIES.find((f) => f.value === frequency)?.label || 'None';

  const handleSave = async () => {
    try {
      await updateReminderSettings({
        frequency,
        days: [],
        hour: parseInt(hour, 10) || 0,
        min: parseInt(minute, 10) || 0,
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Reminders</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {groupOptions.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Use Existing Group Reminder Settings</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setGroupPickerVisible(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedGroupId && styles.dropdownPlaceholder,
                ]}
              >
                {selectedGroupLabel || 'Select group'}
              </Text>
              <ChevronDown color={colors.textMuted} size={18} />
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionLabel}>Frequency & Time</Text>
        <View style={styles.frequencyRow}>
          <TouchableOpacity
            style={styles.frequencyPicker}
            onPress={() => setFrequencyPickerVisible(true)}
          >
            <Text style={[
              styles.frequencyText,
              frequency !== 'NONE' && styles.frequencyTextActive,
            ]}>
              {selectedFrequencyLabel}
            </Text>
            <ChevronDown color={colors.textMuted} size={16} />
          </TouchableOpacity>
          <Text style={styles.atLabel}>at</Text>
          <View style={styles.timeInputWrap}>
            <TextInput
              style={styles.timeInput}
              value={hour}
              onChangeText={setHour}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput
              style={styles.timeInput}
              value={minute}
              onChangeText={setMinute}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Switch
            value={isCustom}
            onValueChange={setIsCustom}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
          <Text style={styles.toggleLabel}>Turn on Custom Reminder Notifications</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>

      <ModalPicker
        visible={groupPickerVisible}
        onDismiss={() => setGroupPickerVisible(false)}
        data={groupOptions.map((g) => ({ label: g.label, value: g.id }))}
        selectedValue={selectedGroupId}
        onSelect={(item) => {
          setSelectedGroupId(item.value as number);
          setGroupPickerVisible(false);
        }}
        animationType="fadeSlide"
        emptyText="No groups available"
      />

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
  backButton: { width: 24, alignItems: 'flex-start' },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 100 },
  sectionLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.xl,
  },
  dropdownText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  dropdownPlaceholder: { color: colors.textPlaceholder },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  frequencyPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  frequencyText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPlaceholder,
  },
  frequencyTextActive: {
    color: colors.textPrimary,
  },
  atLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  timeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
  },
  timeInput: {
    width: 28,
    textAlign: 'center',
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  timeSeparator: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  toggleLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
  },
});
