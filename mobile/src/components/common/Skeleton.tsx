import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { colors, radius } from '../../styles/common';

type SkeletonBlockProps = {
  width?: number | string;
  height?: number;
  radiusSize?: number;
  style?: ViewStyle;
};

export function SkeletonBlock({
  width = '100%',
  height = 12,
  radiusSize = radius.sm,
  style,
}: SkeletonBlockProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radiusSize,
          backgroundColor: colors.cardAlt,
          opacity,
        },
        style,
      ]}
    />
  );
}
