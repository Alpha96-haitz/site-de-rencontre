import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { notificationService } from '../../services/notificationService';
import { colors } from '../../theme/colors';

export default function NotificationsScreen() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const data = await notificationService.list();
    setItems(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    await notificationService.markAllRead();
    await load();
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.markAll} onPress={markAll}><Text style={styles.markAllText}>Tout marquer lu</Text></Pressable>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={[styles.item, !item.read && styles.unread]}>
            <Text style={styles.type}>{item.type?.toUpperCase()}</Text>
            <Text style={styles.content}>{item.content || 'Notification'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  markAll: { alignSelf: 'flex-end', marginTop: 12, marginRight: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
  markAllText: { color: colors.primary, fontWeight: '700' },
  item: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10 },
  unread: { borderColor: colors.primary },
  type: { color: colors.primaryDark, fontWeight: '800', fontSize: 12, marginBottom: 4 },
  content: { color: colors.text }
});
