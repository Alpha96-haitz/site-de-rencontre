import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollGrow} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.title, { color: theme.text }]}>Content de te revoir</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Prêt(e) à faire de nouvelles rencontres ?</Text>
          </View>

          <View style={styles.formCard}>
            <AppInput
              icon="mail"
              placeholder="Adresse e-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <View style={styles.relativeBlock}>
              <AppInput
                icon="lock-closed"
                placeholder="Mot de passe"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
                <Text style={[styles.forgotText, { color: theme.primary }]}>Oublié ?</Text>
              </Pressable>
            </View>

            <AppButton title="SE CONNECTER" onPress={handleLogin} loading={loading} style={styles.submitBtn} />
            
            <Pressable onPress={() => navigation.navigate('Signup')} style={styles.registerWrap}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>Pas encore de compte ? <Text style={[styles.link, { color: theme.primary }]}>S'inscrire</Text></Text>
            </Pressable>
          </View>

          <View style={styles.termsWrapper}>
            <Text style={[styles.termsText, { color: theme.textGhost }]}>
              En vous connectant, vous acceptez nos{' '}
              <Text style={styles.underline}>Conditions d'utilisation</Text> et notre{' '}
              <Text style={styles.underline}>Politique de confidentialité</Text>.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollGrow: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 180, height: 180, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '900', color: colors.text, marginBottom: 6, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 16, textAlign: 'center', fontWeight: '500' },
  formCard: { 
    backgroundColor: 'transparent',
    gap: 8,
    width: '100%'
  },
  relativeBlock: { position: 'relative' },
  forgot: { position: 'absolute', right: 12, top: 16, zIndex: 10, padding: 4 },
  forgotText: { color: colors.primary, fontWeight: '800', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  submitBtn: { marginTop: 12, height: 56, borderRadius: 16, elevation: 6, shadowColor: '#f43f5e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  registerWrap: { alignItems: 'center', marginTop: 24, marginBottom: 10 },
  footerText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '800' },
  termsWrapper: { marginTop: 'auto', paddingTop: 40, paddingHorizontal: 16 },
  termsText: { fontSize: 11, textAlign: 'center', lineHeight: 18, fontWeight: '500' },
  underline: { textDecorationLine: 'underline' }
});
