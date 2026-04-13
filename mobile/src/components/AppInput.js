import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

export default function AppInput(props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          props.style
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16
  },
  inputFocused: {
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface
  }
});
