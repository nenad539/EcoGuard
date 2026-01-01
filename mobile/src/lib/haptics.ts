import * as Haptics from 'expo-haptics';

export type HapticFeedback = 'selection' | 'impact' | 'success' | 'warning' | 'error';

let availabilityChecked = false;
let hapticsAvailable = false;

const ensureAvailable = async () => {
  if (availabilityChecked) return hapticsAvailable;
  availabilityChecked = true;
  try {
    hapticsAvailable = await Haptics.isAvailableAsync();
  } catch {
    hapticsAvailable = false;
  }
  return hapticsAvailable;
};

export const triggerHaptic = async (type: HapticFeedback = 'selection') => {
  try {
    if (!(await ensureAvailable())) return;
    if (type === 'selection') {
      await Haptics.selectionAsync();
      return;
    }
    if (type === 'impact') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    if (type === 'warning') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.warn('Haptics unavailable', error);
  }
};
