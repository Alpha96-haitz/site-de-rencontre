import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

export default function AppButton({ title, onPress, loading, variant = 'primary', style }) {
  const isSecondary = variant === 'secondary';
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.text : '#fff'} />
      ) : (
        <Text style={[styles.text, isSecondary ? styles.textSecondary : styles.textPrimary]}>{title}</Text>
      )}
    </>
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={loading}
        style={[styles.btn, isSecondary && styles.secondary]}
      >
        {!isSecondary ? (
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            {content}
          </LinearGradient>
        ) : content}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: 14, overflow: 'hidden' },
  gradient: { paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  secondary: { 
    backgroundColor: colors.surface, 
    borderWidth: 1, 
    borderColor: colors.border, 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    alignItems: 'center' 
  },
  text: { fontWeight: '700', fontSize: 16 },
  textPrimary: { color: '#fff' },
  textSecondary: { color: colors.text }
});
