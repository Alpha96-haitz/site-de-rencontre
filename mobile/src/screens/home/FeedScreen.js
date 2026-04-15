import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PostCard from '../../components/PostCard';
import CreatePost from '../../components/CreatePost';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { postService } from '../../services/postService';
import { colors } from '../../theme/colors';
import { useSocket } from '../../contexts/SocketContext';

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { socket } = useSocket();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const data = await postService.timeline();
      setPosts(data);
      const following = new Set();
      data.forEach(post => {
        if (post.userId?._id && post.isFollowing) {
          following.add(String(post.userId._id));
        }
      });
      setFollowingIds(following);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    };

    socket.on('post:new', handleNewPost);
    return () => {
      socket.off('post:new', handleNewPost);
    };
  }, [socket]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostChanged = useCallback((updatedPost) => {
    setPosts((prev) => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  }, []);

  const handlePostDeleted = useCallback((postId) => {
    setPosts((prev) => prev.filter(p => p._id !== postId));
  }, []);

  const handleFollowChanged = useCallback((authorId, isFollowing) => {
    setFollowingIds(prev => {
      const next = new Set(prev);
      if (isFollowing) {
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
    navigation.navigate('ProfileMain', { userId: idOrUsername });
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 8, paddingBottom: 40 },
  emptyBox: { 
    borderRadius: 20, 
    padding: 32, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 20
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 20 }
});
