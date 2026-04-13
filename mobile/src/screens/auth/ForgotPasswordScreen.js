import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AppButton from '../../components/AppButton';
import { colors } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const { forgotPassword, verifyResetCode, resetPassword } = useAuth();
  const [step, setStep] = useState('email'); // email | code | password | done
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const codeInputs = useRef([]);

  const handleSendCode = async () => {
    if (!email.trim()) return Alert.alert('Attention', 'Veuillez entrer votre email.');
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setStep('code');
    } catch (err) {
      // Pour la sécurité, on avance quand même ou on gère l'erreur
      setStep('code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return Alert.alert('Erreur', 'Code incomplet.');
    setLoading(true);
    try {
      const res = await verifyResetCode(email.trim().toLowerCase(), fullCode);
      setResetToken(res.resetToken);
      setStep('password');
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (password.length < 6) return Alert.alert('Erreur', 'Mot de passe trop court.');
    if (password !== confirmPassword) return Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
    
    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      setStep('done');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de réinitialiser le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text.slice(-1);
    setCode(newCode);
    if (text && index < 5) codeInputs.current[index + 1].focus();
  };

  const handleCodeKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1].focus();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 'email' && "Récupération"}
            {step === 'code' && "Vérification"}
            {step === 'password' && "Nouveau Pass"}
            {step === 'done' && "Félicitations"}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email' && "Entrez votre email pour recevoir votre code de réinitialisation."}
            {step === 'code' && `Le code a été envoyé à ${email}`}
            {step === 'password' && "Définissez votre nouveau mot de passe sécurisé."}
            {step === 'done' && "Votre mot de passe a été réinitialisé avec succès."}
          </Text>
        </View>

        {step === 'email' && (
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Votre adresse email"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <AppButton title="Envoyer le code" onPress={handleSendCode} loading={loading} />
          </View>
        )}

        {step === 'code' && (
          <View style={styles.form}>
            <View style={styles.codeContainer}>
              {code.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => (codeInputs.current[idx] = ref)}
                  style={styles.codeInput}
                  value={digit}
                  onChangeText={(t) => handleCodeChange(t, idx)}
                  onKeyPress={(e) => handleCodeKeyPress(e, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                  placeholderTextColor="#475569"
                />
              ))}
            </View>
            <AppButton title="Vérifier le code" onPress={handleVerifyCode} loading={loading} />
            <Pressable onPress={() => setStep('email')} style={styles.linkBtn}>
              <Text style={styles.linkText}>Changer d'email</Text>
            </Pressable>
          </View>
        )}

        {step === 'password' && (
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Nouveau mot de passe"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Confirmer mot de passe"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            <AppButton title="Mettre à jour" onPress={handleResetPassword} loading={loading} />
          </View>
        )}

        {step === 'done' && (
          <View style={styles.doneContainer}>
             <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={50} color={colors.primary} />
             </View>
             <AppButton title="Retour à la connexion" onPress={() => navigation.navigate('Login')} />
          </View>
        )}

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
    paddingTop: 60,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeInput: {
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
  linkBtn: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  doneContainer: {
    alignItems: 'center',
    paddingTop: 20,
    gap: 30,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
