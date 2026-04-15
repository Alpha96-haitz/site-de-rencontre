import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppInput from '../../components/AppInput';
import Avatar from '../../components/Avatar';
import { userService } from '../../services/userService';
import { colors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';

export default function SearchScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset search when leaving the screen
  useFocusEffect(
    useCallback(() => {
      // Logic when focusing: none needed here
      return () => {
        // Logic when blurring (leaving):
        setQ('');
        setUsers([]);
        setError('');
      };
    }, [])
  );

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
    navigation.navigate('ProfileMain', { userId });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[
        styles.header, 
        { 
          paddingTop: insets.top + 10,
          borderBottomColor: theme.border, 
          backgroundColor: theme.surface 
        }
      ]}>
        <View style={styles.topRow}>
          <Pressable
            style={[styles.backBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text }]}>Quitter</Text>
          </Pressable>
        </View>

        <View style={styles.inputWrapper}>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
            <Ionicons name="search" size={20} color={theme.textGhost} style={{ marginLeft: 15 }} />
            <TextInput
              placeholder="Chercher un profil..."
              placeholderTextColor={theme.textGhost}
              value={q}
              onChangeText={setQ}
              style={[styles.searchInputField, { color: theme.text }]}
            />
            {q.length > 0 && (
              <Pressable style={styles.clearBtnInner} onPress={() => setQ('')}>
                <Ionicons name="close-circle" size={18} color={theme.textGhost} />
              </Pressable>
            )}
          </View>
        </View>

        <Text style={[styles.title, { color: theme.textMuted }]}>{title}</Text>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.primary} />
        </View>
      )}

      {!!error && <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>}

      <FlatList
        data={listData}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
               <View style={[styles.emptyIconBox, { backgroundColor: theme.inputBg }]}>
                 <Ionicons name="search" size={32} color={theme.textGhost} />
               </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {isSearching ? 'Aucun profil trouvé' : 'Aucune suggestion'}
              </Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {isSearching ? 'Essayez un autre nom ou @username.' : 'Complétez vos infos pour plus de suggestions.'}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable 
            style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={() => openProfile(item)}
          >
            <View style={styles.avatarWrap}>
               <Avatar
                uri={item?.photos?.find?.((p) => p.isPrimary)?.url || item?.googlePhoto || item?.profilePicture}
                size={56}
               />
               {item.isOnline && <View style={styles.onlineStatus} />}
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>{item.firstName} {item.lastName}</Text>
              <Text style={[styles.meta, { color: theme.textMuted }]}>@{item.username}</Text>
              {!!item?.bio && <Text style={[styles.bio, { color: theme.textGhost }]} numberOfLines={1}>{item.bio}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.border} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2
  },
  backText: { fontWeight: '800', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center' },
  inputContainer: { 
    flex: 1, 
    height: 54, 
    borderRadius: 27, 
    flexDirection: 'row', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2
  },
  searchInputField: { flex: 1, height: '100%', paddingHorizontal: 12, fontSize: 16, fontWeight: '500' },
  clearBtnInner: { padding: 12 },
  title: { marginTop: 18, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.6 },
  loadingBox: { paddingVertical: 30 },
  errorText: { paddingHorizontal: 16, marginBottom: 10, fontWeight: '700', fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingVertical: 20 },
  item: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  avatarWrap: { position: 'relative' },
  onlineStatus: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  userInfo: { flex: 1 },
  itemTitle: { fontWeight: '900', fontSize: 16 },
  meta: { fontSize: 13, marginTop: 2, fontWeight: '600' },
  bio: { marginTop: 6, fontSize: 13, opacity: 0.8 },
  emptyBox: { marginTop: 80, alignItems: 'center', paddingHorizontal: 30 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontWeight: '900', fontSize: 20, marginBottom: 10, textAlign: 'center' },
  emptyText: { textAlign: 'center', lineHeight: 24, fontSize: 15 }
});
