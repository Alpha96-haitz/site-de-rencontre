import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const { login, loginWithGoogle } = useAuth();
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.header}>
          <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Content de te revoir</Text>
          <Text style={styles.subtitle}>Prêt à faire de nouvelles rencontres ?</Text>
        </View>

        <View style={styles.form}>
          <AppInput 
            placeholder="Adresse e-mail" 
            autoCapitalize="none" 
            keyboardType="email-address" 
            value={email} 
            onChangeText={setEmail} 
          />
          <View>
             <AppInput 
               placeholder="Mot de passe" 
               secureTextEntry 
               value={password} 
               onChangeText={setPassword} 
             />
             <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
               <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
             </Pressable>
          </View>

          <AppButton title="Se connecter" onPress={handleLogin} loading={loading} style={styles.submitBtn} />
          
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.ou}>OU</Text>
            <View style={styles.line} />
          </View>

          <AppButton 
            title="Continuer avec Google" 
            onPress={loginWithGoogle} 
            variant="secondary" 
          />
        </View>

        <Pressable onPress={() => navigation.navigate('Signup')} style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ? <Text style={styles.link}>S'inscrire</Text></Text>
        </Pressable>
        
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 120, height: 120, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 16, textAlign: 'center' },
  form: { gap: 4 },
  forgot: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  submitBtn: { marginBottom: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  ou: { marginHorizontal: 16, color: colors.textGhost, fontWeight: '700', fontSize: 12 },
  footer: { marginTop: 'auto', paddingVertical: 24, alignItems: 'center' },
  footerText: { color: colors.textMuted, fontSize: 15 },
  link: { color: colors.primary, fontWeight: '700' }
});
