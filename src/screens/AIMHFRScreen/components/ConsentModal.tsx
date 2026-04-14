import React from 'react';
import ConfirmModal from '../../../components/ConfirmModal';

const CONSENT_MESSAGE =
  'This AI supports self-reflection but does not replace professional help. ' +
  'ShareTree encourages professional support when you feel distressed. ' +
  'By clicking "Agree," you consent to the recording of your conversation, ' +
  'which will be kept confidential. If there\'s serious risk of harm, we may ' +
  'share information by appropriate means to protect you or others.';

interface ConsentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConsentModal({
  visible,
  onClose,
  onConfirm,
}: ConsentModalProps) {
  return (
    <ConfirmModal
      visible={visible}
      onClose={onClose}
      onConfirm={onConfirm}
      title=""
      message={CONSENT_MESSAGE}
      confirmText="Accept"
      cancelText="Cancel"
      variant="bottom"
    />
  );
}
