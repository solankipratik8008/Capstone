import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface LogoSplashProps {
  message?: string;
}

export const LogoSplash: React.FC<LogoSplashProps> = ({ message }) => {
  // Entrance animations
  const logoScale   = useRef(new Animated.Value(0.55)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // Pulse ring
  const ringScale   = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.5)).current;

  // Three loading dots
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    // ── 1. Logo entrance (spring pop) ──────────────────────
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 55,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // ── 2. Text fades in after logo lands ──────────────
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    });

    // ── 3. Pulse ring (starts after 500 ms) ───────────────
    const ringTimer = setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 2.1,
            duration: 1400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        { resetBeforeIteration: true }
      ).start();
    }, 500);

    // ── 4. Sequential dot bounce ──────────────────────────
    const dotLoop = Animated.loop(
      Animated.sequence([
        // dot 1 up
        Animated.timing(dot1, { toValue: 1, duration: 240, useNativeDriver: true }),
        // dot 2 up (dot 1 fades)
        Animated.parallel([
          Animated.timing(dot1, { toValue: 0.25, duration: 200, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 1,    duration: 240, useNativeDriver: true }),
        ]),
        // dot 3 up (dot 2 fades)
        Animated.parallel([
          Animated.timing(dot2, { toValue: 0.25, duration: 200, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 1,    duration: 240, useNativeDriver: true }),
        ]),
        Animated.timing(dot3, { toValue: 0.25, duration: 200, useNativeDriver: true }),
      ])
    );
    dotLoop.start();

    return () => {
      clearTimeout(ringTimer);
      dotLoop.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Glowing pulse ring behind logo */}
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
      />

      {/* Logo image */}
      <Animated.View
        style={{
          transform: [{ scale: logoScale }],
          opacity: logoOpacity,
          shadowColor: '#1565C0',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 28,
          elevation: 16,
        }}
      >
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App name + optional message */}
      <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
        <Text style={styles.appName}>ParkSpot</Text>
        {message ? (
          <Text style={styles.message}>{message}</Text>
        ) : null}
      </Animated.View>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsRow, { opacity: textOpacity }]}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </Animated.View>
    </View>
  );
};

const LOGO_SIZE = 140;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1929',   // matches app icon background
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  ring: {
    position: 'absolute',
    width: LOGO_SIZE + 20,
    height: LOGO_SIZE + 20,
    borderRadius: (LOGO_SIZE + 20) / 2,
    borderWidth: 2.5,
    borderColor: '#1565C0',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE * 0.22,   // iOS-style rounded corners
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 28,
    gap: 6,
  },
  appName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  message: {
    fontSize: 14,
    color: '#7B8FA8',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1565C0',
  },
});

export default LogoSplash;
