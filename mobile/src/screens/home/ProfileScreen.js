import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// Thème sombre type Facebook
const fbDark = {
  bg: '#18191A',
  surface: '#242526',
  text: '#E4E6EB',
  textMuted: '#B0B3B8',
  primary: '#2374E1',
  border: '#3E4042',
  danger: '#F25F5C',
};

export default function ProfileScreen({ navigation, route }) {
  const { user, logout, refreshUser } = useAuth();
  const { theme, isDark } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Publications'); // Publications | À propos | Photos
  
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
  
  const cover = profile?.coverPicture || 'https://placehold.co/1200x500';
  const isMe = targetId === (user?.username || user?._id);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Cover Photo */}
      <View style={styles.coverContainer}>
        <Image source={cover} style={styles.cover} contentFit="cover" transition={300} />
        {isMe && (
          <Pressable style={styles.editCoverBtn} onPress={() => navigation.navigate('EditProfile', { profile })}>
            <Ionicons name="camera" size={18} color="#fff" />
          </Pressable>
        )}
      </View>

      {/* Profile Header section */}
      <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
        <View style={[styles.avatarContainer, { borderColor: theme.surface, backgroundColor: theme.bg }]}>
          <Image source={avatar} style={styles.avatar} transition={300} />
          {isMe && (
            <Pressable style={styles.editAvatarBtn} onPress={() => navigation.navigate('EditProfile', { profile })}>
              <Ionicons name="camera" size={20} color={theme.text} />
            </Pressable>
          )}
          {profile?.isOnline && !isMe && <View style={styles.onlineBadge} />}
        </View>

        <Text style={[styles.name, { color: theme.text }]}>
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text style={[styles.username, { color: theme.textMuted }]}>@{profile?.username}</Text>

        {profile?.bio ? (
          <Text style={[styles.bio, { color: theme.text }]}>{profile.bio}</Text>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isMe ? (
            <>
              <Pressable style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('EditProfile', { profile })}>
                <FontAwesome5 name="pen" size={14} color="#fff" />
                <Text style={styles.btnPrimaryText}>Modifier le profil</Text>
              </Pressable>
              <Pressable style={[styles.btnIcon, styles.btnSecondary, { backgroundColor: theme.border }]} onPress={async () => { await refreshUser(); await logout(); }}>
                <Ionicons name="log-out-outline" size={20} color={theme.danger} />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.primary }]}>
                <Ionicons name="heart" size={20} color="#fff" />
                <Text style={styles.btnPrimaryText}>Liker</Text>
              </Pressable>
              <Pressable 
                style={[styles.btn, styles.btnSecondary, { backgroundColor: theme.border }]} 
                onPress={() => navigation.navigate('Messages')} // Redirige vers l'écran de messagerie direct
              >
                <FontAwesome5 name="facebook-messenger" size={16} color={theme.text} />
                <Text style={[styles.btnSecondaryText, { color: theme.text }]}>Message</Text>
              </Pressable>
              <Pressable style={[styles.btnIcon, styles.btnSecondary, { backgroundColor: theme.border }]}>
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.text} />
              </Pressable>
            </>
          )}
        </View>

        {/* User Details */}
        <View style={styles.detailsContainer}>
          {!!profile?.location?.city && (
            <View style={styles.detailRow}>
              <Ionicons name="home" size={20} color={theme.textMuted} />
              <Text style={[styles.detailText, { color: theme.text }]}>Habite à <Text style={styles.detailBold}>{profile.location.city}</Text></Text>
            </View>
          )}

          {/* Abonnés et Suivis - Données Réelles */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: theme.text }]}>{profile?.followers?.length || 0}</Text>
              <Text style={[styles.statKey, { color: theme.textMuted }]}>Abonnés</Text>
            </View>
            <View style={[styles.dividerStat, { backgroundColor: theme.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: theme.text }]}>{profile?.following?.length || 0}</Text>
              <Text style={[styles.statKey, { color: theme.textMuted }]}>Abonnements</Text>
            </View>
          </View>

          <Pressable style={styles.detailRow} onPress={() => setActiveTab('À propos')}>
             <Ionicons name="ellipsis-horizontal-circle" size={20} color={theme.textMuted} />
             <Text style={[styles.detailText, { color: theme.text }]}>Voir les informations <Text style={styles.detailBold}>À propos</Text></Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.sectionDivider, { backgroundColor: isDark ? '#000' : '#f0f2f5' }]} />

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          {['Publications', 'À propos', 'Photos'].map((tab) => (
            <Pressable 
              key={tab} 
              style={[styles.tab, activeTab === tab && [styles.activeTab, { borderBottomColor: theme.primary }]]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && [styles.activeTabText, { color: theme.primary }]]}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={[styles.sectionDivider, { backgroundColor: isDark ? '#000' : '#f0f2f5' }]} />

      {/* Dynamic Tab Content */}
      <View style={styles.tabContentArea}>
        {activeTab === 'Publications' && (
          <View style={[styles.emptyStateContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.border }]}>
              <Ionicons name="document-text" size={32} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>Aucune publication pour le moment</Text>
          </View>
        )}

        {activeTab === 'À propos' && (
          <View style={[styles.aboutContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>Informations générales</Text>
            {profile?.bio ? (
              <Text style={[styles.aboutText, { color: theme.text }]}>{profile.bio}</Text>
            ) : (
              <Text style={[styles.aboutTextMuted, { color: theme.textMuted }]}>Aucune description ajoutée.</Text>
            )}
            
            <View style={styles.aboutRow}>
              <Ionicons name="transgender" size={20} color={theme.textMuted} />
              <Text style={[styles.aboutLabel, { color: theme.textMuted }]}>Genre : <Text style={[styles.aboutValue, { color: theme.text }]}>
                {profile?.gender === 'male' ? 'Homme' : profile?.gender === 'female' ? 'Femme' : 'Autre'}
              </Text></Text>
            </View>

            <View style={styles.aboutRow}>
              <Ionicons name="calendar" size={20} color={theme.textMuted} />
              <Text style={[styles.aboutLabel, { color: theme.textMuted }]}>Âge : <Text style={[styles.aboutValue, { color: theme.text }]}>{profile?.age || '--'} ans</Text></Text>
            </View>

            {profile?.interests && profile.interests.length > 0 && (
              <View style={{marginTop: 16}}>
                <Text style={[styles.aboutLabel, { color: theme.textMuted, marginBottom: 8 }]}>Centres d'intérêt :</Text>
                <View style={styles.tagsContainer}>
                  {profile.interests.map((interest, index) => (
                    <View key={index} style={[styles.interestTag, { backgroundColor: theme.border }]}>
                      <Text style={[styles.interestTagText, { color: theme.text }]}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Photos' && (
          <View style={[styles.photosContainer, { backgroundColor: theme.surface }]}>
            {profile?.photos && profile.photos.length > 0 ? (
              <View style={styles.photoGrid}>
                {profile.photos.map((photo, index) => (
                  <View key={index} style={styles.gridImageWrapper}>
                    <Image source={photo.url} style={styles.gridImage} contentFit="cover" transition={200} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyStateContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.emptyIconContainer, { backgroundColor: theme.border }]}>
                  <Ionicons name="images" size={32} color={theme.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>Aucune photo partagée</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Admin Quick Action */}
      {!isMe && (user?.role === 'root' || user?.role === 'admin') && (
        <View style={[styles.adminSection, { backgroundColor: theme.surface }]}>
           <Pressable 
              onPress={() => {
                Alert.alert("Suppression", "Voulez-vous vraiment bannir/supprimer cet utilisateur ?", [
                  { text: "Annuler", style: "cancel" },
                  { text: "Supprimer", style: "destructive", onPress: async () => {
                    try {
                      await userService.deleteUser(profile._id);
                      navigation.goBack();
                    } catch (e) {
                      console.log(e);
                    }
                  }}
                ]);
              }} 
              style={[styles.btn, { backgroundColor: 'rgba(242, 95, 92, 0.1)', height: 44 }]}
            >
              <Ionicons name="trash" size={18} color={theme.danger} />
              <Text style={[styles.btnSecondaryText, { color: theme.danger }]}>Supprimer le compte</Text>
            </Pressable>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: fbDark.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: fbDark.bg },
  
  coverContainer: {
    width: '100%',
    height: 250,
    backgroundColor: fbDark.border,
    position: 'relative',
  },
  cover: { width: '100%', height: '100%' },
  editCoverBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  
  profileHeader: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: fbDark.surface,
  },
  avatarContainer: {
    width: 170,
    height: 170,
    borderRadius: 85,
    marginTop: -100, 
    alignSelf: 'center',
    position: 'relative',
    borderWidth: 4,
    borderColor: fbDark.surface,
    backgroundColor: fbDark.bg,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 85,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: fbDark.border,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: fbDark.surface,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#31A24C',
    borderWidth: 3,
    borderColor: fbDark.surface,
  },
  
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: fbDark.text,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 15,
    color: fbDark.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  bio: {
    fontSize: 15,
    color: fbDark.text,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnIcon: {
    width: 44,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: fbDark.primary,
  },
  btnSecondary: {
    backgroundColor: fbDark.border,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  btnSecondaryText: {
    color: fbDark.text,
    fontWeight: '600',
    fontSize: 15,
  },
  
  detailsContainer: {
    marginTop: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 16,
    color: fbDark.text,
  },
  detailBold: {
    fontWeight: 'bold',
  },
  
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: fbDark.text,
  },
  statKey: {
    fontSize: 15,
    color: fbDark.textMuted,
  },
  dividerStat: {
    width: 1,
    height: 14,
    backgroundColor: fbDark.border,
    marginHorizontal: 12,
  },
  
  sectionDivider: {
    height: 10,
    backgroundColor: '#000',
  },
  
  tabsContainer: {
    backgroundColor: fbDark.surface,
  },
  tabsScrollContent: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: fbDark.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: fbDark.textMuted,
  },
  activeTabText: {
    color: fbDark.primary,
  },
  
  tabContentArea: {
    minHeight: 200,
  },
  
  aboutContainer: {
    padding: 16,
    backgroundColor: fbDark.surface,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: fbDark.text,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 15,
    color: fbDark.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  aboutTextMuted: {
    fontSize: 15,
    color: fbDark.textMuted,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  aboutLabel: {
    fontSize: 15,
    color: fbDark.textMuted,
  },
  aboutValue: {
    color: fbDark.text,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: fbDark.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestTagText: {
    color: fbDark.text,
    fontSize: 13,
    fontWeight: '500',
  },
  
  photosContainer: {
    backgroundColor: fbDark.surface,
    padding: 2,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridImageWrapper: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: fbDark.surface,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: fbDark.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: fbDark.textMuted,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  adminSection: {
    padding: 16,
    backgroundColor: fbDark.surface,
    marginTop: 10,
  }
});

