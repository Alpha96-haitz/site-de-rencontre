import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import { notificationService } from '../../services/notificationService';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import { colors } from '../../theme/colors';

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (diffSec < 60) return "à l'instant";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h`;
  return `${Math.floor(diffSec / 86400)} j`;
};

const getTypeConfig = (type) => {
  if (type === 'like') return { icon: 'heart', color: '#ef4444', label: "a aime votre publication." };
  if (type === 'comment') return { icon: 'chatbubble', color: '#3b82f6', label: 'a commente votre publication.' };
  if (type === 'follow') return { icon: 'person-add', color: '#10b981', label: 'a commence a vous suivre.' };
  if (type === 'match') return { icon: 'sparkles', color: '#f59e0b', label: 'vous avez un nouveau match.' };
  if (type === 'report') return { icon: 'warning', color: '#f97316', label: 'a signale votre profil.' };
  if (type === 'message') return { icon: 'mail', color: '#6366f1', label: 'vous a envoye un message.' };
  return { icon: 'notifications', color: colors.primary, label: 'nouvelle notification.' };
};

export default function NotificationsScreen({ navigation }) {
  const { socket } = useSocket();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await notificationService.list();
      setItems(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;

    const onNewNotification = (notification) => {
      if (!notification?._id) return;
      setItems((prev) => {
        const exists = prev.some((item) => String(item._id) === String(notification._id));
        if (exists) return prev;
        return [notification, ...prev];
      });
    };

    socket.on('notification:new', onNewNotification);
    return () => {
      socket.off('notification:new', onNewNotification);
    };
  }, [socket]);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  );

  const markAll = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setActionBusy(false);
    }
  };

  const handleOpenNotification = async (item) => {
    if (!item.read) {
      try {
        await notificationService.markRead(item._id);
        setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, read: true } : n)));
      } catch (err) {
        // no-op
      }
    }

    const senderId = item?.sender?.username || item?.sender?._id;
    if (senderId) {
      navigation.navigate('ProfileMain', { userId: senderId });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{unreadCount} non lue(s)</Text>
        </View>
        <Pressable style={[styles.markAll, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={markAll} disabled={actionBusy}>
          <Text style={[styles.markAllText, { color: theme.primary }]}>{actionBusy ? '...' : 'Tout marquer lu'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={42} color={theme.textGhost} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune notification</Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>Vos likes, commentaires et matchs apparaitront ici.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const sender = item?.sender || {};
            const cfg = getTypeConfig(item?.type);
            return (
              <Pressable
                onPress={() => handleOpenNotification(item)}
                style={[
                  styles.item,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  !item.read && [styles.unreadItem, { borderColor: isDark ? theme.primaryDark : '#fbcfe8', backgroundColor: isDark ? '#1f172a' : '#fff9fb' }]
                ]}
              >
                <Avatar
                  uri={
                    sender?.profilePicture ||
                    sender?.googlePhoto ||
                    sender?.photos?.find?.((p) => p.isPrimary)?.url
                  }
                  size={46}
                />
                <View style={styles.itemBody}>
                  <Text style={[styles.content, { color: theme.text }]}>
                    <Text style={[styles.senderName, { color: theme.text }]}>
                      {sender?.firstName || ''} {sender?.lastName || ''}
                    </Text>{' '}
                    {item?.content || cfg.label}
                  </Text>
                  <Text style={[styles.timeText, { color: theme.textGhost }]}>{formatRelativeTime(item?.createdAt)}</Text>
                </View>
                <View style={[styles.typeIconWrap, { backgroundColor: `${cfg.color}22` }]}>
                  <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  markAll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12
  },
  markAllText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  loaderBox: { paddingTop: 20 },
  listContent: { paddingHorizontal: 12, paddingBottom: 20 },
  item: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  unreadItem: { borderColor: '#fbcfe8', backgroundColor: '#fff9fb' },
  itemBody: { flex: 1 },
  content: { color: colors.text, lineHeight: 20 },
  senderName: { fontWeight: '800', color: colors.text },
  timeText: { color: colors.textGhost, marginTop: 4, fontSize: 12, fontWeight: '600' },
  typeIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyBox: { marginTop: 80, alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { color: colors.text, fontWeight: '800', marginTop: 10, fontSize: 16 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 }
});
