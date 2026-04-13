import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AppButton from '../../components/AppButton';
import { colors } from '../../theme/colors';

export default function EmailVerificationScreen() {
  const { verifyEmail, logout, user } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text.slice(-1);
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return Alert.alert('Erreur', 'Entrez les 6 chiffres.');

    setLoading(true);
    try {
      await verifyEmail(fullCode);
      Alert.alert('Succès', 'Votre email a été vérifié !');
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-unread" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Vérification</Text>
          <Text style={styles.subtitle}>
            Entrez le code envoyé à{"\n"}
            <Text style={styles.email}>{user?.email}</Text>
          </subtitle>
        </View>

        <View style={styles.codeContainer}>
          {code.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => (inputs.current[idx] = ref)}
              style={styles.input}
              value={digit}
              onChangeText={(t) => handleChange(t, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              placeholderTextColor={colors.textGhost}
              selectionColor={colors.primary}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <AppButton 
            title="Vérifier le compte" 
            onPress={handleVerify} 
            loading={loading}
            style={styles.primaryBtn}
          />
          <Pressable onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Utiliser un autre compte</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  email: {
    color: colors.primary,
    fontWeight: '700',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  input: {
    width: '14%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  footer: {
    gap: 16,
  },
  primaryBtn: {
    borderRadius: 16,
    height: 56,
  },
  logoutBtn: {
    padding: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  }
});
