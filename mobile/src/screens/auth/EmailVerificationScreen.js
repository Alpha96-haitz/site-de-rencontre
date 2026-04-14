import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AppButton from '../../components/AppButton';
import { authService } from '../../services/authService';
import { colors } from '../../theme/colors';

export default function EmailVerificationScreen() {
  const { refreshUser, logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      await authService.resendVerification();
      Alert.alert('E-mail envoyé', 'Un nouveau lien de validation a été envoyé à votre adresse e-mail.');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de renvoyer l\'e-mail. Veuillez réessayer plus tard.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      const updatedUser = await refreshUser();
      if (updatedUser?.emailVerified) {
        Alert.alert('Succès', 'Votre adresse e-mail a bien été validée !');
      } else {
        Alert.alert('En attente', "Votre adresse e-mail n'est pas encore validée. Veuillez vérifier votre boîte de réception et cliquer sur le lien.");
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de vérifier le statut. Veuillez réessayer.');
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
          <Text style={styles.title}>Vérifiez votre e-mail</Text>
          <Text style={styles.subtitle}>
            Nous vous avons envoyé un lien d'activation à l'adresse{"\\n"}
            <Text style={styles.email}>{user?.email}</Text>
          </Text>
          
          <View style={styles.instructionBox}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.instructionText}>
              Veuillez ouvrir cet e-mail et cliquer sur le lien pour activer votre compte.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <AppButton 
            title="J'ai validé mon adresse e-mail" 
            onPress={handleCheckVerification} 
            loading={loading}
            style={styles.primaryBtn}
          />
          <AppButton 
            title="Renvoyer l'e-mail de validation" 
            onPress={handleResendEmail} 
            loading={resending}
            variant="secondary"
            style={styles.resendBtn}
          />
          <Pressable onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Utiliser un autre compte / Se déconnecter</Text>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  email: {
    color: colors.primary,
    fontWeight: '700',
  },
  instructionBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginTop: 10,
  },
  infoIcon: {
    marginRight: 10,
  },
  instructionText: {
    flex: 1,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  footer: {
    marginTop: 20,
  },
  primaryBtn: {
    marginBottom: 10,
  },
  resendBtn: {
    marginBottom: 16,
  },
  logoutBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.textGhost,
    fontSize: 15,
    fontWeight: '600',
  },
});
