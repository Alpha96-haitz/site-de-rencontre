import React, { useMemo, useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, TouchableOpacity, Switch, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { colors } from '../../theme/colors';
import client from '../../api/client';

export default function EditProfileScreen({ route, navigation }) {
  const { user, refreshUser } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    age: user?.age ? String(user.age) : '',
    gender: user?.gender || 'other',
    interests: (user?.interests || []).join(', '),
    location: user?.location || { city: '', country: '' }
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: user?.notificationPreferences?.email ?? true,
    push: user?.notificationPreferences?.push ?? true,
    marketing: user?.notificationPreferences?.marketing ?? false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: user?.privacy?.showOnlineStatus ?? true,
    profileVisibility: user?.privacy?.profileVisibility ?? 'public',
    allowMessagesFrom: user?.privacy?.allowMessagesFrom ?? 'matches'
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        bio: user.bio || '',
        age: user.age ? String(user.age) : '',
        gender: user.gender || 'other',
        interests: Array.isArray(user.interests) ? user.interests.join(', ') : '',
        location: user.location || { city: '', country: '' }
      });
      if (user.notificationPreferences) {
        setNotificationSettings({
          email: user.notificationPreferences.email ?? true,
          push: user.notificationPreferences.push ?? true,
          marketing: user.notificationPreferences.marketing ?? false,
        });
      }
      if (user.privacy) {
        setPrivacySettings({
          showOnlineStatus: user.privacy.showOnlineStatus ?? true,
          profileVisibility: user.privacy.profileVisibility ?? 'public',
          allowMessagesFrom: user.privacy.allowMessagesFrom ?? 'matches'
        });
      }
    }
  }, [user]);

  const setField = (key, value) => {
    if (key === 'city') {
      setForm(p => ({ ...p, location: { ...p.location, city: value } }));
    } else {
      setForm(p => ({ ...p, [key]: value }));
    }
  };

  const payload = useMemo(() => ({
    ...form,
    age: form.age ? Number(form.age) : undefined,
    interests: form.interests.split(',').map((v) => v.trim()).filter(Boolean)
  }), [form]);

  const handleSaveGeneral = async () => {
    try {
      setLoading(true);
      await userService.updateProfile(payload);
      await refreshUser();
      Alert.alert('Succès', 'Profil mis à jour');
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de sauvegarder');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await client.put('/users/profile', {
        privacy: privacySettings,
        notificationPreferences: notificationSettings
      });
      await refreshUser();
      Alert.alert('Succès', 'Préférences sauvegardées');
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de sauvegarder');
    } finally {
      setLoading(false);
    }
  };

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
    setPhotoLoading(true);
    try {
      if (kind === 'cover') await userService.uploadCover(data);
      else await userService.uploadPhoto(data);
      await refreshUser();
      Alert.alert('Succès', 'Photo mise à jour');
    } catch(err) {
      Alert.alert('Erreur', 'Echec de l\'upload');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleDeletePhoto = async (publicId) => {
    Alert.alert('Confirmation', 'Supprimer cette photo ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await client.delete(`/users/photos/${publicId}`);
          await refreshUser();
        } catch(e) {}
      }}
    ]);
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: 'person' },
    { id: 'photos', label: 'Photos', icon: 'image' },
    { id: 'security', label: 'Sécurité', icon: 'shield-checkmark' },
    { id: 'notifications', label: 'Alertes', icon: 'notifications' }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.tabsWrapper, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity key={tab.id} style={[styles.tab, isActive && styles.activeTab]} onPress={() => setActiveTab(tab.id)}>
                <Ionicons name={isActive ? tab.icon : `${tab.icon}-outline`} size={18} color={isActive ? 'white' : theme.textGhost} />
                <Text style={[styles.tabText, { color: theme.textGhost }, isActive && styles.activeTabText]}>{tab.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'general' && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text, borderBottomColor: theme.border }]}>Informations publiques</Text>
            <AppInput label="Prénom" icon="person" placeholder="Votre prénom" value={form.firstName} onChangeText={(v) => setField('firstName', v)} />
            <AppInput label="Nom" icon="person" placeholder="Votre nom" value={form.lastName} onChangeText={(v) => setField('lastName', v)} />
            <AppInput label="Nom d'utilisateur" icon="at" placeholder="Nom d'utilisateur" value={form.username} onChangeText={(v) => setField('username', v)} />
            <AppInput label="Âge" icon="calendar" placeholder="Votre âge" keyboardType="numeric" value={form.age} onChangeText={(v) => setField('age', v)} />
            <AppInput label="Ville" icon="location" placeholder="Où habitez-vous ?" value={form.location.city} onChangeText={(v) => setField('city', v)} />
            <AppInput label="Bio" icon="document-text" placeholder="Parlez un peu de vous..." value={form.bio} onChangeText={(v) => setField('bio', v)} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
            <AppInput label="Centres d'intérêt" icon="star" placeholder="ex: Sport, Cinéma..." value={form.interests} onChangeText={(v) => setField('interests', v)} />
            
            <AppButton title="Enregistrer les modifications" onPress={handleSaveGeneral} loading={loading} style={styles.saveBtn} />
          </View>
        )}

        {activeTab === 'photos' && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text, borderBottomColor: theme.border }]}>Photo de Couverture</Text>
            <TouchableOpacity style={[styles.coverBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={() => pickImage('cover')}>
              {user?.coverPicture ? (
                <Image source={{ uri: user.coverPicture }} style={styles.coverImage} />
              ) : (
                <Ionicons name="image" size={40} color={theme.textGhost} />
              )}
              <View style={styles.coverOverlay}>
                <Ionicons name="camera" size={20} color="white" />
                <Text style={styles.coverOverlayText}>Changer</Text>
              </View>
            </TouchableOpacity>

            <Text style={[styles.cardTitle, { marginTop: 24, color: theme.text, borderBottomColor: theme.border }]}>Votre Galerie</Text>
            <View style={styles.grid}>
              {user?.photos?.map(photo => (
                <View key={photo.publicId} style={styles.photoWrap}>
                  <Image source={{ uri: photo.url }} style={styles.photoImg} />
                  <TouchableOpacity style={styles.deletePhotoBtn} onPress={() => handleDeletePhoto(photo.publicId)}>
                    <Ionicons name="trash" size={16} color="white" />
                  </TouchableOpacity>
                  {photo.isPrimary && <View style={styles.primaryBadge}><Text style={styles.primaryBadgeText}>PROFIL</Text></View>}
                </View>
              ))}
              <TouchableOpacity style={[styles.addPhotoWrap, { borderColor: theme.border, backgroundColor: theme.inputBg }]} onPress={() => pickImage('profile')}>
                <Ionicons name="add" size={32} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'security' && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text, borderBottomColor: theme.border }]}>Confidentialité et sécurité</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Afficher mon statut en ligne</Text>
                <Text style={[styles.settingDesc, { color: theme.textMuted }]}>Les autres voient si vous êtes connecté.</Text>
              </View>
              <Switch 
                value={privacySettings.showOnlineStatus} 
                onValueChange={(v) => setPrivacySettings(p => ({...p, showOnlineStatus: v}))} 
                trackColor={{ true: theme.primary, false: '#e2e8f0' }}
              />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Visibilité (Public)</Text>
                <Text style={[styles.settingDesc, { color: theme.textMuted }]}>Tout le monde peut voir votre profil.</Text>
              </View>
              <Switch 
                value={privacySettings.profileVisibility === 'public'} 
                onValueChange={(v) => setPrivacySettings(p => ({...p, profileVisibility: v ? 'public' : 'matches'}))} 
                trackColor={{ true: theme.primary, false: '#e2e8f0' }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Mode sombre</Text>
                <Text style={[styles.settingDesc, { color: theme.textMuted }]}>Basculer entre mode clair et sombre.</Text>
              </View>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: theme.primary, false: '#e2e8f0' }} />
            </View>

            <AppButton title="Sauvegarder les paramètres" onPress={handleSaveSettings} loading={loading} style={styles.saveBtn} />
          </View>
        )}

        {activeTab === 'notifications' && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text, borderBottomColor: theme.border }]}>Alertes et Notifications</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications Push</Text>
                <Text style={[styles.settingDesc, { color: theme.textMuted }]}>Alertes instantanées sur votre appareil.</Text>
              </View>
              <Switch 
                value={notificationSettings.push} 
                onValueChange={(v) => setNotificationSettings(p => ({...p, push: v}))} 
                trackColor={{ true: theme.primary, false: '#e2e8f0' }}
              />
            </View>
            
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
               <View style={styles.settingText}>
                 <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications par Email</Text>
                 <Text style={[styles.settingDesc, { color: theme.textMuted }]}>Messages, alertes et matchs.</Text>
               </View>
               <Switch 
                 value={notificationSettings.email} 
                 onValueChange={(v) => setNotificationSettings(p => ({...p, email: v}))} 
                 trackColor={{ true: theme.primary, false: '#e2e8f0' }}
               />
            </View>

            <AppButton title="Sauvegarder les paramètres" onPress={handleSaveSettings} loading={loading} style={styles.saveBtn} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  tabsWrapper: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontWeight: 'bold',
    color: colors.textGhost,
    fontSize: 14,
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  saveBtn: {
    marginTop: 20,
    borderRadius: 12,
  },
  coverBox: {
    height: 160,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coverOverlayText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoWrap: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 6,
    borderRadius: 8,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  primaryBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '900',
  },
  addPhotoWrap: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingText: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    color: colors.textGhost,
    lineHeight: 18,
  }
});
