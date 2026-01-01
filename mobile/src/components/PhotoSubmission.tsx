import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Upload, MapPin, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, gradients } from '../styles/common';
import { showError } from '../lib/toast';
import { trackEvent } from '../lib/analytics';
import { triggerHaptic } from '../lib/haptics';
import { useLanguage } from '../lib/language';

type PhotoSubmissionProps = {
  visible: boolean;
  challengeId: number;
  challengeTitle: string;
  challengePoints: number;
  onSubmit: (submission: {
    challengeId: number;
    photoUri: string;
    description: string;
    location?: string;
  }, onProgress?: (value: number) => void) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
};

export function PhotoSubmission({
  visible,
  challengeId,
  challengeTitle,
  challengePoints,
  onSubmit,
  onCancel,
}: PhotoSubmissionProps) {
  const { t } = useLanguage();
  const [submissionStep, setSubmissionStep] = useState<'capture' | 'details' | 'confirm'>('capture');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetState = () => {
    setSubmissionStep('capture');
    setPhotoPreview(null);
    setDescription('');
    setLocation('');
    setUploadProgress(0);
    setSubmitError(null);
  };

  const handleCancel = () => {
    void triggerHaptic('selection');
    trackEvent('photo_submission_cancelled', { challengeId, step: submissionStep });
    resetState();
    onCancel();
  };

  const capturePhoto = async () => {
    void triggerHaptic('selection');
    trackEvent('photo_capture_started', { challengeId });
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showError(t('cameraPermissionTitle'), t('cameraPermissionMessage'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      showError("Gre\u0161ka", t('photoLoadError'));
      return;
    }

    setPhotoPreview(asset.uri);
    setSubmissionStep('details');
  };

  const handleSubmit = async () => {
    if (!photoPreview) {
      showError("Gre\u0161ka", t('photoRequiredError'));
      return;
    }

    void triggerHaptic('impact');
    trackEvent('photo_submission_attempt', { challengeId });
    setIsSubmitting(true);
    setSubmitError(null);
    setUploadProgress(0.05);
    try {
      const result = await onSubmit(
        {
          challengeId,
          photoUri: photoPreview,
          description,
          location,
        },
        setUploadProgress
      );
      if (!result.success) {
        setSubmitError(result.error ?? t('photoSubmissionFailed'));
        void triggerHaptic('error');
        trackEvent('photo_submission_error', { challengeId });
        return;
      }
      setUploadProgress(1);
      resetState();
      void triggerHaptic('success');
      trackEvent('photo_submission_success', { challengeId });
    } catch (error) {
      setSubmitError(t('photoSubmissionFailed'));
      void triggerHaptic('error');
      trackEvent('photo_submission_error', { challengeId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: { key: 'capture' | 'details' | 'confirm'; label: string }[] = [
    { key: 'capture', label: t('photoStepCapture') },
    { key: 'details', label: t('photoStepDetails') },
    { key: 'confirm', label: t('photoStepConfirm') },
  ];

  useEffect(() => {
    if (visible) {
      trackEvent('photo_submission_opened', { challengeId });
    }
  }, [visible, challengeId]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(34, 197, 94, 0.35)', 'rgba(15, 23, 42, 0.98)'] as const}
          style={styles.modalShell}
        >
          <View style={styles.modal}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{t('photoSubmissionTitle')}</Text>
                <Text style={styles.subtitle}>{challengeTitle}</Text>
              </View>
              <TouchableOpacity
                onPress={handleCancel}
                accessibilityRole="button"
                accessibilityLabel={t('photoSubmissionCloseLabel')}
              >
                <X color={colors.muted} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.stepper}>
              {steps.map((step, index) => {
                const isActive = submissionStep === step.key;
                return (
                  <View key={step.key} style={styles.stepItem}>
                    <LinearGradient
                      colors={
                        isActive
                          ? gradients.primary
                          : (['rgba(51, 65, 85, 0.8)', 'rgba(15, 23, 42, 0.8)'] as const)
                      }
                      style={[styles.stepPill, isActive && styles.stepPillActive]}
                    >
                      <Text style={[styles.stepText, isActive && styles.stepTextActive]}>
                        {index + 1}. {step.label}
                      </Text>
                    </LinearGradient>
                  </View>
                );
              })}
            </View>

            {submissionStep === 'capture' && (
              <View style={styles.captureSection}>
                <LinearGradient colors={gradients.primary} style={styles.captureIcon}>
                  <Camera color={colors.text} size={32} />
                </LinearGradient>
                <Text style={styles.captureTitle}>{t('photoCaptureTitle')}</Text>
                <Text style={styles.captureSubtitle}>{t('photoCaptureSubtitle')}</Text>
                <TouchableOpacity
                  onPress={capturePhoto}
                  accessibilityRole="button"
                  accessibilityLabel={t('photoOpenCameraLabel')}
                >
                  <LinearGradient colors={gradients.primary} style={styles.primaryButton}>
                    <Camera color={colors.text} size={18} />
                    <Text style={styles.primaryLabel}>{t('photoOpenCameraLabel')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {submissionStep === 'details' && photoPreview && (
              <ScrollView contentContainerStyle={styles.stepContent}>
                <Image source={{ uri: photoPreview }} style={styles.preview} />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    void triggerHaptic('selection');
                    setSubmissionStep('capture');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t('photoRetakeLabel')}
                >
                  <Camera color={colors.primary} size={16} />
                  <Text style={styles.secondaryLabel}>{t('photoRetakeLabel')}</Text>
                </TouchableOpacity>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('photoDescriptionLabel')}</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('photoDescriptionPlaceholder')}
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('photoLocationLabel')}</Text>
                <View style={styles.inputRow}>
                  <MapPin color={colors.muted} size={16} />
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder={t('photoLocationPlaceholder')}
                    placeholderTextColor={colors.muted}
                    style={styles.inputInline}
                  />
                </View>
              </View>

                <LinearGradient
                  colors={['rgba(34, 197, 94, 0.3)', 'rgba(15, 23, 42, 0.9)'] as const}
                  style={styles.rewardRow}
                >
                  <Text style={styles.rewardText}>
                    {t('photoRewardText').replace('{points}', String(challengePoints))}
                  </Text>
                </LinearGradient>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.rowButton, styles.secondaryButtonRow]}
                    onPress={() => {
                      void triggerHaptic('selection');
                      setSubmissionStep('capture');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t('photoBackToPhotoLabel')}
                  >
                    <Text style={styles.secondaryLabel}>{"Nazad"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      void triggerHaptic('selection');
                      setSubmissionStep('confirm');
                    }}
                    style={styles.rowButton}
                    accessibilityRole="button"
                    accessibilityLabel={t('photoNextToConfirmLabel')}
                  >
                    <LinearGradient colors={gradients.primary} style={[styles.primaryButton, styles.primaryButtonRow]}>
                      <Text style={styles.primaryLabel}>{t('nextLabel')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {submissionStep === 'confirm' && photoPreview && (
              <ScrollView contentContainerStyle={styles.stepContent}>
                <Image source={{ uri: photoPreview }} style={styles.preview} />
                <LinearGradient
                  colors={['rgba(15, 23, 42, 0.95)', 'rgba(34, 197, 94, 0.12)'] as const}
                  style={styles.confirmBox}
                >
                  <Text style={styles.label}>{t('photoConfirmTitle')}</Text>
                  <Text style={styles.confirmText}>
                    {t('photoConfirmChallengeLabel').replace('{title}', challengeTitle)}
                  </Text>
                  <Text style={styles.confirmText}>
                    {t('photoConfirmRewardLabel').replace('{points}', String(challengePoints))}
                  </Text>
                  {description ? (
                    <Text style={styles.confirmText}>
                      {t('photoConfirmDescriptionLabel').replace('{description}', description)}
                    </Text>
                  ) : null}
                  {location ? (
                    <Text style={styles.confirmText}>
                      {t('photoConfirmLocationLabel').replace('{location}', location)}
                    </Text>
                  ) : null}
                  <View style={styles.noticeRow}>
                    <Clock color={colors.muted} size={14} />
                    <Text style={styles.noticeText}>{t('photoReviewNotice')}</Text>
                  </View>
                </LinearGradient>

                {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
                {isSubmitting ? (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.round(uploadProgress * 100)}%` }]} />
                  </View>
                ) : null}

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.rowButton, styles.secondaryButtonRow]}
                    onPress={() => {
                      void triggerHaptic('selection');
                      setSubmissionStep('details');
                    }}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                    accessibilityLabel={t('photoBackToDetailsLabel')}
                  >
                    <Text style={styles.secondaryLabel}>{"Nazad"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={styles.rowButton}
                    accessibilityRole="button"
                    accessibilityLabel={t('photoSendAccessibilityLabel')}
                  >
                    <LinearGradient colors={gradients.primary} style={[styles.primaryButton, styles.primaryButtonRow]}>
                      {isSubmitting ? (
                        <ActivityIndicator color={colors.text} />
                      ) : (
                        <>
                          <Upload color={colors.text} size={16} />
                          <Text style={styles.primaryLabel}>
                            {submitError ? t('photoRetryLabel') : t('photoSendLabel')}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalShell: {
    borderRadius: radius.lg,
    padding: 1.5,
    width: '100%',
    alignSelf: 'center',
  },
  modal: {
    backgroundColor: 'rgba(12, 18, 30, 0.98)',
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '90%',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  captureSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  captureIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    paddingBottom: spacing.md,
  },
  captureTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  captureSubtitle: {
    color: colors.muted,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    minHeight: 48,
    width: '100%',
  },
  primaryLabel: {
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    minHeight: 48,
  },
  secondaryLabel: {
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
  },
  formGroup: {
    marginTop: spacing.sm,
  },
  label: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    color: colors.text,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  inputInline: {
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.sm,
    marginLeft: spacing.xs,
  },
  rewardRow: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  rewardText: {
    color: colors.primary,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'stretch',
  },
  rowButton: {
    flex: 1,
    minWidth: 0,
  },
  primaryButtonRow: {
    marginTop: 0,
    paddingVertical: 12,
    minHeight: 48,
  },
  secondaryButtonRow: {
    marginTop: 0,
    paddingVertical: 12,
    minHeight: 48,
  },
  confirmBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
  },
  confirmText: {
    color: colors.muted,
    marginTop: spacing.xs,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  noticeText: {
    color: colors.muted,
    flex: 1,
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  stepper: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  stepItem: {
    flex: 1,
  },
  stepPill: {
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: 'center',
  },
  stepPillActive: {
    shadowColor: '#22c55e',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  stepText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  stepTextActive: {
    color: colors.text,
  },
});
