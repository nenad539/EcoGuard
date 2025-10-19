import React, { useState, useEffect } from 'react';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ChallengesScreen } from './screens/ChallengesScreen';
import { StatisticsScreen } from './screens/StatisticsScreen';
import { CommunityScreen } from './screens/CommunityScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { EcoTipsScreen } from './screens/EcoTipsScreen';
import './styles/App.css';

export type Screen = 
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'home'
  | 'challenges'
  | 'statistics'
  | 'community'
  | 'profile'
  | 'settings'
  | 'notifications'
  | 'ecoTips';

export type NavigationContextType = {
  currentScreen: Screen;
  navigateTo: (screen: Screen) => void;
  userData: {
    name: string;
    level: number;
    points: number;
    recycled: number;
    energySaved: number;
    co2Reduced: number;
  };
};

export const NavigationContext = React.createContext<NavigationContextType>({
  currentScreen: 'splash',
  navigateTo: () => {},
  userData: {
    name: 'Marko',
    level: 3,
    points: 2450,
    recycled: 127,
    energySaved: 85,
    co2Reduced: 42,
  },
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [userData] = useState({
    name: 'Niggac',
    level: 3,
    points: 2450,
    recycled: 127,
    energySaved: 85,
    co2Reduced: 42,
  });

  useEffect(() => {
    // Auto-navigate from splash to onboarding after 2.5 seconds
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        setCurrentScreen('onboarding');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const navigationContext: NavigationContextType = {
    currentScreen,
    navigateTo,
    userData,
  };

  return (
    <NavigationContext.Provider value={navigationContext}>
      <div className="app-container">
        {currentScreen === 'splash' && <SplashScreen />}
        {currentScreen === 'onboarding' && <OnboardingScreen />}
        {currentScreen === 'login' && <LoginScreen />}
        {currentScreen === 'register' && <RegisterScreen />}
        {currentScreen === 'home' && <HomeScreen />}
        {currentScreen === 'challenges' && <ChallengesScreen />}
        {currentScreen === 'statistics' && <StatisticsScreen />}
        {currentScreen === 'community' && <CommunityScreen />}
        {currentScreen === 'profile' && <ProfileScreen />}
        {currentScreen === 'settings' && <SettingsScreen />}
        {currentScreen === 'notifications' && <NotificationsScreen />}
        {currentScreen === 'ecoTips' && <EcoTipsScreen />}
      </div>
    </NavigationContext.Provider>
  );
}
