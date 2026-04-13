import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';

export default function EditProfileScreen({ route, navigation }) {
  const { refreshUser } = useAuth();
  const profile = route.params?.profile || {};
  const [form, setForm] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    username: profile.username || '',
    bio: profile.bio || '',
    age: profile.age ? String(profile.age) : '',
    interests: (profile.interests || []).join(', '),
    location: profile.location || { city: '', country: '' }
  });
  const [saving, setSaving] = useState(false);

  const payload = useMemo(() => ({
    ...form,
    age: form.age ? Number(form.age) : undefined,
    interests: form.interests.split(',').map((v) => v.trim()).filter(Boolean)
  }), [form]);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const pickImage = async (kind) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    const file = result.assets[0];
    const data = new FormData();
    data.append('photo', {
      uri: file.uri,
      type: file.mimeType || 'image/jpeg',
      name: file.fileName || 'image.jpg'
    });
    if (kind === 'cover') await userService.uploadCover(data);
    else await userService.uploadPhoto(data);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userService.updateProfile(payload);
      await refreshUser();
      Alert.alert('Succes', 'Profil mis a jour');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <AppInput placeholder="Prenom" value={form.firstName} onChangeText={(v) => setField('firstName', v)} />
      <AppInput placeholder="Nom" value={form.lastName} onChangeText={(v) => setField('lastName', v)} />
      <AppInput placeholder="Username" value={form.username} onChangeText={(v) => setField('username', v)} />
      <AppInput placeholder="Age" keyboardType="numeric" value={form.age} onChangeText={(v) => setField('age', v)} />
      <AppInput placeholder="Bio" value={form.bio} onChangeText={(v) => setField('bio', v)} multiline numberOfLines={3} />
      <AppInput placeholder="Interets (sport, musique...)" value={form.interests} onChangeText={(v) => setField('interests', v)} />

      <AppButton title="Changer photo profil" variant="secondary" onPress={() => pickImage('profile')} />
      <AppButton title="Changer couverture" variant="secondary" onPress={() => pickImage('cover')} style={{ marginTop: 10 }} />

      <AppButton title="Enregistrer" onPress={handleSave} loading={saving} style={{ marginTop: 12 }} />
      <Text style={styles.helper}>Upload image via Cloudinary backend deja configure.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  helper: { marginTop: 10, color: colors.textMuted, textAlign: 'center' }
});
