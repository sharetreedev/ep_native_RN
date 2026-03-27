import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

interface SuggestedActionCardProps {
  action: string;
}

export default function SuggestedActionCard({ action }: SuggestedActionCardProps) {
  if (action === 'LIFT_Monitor') {
    return (
      <View style={styles.actionCard}>
        <Text style={styles.actionCardTitle}>LIFT - Monitor & Support</Text>
        <Text style={styles.actionCardBody}>
          The overall risk is low enough to remain in LIFT mode - Listen, Inquire, Find Support, Thank & Acknowledge. The person feels heard and has immaculate coping strategies, but you'll keep a watchful eye.
        </Text>

        <View style={styles.howYouHelp}>
          <Text style={styles.howYouHelpTitle}>How you help:</Text>
          <Text style={styles.numberedItem}>
            <Text style={styles.numberedBold}>1. </Text>
            <Text style={styles.numberedBold}>Encourage their chosen self-care actions and highlight strengths they showed in the conversation.</Text>
          </Text>
          <Text style={styles.numberedItem}>
            <Text style={styles.numberedBold}>2. </Text>
            <Text style={styles.numberedBold}>Agree on a clear check-in time and preferred channel so they know you'll stay connected.</Text>
          </Text>
        </View>

        <View style={[styles.immediateBox, styles.immediateBoxLift]}>
          <Text style={styles.immediateTitle}>Immediate Actions</Text>
          <Text style={styles.actionBullet}>Share quick wellbeing resources (sleep, movement, gratitude, trusted peer contact).</Text>
          <Text style={styles.actionBullet}>Set a reminder for your follow-up.</Text>
          <Text style={styles.actionBullet}>Switch to ACT if severity, frequency or escalation indicators rise.</Text>
        </View>
      </View>
    );
  }

  if (action === 'ACT_Professional') {
    return (
      <View style={styles.actionCard}>
        <Text style={styles.actionCardTitle}>ACT - Professional Support</Text>
        <Text style={styles.actionCardBody}>
          The total risk score is moderate yet not acute. Move to ACT - Assess, Collaborate, Take Time to Check In, to build a professional safety net for the person.
        </Text>

        <View style={styles.howYouHelp}>
          <Text style={styles.howYouHelpTitle}>How you help:</Text>
          <Text style={styles.actionCardBody}>
            Co-create a warm referral to Trusted, Invited, Skilled supports:
          </Text>
          <Text style={styles.actionBullet}>{'\u2022'} GP {'>'} Mental Health Care Plan (10 + 10 subsidised sessions)</Text>
          <Text style={styles.actionBullet}>{'\u2022'} EAP for confidential counselling/psychology</Text>
          <Text style={styles.actionBullet}>{'\u2022'} Specialist or peer support groups (general or condition specific)</Text>
          <Text style={styles.actionBullet}>{'\u2022'} Crisis lines such as Lifeline for immediate guidance.</Text>
          <Text style={styles.actionBullet}>{'\u2022'} Offer to book the GP visit together or stay online while they call.</Text>
        </View>

        <View style={[styles.immediateBox, styles.immediateBoxProfessional]}>
          <Text style={styles.immediateTitle}>Immediate Actions</Text>
          <Text style={styles.numberedItem}><Text style={styles.numberedBold}>1. </Text>Offer to help supportee book an appointment.</Text>
          <Text style={styles.numberedItem}><Text style={styles.numberedBold}>2. </Text>Secure their consent to pass on accurate risk details to a professional.</Text>
          <Text style={styles.numberedItem}><Text style={styles.numberedBold}>3. </Text>Note down the plan.</Text>
          <Text style={styles.numberedItem}><Text style={styles.numberedBold}>4. </Text>Schedule a check-in within 24-48 hours.</Text>
          <Text style={styles.numberedItem}><Text style={styles.numberedBold}>5. </Text>Stay available and ready to escalate if risk increases.</Text>
        </View>
      </View>
    );
  }

  // ACT_Emergency
  return (
    <View style={styles.actionCard}>
      <Text style={styles.actionCardTitle}>ACT - Emergency Support</Text>
      <Text style={styles.actionCardBody}>
        Severity is an imminent risk of harm to self or others. Safety overrides all else; contact emergency services immediately.
      </Text>

      <View style={styles.howYouHelp}>
        <Text style={styles.howYouHelpTitle}>How you help:</Text>
        <Text style={styles.actionBullet}>{'\u2022'} Dial 112 (or local equivalent) for ambulance or police.</Text>
        <Text style={styles.actionBullet}>{'\u2022'} Keep the person in view/on the line; remain calm and reassure them help is on the way.</Text>
        <Text style={styles.actionBullet}>{'\u2022'} Provide responders with location, risk details and any known triggers or medical info.</Text>
      </View>

      <View style={[styles.immediateBox, styles.immediateBoxEmergency]}>
        <Text style={styles.immediateTitle}>Immediate Actions</Text>
        <Text style={styles.numberedItem}><Text style={styles.numberedBold}>1. </Text>Do not leave them alone until emergency professionals take over.</Text>
        <Text style={styles.numberedItem}><Text style={styles.numberedBold}>2. </Text>Notify your designated internal contact per company protocol.</Text>
        <Text style={styles.numberedItem}><Text style={styles.numberedBold}>3. </Text>Arrange personal debriefing/support for yourself once the situation is handed over.</Text>
        <Text style={styles.numberedItem}><Text style={styles.numberedBold}>4. </Text>Continue follow-up with the supportee when safe.</Text>
      </View>
    </View>
  );
}
