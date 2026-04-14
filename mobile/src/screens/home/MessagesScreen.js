import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
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

export default function MessagesScreen({ route }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);
  const pendingTimeouts = useRef({});
  const convSyncTimeout = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [currentId, setCurrentId] = useState(route.params?.matchId || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
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

    socket.on('message:new', onNew);
    socket.on('message:received', onNew);
    socket.on('message:error', onMessageError);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);

    return () => {
      socket.off('message:new', onNew);
      socket.off('message:received', onNew);
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

  const currentChatUser =
    currentConversation?.users?.find((u) => String(u._id) !== currentUserId) || currentConversation?.users?.[0];
  const isCurrentChatOnline = currentChatUser ? onlineUsers.has(currentChatUser._id) : false;

  const handleChangeText = (value) => {
    setText(value);
    if (!socket || !currentId) return;
    socket.emit('typing:start', { matchId: currentId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing:stop', { matchId: currentId });
    }, 900);
  };

  const sendTextMessage = async (forcedText, retryTempId = null) => {
    const clean = (forcedText ?? text).trim();
    if (!clean || !currentId) return;

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.convListWrapper}>
        <Text style={styles.sectionTitle}>Discussions</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={15} color={colors.textGhost} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une discussion..."
            placeholderTextColor={colors.textGhost}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={filteredConversations}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}
          renderItem={({ item }) => {
            const other = item.users?.find((u) => String(u._id) !== currentUserId) || item.users?.[0];
            const isOnline = other ? onlineUsers.has(other._id) : false;
            const isActive = String(item._id) === String(currentId);
            return (
              <Pressable style={[styles.convItem, isActive && styles.convItemActive]} onPress={() => setCurrentId(item._id)}>
                <View style={styles.avatarWrap}>
                  <Avatar uri={other?.photos?.find?.((p) => p.isPrimary)?.url || other?.googlePhoto} size={52} />
                  {isOnline && <View style={styles.onlineBadge} />}
                </View>
                <Text style={styles.convName} numberOfLines={1}>{other?.firstName || 'Chat'}</Text>
                {!!item.unreadCount && <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount}</Text></View>}
              </Pressable>
            );
          }}
        />
      </View>

      <View style={styles.chatBox}>
        {currentId ? (
          <>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderTitleGroup}>
                <Text style={styles.chatHeaderName}>{currentChatUser?.firstName || 'Discussion'}</Text>
                <Text style={styles.chatHeaderStatus}>
                  {typing
                    ? "en train d'ecrire..."
                    : isCurrentChatOnline
                      ? 'en ligne'
                      : 'hors ligne'}
                </Text>
              </View>
              <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, idx) => String(item._id || item.clientTempId || idx)}
              contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 22 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => {
                const mine = senderIdOf(item) === currentUserId;
                return (
                  <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapOther]}>
                    <Pressable
                      disabled={!item.__failed}
                      onPress={() => retryFailedMessage(item)}
                      style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}
                    >
                      <Text style={[styles.msgText, mine && styles.msgTextMine]}>{item.content}</Text>
                      {mine && item.__pending && <Text style={styles.pendingText}>envoi...</Text>}
                      {mine && item.__failed && <Text style={styles.failedText}>echec - toucher pour renvoyer</Text>}
                    </Pressable>
                  </View>
                );
              }}
            />

            <View style={styles.inputRow}>
              <View style={styles.inputContain}>
                <TextInput
                  value={text}
                  onChangeText={handleChangeText}
                  placeholder="Message"
                  placeholderTextColor={colors.textGhost}
                  style={styles.input}
                  multiline
                />
              </View>
              <Pressable style={[styles.send, !text.trim() && styles.sendDisabled]} onPress={() => sendTextMessage()}>
                <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 2 }} />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.border} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Vos messages</Text>
            <Text style={styles.emptyText}>Selectionnez une discussion pour commencer.</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ece5dd' },
  convListWrapper: { paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginLeft: 14, marginBottom: 8 },
  searchBox: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
    gap: 6
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  convItem: { width: 64, alignItems: 'center', opacity: 0.65 },
  convItemActive: { opacity: 1 },
  avatarWrap: { position: 'relative', marginBottom: 6 },
  onlineBadge: { position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  convName: { fontSize: 11, color: colors.text, fontWeight: '700' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

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
