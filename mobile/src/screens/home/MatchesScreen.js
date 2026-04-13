import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import { matchService } from '../../services/matchService';
import { colors } from '../../theme/colors';

export default function MatchesScreen({ navigation }) {
  const [matches, setMatches] = useState([]);

  const load = useCallback(async () => {
    const data = await matchService.list();
    setMatches(data || []);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [load, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Mes Matchs</Text>
      <FlatList
        data={matches}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{ padding: 16 }}
        numColumns={2}
        columnWrapperStyle={{ gap: 16, marginBottom: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-dislike-outline" size={64} color={colors.border} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Aucun match</Text>
            <Text style={styles.emptyText}>Continuez de swiper pour découvrir votre moitié !</Text>
          </View>
        }
        renderItem={({ item }) => {
          const user = item.matchedUser;
          if (!user) return null;
          return (
            <Pressable style={styles.card} onPress={() => navigation.navigate('Messages', { matchId: item._id })}>
              <View style={styles.avatarWrapper}>
                <Avatar uri={user?.photos?.find?.((p) => p.isPrimary)?.url || user?.googlePhoto} size={100} />
                {user?.isOnline && <View style={styles.onlineBadge} />}
              </View>
              <Text style={styles.name} numberOfLines={1}>{user?.firstName}</Text>
              <Text style={styles.meta} numberOfLines={1}>{user?.isOnline ? 'En ligne' : 'Hors ligne'}</Text>
              <View style={styles.chatBtn}>
                <Ionicons name="chatbubble" size={16} color="#fff" />
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
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, alignItems: 'center', position: 'relative', elevation: 2, shadowColor: '#000', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  onlineBadge: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.success, borderWidth: 3, borderColor: '#fff' },
  name: { color: colors.text, fontWeight: '800', fontSize: 16, textAlign: 'center' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  chatBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 15, lineHeight: 22, paddingHorizontal: 20 }
});
