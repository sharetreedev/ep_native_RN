export interface Option {
  label: string;
  description: string;
  value: number;
}

export const RISK_OPTIONS: Option[] = [
  { label: 'Strain / Discomfort', description: 'Felt better after chat', value: 1 },
  { label: 'Distress', description: 'Needs another check-in soon', value: 2 },
  { label: 'Dysfunction', description: 'Encouraged professional help', value: 3 },
  { label: 'Chronic Disability', description: 'Needs ongoing Care', value: 4 },
  { label: 'Imminent harm to self or others', description: 'Call 112 / emergency', value: 5 },
];

export const FREQUENCY_OPTIONS: Option[] = [
  { label: 'First Time', description: 'One-off incident', value: 1 },
  { label: 'Repeated', description: 'Happened before', value: 2 },
  { label: 'Ongoing', description: 'Constant pattern', value: 3 },
];

export const ESCALATION_OPTIONS: Option[] = [
  { label: 'Resolved', description: 'Situation Settled', value: 1 },
  { label: 'Still Present', description: 'Needs Monitoring', value: 2 },
  { label: 'Escalating', description: 'Likely to rise', value: 3 },
];

export type SuggestedAction = 'LIFT_Monitor' | 'ACT_Professional' | 'ACT_Emergency';

export function getSuggestedAction(risk: number, frequency: number, escalation: number): SuggestedAction {
  if (risk === 5) return 'ACT_Emergency';
  const sum = risk + frequency + escalation;
  if (sum >= 5) return 'ACT_Professional';
  return 'LIFT_Monitor';
}
