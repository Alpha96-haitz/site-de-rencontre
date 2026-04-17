import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function LoadingScreen({ label = 'Chargement' }) {
  const { theme } = useTheme();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Progress bar animation
    Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false, // Cannot use native driver for layout/left
      })
    ).start();
  }, []);

  const progressInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </Animated.View>

      <View style={styles.loaderContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: theme.primary,
                left: progressInterpolate
              }
            ]} 
          />
        </View>
        <Text style={[styles.text, { color: theme.textMuted }]}>
          {label.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 40
  },
  logo: {
    width: 140,
    height: 60,
    marginBottom: 60,
  },
  loaderContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: 120,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    width: '50%',
    height: '100%',
    borderRadius: 2,
  },
  text: { 
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
  }
});
