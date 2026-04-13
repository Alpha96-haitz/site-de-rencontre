import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { messageService } from '../../services/messageService';
import { colors } from '../../theme/colors';

export default function MessagesScreen({ route }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [currentId, setCurrentId] = useState(route.params?.matchId || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const typingTimeout = useRef(null);
  const flatListRef = useRef(null);

  const currentUserId = (user?._id || user?.id || '').toString();

  const loadConversations = async () => {
    const data = await messageService.conversations();
    setConversations(data || []);
    
    // Check initially populated online status
    const onlineSet = new Set(onlineUsers);
    data?.forEach(c => {
      const other = c.users?.find((u) => u._id !== currentUserId) || c.users?.[0];
      if (other?.isOnline) onlineSet.add(other._id);
    });
    setOnlineUsers(onlineSet);
  };

  const loadMessages = async (matchId) => {
    const data = await messageService.getByMatch(matchId);
    setMessages(data || []);
    await messageService.markRead(matchId);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!currentId) return;
    loadMessages(currentId);
    socket?.emit('join:match', currentId);
    return () => socket?.emit('leave:match', currentId);
  }, [currentId, socket]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (msg) => {
      if (msg.match === currentId) {
        setMessages((prev) => {
          const exists = prev.some((m) => (m._id || '').toString() === (msg._id || '').toString());
          if (exists) return prev;
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          return [...prev, msg];
        });
      }
      loadConversations();
    };

    const onTypingStart = ({ matchId, userId }) => {
      if (matchId === currentId && userId !== currentUserId) setTyping(true);
    };
    const onTypingStop = ({ matchId, userId }) => {
      if (matchId === currentId && userId !== currentUserId) setTyping(false);
    };
    
    const onUserOnline = ({ userId }) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    };
    const onUserOffline = ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on('message:new', onNew);
    socket.on('message:received', onNew);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);

    return () => {
      socket.off('message:new', onNew);
      socket.off('message:received', onNew);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('user:online', onUserOnline);
      socket.off('user:offline', onUserOffline);
    };
  }, [socket, currentId, currentUserId]);

  const currentConversation = useMemo(() => conversations.find((c) => c._id === currentId), [conversations, currentId]);

  const handleChangeText = (value) => {
    setText(value);
    if (!socket || !currentId) return;
    socket.emit('typing:start', { matchId: currentId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing:stop', { matchId: currentId });
    }, 900);
  };

  const send = async () => {
    if (!text.trim() || !currentId) return;
    const payload = { content: text.trim(), clientTempId: `tmp-${Date.now()}` };
    setText('');

    if (socket?.connected) {
      socket.emit('message:send', { matchId: currentId, ...payload });
    } else {
      const created = await messageService.send(currentId, payload);
      setMessages((prev) => [...prev, created]);
      loadConversations();
    }
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const currentChatUser = currentConversation?.users?.find((u) => u._id !== currentUserId) || currentConversation?.users?.[0];
  const isCurrentChatOnline = currentChatUser ? onlineUsers.has(currentChatUser._id) : false;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container} keyboardVerticalOffset={90}>
      <View style={styles.convListWrapper}>
        <Text style={styles.sectionTitle}>Matchs récents</Text>
        <FlatList
          data={conversations}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
          renderItem={({ item }) => {
            const other = item.users?.find((u) => u._id !== currentUserId) || item.users?.[0];
            const isOnline = other ? onlineUsers.has(other._id) : false;
            const isActive = item._id === currentId;
            return (
              <Pressable style={[styles.convItem, isActive && styles.convItemActive]} onPress={() => setCurrentId(item._id)}>
                <View style={styles.avatarWrap}>
                  <Avatar uri={other?.photos?.find?.((p) => p.isPrimary)?.url || other?.googlePhoto} size={56} />
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
                 <Text style={styles.chatHeaderName}>{currentChatUser?.firstName}</Text>
                 {isCurrentChatOnline && <Text style={styles.chatHeaderStatus}>En ligne</Text>}
               </View>
               <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, idx) => item._id || String(idx)}
              contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => {
                const senderId = (item.sender?._id || item.sender || '').toString();
                const mine = senderId === currentUserId;
                return (
                  <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapOther]}>
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                      <Text style={[styles.msgText, mine && { color: '#fff' }]}>{item.content}</Text>
                    </View>
                  </View>
                );
              }}
              ListFooterComponent={typing ? <Text style={styles.typing}>{currentChatUser?.firstName} est en train d'écrire...</Text> : null}
            />

            <View style={styles.inputRow}>
              <View style={styles.inputContain}>
                <TextInput
                  value={text}
                  onChangeText={handleChangeText}
                  placeholder="Tapez un message..."
                  placeholderTextColor={colors.textGhost}
                  style={styles.input}
                  multiline
                />
              </View>
              <Pressable style={[styles.send, (!text.trim()) && styles.sendDisabled]} onPress={send}>
                <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 2 }} />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.border} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Vos Messages</Text>
            <Text style={styles.emptyText}>Sélectionnez un match en haut pour commencer à discuter.</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  convListWrapper: { paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginLeft: 16, marginBottom: 16 },
  convItem: { width: 68, alignItems: 'center', opacity: 0.6 },
  convItemActive: { opacity: 1 },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success, borderWidth: 2, borderColor: '#fff' },
  convName: { fontSize: 12, color: colors.text, fontWeight: '700' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: colors.danger, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  
  chatBox: { flex: 1, backgroundColor: colors.bg },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  chatHeaderTitleGroup: { flexDirection: 'column' },
  chatHeaderName: { fontSize: 16, fontWeight: '800', color: colors.text },
  chatHeaderStatus: { fontSize: 12, fontWeight: '600', color: colors.success },
  
  bubbleWrap: { flexDirection: 'row', width: '100%' },
  bubbleWrapMine: { justifyContent: 'flex-end' },
  bubbleWrapOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  msgText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  typing: { color: colors.textGhost, fontSize: 13, fontStyle: 'italic', marginLeft: 12, marginTop: 4 },
  
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  inputContain: { flex: 1, backgroundColor: colors.inputBg, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, maxHeight: 120 },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingTop: 6, paddingBottom: 6 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sendDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 15, lineHeight: 22 }
});
