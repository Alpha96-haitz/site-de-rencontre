import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator, Alert, Dimensions, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Share } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { matchService } from '../../services/matchService';
import { postService } from '../../services/postService';
import { useTheme } from '../../contexts/ThemeContext';
import PostCard from '../../components/PostCard';
import CreatePost from '../../components/CreatePost';
import { useSocket } from '../../contexts/SocketContext';

import client from '../../api/client';

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

const ProfileHeader = memo(({ profile, isMe, theme, insets, onCameraPress, navigation, activeTab, setActiveTab, isDark, logout, refreshUser }) => {
  const avatar = profile?.photos?.find?.((p) => p.isPrimary)?.url || profile?.googlePhoto || profile?.profilePicture || 'https://placehold.co/300x300';
  const cover = profile?.coverPicture || 'https://placehold.co/1200x500';

  return (
    <View style={{ backgroundColor: theme.bg }}>
      <View style={styles.coverContainer}>
        <Pressable style={styles.coverTapArea} onPress={() => onCameraPress('cover')}>
          <Image source={cover} style={styles.cover} contentFit="cover" transition={300} />
        </Pressable>
        <Pressable style={[styles.backBtn, { top: insets.top + 5 }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        {isMe && (
          <Pressable style={styles.editCoverBtn} onPress={() => onCameraPress('cover')}>
            <Ionicons name="camera" size={18} color="#fff" />
          </Pressable>
        )}
      </View>

      <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
        <View style={[styles.avatarContainer, { borderColor: theme.surface, backgroundColor: theme.bg }]}>
          <Pressable style={styles.avatarTapArea} onPress={() => onCameraPress('avatar')}>
            <Image source={avatar} style={styles.avatar} transition={300} />
          </Pressable>
          {isMe && (
            <Pressable style={[styles.editAvatarBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => onCameraPress('avatar')}>
              <Ionicons name="camera" size={20} color={theme.text} />
            </Pressable>
          )}
          {profile?.isOnline && !isMe && <View style={styles.onlineBadge} />}
        </View>

        <Text style={[styles.name, { color: theme.text }]}>{profile?.firstName} {profile?.lastName}</Text>
        <Text style={[styles.username, { color: theme.textMuted }]}>@{profile?.username}</Text>
        {!!profile?.bio && <Text style={[styles.bio, { color: theme.text }]}>{profile.bio}</Text>}

        <View style={styles.actionButtons}>
          {isMe ? (
            <>
              <Pressable style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('EditProfile', { profile })}>
                <FontAwesome5 name="pen" size={14} color="#fff" />
                <Text style={styles.btnPrimaryText}>Modifier</Text>
              </Pressable>
              <Pressable style={[styles.btnIcon, styles.btnSecondary, { backgroundColor: theme.border }]} onPress={async () => { await refreshUser(); await logout(); }}>
                <Ionicons name="log-out-outline" size={20} color={theme.text} />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={[styles.btn, styles.btnPrimary, { backgroundColor: profile?.matchStatus?.hasLiked ? theme.textMuted : '#f43f5e' }]}>
                <Ionicons name="heart" size={20} color="#fff" />
                <Text style={styles.btnPrimaryText}>{profile?.matchStatus?.hasLiked ? "Aimé" : "Liker"}</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnSecondary, { backgroundColor: theme.border }]} onPress={() => { if(profile?.matchStatus?.isMutual) navigation.navigate('MainTabs', { screen: 'Messages', params: { matchId: profile.matchStatus.matchId } }); }}>
                <FontAwesome5 name="facebook-messenger" size={16} color={theme.primary} />
                <Text style={[styles.btnSecondaryText, { color: theme.text }]}>Message</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}><Text style={[styles.statVal, { color: theme.text }]}>{profile?.followers?.length || 0}</Text><Text style={[styles.statKey, { color: theme.textMuted }]}> Abonnés</Text></View>
            <View style={[styles.dividerStat, { backgroundColor: theme.border }]} />
            <View style={styles.statBox}><Text style={[styles.statVal, { color: theme.text }]}>{profile?.following?.length || 0}</Text><Text style={[styles.statKey, { color: theme.textMuted }]}> Suivis</Text></View>
          </View>
        </View>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: theme.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          {['Publications', 'À propos', 'Photos'].map((tab) => (
            <Pressable key={tab} style={[styles.tab, activeTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.textMuted }]}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={{ height: 10, backgroundColor: isDark ? '#000' : '#f0f2f5' }} />
    </View>
  );
});

export default function ProfileScreen({ navigation, route }) {
  const { user, logout, refreshUser } = useAuth();
  const { theme, isDark } = useTheme();
  const { socket } = useSocket();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Publications');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFullImage, setSelectedFullImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const targetId = route.params?.userId || user?.username || user?._id;

  const fetchProfileData = useCallback(async () => {
    try {
      // 1. Fetch profile first (accepts ID or username)
      const profileData = await userService.getProfile(targetId);
      setProfile(profileData);

      // 2. Fetch posts using the REAL technical ID from profileData
      if (profileData?._id) {
        const postsData = await postService.getUserPosts(profileData._id);
        setPosts(postsData || []);
      }
    } catch (err) {
      console.error('Profile Load Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  useEffect(() => {
    if (!socket) return;

    const handleLikeUpdated = ({ postId, likes }) => {
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, likes } : p)));
    };

    const handleCommentAdded = ({ postId, comment }) => {
      setPosts((prev) => prev.map((p) => {
        if (p._id !== postId) return p;
        if (p.comments?.some(c => c._id === comment._id)) return p;
        return { ...p, comments: [...(p.comments || []), comment] };
      }));
    };

    const handleUserStatsUpdated = ({ userId, followersCount, followingCount }) => {
      setProfile((prev) => {
        if (!prev || prev._id !== userId) return prev;
        const newProfile = { ...prev };
        if (followersCount !== undefined) newProfile.followers = new Array(followersCount).fill(null);
        if (followingCount !== undefined) newProfile.following = new Array(followingCount).fill(null);
        return newProfile;
      });
    };

    socket.on('post:like-updated', handleLikeUpdated);
    socket.on('post:comment-added', handleCommentAdded);
    socket.on('user:stats-updated', handleUserStatsUpdated);

    return () => {
      socket.off('post:like-updated', handleLikeUpdated);
      socket.off('post:comment-added', handleCommentAdded);
      socket.off('user:stats-updated', handleUserStatsUpdated);
    };
  }, [socket]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostChanged = (updatedPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const sendReport = async (reason) => {
    try {
      await client.post('/reports', {
        reportedUserId: profile._id,
        reason: reason,
        description: `Signalement via l'application mobile pour: ${reason}`
      });
      Alert.alert("Merci", "Le signalement a été envoyé avec succès. Notre équipe va l'étudier.");
    } catch (err) {
      Alert.alert("Erreur", "Impossible d'envoyer le signalement pour le moment.");
    }
  };

  const avatar = useMemo(
    () => profile?.photos?.find?.((p) => p.isPrimary)?.url || profile?.googlePhoto || profile?.profilePicture || 'https://placehold.co/300x300',
    [profile]
  );
  
  const cover = profile?.coverPicture || 'https://placehold.co/1200x500';
  const isMe = useMemo(() => {
    const meId = String(user?._id || '');
    const meUsername = String(user?.username || '');
    const tId = String(targetId || '');
    const pId = String(profile?._id || '');
    const pUsername = String(profile?.username || '');

    if (!meId && !meUsername) return false;
    return (
      (tId && (tId === meId || tId === meUsername)) ||
      (pId && pId === meId) ||
      (pUsername && pUsername === meUsername)
    );
  }, [user?._id, user?.username, targetId, profile?._id, profile?.username]);

  const pickImage = async (kind) => {
    if (!isMe) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission requise", "Nous avons besoin de votre permission pour accéder à vos photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: kind === 'cover' ? [16, 9] : [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploading(true);
      const file = result.assets[0];
      const data = new FormData();
      data.append('photo', {
        uri: file.uri,
        type: file.mimeType || 'image/jpeg',
        name: file.fileName || 'profile_update.jpg'
      });

      if (kind === 'cover') {
        await userService.uploadCover(data);
      } else {
        await userService.uploadPhoto(data);
      }

      await fetchProfileData();
      await refreshUser();
      Alert.alert("Succès", "Votre photo a été mise à jour !");
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi de la photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleCameraPress = (kind) => {
    const photoUrl = kind === 'cover' ? cover : avatar;
    const options = [
      {
        text: "Voir la photo",
        onPress: () => setSelectedFullImage(photoUrl)
      }
    ];

    if (isMe) {
      options.push({
        text: "Importer une nouvelle",
        onPress: () => pickImage(kind)
      });
    }

    options.push({
      text: "Annuler",
      style: "cancel"
    });

    Alert.alert(
      kind === 'cover' ? "Photo de couverture" : "Photo de profil",
      "Que souhaitez-vous faire ?",
      options
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  return (
    <>
      <FlatList
        data={activeTab === 'Publications' ? posts : []}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            currentUserId={user?._id} 
            onPostChanged={handlePostChanged} 
            onPostDeleted={handlePostDeleted} 
          />
        )}
        ListHeaderComponent={
          <ProfileHeader 
            profile={profile} 
            isMe={isMe} 
            theme={theme} 
            insets={insets} 
            onCameraPress={handleCameraPress} 
            navigation={navigation}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isDark={isDark}
            logout={logout}
            refreshUser={refreshUser}
          />
        }
        ListFooterComponent={
          <>
            {activeTab === 'À propos' && (
              <View style={{ padding: 20, backgroundColor: theme.surface }}>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>À propos</Text>
                <Text style={{ color: theme.text, marginTop: 10 }}>{profile?.bio || 'Aucune bio.'}</Text>
              </View>
            )}
            {activeTab === 'Photos' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 4 }}>
                {(profile?.photos || []).map((p, i) => (
                  <Pressable key={i} onPress={() => setSelectedFullImage(p.url)}>
                    <Image source={p.url} style={{ width: width / 3 - 8, height: width / 3 - 8, margin: 4, borderRadius: 8 }} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          activeTab === 'Publications' && (
            <View style={{ padding: 60, alignItems: 'center' }}>
              <Text style={{ color: theme.textMuted }}>Aucune publication.</Text>
            </View>
          )
        }
        style={{ backgroundColor: theme.bg }}
      />

      <Modal visible={!!selectedFullImage} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.fullImageOverlay} onPress={() => setSelectedFullImage(null)}>
          <Image source={selectedFullImage} style={styles.fullImage} contentFit="contain" />
          <Pressable style={[styles.closeImageBtn, { top: insets.top + 10 }]} onPress={() => setSelectedFullImage(null)}>
            <Ionicons name="close-circle" size={40} color="#fff" />
          </Pressable>
        </Pressable>
      </Modal>

      {uploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Mise à jour...</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  coverContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#3E4042',
    position: 'relative',
  },
  cover: { width: '100%', height: '100%' },
  coverTapArea: {
    width: '100%',
    height: '100%'
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  editCoverBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)'
  },
  
  profileHeader: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  avatarContainer: {
    width: 170,
    height: 170,
    borderRadius: 85,
    marginTop: -100, 
    alignSelf: 'center',
    position: 'relative',
    borderWidth: 4,
  },
  adminSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f43f5e',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  createPostWrap: {
    padding: 10,
  },
  postsList: {
    paddingBottom: 20,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  matchBadgeText: {
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 13,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 85,
  },
  avatarTapArea: {
    width: '100%',
    height: '100%',
    borderRadius: 85,
    overflow: 'hidden'
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3
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
  },
  
  name: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 2,
  },
  bio: {
    fontSize: 15,
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
  },
  btnSecondary: {
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  btnSecondaryText: {
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
  },
  statKey: {
    fontSize: 15,
  },
  dividerStat: {
    width: 1,
    height: 14,
    marginHorizontal: 12,
  },
  
  sectionDivider: {
    height: 10,
  },
  
  tabsContainer: {
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
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
  },
  
  tabContentArea: {
    minHeight: 200,
  },
  
  aboutContainer: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  aboutTextMuted: {
    fontSize: 15,
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
  },
  aboutValue: {
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestTagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  photosContainer: {
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
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  adminSection: {
    padding: 16,
    marginTop: 10,
  },
  fullImageOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.95)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  fullImage: { width: '100%', height: '100%' },
  closeImageBtn: { position: 'absolute', right: 20, zIndex: 100 },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  uploadText: {
    color: '#fff',
    marginTop: 10,
    fontWeight: '700'
  }
});

