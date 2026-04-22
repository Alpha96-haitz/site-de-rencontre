import React, { useEffect, useMemo, useRef, useState, useLayoutEffect, useCallback, memo } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { messageService } from '../../services/messageService';
import { colors } from '../../theme/colors';
// Removed date-fns to avoid bundler issues, using native Intl instead

const { width } = Dimensions.get('window');

// --- HELPERS ---
const groupMessagesByDate = (messages) => {
  const groups = [];
  messages.forEach((msg) => {
    const date = new Date(msg.createdAt);
    const dateStr = date.toDateString();

    let group = groups.find(g => g.dateStr === dateStr);
    if (!group) {
      group = { dateStr, date, data: [] };
      groups.push(group);
    }
    group.data.push(msg);
  });
  return groups;
};

const formatDateHeader = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Aujourd'hui";
  if (isYesterday) return "Hier";

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '--:--';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const buildTempMessage = ({ tempId, matchId, text, currentUser }) => ({
  _id: tempId,
  clientTempId: tempId,
  match: matchId,
  sender: {
    _id: (currentUser?._id || currentUser?.id).toString(),
    firstName: currentUser?.firstName || 'Vous'
  },
  content: text,
  createdAt: new Date().toISOString(),
  __pending: true,
  __failed: false
});

const senderIdOf = (msg) => (msg?.sender?._id || msg?.sender || '').toString();

// --- COMPONENTS ---

const DateHeader = memo(({ date }) => (
  <View style={styles.dateHeaderContainer}>
    <View style={styles.dateHeaderBadge}>
      <Text style={styles.dateHeaderText}>{formatDateHeader(date)}</Text>
    </View>
  </View>
));

const MessageBubble = memo(({ item, mine, isDark, theme }) => {
  const timeStr = formatTime(item.createdAt);

  return (
    <View style={[styles.bubbleWrapper, mine ? styles.bubbleWrapperMine : styles.bubbleWrapperOther]}>
      {mine ? (
        <LinearGradient
          colors={['#ec4899', '#e11d48']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.bubbleMine, { borderBottomRightRadius: 4 }]}
        >
          <Text style={[styles.messageText, { color: '#fff' }]}>
            {item.content}
          </Text>
          <View style={styles.bubbleFooter}>
            <Text style={[styles.timeText, { color: 'rgba(255,255,255,0.7)' }]}>{timeStr}</Text>
            {!item.__failed && <FiCheckCircle color="rgba(255,255,255,0.8)" size={12} style={{ marginLeft: 4 }} />}
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.bubbleOther, { backgroundColor: '#fff', borderBottomLeftRadius: 4 }]}>
          <Text style={[styles.messageText, { color: '#0f172a' }]}>
            {item.content}
          </Text>
          <View style={styles.bubbleFooter}>
            <Text style={[styles.timeText, { color: '#64748b' }]}>{timeStr}</Text>
          </View>
        </View>
      )}
    </View>
  );
});

// Mock FiCheckCircle because we use Ionicons on mobile
const FiCheckCircle = ({ color, size, style }) => (
  <Ionicons name="checkmark-done" size={size} color={color} style={style} />
);

export default function MessagesScreen({ route, navigation }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const currentUserId = (user?._id || user?.id || '').toString();

  const [conversations, setConversations] = useState([]);
  const [currentId, setCurrentId] = useState(route.params?.matchId || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [query, setQuery] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      const data = await messageService.conversations();
      setConversations(data || []);
    } catch (e) { }
  }, []);

  const loadMessages = useCallback(async (mid) => {
    try {
      const data = await messageService.getByMatch(mid);
      setMessages(data || []);
      await messageService.markRead(mid).catch(() => { });
      socket?.emit('message:read', mid);
    } catch (e) { }
  }, [socket]);

  useLayoutEffect(() => {
    // Keep global headers and tabs visible as requested
    // We only hide the internal screen header to prevent it from stacking with the global one
    navigation.setOptions({ headerShown: false });
    
    // Ensure parent tab bar is visible
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'flex' }
    });
  }, [navigation]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    const mid = route.params?.matchId;
    if (mid && mid !== currentId) setCurrentId(mid);
  }, [route.params?.matchId]);

  useEffect(() => {
    if (!currentId) return;
    loadMessages(currentId);
    socket?.emit('join:match', currentId);
    return () => {
      socket?.emit('leave:match', currentId);
      socket?.emit('typing:stop', { matchId: currentId });
    };
  }, [currentId, socket, loadMessages]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (msg) => {
      const msgMatch = String(msg?.match || '');
      if (msgMatch === String(currentId || '')) {
        setMessages(prev => {
          const exists = prev.some(m => String(m._id) === String(msg._id) || (msg.clientTempId && String(m._id) === String(msg.clientTempId)));
          if (exists && !msg.clientTempId) return prev;
          if (msg.clientTempId) return prev.map(m => String(m.clientTempId || m._id) === String(msg.clientTempId) ? { ...msg, __pending: false } : m);
          return [...prev, msg];
        });
        if (senderIdOf(msg) !== currentUserId) {
          messageService.markRead(currentId).catch(() => { });
          socket.emit('message:read', currentId);
        }
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
      loadConversations();
    };

    socket.on('message:new', onNew);
    socket.on('message:received', (msg) => {
      if (String(msg.match) === String(currentId)) loadMessages(currentId);
      loadConversations();
    });

    return () => {
      socket.off('message:new');
      socket.off('message:received');
    };
  }, [socket, currentId, currentUserId, loadConversations, loadMessages]);

  const groupedMessages = useMemo(() => {
    const groups = groupMessagesByDate(messages);
    const flat = [];
    groups.forEach(g => {
      flat.push({ type: 'DATE', date: g.date });
      g.data.forEach(m => flat.push({ type: 'MSG', ...m }));
    });
    return flat;
  }, [messages]);

  const currentConversation = useMemo(() => conversations.find(c => String(c._id) === String(currentId)), [conversations, currentId]);
  const otherUser = currentConversation?.users?.find(u => String(u._id) !== currentUserId) || route.params?.recipient;

  const sendMessage = async () => {
    const clean = text.trim();
    if (!clean || !currentId) return;
    const tid = `tmp-${Date.now()}`;
    setMessages(p => [...p, buildTempMessage({ tempId: tid, matchId: currentId, text: clean, currentUser: user })]);
    setText('');
    try {
      socket?.emit('message:send', { matchId: currentId, content: clean, clientTempId: tid });
    } catch (e) { }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border, paddingTop: Math.max(insets.top, 10) }]}>
      <Pressable onPress={() => setCurrentId(null)} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={28} color={theme.text} />
      </Pressable>
      <View style={styles.headerUser}>
        <Avatar uri={otherUser?.photos?.find(p => p.isPrimary)?.url || otherUser?.googlePhoto} size={42} />
        <View style={styles.headerText}>
          <Text style={[styles.headerName, { color: theme.text }]} numberOfLines={1}>{otherUser?.firstName} {otherUser?.lastName}</Text>
          <Text style={[styles.headerStatus, { color: otherUser?.isOnline ? '#22c55e' : theme.textMuted }]}>
            {otherUser?.isOnline ? 'En ligne' : 'Hors ligne'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderConvList = () => (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.listHeader, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={[styles.listTitle, { color: theme.text }]}>Messages</Text>
      </View>
      <View style={[styles.searchBox, { backgroundColor: theme.surface }]}>
        <Ionicons name="search" size={18} color={theme.textMuted} />
        <TextInput
          placeholder="Rechercher..."
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <FlatList
        data={conversations.filter(c => {
          const other = c.users?.find(u => u._id !== currentUserId);
          const name = `${other?.firstName} ${other?.lastName}`.toLowerCase();
          return name.includes(query.toLowerCase());
        })}
        keyExtractor={c => c._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const other = item.users?.find(u => u._id !== currentUserId);
          const lastMsg = item.lastMessage?.content || 'Nouvelle discussion';
          const timeStr = item.lastMessage?.createdAt ? formatTime(item.lastMessage.createdAt) : '';
          return (
            <Pressable style={styles.convItem} onPress={() => setCurrentId(item._id)}>
              <Avatar uri={other?.photos?.find(p => p.isPrimary)?.url || other?.googlePhoto} size={60} />
              <View style={[styles.convInfo, { borderBottomColor: theme.border }]}>
                <View style={styles.convRow}>
                  <Text style={[styles.convName, { color: theme.text }]}>{other?.firstName} {other?.lastName}</Text>
                  <Text style={[styles.convTime, { color: theme.textMuted }]}>{timeStr}</Text>
                </View>
                <View style={styles.convRow}>
                  <Text style={[styles.convLast, { color: item.unreadCount > 0 ? '#db2777' : theme.textMuted, fontWeight: item.unreadCount > 0 ? '700' : '400' }]} numberOfLines={1}>{lastMsg}</Text>
                  {item.unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount}</Text></View>}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );

  if (!currentId) return renderConvList();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header pushed slightly higher */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border, paddingTop: Math.max(insets.top, 5) }]}>
        <Pressable onPress={() => setCurrentId(null)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <View style={styles.headerUser}>
          <Avatar uri={otherUser?.photos?.find(p => p.isPrimary)?.url || otherUser?.googlePhoto} size={38} />
          <View style={styles.headerText}>
            <Text style={[styles.headerName, { color: theme.text }]} numberOfLines={1}>{otherUser?.firstName} {otherUser?.lastName}</Text>
            <Text style={[styles.headerStatus, { color: otherUser?.isOnline ? '#22c55e' : theme.textMuted }]}>
              {otherUser?.isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <FlatList
          ref={flatListRef}
          data={groupedMessages}
          keyExtractor={(item, index) => item._id || `idx-${index}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 15 }}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            if (item.type === 'DATE') return <DateHeader date={item.date} />;
            const mine = senderIdOf(item) === currentUserId;
            return (
              <View style={[styles.bubbleWrapper, mine ? styles.bubbleWrapperMine : styles.bubbleWrapperOther]}>
                {mine ? (
                  <LinearGradient
                    colors={['#ec4899', '#e11d48']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.bubble, styles.bubbleMine, { borderBottomRightRadius: 4 }]}
                  >
                    <Text style={[styles.messageText, { color: '#fff' }]}>{item.content}</Text>
                    <View style={styles.bubbleFooter}>
                      <Text style={[styles.timeText, { color: 'rgba(255,255,255,0.7)' }]}>{formatTime(item.createdAt)}</Text>
                      {!item.__failed && <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }} />}
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={[styles.bubble, styles.bubbleOther, { backgroundColor: theme.surface, borderBottomLeftRadius: 4, borderColor: theme.border, borderWidth: isDark ? 0 : 1 }]}>
                    <Text style={[styles.messageText, { color: theme.text }]}>{item.content}</Text>
                    <View style={styles.bubbleFooter}>
                      <Text style={[styles.timeText, { color: theme.textMuted }]}>{formatTime(item.createdAt)}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
        <View style={[styles.inputRow, { 
          backgroundColor: theme.surface, 
          borderTopColor: theme.border, 
          paddingBottom: Math.max(insets.bottom, 12) + 60 // Lifted above tab bar (approx 60px)
        }]}>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? theme.bg : '#f1f5f9' }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message..."
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text }]}
              multiline
            />
          </View>
          <Pressable
            style={[styles.sendBtn, !text.trim() && { opacity: 0.5 }]}
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <LinearGradient colors={['#ec4899', '#e11d48']} style={styles.sendGrad}>
              <Ionicons name="send" size={18} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 8, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginLeft: -5 },
  headerUser: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  headerText: { marginLeft: 10 },
  headerName: { fontSize: 16, fontWeight: '900' },
  headerStatus: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  dateHeaderContainer: { alignItems: 'center', marginVertical: 15 },
  dateHeaderBadge: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  dateHeaderText: { fontSize: 9, fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },

  bubbleWrapper: { width: '100%', marginVertical: 3, flexDirection: 'row' },
  bubbleWrapperMine: { justifyContent: 'flex-end' },
  bubbleWrapperOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: width * 0.78, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  bubbleMine: { elevation: 2 },
  bubbleOther: { elevation: 1 },
  messageText: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
  bubbleFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 3 },
  timeText: { fontSize: 9, fontWeight: '800' },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  inputContainer: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100 },
  input: { fontSize: 15, fontWeight: '500', paddingTop: 2, paddingBottom: 2 },
  sendBtn: { marginLeft: 10, marginBottom: 2 },
  sendGrad: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  listHeader: { padding: 24 },
  listTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  searchBox: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500' },
  convItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  convInfo: { flex: 1, marginLeft: 16, borderBottomWidth: 1, paddingBottom: 15 },
  convRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 16, fontWeight: '800' },
  convTime: { fontSize: 11, fontWeight: '600' },
  convLast: { fontSize: 13, marginTop: 4, flex: 1, marginRight: 8 },
  badge: { backgroundColor: '#db2777', minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, elevation: 2 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' }
});
