import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSend, FiChevronLeft, FiCheckCircle, FiMessageCircle, FiSearch, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { connectSocket } from '../socket/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// --- HELPERS ---
const groupMessagesByDate = (messages) => {
  const groups = [];
  messages.forEach((msg) => {
    const date = new Date(msg.createdAt);
    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    let group = groups.find(g => g.dateStr === dateStr);
    if (!group) {
      group = { dateStr, messages: [] };
      groups.push(group);
    }
    group.messages.push(msg);
  });
  return groups;
};

const formatDateLabel = (dateStr) => {
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  if (dateStr === today) return "Aujourd'hui";
  if (dateStr === yesterday) return "Hier";
  return dateStr;
};

// --- SOUS-COMPOSANTS MÉMOÏSÉS ---

const MessageItem = memo(({ msg, isMe, isFirstInGroup, currentUserId }) => {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-6' : 'mt-1'} group animate-in fade-in slide-in-from-bottom-1 duration-300`}>
      <div className={`relative max-w-[80%] md:max-w-[65%] px-4 py-2.5 rounded-[22px] transition-all duration-200 ${
        isMe 
          ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-tr-none shadow-md shadow-pink-200/50 group-hover:shadow-lg group-hover:-translate-y-0.5' 
          : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5'
      }`}>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
        <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end opacity-80' : 'justify-start opacity-50'}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : '--:--'}
          </span>
          {isMe && !msg.isOptimistic && <FiCheckCircle className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );
});

const ConversationItem = memo(({ c, matchId, currentUserId }) => {
  const other = c.users.find((u) => u._id === currentUserId ? false : true) || c.users[0];
  const otherAvatar = useMemo(() => other?.photos?.find((p) => p.isPrimary)?.url || other?.googlePhoto || 'https://placehold.co/150', [other]);
  const isActive = matchId === c._id;
  const preview = c.lastMessage?.hasImage ? 'Photo' : (c.lastMessage?.content || 'Cliquez pour discuter...');
  const timeBase = c.lastMessage?.createdAt || c.updatedAt;

  return (
    <Link
      to={`/home/messages/${c._id}`}
      className={`flex items-center gap-4 p-4 transition-all relative border-b border-slate-50/50 group ${
        isActive ? 'bg-gradient-to-r from-pink-50 to-white' : 'hover:bg-slate-50'
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className={`absolute -inset-1 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity blur-[2px] ${isActive ? 'opacity-100' : ''}`}></div>
        <img src={otherAvatar} alt="" className="relative w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        {other?.isOnline && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-md"></div>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={`text-[15px] truncate transition-colors ${isActive ? 'text-pink-600 font-black' : 'text-slate-800 font-bold'}`}>
            {other?.firstName} {other?.lastName}
          </h3>
          <span className={`text-[10px] font-black uppercase tracking-tighter ${c.unreadCount > 0 ? 'text-pink-600' : 'text-slate-400'}`}>
            {timeBase ? format(new Date(timeBase), 'HH:mm') : '--:--'}
          </span>
        </div>
        
        <div className="flex justify-between items-center gap-2">
          <p className={`text-[13px] truncate flex-1 leading-tight ${c.unreadCount > 0 ? 'text-pink-600 font-black' : 'text-slate-500 font-medium'}`}>
            {preview}
          </p>
          {c.unreadCount > 0 && (
            <span className="bg-pink-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-pink-200 animate-bounce">
              {c.unreadCount}
            </span>
          )}
        </div>
      </div>
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-600 rounded-r-lg"></div>}
    </Link>
  );
});

export default function Messages() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const currentUserId = (user?._id || user?.id || '').toString();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unread
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useMemo(() => connectSocket({ priority: 'high' }), []);

  const scrollToBottom = useCallback((instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
  }, []);

  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  // Sync session based on URL query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('user')?.trim();
    if (userId && /^[a-fA-F0-9]{24}$/.test(userId)) {
      client.get(`/messages/user/${userId}`).then(({ data }) => {
        if (data._id) navigate(`/home/messages/${data._id}`, { replace: true });
      }).catch(() => toast.error("Erreur d'accès à la conversation"));
    }
  }, [location.search, navigate]);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await client.get('/messages/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Conv error:', err);
    }
  }, []);

  const syncMessages = useCallback(async () => {
    if (!matchId) return;
    try {
      const { data } = await client.get(`/messages/${matchId}?limit=50&page=1`);
      setMessages(data);
      setTimeout(() => scrollToBottom(), 50);
    } catch (err) {
      console.error('Sync error:', err);
    }
  }, [matchId, scrollToBottom]);

  // Initial Load
  useEffect(() => {
    fetchConversations();
    if (matchId) {
      setLoading(true);
      Promise.all([
        client.get(`/messages/${matchId}?limit=50&page=1`),
        client.get(`/matches/${matchId}`)
      ]).then(([msgsRes, matchRes]) => {
        setMessages(msgsRes.data);
        setCurrentMatch(matchRes.data);
        setLoading(false);
        setTimeout(() => scrollToBottom(true), 100);
      });
      client.put(`/messages/${matchId}/read`).catch(() => {});
    }
  }, [matchId, fetchConversations, scrollToBottom]);

  // Unified Socket Listeners
  useEffect(() => {
    if (!socket || !matchId) return;

    const joinRoom = () => socket.emit('join:match', matchId);
    joinRoom();
    socket.on('connect', joinRoom);

    const onConversationUpdate = () => fetchConversations();

    const onNewMessage = (msg) => {
      onConversationUpdate();
      const msgMatchId = String(msg.match || '');
      if (msgMatchId === String(matchId)) {
        setMessages((prev) => {
          const exists = prev.some(m => String(m._id) === String(msg._id) || (msg.clientTempId && String(m._id) === String(msg.clientTempId)));
          if (exists && !msg.clientTempId) return prev;
          if (msg.clientTempId) return prev.map(m => String(m._id) === String(msg.clientTempId) ? msg : m);
          return [...prev, msg];
        });
        syncMessages();
        if (msg.sender?._id !== currentUserId && msg.sender !== currentUserId) {
          client.put(`/messages/${matchId}/read`).catch(() => {});
        }
      }
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:received', onNewMessage);
    socket.on('message:unread-update', onConversationUpdate);
    socket.on('match:new', onConversationUpdate);

    return () => {
      socket.emit('leave:match', matchId);
      socket.off('connect', joinRoom);
      socket.off('message:new', onNewMessage);
      socket.off('message:received', onNewMessage);
      socket.off('message:unread-update', onConversationUpdate);
      socket.off('match:new', onConversationUpdate);
    };
  }, [socket, matchId, currentUserId, fetchConversations, syncMessages, scrollToBottom]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || !matchId) return;
    
    const content = text.trim();
    const tempId = `tmp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      match: matchId,
      sender: { _id: currentUserId },
      content,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    setMessages(p => [...p, optimisticMsg]);
    setText('');
    setTimeout(() => scrollToBottom(), 20);

    try {
      if (socket?.connected) {
        socket.emit('message:send', { matchId, content, clientTempId: tempId });
      } else {
        await client.post(`/messages/${matchId}`, { content, clientTempId: tempId });
      }
    } catch (err) {
      setMessages(p => p.filter(m => m._id !== tempId));
      toast.error('Erreur envoi');
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const other = c.users.find((u) => u._id !== currentUserId) || {};
      const query = searchTerm.toLowerCase();
      const matchSearch = !query || `${other.firstName} ${other.lastName}`.toLowerCase().includes(query) || other.username?.toLowerCase().includes(query);
      return filter === 'unread' ? (c.unreadCount > 0 && matchSearch) : matchSearch;
    });
  }, [conversations, searchTerm, filter, currentUserId]);

  const chatUser = useMemo(() => currentMatch?.users?.find(u => u._id !== currentUserId), [currentMatch, currentUserId]);

  if (loading && matchId) return <div className="flex-1 flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white font-sans selection:bg-pink-100">
      
      {/* Sidebar */}
      <div className={`w-full md:w-[380px] flex-shrink-0 border-r border-slate-100 flex flex-col ${matchId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 pb-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Messages</h2>
          <div className="relative group mb-4">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une personne..."
              className="w-full bg-slate-100/70 border border-transparent rounded-2xl pl-11 pr-4 py-3 text-[14px] focus:bg-white focus:border-pink-200 focus:ring-4 focus:ring-pink-50 transition-all outline-none font-medium"
            />
          </div>
          <div className="flex gap-2 mb-2">
            <button onClick={() => setFilter('all')} className={`flex-1 py-2 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all shadow-sm ${filter === 'all' ? 'bg-pink-600 text-white shadow-pink-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Toutes</button>
            <button onClick={() => setFilter('unread')} className={`flex-1 py-2 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all shadow-sm ${filter === 'unread' ? 'bg-pink-600 text-white shadow-pink-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Non lues</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          {filteredConversations.map(c => (
            <ConversationItem key={c._id} c={c} matchId={matchId} currentUserId={currentUserId} />
          ))}
          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-300 gap-4 mt-10">
              <FiMessageCircle className="w-12 h-12 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest text-center">Aucune discussion</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {matchId ? (
        <div className="flex-1 flex flex-col relative bg-slate-50/50">
          <div className="h-[72px] flex-shrink-0 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-20 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <Link to="/home/messages" className="md:hidden p-2 text-slate-400 hover:text-pink-600 transition-colors"><FiChevronLeft size={24}/></Link>
              <div className="relative">
                <img src={chatUser?.photos?.find(p => p.isPrimary)?.url || 'https://placehold.co/150'} className="w-11 h-11 rounded-full object-cover border-2 border-slate-50 shadow-sm" alt="" />
                {chatUser?.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-slate-900 text-[16px] truncate leading-tight">{chatUser?.firstName} {chatUser?.lastName}</h3>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${chatUser?.isOnline ? 'text-green-500' : 'text-slate-300'}`}>
                  {chatUser?.isOnline ? 'Maintenant en ligne' : 'Hors ligne'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                   if(window.confirm("Voulez-vous supprimer tout l'historique ?")) {
                     await client.delete(`/messages/${matchId}`);
                     navigate('/home/messages');
                     fetchConversations();
                   }
                }} 
                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Supprimer la conversation"
              >
                <FiTrash2 size={18}/>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 custom-scrollbar relative" style={{ backgroundImage: 'radial-gradient(#f1f5f9 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            {messageGroups.map((group) => (
              <div key={group.dateStr} className="space-y-1">
                <div className="flex justify-center my-8">
                  <span className="bg-slate-200/50 backdrop-blur-sm text-slate-500 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                    {formatDateLabel(group.dateStr)}
                  </span>
                </div>
                {group.messages.map((m, i) => (
                  <MessageItem 
                    key={m._id} 
                    msg={m} 
                    isMe={m.sender?._id === currentUserId || m.sender === currentUserId} 
                    isFirstInGroup={i === 0 || (group.messages[i-1].sender?._id || group.messages[i-1].sender) !== (m.sender?._id || m.sender)}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>

          <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-20">
            <form onSubmit={sendMessage} className="flex gap-3 max-w-5xl mx-auto items-end">
              <div className="flex-1 relative">
                <textarea
                  rows="1"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Écrivez votre message..."
                  className="w-full bg-slate-100/70 border border-transparent rounded-[24px] px-6 py-3.5 text-[15px] focus:bg-white focus:border-pink-200 focus:ring-4 focus:ring-pink-50 transition-all outline-none font-medium resize-none min-h-[52px] max-h-[150px] custom-scrollbar"
                />
              </div>
              <button 
                disabled={!text.trim()} 
                type="submit" 
                className="flex-shrink-0 bg-pink-600 hover:bg-pink-700 text-white p-3.5 rounded-full shadow-xl shadow-pink-200 disabled:opacity-40 disabled:shadow-none transition-all active:scale-95 mb-0.5"
              >
                <FiSend className="w-5 h-5 translate-x-0.5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-white">
           <div className="w-64 h-64 bg-slate-50 rounded-full flex items-center justify-center mb-6 relative animate-pulse">
              <FiMessageCircle className="w-24 h-24 text-pink-200" />
              <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-pink-400 rounded-full"></div>
           </div>
           <h3 className="text-xl font-black text-slate-800 mb-2">Vos conversations</h3>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Sélectionnez une discussion pour commencer à discuter</p>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}
