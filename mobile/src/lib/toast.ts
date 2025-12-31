import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

export const showToast = (type: ToastType, title: string, message?: string) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 2500,
    bottomOffset: 80,
  });
};

export const showSuccess = (title: string, message?: string) => showToast('success', title, message);
export const showError = (title: string, message?: string) => showToast('error', title, message);
export const showInfo = (title: string, message?: string) => showToast('info', title, message);
