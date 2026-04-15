import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function AppInput(props) {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const { icon, label, ...inputProps } = props;

  return (
    <View style={styles.wrap}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <View style={[
          styles.inputContainer,
          {
            backgroundColor: theme.inputBg,
            borderColor: isFocused ? theme.primary : 'transparent'
          }
      ]}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color={isFocused ? theme.primary : theme.textGhost} />
          </View>
        )}
        <TextInput
          placeholderTextColor={theme.textGhost}
          style={[
            styles.input,
            { color: theme.text },
            !icon && { paddingLeft: 16 },
            props.style
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...inputProps}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  iconContainer: {
    paddingLeft: 16,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingRight: 16,
    paddingVertical: 14,
    fontSize: 16,
  }
});
