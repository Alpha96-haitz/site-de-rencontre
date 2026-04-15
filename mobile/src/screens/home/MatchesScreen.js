import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import { matchService } from '../../services/matchService';
import { colors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';

export default function MatchesScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [matches, setMatches] = useState([]);
  const [likes, setLikes] = useState([]);
  const [tab, setTab] = useState('matches');

  const load = useCallback(async () => {
    const [mData, lData] = await Promise.all([
      matchService.list(),
      matchService.likesReceived()
    ]);
    setMatches(mData || []);
    setLikes(lData || []);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [load, navigation]);

  const list = useMemo(() => (tab === 'matches' ? matches : likes), [tab, matches, likes]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.headerTitle, { color: theme.text, paddingTop: insets.top + 10 }]}>Mes Matchs</Text>

      <View style={[styles.tabs, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Pressable 
          style={[styles.tabBtn, tab === 'matches' && (isDark ? { backgroundColor: 'rgba(236,72,153,0.2)' } : styles.tabBtnActive)]} 
          onPress={() => setTab('matches')}
        >
          <Text style={[styles.tabText, tab === 'matches' && (isDark ? { color: theme.primary } : styles.tabTextActive)]}>{matches.length} Matchs</Text>
        </Pressable>
        <Pressable 
          style={[styles.tabBtn, tab === 'likes' && (isDark ? { backgroundColor: 'rgba(236,72,153,0.2)' } : styles.tabBtnActive)]} 
          onPress={() => setTab('likes')}
        >
          <Text style={[styles.tabText, tab === 'likes' && (isDark ? { color: theme.primary } : styles.tabTextActive)]}>{likes.length} Likes</Text>
        </Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        numColumns={2}
        columnWrapperStyle={{ gap: 16, marginBottom: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-dislike-outline" size={64} color={theme.border} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun {tab === 'matches' ? 'match' : 'like'} pour le moment</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {tab === 'matches'
                ? 'Continuez de swiper pour trouver votre connexion.'
                : 'Les likes recus en attente de confirmation apparaitront ici.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const user = tab === 'matches' ? item.matchedUser : item.likedBy;
          if (!user) return null;

          return (
            <Pressable
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() =>
                tab === 'matches'
                  ? navigation.navigate('Messages', { matchId: item._id })
                  : navigation.navigate('Profile', { screen: 'ProfileMain', params: { userId: user.username || user._id } })
              }
            >
              <View style={styles.avatarWrapper}>
                <Avatar uri={user?.photos?.find?.((p) => p.isPrimary)?.url || user?.googlePhoto} size={100} />
                {user?.isOnline && <View style={styles.onlineBadge} />}
              </View>
              <Text style={styles.name} numberOfLines={1}>{user?.firstName}</Text>
              {tab === 'matches' ? (
                <Text style={styles.meta} numberOfLines={1}>{user?.isOnline ? 'En ligne' : 'Hors ligne'}</Text>
              ) : (
                <Text style={styles.pendingText}>Vous plaisez. En attente de confirmation.</Text>
              )}
              <View style={[styles.chatBtn, tab === 'likes' && styles.likeBtn]}>
                <Ionicons name={tab === 'matches' ? 'chatbubble' : 'heart'} size={16} color="#fff" />
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#fce7f3' },
  tabText: { color: colors.textMuted, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  tabTextActive: { color: '#be185d' },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, alignItems: 'center', position: 'relative', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  onlineBadge: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.success, borderWidth: 3, borderColor: '#fff' },
  name: { color: colors.text, fontWeight: '800', fontSize: 16, textAlign: 'center' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  pendingText: { color: '#be185d', fontSize: 11, marginTop: 4, textAlign: 'center', fontWeight: '700' },
  chatBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  likeBtn: { backgroundColor: '#ec4899' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 15, lineHeight: 22, paddingHorizontal: 20 }
});
