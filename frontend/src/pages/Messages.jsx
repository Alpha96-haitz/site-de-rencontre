import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSend, FiMoreVertical, FiChevronLeft, FiCheckCircle, FiMessageCircle, FiSearch, FiPlus, FiSmile, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { getSocket } from '../socket/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

// --- SOUS-COMPOSANTS MÉMOÏSÉS POUR LA PERFORMANCE ---

const MessageItem = memo(({ msg, isMe, isFirstInGroup, currentUserId }) => {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`relative max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${isMe ? 'bg-pink-600 text-white rounded-tr-none shadow-lg shadow-pink-100' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
        {isFirstInGroup && (
          <div className={`absolute top-0 w-3 h-3 ${isMe ? '-right-2 text-pink-600' : '-left-2 text-white'}`}>
            <svg viewBox="0 0 8 13" preserveAspectRatio="none" className="w-full h-full">
              <path d={isMe ? 'M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z' : 'M6.467 3.568L0 12.193V1h5.188C6.958 1 7.526 2.156 6.467 3.568z'} fill="currentColor"></path>
            </svg>
          </div>
        )}
        <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end -mr-1' : 'justify-start -ml-1'}`}>
          {msg.isOptimistic ? (
            <span className={`text-[9px] font-black uppercase tracking-tighter animate-pulse ${isMe ? 'text-pink-200' : 'text-slate-400'}`}>
              Envoi...
            </span>
          ) : (
            <>
              {isMe && <FiCheckCircle className="w-3 h-3 text-pink-200" />}
              <span className={`text-[9px] font-black uppercase tracking-tighter ${isMe ? 'text-pink-200' : 'text-slate-300'}`}>
                {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : '--:--'}
              </span>
            </>
          )}
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
      className={`flex items-center gap-3 p-4 transition-all hover:bg-slate-50 relative group ${isActive ? 'bg-pink-50/50' : ''}`}
    >
      <div className="relative">
        <img src={otherAvatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform" loading="lazy" />
        {other?.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>}
      </div>
      <div className="flex-1 min-w-0 border-b border-slate-50 pb-1 group-hover:border-pink-100 transition-colors">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className="text-slate-800 text-[15px] font-black truncate">{other?.firstName} {other?.lastName}</h3>
          <span className={`text-[11px] font-black ${c.unreadCount > 0 ? 'text-pink-600 animate-pulse' : 'text-slate-400'}`}>
            {timeBase ? format(new Date(timeBase), 'HH:mm') : '--:--'}
          </span>
        </div>
        <div className="flex justify-between items-center px-0.5">
          <p className={`text-[13px] truncate flex-1 leading-tight ${c.unreadCount > 0 ? 'text-pink-600 font-black' : 'text-slate-400 font-medium'}`}>
            {c.unreadCount > 0 ? <span className="bg-pink-50 px-1 rounded mr-1">Nouveau(x)</span> : ''}
            {preview}
          </p>
          {c.unreadCount > 0 && (
            <span className="bg-pink-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ml-2 shadow-lg shadow-pink-100">
              {c.unreadCount}
            </span>
          )}
        </div>
      </div>
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-600"></div>}
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
  const socket = getSocket();

  const scrollToBottom = useCallback((instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
  }, []);

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

  // Fetch conversations list once and on socket events
  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await client.get('/messages/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Conv error:', err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    if (socket) {
      const update = () => fetchConversations();
      socket.on('message:received', update);
      socket.on('message:unread-update', update);
      socket.on('match:new', update);
      return () => {
        socket.off('message:received', update);
        socket.off('message:unread-update', update);
        socket.off('match:new', update);
      };
    }
  }, [socket, fetchConversations]);

  // Load chat messages
  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      return;
    }

    const fetchChatData = async () => {
      setLoading(true);
      try {
        const [msgsRes, matchRes] = await Promise.all([
          client.get(`/messages/${matchId}?limit=50&page=1`),
          client.get(`/matches/${matchId}`)
        ]);
        
        setMessages(msgsRes.data);
        setCurrentMatch(matchRes.data);

        // Mark as read in parallel (don't block UI)
        client.put(`/messages/${matchId}/read`).then(() => {
          client.get('/messages/unread-count').then(({ data }) => {
            window.dispatchEvent(new CustomEvent('message:read', { detail: { count: data.count || 0 } }));
          });
        });

      } catch (err) {
        toast.error('Erreur chargement messages');
      } finally {
        setLoading(false);
        setTimeout(() => scrollToBottom(true), 100);
      }
    };

    fetchChatData();
    socket?.emit('join:match', matchId);
    return () => socket?.emit('leave:match', matchId);
  }, [matchId, socket, scrollToBottom]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket || !matchId) return;

    const onNew = (msg) => {
      if (msg.match === matchId) {
        setMessages((prev) => {
          const exists = prev.some(m => m._id === msg._id || (msg.clientTempId && m._id === msg.clientTempId));
          if (exists && !msg.clientTempId) return prev;
          
          if (msg.clientTempId) {
            return prev.map(m => m._id === msg.clientTempId ? msg : m);
          }
          return [...prev, msg];
        });
        setTimeout(() => scrollToBottom(), 50);
      }
    };

    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
  }, [socket, matchId, scrollToBottom]);

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
      const matchSearch = !query || 
        `${other.firstName} ${other.lastName}`.toLowerCase().includes(query) || 
        other.username?.toLowerCase().includes(query) ||
        c.lastMessage?.content?.toLowerCase().includes(query);

      if (!matchSearch) return false;
      return filter === 'unread' ? c.unreadCount > 0 : true;
    });
  }, [conversations, searchTerm, filter, currentUserId]);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white font-sans">
      
      {/* Sidebar - Conversations */}
      <div className={`w-full md:w-[400px] flex-shrink-0 border-r border-slate-100 flex flex-col ${matchId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 bg-slate-50/80 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Discussions</h2>
        </div>

        <div className="p-2 space-y-2 border-b border-slate-50">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-slate-100/80 rounded-2xl pl-12 pr-4 py-2 text-sm focus:ring-2 focus:ring-pink-100 transition-all outline-none"
            />
          </div>
          <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase transition-all ${filter === 'all' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Toutes</button>
            <button onClick={() => setFilter('unread')} className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase transition-all ${filter === 'unread' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Non lues</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.map(c => (
            <ConversationItem key={c._id} c={c} matchId={matchId} currentUserId={currentUserId} />
          ))}
          {filteredConversations.length === 0 && (
            <div className="p-12 text-center text-slate-300 italic text-sm">Aucune discussion trouvée.</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {matchId ? (
        <div className="flex-1 flex flex-col relative bg-slate-50">
          {/* Header */}
          <div className="h-16 flex-shrink-0 flex items-center justify-between px-4 bg-white z-10 border-b border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <Link to="/home/messages" className="md:hidden p-2 text-slate-400"><FiChevronLeft /></Link>
              <img src={currentMatch?.users?.find(u => u._id !== currentUserId)?.photos?.find(p => p.isPrimary)?.url || 'https://placehold.co/150'} className="w-10 h-10 rounded-full object-cover" alt="" />
              <div>
                <h3 className="font-bold text-slate-800 text-[15px] truncate">{currentMatch?.users?.find(u => u._id !== currentUserId)?.firstName}</h3>
                <p className="text-[10px] font-black uppercase text-green-500 tracking-widest">{currentMatch?.users?.find(u => u._id !== currentUserId)?.isOnline ? 'en ligne' : ''}</p>
              </div>
            </div>
            <button onClick={async () => {
               if(window.confirm("Supprimer?")) {
                 await client.delete(`/messages/${matchId}`);
                 navigate('/home/messages');
                 fetchConversations();
               }
            }} className="p-2 text-slate-400 hover:text-rose-600"><FiTrash2 /></button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {messages.map((m, i) => (
              <MessageItem 
                key={m._id || i} 
                msg={m} 
                isMe={m.sender?._id === currentUserId || m.sender === currentUserId} 
                isFirstInGroup={i === 0 || (messages[i-1].sender?._id || messages[i-1].sender) !== (m.sender?._id || m.sender)}
                currentUserId={currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 z-10 shadow-2xl">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-slate-100 rounded-2xl px-5 py-3 text-sm focus:ring-4 focus:ring-pink-50 transition-all outline-none"
              />
              <button disabled={!text.trim()} type="submit" className="bg-pink-600 text-white p-3 rounded-2xl shadow-lg disabled:opacity-50">
                <FiSend className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-white text-slate-400">
           <FiMessageCircle className="w-20 h-20 mb-4 opacity-10" />
           <p className="font-bold uppercase tracking-widest text-xs">Sélectionnez une discussion pour commencer</p>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
