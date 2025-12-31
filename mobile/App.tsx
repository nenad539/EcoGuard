import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AppNavigator } from './src/navigation/AppNavigator';
import { toastConfig } from './src/lib/toastConfig';
import { NotificationsListener } from './src/components/NotificationsListener';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
      <NotificationsListener />
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}
