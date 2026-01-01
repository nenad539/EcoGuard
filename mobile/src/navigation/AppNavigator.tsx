import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Camera, BarChart3, User, Settings as SettingsIcon } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { trackScreen } from '../lib/analytics';
import { RootStackParamList, MainTabParamList } from './types';

import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { TermsScreen } from '../screens/TermsScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PhotoChallengeScreen } from '../screens/PhotoChallengeScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ChallengesScreen } from '../screens/ChallengesScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { FriendSystemScreen } from '../screens/FriendSystemScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { EcoTipsScreen } from '../screens/EcoTipsScreen';
import { CreateChallengeScreen } from '../screens/CreateChallengeScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { FriendChatScreen } from '../screens/FriendChatScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';
import { AdminModerationScreen } from '../screens/AdminModerationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: 'rgba(71, 85, 105, 0.5)',
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Pode\u0161avanja",
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PhotoChallenges"
        component={PhotoChallengeScreen}
        options={{
          title: "Izazovi",
          tabBarIcon: ({ color, size }) => <Camera color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Po\u010detna",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          title: "Statistika",
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Nalog",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Splash' | 'Onboarding' | 'MainTabs' | 'Login'>('Splash');
  const [checking, setChecking] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const routeNameRef = useRef<string | undefined>();

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setInitialRoute(data.session ? 'MainTabs' : 'Onboarding');
      } catch (error) {
        console.warn('Session check failed', error);
        if (mounted) setInitialRoute('Onboarding');
      } finally {
        if (mounted) setChecking(false);
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN') setInitialRoute('MainTabs');
      if (event === 'SIGNED_OUT') setInitialRoute('Login');
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (checking || showSplash) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const route = navigationRef.getCurrentRoute();
        routeNameRef.current = route?.name;
        if (route?.name) {
          trackScreen(route.name);
        }
      }}
      onStateChange={() => {
        const route = navigationRef.getCurrentRoute();
        if (!route?.name || routeNameRef.current === route.name) return;
        routeNameRef.current = route.name;
        trackScreen(route.name);
      }}
    >
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Challenges" component={ChallengesScreen} />
        <Stack.Screen name="Community" component={CommunityScreen} />
        <Stack.Screen name="Friends" component={FriendSystemScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="EcoTips" component={EcoTipsScreen} />
        <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="FriendChat" component={FriendChatScreen} />
        <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
        <Stack.Screen name="AdminModeration" component={AdminModerationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
