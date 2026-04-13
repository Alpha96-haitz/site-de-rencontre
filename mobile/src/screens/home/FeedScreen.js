import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import { Image } from 'expo-image';
import PostCard from '../../components/PostCard';
import CreatePost from '../../components/CreatePost';
import LoadingScreen from '../../components/LoadingScreen';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/postService';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchFeed();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const TopHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Image source={require('../../../assets/logo.png')} style={styles.headerLogo} contentFit="contain" />
        
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textGhost} />
          <TextInput 
            placeholder="Rechercher..." 
            placeholderTextColor={colors.textGhost} 
            style={styles.searchInput}
            onFocus={() => navigation.navigate('Search')}
          />
        </View>

        <View style={styles.headerActions}>
          <Ionicons name="moon-outline" size={24} color={colors.text} />
          <Pressable style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Profile')}>
            <Avatar uri={user?.photos?.find?.(p => p.isPrimary)?.url || user?.googlePhoto} size={32} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderItem = useCallback(({ item }) => (
    <PostCard 
      post={item} 
      currentUserId={user?._id || user?.id} 
      userRole={user?.role} 
      onRefresh={fetchFeed} 
    />
  ), [user?._id, user?.id, user?.role, fetchFeed]);

  if (loading) return <LoadingScreen label="Chargement du feed" />;

  return (
    <View style={styles.container}>
      <TopHeader />
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={<CreatePost onPostCreated={handlePostCreated} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="images-outline" size={48} color={colors.border} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Aucune publication</Text>
            <Text style={styles.emptyText}>Abonnez-vous à d'autres utilisateurs ou publiez quelque chose pour commencer !</Text>
          </View>
        }
        renderItem={renderItem}
      />
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
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 20 }
});
