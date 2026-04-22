import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View, Image, ScrollView, Modal } from 'react-native';
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
  const [showTerms, setShowTerms] = useState(false);
  const scrollRef = useRef(null);

  const ensureInputVisible = (y = 140) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    }, 80);
  };

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollGrow}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
              onFocus={() => ensureInputVisible(120)}
            />
            <View style={styles.relativeBlock}>
              <AppInput
                icon="lock-closed"
                placeholder="Mot de passe"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => ensureInputVisible(220)}
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
              <Text 
                style={styles.underline} 
                onPress={() => setShowTerms(true)}
              >
                Conditions d'utilisation
              </Text> et notre{' '}
              <Text style={styles.underline}>Politique de confidentialité</Text>.
            </Text>
          </View>

          {/* Modal des Conditions d'utilisation */}
          <Modal visible={showTerms} animationType="slide" transparent={false}>
            <View style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Conditions d'utilisation</Text>
                <Pressable onPress={() => setShowTerms(false)} style={styles.closeBtn}>
                  <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Fermer</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={[styles.termsFullText, { color: theme.text }]}>
                  Bienvenue sur HAITZ. En utilisant notre plateforme, vous acceptez les présentes conditions d'utilisation. Ces conditions définissent vos droits et obligations vis-à-vis de notre service, de nos utilisateurs et de notre communauté.{"\n\n"}
                  <Text style={styles.bold}>1. Inscription</Text>{"\n"}
                  Vous devez avoir au moins 18 ans pour créer un compte. Les informations que vous fournissez doivent être véridiques et à jour. Toute fausse déclaration peut entraîner la suspension de votre compte.{"\n\n"}
                  <Text style={styles.bold}>2. Contenu utilisateur</Text>{"\n"}
                  Vous restez responsable du contenu que vous publiez. Aucun contenu haineux, discriminatoire ou illégal n'est autorisé. Nous nous réservons le droit de supprimer tout contenu non conforme.{"\n\n"}
                  <Text style={styles.bold}>3. Comportement</Text>{"\n"}
                  Le respect et la bienveillance sont obligatoires. Le harcèlement, le spamming et les comportements abusifs peuvent conduire à un bannissement immédiat.{"\n\n"}
                  <Text style={styles.bold}>4. Propriété intellectuelle</Text>{"\n"}
                  Tous les droits sur la marque HAITZ, l'interface et le contenu propriétaire sont réservés. Vous pouvez utiliser le service dans le cadre de l'application des présentes conditions.
                </Text>
              </ScrollView>
            </View>
          </Modal>
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
  underline: { textDecorationLine: 'underline' },
  modalContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 20 },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 20,
    borderBottomWidth: 1
  },
  modalTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  closeBtn: { padding: 8 },
  modalContent: { padding: 20 },
  termsFullText: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  bold: { fontWeight: '900', fontSize: 16 }
});
