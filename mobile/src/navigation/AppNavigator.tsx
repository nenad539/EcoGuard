import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Camera, BarChart3, User, Settings as SettingsIcon } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { RootStackParamList, MainTabParamList } from './types';

import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { TermsScreen } from '../screens/TermsScreen';
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
import { EditProfileScreen } from '../screens/EditProfileScreen';

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
          title: 'Podešavanja',
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PhotoChallenges"
        component={PhotoChallengeScreen}
        options={{
          title: 'Izazovi',
          tabBarIcon: ({ color, size }) => <Camera color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Početna',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          title: 'Statistika',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Nalog',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Splash' | 'Onboarding' | 'MainTabs'>('Splash');
  const [checking, setChecking] = useState(true);

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

  if (checking) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={initialRoute}
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Challenges" component={ChallengesScreen} />
        <Stack.Screen name="Community" component={CommunityScreen} />
        <Stack.Screen name="Friends" component={FriendSystemScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="EcoTips" component={EcoTipsScreen} />
        <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
