import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, Text, TextInput, Pressable, Modal } from 'react-native';
import { Image } from 'expo-image';
import PostCard from '../../components/PostCard';
import CreatePost from '../../components/CreatePost';
import LoadingScreen from '../../components/LoadingScreen';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { postService } from '../../services/postService';
import { colors as baseColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopHeader from '../../components/TopHeader';

export default function FeedScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const data = await postService.timeline();
      setPosts(data || []);
    } catch (err) {
      console.log('Erreur chargement feed', err);
    }
  }, []);

  useEffect(() => {
    fetchFeed().finally(() => setLoading(false));
  }, [fetchFeed]);

  useEffect(() => {
    const ids = (user?.following || []).map((id) => String(id));
    setFollowingIds(new Set(ids));
  }, [user?.following]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchFeed();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePostCreated = useCallback((newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const handlePostChanged = useCallback((nextPost) => {
    setPosts((prev) => prev.map((post) => (post._id === nextPost._id ? nextPost : post)));
  }, []);

  const handlePostDeleted = useCallback((postId) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  }, []);

  const handleFollowChanged = useCallback((authorId, isNowFollowing) => {
    if (!authorId) return;
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (isNowFollowing) {
        next.add(String(authorId));
      } else {
        next.delete(String(authorId));
      }
      return next;
    });
  }, []);

  const handleOpenProfile = useCallback((author) => {
    const idOrUsername = author?.username || author?._id;
    if (!idOrUsername) return;
    navigation.navigate('Profile', { screen: 'ProfileMain', params: { userId: idOrUsername } });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <PostCard 
      post={item} 
      currentUserId={user?._id || user?.id} 
      userRole={user?.role} 
      isFollowingAuthor={followingIds.has(String(item?.userId?._id || ''))}
      onPostChanged={handlePostChanged}
      onPostDeleted={handlePostDeleted}
      onFollowChanged={handleFollowChanged}
      onOpenProfile={handleOpenProfile}
    />
  ), [user?._id, user?.id, user?.role, followingIds, handlePostChanged, handlePostDeleted, handleFollowChanged, handleOpenProfile]);

  if (loading) return <LoadingScreen label="Chargement du feed" />;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <TopHeader 
        navigation={navigation} 
        user={user} 
        onShowProfileMenu={() => setShowProfileMenu(true)} 
        unreadNotifications={user?.unreadNotifications || 0}
      />
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListHeaderComponent={<CreatePost onPostCreated={handlePostCreated} />}
        ListEmptyComponent={
          <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="images-outline" size={48} color={theme.border} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune publication</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Abonnez-vous à d'autres utilisateurs ou publiez quelque chose pour commencer !</Text>
          </View>
        }
        renderItem={renderItem}
      />

      <Modal visible={showProfileMenu} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowProfileMenu(false)}>
          <View style={[styles.profileMenu, { top: insets.top + 50, backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable style={styles.menuItem} onPress={() => { setShowProfileMenu(false); navigation.navigate('Profile', { screen: 'ProfileMain', params: { userId: user._id } }); }}>
              <Ionicons name="person-circle-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Mon Profil</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setShowProfileMenu(false); navigation.navigate('Profile', { screen: 'EditProfile' }); }}>
              <Ionicons name="settings-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Paramètres</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            {(user?.role === 'admin' || user?.role === 'root') && (
              <>
                <Pressable style={styles.menuItem} onPress={() => { setShowProfileMenu(false); navigation.navigate('AdminDashboard'); }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                  <Text style={[styles.menuItemText, { color: theme.primary }]}>Contrôle Admin</Text>
                </Pressable>
                <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
              </>
            )}

            <Pressable style={styles.menuItem} onPress={async () => { setShowProfileMenu(false); await refreshUser(); await logout(); }}>
              <Ionicons name="log-out-outline" size={20} color={theme.danger} />
              <Text style={[styles.menuItemText, { color: theme.danger }]}>Se déconnecter</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, gap: 12 },
  headerLogo: { width: 36, height: 36 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 20, paddingHorizontal: 12, height: 36, gap: 6 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bellBtn: { position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: colors.danger, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  content: { padding: 8, paddingBottom: 40 },
  emptyBox: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 32, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  profileMenu: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    width: 200,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: { fontSize: 15, fontWeight: '600', color: colors.text },
  menuDivider: { height: 1, backgroundColor: colors.border, marginVertical: 4 }
});
