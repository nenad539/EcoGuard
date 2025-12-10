import React, { useState, useEffect, createContext, useContext } from 'react';
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
import { PhotoChallengeScreen } from './screens/PhotoChallengeScreen';
import { TermsScreen } from './screens/TermsScreen';
import { FriendSystemScreen } from "./screens/FriendSystemScreen";
import { CreateChallengeScreen } from './screens/CreateChallengeScreen';
import './styles/App.css';

export type Screen =
  | "splash"
  | "onboarding"
  | "login"
  | "register"
  | "home"
  | "challenges"
  | "statistics"
  | "community"
  | "profile"
  | "settings"
  | "notifications"
  | "ecoTips"
  | "terms"
  | "photoChallenge"
  | "friends"
  | "createChallenge";

export type Theme = 'light' | 'dark';

export type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

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

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

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

export const useTheme = () => useContext(ThemeContext);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [theme, setTheme] = useState<Theme>('dark');
  const [userData] = useState({
    name: 'Nenad',
    level: 3,
    points: 2450,
    recycled: 127,
    energySaved: 85,
    co2Reduced: 42,
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.className = theme;
  }, [theme]);

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const themeContext: ThemeContextType = {
    theme,
    toggleTheme,
  };

  const navigationContext: NavigationContextType = {
    currentScreen,
    navigateTo,
    userData,
  };

  return (
    <ThemeContext.Provider value={themeContext}>
      <NavigationContext.Provider value={navigationContext}>
        <div className="app-container">
          {currentScreen === "splash" && <SplashScreen />}
          {currentScreen === "onboarding" && <OnboardingScreen />}
          {currentScreen === "login" && <LoginScreen />}
          {currentScreen === "register" && <RegisterScreen />}
          {currentScreen === "home" && <HomeScreen />}
          {currentScreen === "challenges" && <ChallengesScreen />}
          {currentScreen === "statistics" && <StatisticsScreen />}
          {currentScreen === "community" && <CommunityScreen />}
          {currentScreen === "profile" && <ProfileScreen />}
          {currentScreen === "settings" && <SettingsScreen />}
          {currentScreen === "notifications" && <NotificationsScreen />}
          {currentScreen === "ecoTips" && <EcoTipsScreen />}
          {currentScreen === "photoChallenge" && <PhotoChallengeScreen />}
          {currentScreen === "terms" && <TermsScreen />}
          {currentScreen === "friends" && <FriendSystemScreen />}
          {currentScreen === 'createChallenge' && <CreateChallengeScreen />}
        </div>
      </NavigationContext.Provider>
    </ThemeContext.Provider>
  );
}
