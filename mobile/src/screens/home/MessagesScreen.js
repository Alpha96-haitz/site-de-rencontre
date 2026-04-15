import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { messageService } from '../../services/messageService';
import { colors } from '../../theme/colors';

const buildTempMessage = ({ tempId, matchId, text, currentUser }) => ({
  _id: tempId,
  clientTempId: tempId,
  match: matchId,
  sender: {
    _id: currentUser?._id || currentUser?.id,
    firstName: currentUser?.firstName || 'Vous'
  },
  content: text,
  createdAt: new Date().toISOString(),
  __pending: true,
  __failed: false
});

const senderIdOf = (msg) => (msg?.sender?._id || msg?.sender || '').toString();

export default function MessagesScreen({ route, navigation }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);
  const pendingTimeouts = useRef({});
  const convSyncTimeout = useRef(null);

  const TAB_BAR_HEIGHT = 96; // 70 (height) + 16 (bottom) + grace

  const [conversations, setConversations] = useState([]);
  const [currentId, setCurrentId] = useState(route.params?.matchId || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [query, setQuery] = useState('');

  const currentUserId = (user?._id || user?.id || '').toString();

  const loadConversations = async () => {
    const data = await messageService.conversations();
    const next = data || [];
    setConversations(next);
    setOnlineUsers((prev) => {
      const updated = new Set(prev);
      next.forEach((c) => {
        const other = c.users?.find((u) => u._id !== currentUserId) || c.users?.[0];
        if (other?.isOnline) updated.add(other._id);
      });
      return updated;
    });
  };

  const scheduleConversationsSync = () => {
    if (convSyncTimeout.current) return;
    convSyncTimeout.current = setTimeout(async () => {
      convSyncTimeout.current = null;
      await loadConversations();
    }, 1200);
  };

  const loadMessages = async (matchId) => {
    const data = await messageService.getByMatch(matchId);
    setMessages(data || []);
    await messageService.markRead(matchId).catch(() => {});
    socket?.emit('message:read', matchId);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const incomingMatchId = route.params?.matchId;
    if (incomingMatchId && incomingMatchId !== currentId) setCurrentId(incomingMatchId);
  }, [route.params?.matchId]);

  useEffect(() => {
    if (!currentId) return;
    loadMessages(currentId);
    socket?.emit('join:match', currentId);
    return () => socket?.emit('leave:match', currentId);
  }, [currentId, socket]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (msg) => {
      const msgMatch = String(msg?.match || '');
      const belongsToCurrent = msgMatch === String(currentId || '');
      const mine = senderIdOf(msg) === currentUserId;

      if (belongsToCurrent) {
        setMessages((prev) => {
          const byId = prev.findIndex((m) => String(m._id) === String(msg._id));
          if (byId !== -1) return prev;

          if (mine && msg.clientTempId) {
            const tempIdx = prev.findIndex((m) => String(m.clientTempId || m._id) === String(msg.clientTempId));
            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = { ...msg, __pending: false, __failed: false };
              if (pendingTimeouts.current[msg.clientTempId]) {
                clearTimeout(pendingTimeouts.current[msg.clientTempId]);
                delete pendingTimeouts.current[msg.clientTempId];
              }
              return next;
            }
          }

          return [...prev, { ...msg, __pending: false, __failed: false }];
        });

        if (!mine) {
          messageService.markRead(currentId).catch(() => {});
          socket.emit('message:read', currentId);
        }

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
      }
      setConversations((prev) => {
        const idx = prev.findIndex((c) => String(c._id) === msgMatch);
        if (idx === -1) return prev;
        const next = [...prev];
        const updated = { ...next[idx] };
        updated.lastMessage = {
          content: msg?.content || '',
          sender: senderIdOf(msg) || null,
          createdAt: msg?.createdAt || new Date().toISOString(),
          hasImage: Boolean(msg?.image?.url)
        };
        if (!mine) updated.unreadCount = Math.max((updated.unreadCount || 0) + 1, 0);
        next.splice(idx, 1);
        return [updated, ...next];
      });
      scheduleConversationsSync();
    };

    const onMessageError = ({ clientTempId }) => {
      if (!clientTempId) return;
      setMessages((prev) =>
        prev.map((m) =>
          String(m.clientTempId || m._id) === String(clientTempId)
            ? { ...m, __pending: false, __failed: true }
            : m
        )
      );
      if (pendingTimeouts.current[clientTempId]) {
        clearTimeout(pendingTimeouts.current[clientTempId]);
        delete pendingTimeouts.current[clientTempId];
      }
    };

    const onTypingStart = ({ matchId, userId }) => {
      if (String(matchId) === String(currentId) && String(userId) !== currentUserId) setTyping(true);
    };
    const onTypingStop = ({ matchId, userId }) => {
      if (String(matchId) === String(currentId) && String(userId) !== currentUserId) setTyping(false);
    };

    const onUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    };
    const onUserOffline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    const onMessageUpdated = (msg) => {
      setMessages((prev) => prev.map((m) => (String(m._id) === String(msg._id) ? msg : m)));
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
    };

    socket.on('message:new', onNew);
    socket.on('message:received', onNew);
    socket.on('message:updated', onMessageUpdated);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('message:error', onMessageError);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);

    return () => {
      socket.off('message:new', onNew);
      socket.off('message:received', onNew);
      socket.off('message:updated', onMessageUpdated);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('message:error', onMessageError);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('user:online', onUserOnline);
      socket.off('user:offline', onUserOffline);
    };
  }, [socket, currentId, currentUserId]);

  useEffect(() => {
    return () => {
      Object.values(pendingTimeouts.current).forEach((t) => clearTimeout(t));
      if (convSyncTimeout.current) clearTimeout(convSyncTimeout.current);
    };
  }, []);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const other = c.users?.find((u) => u._id !== currentUserId) || c.users?.[0];
      const fullName = `${other?.firstName || ''} ${other?.lastName || ''}`.toLowerCase();
      const username = String(other?.username || '').toLowerCase();
      const preview = String(c?.lastMessage?.content || '').toLowerCase();
      return fullName.includes(q) || username.includes(q) || preview.includes(q);
    });
  }, [conversations, query, currentUserId]);

  const currentConversation = useMemo(
    () => conversations.find((c) => String(c._id) === String(currentId)),
    [conversations, currentId]
  );

  const fallbackRecipient = route.params?.recipient;
  const currentChatUser =
    currentConversation?.users?.find((u) => String(u._id) !== currentUserId) || 
    currentConversation?.users?.[0] ||
    fallbackRecipient;
  const isCurrentChatOnline = currentChatUser ? onlineUsers.has(currentChatUser._id) : false;

  const handleDeleteConversation = (idToDel) => {
    Alert.alert(
      "Supprimer la conversation",
      "Voulez-vous vraiment supprimer cette conversation ? Cette action est irréversible et supprimera l'historique.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive", 
          onPress: async () => {
            try {
              await messageService.deleteConversation(idToDel);
              setConversations(prev => prev.filter(c => String(c._id) !== String(idToDel)));
              if (String(currentId) === String(idToDel)) {
                setCurrentId(null);
                setMessages([]);
              }
            } catch (err) {
              Alert.alert("Erreur", "Impossible de supprimer cette conversation.");
            }
          }
        }
      ]
    );
  };

  const handleChangeText = (value) => {
    setText(value);
    if (!socket || !currentId) return;
    socket.emit('typing:start', { matchId: currentId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing:stop', { matchId: currentId });
    }, 900);
  };

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      if (currentId) {
        parent.setOptions({ tabBarStyle: { display: 'none' } });
      } else {
        parent.setOptions({
          tabBarStyle: { 
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            height: 70, 
            paddingTop: 8, 
            paddingBottom: 8, 
            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
            borderWidth: 1, 
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderRadius: 35,
            elevation: 10, 
            shadowColor: '#000', 
            shadowOpacity: 0.1, 
            shadowOffset: { width: 0, height: 10 },
            shadowRadius: 20
          }
        });
      }
    }
  }, [currentId, navigation, isDark]);

  const sendTextMessage = async (forcedText, retryTempId = null) => {
    const clean = (forcedText ?? text).trim();
    if (!clean || !currentId) return;

    if (editingMessageId) {
      const targetId = editingMessageId;
      setEditingMessageId(null);
      setText('');
      
      try {
        const updated = await messageService.editMessage(targetId, clean);
        setMessages((prev) => prev.map((m) => String(m._id) === String(targetId) ? updated : m));
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de modifier le message');
      }
      return;
    }

    const tempId = retryTempId || `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic = buildTempMessage({
      tempId,
      matchId: currentId,
      text: clean,
      currentUser: user
    });

    if (retryTempId) {
      setMessages((prev) =>
        prev.map((m) =>
          String(m.clientTempId || m._id) === String(retryTempId)
            ? { ...m, __pending: true, __failed: false, content: clean }
            : m
        )
      );
    } else {
      setMessages((prev) => [...prev, optimistic]);
      setText('');
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    socket?.emit('typing:stop', { matchId: currentId });

    const failTimer = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m.clientTempId || m._id) === String(tempId)
            ? { ...m, __pending: false, __failed: true }
            : m
        )
      );
    }, 10000);
    pendingTimeouts.current[tempId] = failTimer;

    try {
      if (socket?.connected) {
        socket.emit('message:send', { matchId: currentId, content: clean, clientTempId: tempId });
      } else {
        const created = await messageService.send(currentId, { content: clean, clientTempId: tempId });
        setMessages((prev) =>
          prev.map((m) => (String(m.clientTempId || m._id) === tempId ? { ...created } : m))
        );
        clearTimeout(pendingTimeouts.current[tempId]);
        delete pendingTimeouts.current[tempId];
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
      setConversations((prev) => {
        const idx = prev.findIndex((c) => String(c._id) === String(currentId));
        if (idx === -1) return prev;
        const next = [...prev];
        const updated = { ...next[idx] };
        updated.lastMessage = {
          content: clean,
          sender: currentUserId,
          createdAt: new Date().toISOString(),
          hasImage: false
        };
        next.splice(idx, 1);
        return [updated, ...next];
      });
      scheduleConversationsSync();
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          String(m.clientTempId || m._id) === String(tempId)
            ? { ...m, __pending: false, __failed: true }
            : m
        )
      );
      clearTimeout(pendingTimeouts.current[tempId]);
      delete pendingTimeouts.current[tempId];
    }
  };

  const retryFailedMessage = (msg) => {
    sendTextMessage(msg.content, msg.clientTempId || msg._id);
  };

  const handleLongPressMessage = (item) => {
    const mine = senderIdOf(item) === currentUserId;
    if (!mine || item.__pending || item.__failed) return;
    
    Alert.alert(
      "Options du message",
      "Que souhaitez-vous faire avec ce message ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Modifier", 
          onPress: () => {
            setText(item.content);
            setEditingMessageId(item._id);
          }
        },
        { 
          text: "Supprimer", 
          style: "destructive", 
          onPress: async () => {
            try {
              await messageService.deleteMessage(item._id);
              setMessages((prev) => prev.filter((m) => String(m._id) !== String(item._id)));
            } catch (err) {
              Alert.alert("Erreur", "Impossible de supprimer ce message.");
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.bg }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {!currentId && (
        <View style={[styles.convListWrapper, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Discussions</Text>
          <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Ionicons name="search" size={15} color={theme.textGhost} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher une discussion..."
              placeholderTextColor={theme.textGhost}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          <FlatList
            data={filteredConversations}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => String(item._id)}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }}
            renderItem={({ item }) => {
              const other = item.users?.find((u) => String(u._id) !== currentUserId) || item.users?.[0];
              const isOnline = other ? onlineUsers.has(other._id) : false;
              const isActive = String(item._id) === String(currentId);
              return (
                <Pressable 
                  style={[styles.convItemVertical, isActive && styles.convItemActive]} 
                  onPress={() => setCurrentId(item._id)}
                  onLongPress={() => handleDeleteConversation(item._id)}
                >
                  <View style={styles.avatarWrap}>
                    <Avatar uri={other?.photos?.find?.((p) => p.isPrimary)?.url || other?.googlePhoto} size={60} />
                    {isOnline && <View style={styles.onlineBadge} />}
                  </View>
                  <View style={styles.convDetails}>
                    <View style={styles.convDetailsTop}>
                      <Text style={[styles.convNameVertical, { color: theme.text }]} numberOfLines={1}>{other?.firstName} {other?.lastName}</Text>
                      {item.lastMessage && <Text style={[styles.convTime, { color: theme.textGhost }]}>{new Date(item.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>}
                    </View>
                    <Text style={[styles.convPreview, { color: !!item.unreadCount ? theme.primary : theme.textMuted, fontWeight: !!item.unreadCount ? '800' : '500' }]} numberOfLines={1}>
                      {item.lastMessage?.hasImage ? '📷 Image' : (item.lastMessage?.content || 'Nouvelle discussion')}
                    </Text>
                  </View>
                  {!!item.unreadCount && <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount}</Text></View>}
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {currentId && (
          <View style={[styles.chatBox, { backgroundColor: theme.bg }]}>
            <View style={[styles.chatHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable onPress={() => setCurrentId(null)} style={{ padding: 4 }}>
                  <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Avatar uri={currentChatUser?.photos?.find?.((p) => p.isPrimary)?.url || currentChatUser?.googlePhoto} size={40} />
                <View style={styles.chatHeaderTitleGroup}>
                  <Text style={[styles.chatHeaderName, { color: theme.text }]} numberOfLines={1}>{currentChatUser?.firstName || 'Discussion'} {currentChatUser?.lastName || ''}</Text>
                  <Text style={[styles.chatHeaderStatus, { color: theme.textMuted }]}>
                    {typing
                      ? "en train d'écrire..."
                      : isCurrentChatOnline
                        ? 'en ligne'
                        : 'hors ligne'}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => handleDeleteConversation(currentId)} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={22} color={theme.danger || '#ef4444'} />
              </Pressable>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, idx) => String(item._id || item.clientTempId || idx)}
              contentContainerStyle={{ 
                padding: 16, 
                gap: 10, 
                paddingBottom: currentId ? 20 : TAB_BAR_HEIGHT + insets.bottom 
              }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => {
                const mine = senderIdOf(item) === currentUserId;
                return (
                  <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapOther]}>
                    <Pressable
                      disabled={!item.__failed && !mine}
                      onPress={() => {
                        if (item.__failed) retryFailedMessage(item);
                      }}
                      onLongPress={() => handleLongPressMessage(item)}
                      style={[
                        styles.bubble,
                        mine ? styles.bubbleMine : styles.bubbleOther,
                        !mine && isDark && { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }
                      ]}
                    >
                      <Text style={[styles.msgText, mine && styles.msgTextMine, !mine && isDark && { color: theme.text }]}>{item.content}</Text>
                      {mine && item.__pending && <Text style={[styles.pendingText, { color: theme.textMuted }]}>envoi...</Text>}
                      {mine && item.__failed && <Text style={styles.failedText}>echec - toucher pour renvoyer</Text>}
                    </Pressable>
                  </View>
                );
              }}
            />

            <View style={[
              styles.inputRow, 
              { 
                backgroundColor: theme.surface, 
                borderTopColor: theme.border,
                paddingBottom: insets.bottom + (currentId ? TAB_BAR_HEIGHT - 10 : 10)
              }
            ]}>
              <View style={[styles.inputContain, { backgroundColor: isDark ? theme.surface : '#fff', borderColor: theme.border }]}>
                <TextInput
                  value={text}
                  onChangeText={handleChangeText}
                  placeholder="Message"
                  placeholderTextColor={theme.textGhost}
                  style={[styles.input, { color: theme.text }]}
                  multiline
                />
              </View>
              <Pressable style={[styles.send, !text.trim() && styles.sendDisabled]} onPress={() => sendTextMessage()}>
                <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 2 }} />
              </Pressable>
            </View>
          </View>
        )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ece5dd' },
  convListWrapper: { flex: 1, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 28, fontWeight: '900', color: colors.text, marginLeft: 16, marginBottom: 16, marginTop: 16 },
  searchBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    gap: 8
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  convItemVertical: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 14 },
  convItemActive: { opacity: 1 },
  avatarWrap: { position: 'relative' },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 15, height: 15, borderRadius: 8, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  convDetails: { flex: 1, justifyContent: 'center' },
  convDetailsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convNameVertical: { fontSize: 16, color: colors.text, fontWeight: '800', flex: 1, paddingRight: 8 },
  convTime: { fontSize: 12, fontWeight: '600' },
  convPreview: { fontSize: 14, lineHeight: 20 },
  badge: { backgroundColor: '#ef4444', minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  chatBox: { flex: 1, backgroundColor: '#ece5dd' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f6f6f6', borderBottomWidth: 1, borderBottomColor: colors.border },
  chatHeaderTitleGroup: { flexDirection: 'column' },
  chatHeaderName: { fontSize: 16, fontWeight: '800', color: colors.text },
  chatHeaderStatus: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 1 },

  bubbleWrap: { flexDirection: 'row', width: '100%' },
  bubbleWrapMine: { justifyContent: 'flex-end' },
  bubbleWrapOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: '#dcf8c6', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  msgText: { color: '#111827', fontSize: 15, lineHeight: 20 },
  msgTextMine: { color: '#111827' },
  pendingText: { marginTop: 4, fontSize: 10, color: '#6b7280', textAlign: 'right', fontWeight: '700' },
  failedText: { marginTop: 4, fontSize: 10, color: '#dc2626', textAlign: 'right', fontWeight: '700' },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: '#f6f6f6', borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  inputContain: { flex: 1, backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8, minHeight: 42, maxHeight: 120, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingTop: 4, paddingBottom: 4 },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#25d366', alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { backgroundColor: '#9ca3af' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 15, lineHeight: 22 }
});
