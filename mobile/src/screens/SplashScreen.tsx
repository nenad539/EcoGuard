import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Leaf, Shield } from 'lucide-react-native';
import { colors, radius } from '../styles/common';
import { GradientBackground } from '../components/common/GradientBackground';

export function SplashScreen() {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 600,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    spin.start();
    pulse.start();

    return () => {
      spin.stop();
      pulse.stop();
    };
  }, [spinAnim, pulseAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const logoScale = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const titleTranslate = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Animated.View style={[styles.logoContainer, { opacity: logoAnim, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoBadge}>
            <Shield color={colors.primary} size={96} strokeWidth={1.5} />
            <Leaf color={colors.primaryDark} size={48} style={styles.leaf} />
          </View>

          <Animated.View style={[styles.loader, { transform: [{ rotate: spin }] }]} />
          <Animated.View style={[styles.glow, { transform: [{ scale: pulseAnim }] }]} />
        </Animated.View>

        <Animated.View style={{ opacity: titleAnim, transform: [{ translateY: titleTranslate }] }}>
          <Text style={styles.title}>GrowWithUs</Text>
          <Text style={styles.subtitle}>Čuvaj prirodu.</Text>
        </Animated.View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    position: 'absolute',
  },
  loader: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: colors.primary,
    borderRightColor: colors.primaryDark,
    marginTop: 16,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
  title: {
    marginTop: 12,
    fontSize: 28,
    color: colors.text,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 6,
    color: colors.softGreen,
  },
});
