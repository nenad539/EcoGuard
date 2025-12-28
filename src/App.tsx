import React, { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "./supabase-client";
import { SplashScreen } from "./screens/SplashScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { CreateChallengeScreen } from "./screens/CreateChallengeScreen";
import { FriendSystemScreen } from "./screens/FriendSystemScreen";
import { ChallengesScreen } from "./screens/ChallengesScreen";
import { StatisticsScreen } from "./screens/StatisticsScreen";
import { CommunityScreen } from "./screens/CommunityScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { EcoTipsScreen } from "./screens/EcoTipsScreen";
import { PhotoChallengeScreen } from "./screens/PhotoChallengeScreen";
import { TermsScreen } from "./screens/TermsScreen";
import { EditProfileScreen } from "./screens/EditProfileScreen";
import { ChatScreen } from "./screens/ChatScreen";
import "./styles/App.css";

export type Screen =
  | "splash"
  | "onboarding"
  | "login"
  | "register"
  | "home"
  | "challenges"
  | "statistics"
  | "community"
  | "friends"
  | "profile"
  | "edit-profile"
  | "createChallenge"
  | "settings"
  | "notifications"
  | "ecoTips"
  | "terms"
  | "photoChallenge"
  | "chat";

export type Theme = "light" | "dark";

export type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

export type NavigationContextType = {
  currentScreen: Screen;
  navigateTo: (screen: Screen, sub?: string) => void;
  setChallengeData?: (data: any) => void;
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
  theme: "dark",
  toggleTheme: () => {},
});

export const NavigationContext = React.createContext<NavigationContextType>({
  currentScreen: "splash",
  navigateTo: () => {},
  setChallengeData: () => {},
  userData: {
    name: "Marko",
    level: 3,
    points: 2450,
    recycled: 127,
    energySaved: 85,
    co2Reduced: 42,
  },
});

export const useTheme = () => useContext(ThemeContext);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [theme, setTheme] = useState<Theme>("dark");
  const [userData] = useState({
    name: "Nenad",
    level: 3,
    points: 2450,
    recycled: 127,
    energySaved: 85,
    co2Reduced: 42,
  });
  const [challengeData, setChallengeData] = useState<any | null>(null);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    if (currentScreen === "splash") {
      const timer = setTimeout(() => {
        setCurrentScreen("onboarding");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn("auth.getUser on mount error:", error);
        }
        const userId = data?.user?.id;
        if (mounted && userId) {
          setCurrentScreen("home");
        }
      } catch (e) {
        console.warn("Error checking auth on mount:", e);
      }
    };

    checkUser();

    // Subscribe to auth state changes to keep navigation in sync.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // When user signs out, navigate to login. When signed in, navigate to home.
        if (event === "SIGNED_OUT") {
          setCurrentScreen("login");
        } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          setCurrentScreen("home");
        }
      }
    );

    return () => {
      mounted = false;
      // Unsubscribe
      try {
        listener?.subscription?.unsubscribe();
      } catch (e) {}
    };
  }, []);

  const navigateTo = (screen: Screen, sub?: string) => {
    // Ako idemo na photoChallenge sa sub parametrom, možemo ga obraditi
    if (screen === "photoChallenge" && sub) {
      console.log(`Navigating to photoChallenge with sub: ${sub}`);
      // Ovdje možete dodati logiku za postavljanje aktivnog taba ako je potrebno
    }
    setCurrentScreen(screen);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const themeContext: ThemeContextType = {
    theme,
    toggleTheme,
  };

  const navigationContext: NavigationContextType = {
    currentScreen,
    navigateTo,
    setChallengeData,
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
          {currentScreen === "friends" && <FriendSystemScreen />}
          {currentScreen === "createChallenge" && <CreateChallengeScreen />}
          {currentScreen === "challenges" && <ChallengesScreen />}
          {currentScreen === "statistics" && <StatisticsScreen />}
          {currentScreen === "community" && <CommunityScreen />}
          {currentScreen === "profile" && <ProfileScreen />}
          {currentScreen === "edit-profile" && <EditProfileScreen />}
          {currentScreen === "settings" && <SettingsScreen />}
          {currentScreen === "notifications" && <NotificationsScreen />}
          {currentScreen === "ecoTips" && <EcoTipsScreen />}
          {currentScreen === "photoChallenge" && (
            <PhotoChallengeScreen
              navigateToCreate={() => navigateTo("createChallenge")}
            />
          )}
          {currentScreen === "terms" && <TermsScreen />}
          {currentScreen === "chat" && <ChatScreen />}
        </div>
      </NavigationContext.Provider>
    </ThemeContext.Provider>
  );
}
