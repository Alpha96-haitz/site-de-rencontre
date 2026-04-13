import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import AppInput from '../../components/AppInput';
import Avatar from '../../components/Avatar';
import { userService } from '../../services/userService';
import { colors } from '../../theme/colors';

export default function SearchScreen({ navigation }) {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!q.trim()) {
        setUsers([]);
        return;
      }
      const data = await userService.search(q);
      setUsers(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const title = useMemo(() => (q ? `${users.length} resultat(s)` : 'Recherche utilisateurs'), [q, users.length]);

  return (
    <View style={styles.container}>
      <View style={{ padding: 12 }}>
        <AppInput placeholder="Nom, username..." value={q} onChangeText={setQ} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => navigation.navigate('Profile', { screen: 'ProfileMain', params: { userId: item.username } })}>
            <Avatar uri={item?.photos?.find?.((p) => p.isPrimary)?.url || item?.googlePhoto} size={48} />
            <View>
              <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
              <Text style={styles.meta}>@{item.username}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.textMuted, marginTop: 2 },
  item: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12 }
});
