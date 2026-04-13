import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function Avatar({ uri, size = 40 }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image source={{ uri: uri || 'https://placehold.co/200x200' }} style={{ width: size, height: size, borderRadius: size / 2 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#e2e8f0' }
});
