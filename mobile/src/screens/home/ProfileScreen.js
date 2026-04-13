import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import AppButton from '../../components/AppButton';
import { colors } from '../../theme/colors';

export default function ProfileScreen({ navigation, route }) {
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const targetId = route.params?.userId || user?.username || user?._id;

  useEffect(() => {
    userService.getProfile(targetId)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [targetId]);

  const avatar = useMemo(
    () => profile?.photos?.find?.((p) => p.isPrimary)?.url || profile?.googlePhoto || profile?.profilePicture || 'https://placehold.co/300x300',
    [profile]
  );
  
  const isMe = targetId === (user?.username || user?._id);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={styles.coverWrapper}>
        <Image source={profile?.coverPicture || 'https://placehold.co/1200x500'} style={styles.cover} contentFit="cover" />
        <View style={styles.coverOverlay} />
      </View>

      <View style={styles.headerContent}>
        <View style={styles.avatarWrap}>
          <Image source={avatar} style={styles.avatar} />
          {profile?.isOnline && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.name}>{profile?.firstName} {profile?.lastName} {profile?.age ? `, ${profile.age}` : ''}</Text>
          <Text style={styles.meta}>@{profile?.username}</Text>
          <Text style={styles.bio}>{profile?.bio || 'Ce profil est encore un mystère...'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{profile?.followers?.length || 0}</Text>
              <Text style={styles.statKey}>Abonnés</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{profile?.following?.length || 0}</Text>
              <Text style={styles.statKey}>Abonnements</Text>
            </View>
            {!!profile?.location?.city && (
              <>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                  <Ionicons name="location" size={18} color={colors.primary} style={{ marginBottom: 2 }} />
                  <Text style={styles.statKey}>{profile.location.city}</Text>
                </View>
              </>
            )}
          </View>

          {isMe && (
            <View style={styles.actionGroup}>
              <AppButton 
                title="Modifier mes infos" 
                onPress={() => navigation.navigate('EditProfile', { profile })} 
              />
              <Pressable onPress={async () => { await refreshUser(); await logout(); }} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                <Text style={styles.logoutText}>Se déconnecter</Text>
              </Pressable>
            </View>
          )}

          {!isMe && (user?.role === 'root' || user?.role === 'admin') && (
            <View style={styles.actionGroup}>
              <Pressable 
                onPress={() => {
                  Alert.alert(
                    "Supprimer le compte",
                    "Voulez-vous vraiment supprimer DEFINITIVEMENT cet utilisateur et toutes ses données ?",
                    [
                      { text: "Annuler", style: "cancel" },
                      { 
                        text: "Supprimer", 
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await userService.deleteUser(profile._id);
                            navigation.goBack();
                          } catch (e) {
                            console.log(e);
                          }
                        } 
                      }
                    ]
                  );
                }} 
                style={styles.logoutBtn}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text style={styles.logoutText}>Supprimer le compte</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.tabsRow}>
          <Pressable style={[styles.tab, styles.activeTab]}>
            <Ionicons name="grid" size={20} color={colors.primary} />
            <Text style={[styles.tabText, styles.activeTabText]}>Publications</Text>
          </Pressable>
          <Pressable style={styles.tab}>
            <Ionicons name="images" size={20} color={colors.textMuted} />
            <Text style={styles.tabText}>Galerie</Text>
          </Pressable>
        </View>

        <View style={styles.feedEmptyState}>
          <Ionicons name="camera-outline" size={48} color={colors.border} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyFeedTitle}>Aucune publication</Text>
          <Text style={styles.emptyFeedText}>Les posts apparaîtront ici.</Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  coverWrapper: { position: 'relative', height: 220, width: '100%' },
  cover: { width: '100%', height: '100%' },
  coverOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(0,0,0,0.1)' },
  
  headerContent: { paddingHorizontal: 16, marginTop: -60 },
  avatarWrap: { alignSelf: 'center', position: 'relative', marginBottom: 12 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff' },
  onlineBadge: { position: 'absolute', bottom: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.success, borderWidth: 4, borderColor: '#fff' },
  
  infoBox: { backgroundColor: '#fff', borderRadius: 24, padding: 24, paddingVertical: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  name: { textAlign: 'center', fontSize: 24, fontWeight: '800', color: colors.text },
  meta: { textAlign: 'center', color: colors.textGhost, fontSize: 13, marginTop: 2 },
  bio: { textAlign: 'center', color: colors.text, marginTop: 12, lineHeight: 22, fontSize: 15 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: colors.text },
  statKey: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '500' },
  divider: { width: 1, height: 24, backgroundColor: colors.border },
  
  actionGroup: { marginTop: 24, gap: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 16 },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  
  tabsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 4, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 },
  activeTab: { backgroundColor: colors.primaryLight },
  tabText: { fontWeight: '600', color: colors.textMuted, fontSize: 14 },
  activeTabText: { color: colors.primaryDark },
  
  feedEmptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyFeedTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyFeedText: { color: colors.textMuted, textAlign: 'center', fontSize: 14 }
});
