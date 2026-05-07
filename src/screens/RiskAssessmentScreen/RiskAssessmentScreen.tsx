import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Heart } from 'lucide-react-native';
import { RootStackParamList } from '../../types/navigation';
import { useMHFR, useSafeEdges } from '../../contexts/MHFRContext';
import { supportRequests as xanoSupportRequests } from '../../api';
import { colors, spacing } from '../../theme';
import {
  RISK_OPTIONS,
  FREQUENCY_OPTIONS,
  ESCALATION_OPTIONS,
  getSuggestedAction,
} from './constants';
import { styles } from './styles';
import OptionsList from './components/OptionsList';
import SuggestedActionCard from './components/SuggestedActionCard';
import { logger } from '../../lib/logger';

type ScreenRouteProp = RouteProp<RootStackParamList, 'RiskAssessment'>;
type ScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'RiskAssessment'>;

export default function RiskAssessmentScreen() {
  const safeEdges = useSafeEdges(['top', 'bottom']);
  const navigation = useNavigation<ScreenNavProp>();
  const route = useRoute<ScreenRouteProp>();
  const { supportRequest: sr } = route.params;
  const { refreshMHFRRequests, applySupportRequestUpdate } = useMHFR();

  const [step, setStep] = useState(1);
  const [risk, setRisk] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [escalation, setEscalation] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const totalSteps = 5;

  const suggestedAction =
    risk != null && frequency != null && escalation != null
      ? getSuggestedAction(risk, frequency, escalation)
      : null;

  const riskScore =
    risk != null && frequency != null && escalation != null
      ? risk + frequency + escalation
      : 0;

  const canGoNext = (): boolean => {
    if (step === 1) return risk != null;
    if (step === 2) return frequency != null;
    if (step === 3) return escalation != null;
    return false;
  };

  const handleNext = async () => {
    if (step === 4) {
      // Save risk assessment then advance to thank-you
      if (saving || !suggestedAction) return;
      setSaving(true);
      try {
        const result = await xanoSupportRequests.patch(sr.id, {
          risk_severity: risk,
          risk_frequency: frequency,
          risk_escalation: escalation,
          risk_score: riskScore,
          support_Action: suggestedAction,
          is_Supported: true,
          supported_Date: new Date().toISOString().split('T')[0],
          status: 'RESOLVED',
          resolved_Date: Date.now(),
        });
        // Push the server's authoritative copy into the MHFR cache so any
        // mounted screens (notably SupportRequestDetailsScreen) reflect the
        // new Resolved status immediately, without waiting on the network
        // round-trip below.
        if (result?.incident_logs) {
          applySupportRequestUpdate(result.incident_logs);
        }
        await refreshMHFRRequests();
        setStep(5);
      } catch (e) {
        logger.error('Failed to save risk assessment:', e);
      } finally {
        setSaving(false);
      }
      return;
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /* ─── Step content ─── */

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <>
          <Text style={styles.stepLabel}>Step 1</Text>
          <Text style={styles.stepQuestion}>How serious is the risk right now?</Text>
          <OptionsList options={RISK_OPTIONS} selected={risk} onSelect={setRisk} />
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <Text style={styles.stepLabel}>Step 2</Text>
          <Text style={styles.stepQuestion}>How often has this risk shown up?</Text>
          <OptionsList options={FREQUENCY_OPTIONS} selected={frequency} onSelect={setFrequency} />
        </>
      );
    }
    if (step === 3) {
      return (
        <>
          <Text style={styles.stepLabel}>Step 3</Text>
          <Text style={styles.stepQuestion}>After your call, the risk is...</Text>
          <OptionsList options={ESCALATION_OPTIONS} selected={escalation} onSelect={setEscalation} />
        </>
      );
    }

    if (step === 4) {
      return (
        <>
          <Text style={styles.recommendLabel}>Based on your Risk Assessment we recommend:</Text>
          {suggestedAction && <SuggestedActionCard action={suggestedAction} />}
        </>
      );
    }

    // Step 5: Thank you
    return (
      <View style={styles.thankYouWrap}>
        <Heart size={48} color={colors.primary} style={{ marginBottom: spacing.lg }} />
        <Text style={styles.thankYouTitle}>Thank You for Showing Up</Text>
        <Text style={styles.thankYouBody}>
          Your care and compassion make a real difference.{'\n'}
          By stepping in when it mattered most, you've shown what true support looks like.
        </Text>
        <Text style={styles.thankYouBody}>
          Small actions like this can have a lasting impact, thank you for being someone others can count on.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={safeEdges}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Risk Assessment</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <X size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomBar}>
        {step === 5 ? (
          <TouchableOpacity
            style={[styles.nextBtn, { flex: 1 }]}
            activeOpacity={0.8}
            onPress={handleClose}
          >
            <Text style={styles.nextBtnLabel}>Close</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={handleBack}>
              <Text style={styles.backBtnLabel}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nextBtn, (step <= 3 && !canGoNext()) && styles.btnDisabled, saving && styles.btnDisabled]}
              activeOpacity={0.8}
              disabled={(step <= 3 && !canGoNext()) || saving}
              onPress={handleNext}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.nextBtnLabel}>{step === 4 ? 'Save' : 'Next'}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
