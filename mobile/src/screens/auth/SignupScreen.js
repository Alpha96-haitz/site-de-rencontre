import React, { useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { colors } from '../../theme/colors';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LETTERS_ONLY_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TOTAL_STEPS = 6;

export default function SignupScreen({ navigation }) {
  const { signup, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photoAsset, setPhotoAsset] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateDraft, setDateDraft] = useState({ year: 2000, month: 1, day: 1 });
  const scrollRef = useRef(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    city: ''
  });

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setLetterField = (key, value) => {
    if (value === '' || LETTERS_ONLY_REGEX.test(value)) {
      setField(key, value);
    }
  };
  const setBirthDateField = (value) => {
    const cleaned = value.replace(/[^\d-]/g, '').slice(0, 10);
    setField('birthDate', cleaned);
  };

  const progress = useMemo(() => Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1), []);
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1939 }, (_, i) => currentYear - i);
  }, []);

  const ensureInputVisible = (y = 220) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    }, 80);
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorise la galerie pour ajouter ta photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8
    });
    if (result.canceled) return;
    setPhotoAsset(result.assets[0]);
  };

  const isValidBirthDate = (value) => {
    if (!DATE_ONLY_REGEX.test(value)) return false;
    const [yearRaw, monthRaw, dayRaw] = value.split('-');
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    const parsed = new Date(year, month - 1, day);

    const isExactDate =
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day;

    if (!isExactDate) return false;

    const today = new Date();
    parsed.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return parsed <= today;
  };

  const formatDateParts = ({ year, month, day }) =>
    `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

  const parseBirthDate = (value) => {
    if (!DATE_ONLY_REGEX.test(value)) return null;
    const [yearRaw, monthRaw, dayRaw] = value.split('-');
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    if (!year || !month || !day) return null;
    return { year, month, day };
  };

  const openDateModal = () => {
    const parsed = parseBirthDate(form.birthDate.trim());
    const fallback = { year: 2000, month: 1, day: 1 };
    setDateDraft(parsed || fallback);
    setShowDateModal(true);
  };

  const updateDraftField = (key, delta) => {
    setDateDraft((prev) => {
      if (key === 'year') {
        const minYear = years[years.length - 1];
        const maxYear = years[0];
        const nextYear = Math.min(maxYear, Math.max(minYear, prev.year + delta));
        const maxDay = getDaysInMonth(nextYear, prev.month);
        return { ...prev, year: nextYear, day: Math.min(prev.day, maxDay) };
      }
      if (key === 'month') {
        const nextMonth = Math.min(12, Math.max(1, prev.month + delta));
        const maxDay = getDaysInMonth(prev.year, nextMonth);
        return { ...prev, month: nextMonth, day: Math.min(prev.day, maxDay) };
      }
      const maxDay = getDaysInMonth(prev.year, prev.month);
      const nextDay = Math.min(maxDay, Math.max(1, prev.day + delta));
      return { ...prev, day: nextDay };
    });
  };

  const confirmDateFromPicker = () => {
    setField('birthDate', formatDateParts(dateDraft));
    setShowDateModal(false);
  };

  const validateTextOnly = (label, value) => {
    const cleaned = value.trim();
    if (!cleaned) return `${label} est obligatoire.`;
    if (!LETTERS_ONLY_REGEX.test(cleaned)) return `${label} doit contenir uniquement des lettres.`;
    if (cleaned.length < 2) return `${label} doit contenir au moins 2 lettres.`;
    return null;
  };

  const validateStep1 = () => {
    if (!form.username.trim() || !form.email.trim()) {
      return "Veuillez remplir tous les champs.";
    }
    if (!USERNAME_REGEX.test(form.username.trim())) {
      return "Le nom d'utilisateur ne doit contenir que lettres, chiffres et underscore.";
    }
    if (form.username.trim().length < 3) {
      return "Le nom d'utilisateur doit faire au moins 3 caracteres.";
    }
    if (!EMAIL_REGEX.test(form.email.trim().toLowerCase())) {
      return "Veuillez saisir un email valide (type adresse@mail.com).";
    }
    return null;
  };

  const validateStep2 = () => {
    if (!form.password || !form.birthDate.trim()) {
      return 'Veuillez remplir les deux champs.';
    }
    if (form.password.length < 6) {
      return 'Le mot de passe doit faire au moins 6 caracteres.';
    }
    if (!isValidBirthDate(form.birthDate.trim())) {
      return 'La date de naissance doit etre une date valide au format YYYY-MM-DD.';
    }
    return null;
  };

  const validateStep3 = () => validateTextOnly('Le prenom', form.firstName) || validateTextOnly('Le nom', form.lastName);

  const validateStep4 = () => {
    const cityError = validateTextOnly('La ville', form.city);
    if (cityError) return cityError;
    if (!form.gender) return 'Veuillez selectionner votre genre.';
    return null;
  };

  const validateCurrentStep = () => {
    if (step === 1) return validateStep1();
    if (step === 2) return validateStep2();
    if (step === 3) return validateStep3();
    if (step === 4) return validateStep4();
    if (step === 5 && !photoAsset) return 'Veuillez ajouter une photo de profil.';
    return null;
  };

  const nextStep = () => {
    const error = validateCurrentStep();
    if (error) {
      Alert.alert('Validation', error);
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    try {
      const finalError =
        validateStep1() ||
        validateStep2() ||
        validateStep3() ||
        validateStep4() ||
        (!photoAsset ? 'Veuillez ajouter une photo de profil.' : null);
      if (finalError) {
        Alert.alert('Validation', finalError);
        return;
      }

      setLoading(true);
      const payload = {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        birthDate: form.birthDate,
        gender: form.gender,
        location: { city: form.city.trim() }
      };

      const result = await signup(payload);

      if (photoAsset) {
        const uploadData = new FormData();
        uploadData.append('photo', {
          uri: photoAsset.uri,
          type: photoAsset.mimeType || 'image/jpeg',
          name: photoAsset.fileName || 'profile.jpg'
        });
        await userService.uploadPhoto(uploadData);
        await refreshUser();
      }

      if (result?.needsVerification) {
        // Redirection automatique via AppNavigator car token est présent
      } else {
        Alert.alert('Succès', 'Bienvenue sur HAITZ-RENCONTRE !');
      }
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      style={styles.container}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={Keyboard.dismiss}>
          <Image source={require('../../../assets/logo.png')} style={styles.logo} contentFit="contain" />
          <Text style={styles.title}>Creer un compte</Text>
          <View style={styles.progressRow}>
            {progress.map((item) => (
              <View
                key={item}
                style={[
                  styles.progressDot,
                  step >= item ? styles.progressDotDone : null,
                  step === item ? styles.progressDotActive : null
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepTitle}>
            {step === 1 && 'Connexion - 2 champs'}
            {step === 2 && 'Securite - 2 champs'}
            {step === 3 && 'Identite - 2 champs'}
            {step === 4 && 'Profil - 2 champs'}
            {step === 5 && 'Photo de profil obligatoire'}
            {step === 6 && 'Confirmation'}
          </Text>

          {step === 1 && (
            <View style={styles.card}>
              <AppInput
                placeholder="Nom d'utilisateur"
                autoCapitalize="none"
                value={form.username}
                onChangeText={(v) => setField('username', v)}
                onFocus={() => ensureInputVisible(170)}
              />
              <AppInput
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                inputMode="email"
                value={form.email}
                onChangeText={(v) => setField('email', v)}
                onFocus={() => ensureInputVisible(250)}
              />
              <AppButton title="Suivant" onPress={nextStep} />
            </View>
          )}

          {step === 2 && (
            <View style={styles.card}>
              <AppInput
                placeholder="Mot de passe"
                secureTextEntry
                value={form.password}
                onChangeText={(v) => setField('password', v)}
                onFocus={() => ensureInputVisible(170)}
              />
              <AppInput
                placeholder="Date de naissance (YYYY-MM-DD)"
                value={form.birthDate}
                keyboardType="numbers-and-punctuation"
                inputMode="numeric"
                maxLength={10}
                onChangeText={setBirthDateField}
                onFocus={() => ensureInputVisible(250)}
              />
              <AppButton title="Choisir une date" variant="secondary" onPress={openDateModal} style={styles.dateButton} />
              <Text style={styles.helperText}>Format accepte: YYYY-MM-DD (exemple: 1998-04-15)</Text>
              <View style={styles.row}>
                <AppButton title="Retour" variant="secondary" onPress={prevStep} style={styles.flex} />
                <AppButton title="Suivant" onPress={nextStep} style={styles.flex} />
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.card}>
              <AppInput placeholder="Prenom" value={form.firstName} onChangeText={(v) => setLetterField('firstName', v)} onFocus={() => ensureInputVisible(170)} />
              <AppInput placeholder="Nom" value={form.lastName} onChangeText={(v) => setLetterField('lastName', v)} onFocus={() => ensureInputVisible(250)} />
              <View style={styles.row}>
                <AppButton title="Retour" variant="secondary" onPress={prevStep} style={styles.flex} />
                <AppButton title="Suivant" onPress={nextStep} style={styles.flex} />
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.card}>
              <AppInput placeholder="Ville" value={form.city} onChangeText={(v) => setLetterField('city', v)} onFocus={() => ensureInputVisible(200)} />
              <View>
                <Text style={styles.label}>Genre</Text>
                <View style={styles.genderRow}>
                  <Pressable
                    style={[styles.genderChip, form.gender === 'male' && styles.genderChipActive]}
                    onPress={() => setField('gender', 'male')}
                  >
                    <Text style={[styles.genderText, form.gender === 'male' && styles.genderTextActive]}>Homme</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.genderChip, form.gender === 'female' && styles.genderChipActive]}
                    onPress={() => setField('gender', 'female')}
                  >
                    <Text style={[styles.genderText, form.gender === 'female' && styles.genderTextActive]}>Femme</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.genderChip, form.gender === 'other' && styles.genderChipActive]}
                    onPress={() => setField('gender', 'other')}
                  >
                    <Text style={[styles.genderText, form.gender === 'other' && styles.genderTextActive]}>Autre</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.row}>
                <AppButton title="Retour" variant="secondary" onPress={prevStep} style={styles.flex} />
                <AppButton title="Suivant" onPress={nextStep} style={styles.flex} />
              </View>
            </View>
          )}

          {step === 5 && (
            <View style={styles.cardCenter}>
              <Pressable style={styles.photoBox} onPress={pickPhoto}>
                {photoAsset ? (
                  <Image source={photoAsset.uri} style={styles.photoPreview} contentFit="cover" />
                ) : (
                  <Ionicons name="camera-outline" size={42} color={colors.textMuted} />
                )}
              </Pressable>
              <Text style={styles.photoHint}>Une photo est obligatoire pour continuer.</Text>
              <View style={styles.row}>
                <AppButton title="Retour" variant="secondary" onPress={prevStep} style={styles.flex} />
                <AppButton title={photoAsset ? 'Suivant' : 'Ajouter photo'} onPress={photoAsset ? nextStep : pickPhoto} style={styles.flex} />
              </View>
            </View>
          )}

          {step === 6 && (
            <View style={styles.card}>
              <View style={styles.summary}>
                <Text style={styles.summaryLine}>@{form.username}</Text>
                <Text style={styles.summaryLine}>{form.firstName} {form.lastName}</Text>
                <Text style={styles.summaryLine}>{form.email}</Text>
                <Text style={styles.summaryLine}>Naissance: {form.birthDate}</Text>
                <Text style={styles.summaryLine}>{form.city}</Text>
              </View>
              <View style={styles.row}>
                <AppButton title="Retour" variant="secondary" onPress={prevStep} style={styles.flex} />
                <AppButton title="Confirmer l'inscription" onPress={handleSubmit} loading={loading} style={styles.flexWide} />
              </View>
            </View>
          )}

          <Pressable onPress={() => navigation.navigate('Login')} style={{ marginTop: 18 }}>
            <Text style={styles.link}>Deja un compte ? Connexion</Text>
          </Pressable>
        </Pressable>
      </ScrollView>

      <Modal visible={showDateModal} transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selectionner une date</Text>
            <View style={styles.datePickerRow}>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Jour</Text>
                <Pressable onPress={() => updateDraftField('day', 1)} style={styles.dateIconBtn}>
                  <Ionicons name="chevron-up" size={20} color={colors.text} />
                </Pressable>
                <Text style={styles.dateValue}>{String(dateDraft.day).padStart(2, '0')}</Text>
                <Pressable onPress={() => updateDraftField('day', -1)} style={styles.dateIconBtn}>
                  <Ionicons name="chevron-down" size={20} color={colors.text} />
                </Pressable>
              </View>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Mois</Text>
                <Pressable onPress={() => updateDraftField('month', 1)} style={styles.dateIconBtn}>
                  <Ionicons name="chevron-up" size={20} color={colors.text} />
                </Pressable>
                <Text style={styles.dateValue}>{String(dateDraft.month).padStart(2, '0')}</Text>
                <Pressable onPress={() => updateDraftField('month', -1)} style={styles.dateIconBtn}>
                  <Ionicons name="chevron-down" size={20} color={colors.text} />
                </Pressable>
              </View>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Annee</Text>
                <Pressable onPress={() => updateDraftField('year', 1)} style={styles.dateIconBtn}>
                  <Ionicons name="chevron-up" size={20} color={colors.text} />
                </Pressable>
                <Text style={styles.dateValue}>{dateDraft.year}</Text>
                <Pressable onPress={() => updateDraftField('year', -1)} style={styles.dateIconBtn}>
                  <Ionicons name="chevron-down" size={20} color={colors.text} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.datePreview}>Date choisie: {formatDateParts(dateDraft)}</Text>
            <View style={styles.row}>
              <AppButton title="Annuler" variant="secondary" onPress={() => setShowDateModal(false)} style={styles.flex} />
              <AppButton title="Valider" onPress={confirmDateFromPicker} style={styles.flex} />
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { justifyContent: 'flex-start', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  logo: { width: '100%', height: 220, alignSelf: 'center', marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  progressDot: { height: 8, flex: 1, borderRadius: 8, backgroundColor: '#CBD5E1' },
  progressDotDone: { backgroundColor: colors.primaryLight },
  progressDotActive: { backgroundColor: colors.primary },
  stepTitle: { color: colors.textMuted, marginBottom: 16, fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14
  },
  cardCenter: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'center'
  },
  label: { color: colors.text, fontWeight: '700', marginBottom: 8, marginTop: 2 },
  dateButton: { marginTop: -4, marginBottom: 10 },
  helperText: { color: colors.textMuted, marginTop: -8, marginBottom: 12, fontSize: 12 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  genderChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center'
  },
  genderChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FDF2F8'
  },
  genderText: { color: colors.textMuted, fontWeight: '600' },
  genderTextActive: { color: colors.primaryDark, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  flex: { flex: 1 },
  flexWide: { flex: 1.7 },
  link: { color: colors.primary, textAlign: 'center', fontWeight: '600' },
  photoBox: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden'
  },
  photoPreview: { width: 160, height: 160 },
  photoHint: { color: colors.textMuted, marginVertical: 12, textAlign: 'center' },
  summary: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  summaryLine: { color: colors.text, marginBottom: 6, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  datePickerRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dateCol: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 8
  },
  dateLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 6, fontWeight: '700' },
  dateValue: { color: colors.text, fontSize: 22, fontWeight: '800', marginVertical: 6 },
  dateIconBtn: {
    width: 34,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg
  },
  datePreview: { color: colors.textMuted, textAlign: 'center', marginBottom: 12, fontWeight: '600' },
  modalText: { color: colors.text, textAlign: 'center', marginBottom: 20, lineHeight: 20 }
});
