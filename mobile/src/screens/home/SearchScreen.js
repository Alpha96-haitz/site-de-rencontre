import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import Avatar from '../../components/Avatar';
import { userService } from '../../services/userService';
import { colors } from '../../theme/colors';

export default function SearchScreen({ navigation }) {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const data = await userService.suggestions(20);
        if (mounted) setSuggestions(data || []);
      } catch (err) {
        if (mounted) setSuggestions([]);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const clean = q.trim();
      if (!clean) {
        setUsers([]);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await userService.search(clean);
        setUsers(data || []);
      } catch (err) {
        setUsers([]);
        setError('Recherche indisponible. Reessayez.');
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  const isSearching = q.trim().length > 0;
  const listData = isSearching ? users : suggestions;
  const title = useMemo(() => {
    if (isSearching) return `${users.length} resultat(s)`;
    return 'Suggestions pour vous';
  }, [isSearching, users.length]);

  const openProfile = (item) => {
    const userId = item?.username || item?._id;
    if (!userId) return;
    navigation.navigate('Profile', { screen: 'ProfileMain', params: { userId } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.navigate('Feed')}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
            <Text style={styles.backText}>Accueil</Text>
          </Pressable>
        </View>
        <AppInput
          placeholder="Nom, username, centre d'interet..."
          value={q}
          onChangeText={setQ}
        />
        <Text style={styles.title}>{title}</Text>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={listData}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                {isSearching ? 'Aucun profil trouve' : 'Aucune suggestion'}
              </Text>
              <Text style={styles.emptyText}>
                {isSearching ? 'Essayez un autre nom ou username.' : 'Completez vos infos pour de meilleures suggestions.'}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => openProfile(item)}>
            <Avatar
              uri={item?.photos?.find?.((p) => p.isPrimary)?.url || item?.googlePhoto || item?.profilePicture}
              size={50}
            />
            <View style={styles.userInfo}>
              <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
              <Text style={styles.meta}>@{item.username}</Text>
              {!!item?.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  backText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  title: { color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  loadingBox: { paddingHorizontal: 12, paddingBottom: 8 },
  errorText: { color: colors.danger, paddingHorizontal: 12, marginBottom: 6, fontWeight: '600' },
  listContent: { paddingHorizontal: 12, paddingBottom: 16 },
  item: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  userInfo: { flex: 1 },
  name: { color: colors.text, fontWeight: '800', fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  bio: { color: colors.textGhost, marginTop: 3, fontSize: 12 },
  emptyBox: { marginTop: 40, alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 6 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 }
});
