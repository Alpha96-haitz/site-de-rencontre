import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSend, FiImage, FiMoreVertical, FiChevronLeft, FiCheck, FiCheckCircle, FiMessageCircle, FiSearch, FiPlus, FiSmile, FiMic, FiPhone, FiVideo, FiFilter, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { getSocket } from '../socket/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Messages() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const socket = getSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('user');
    
    if (userId) {
      const initChat = async () => {
        try {
          const { data } = await client.get(`/messages/user/${userId}`);
          if (data._id) {
            navigate(`/home/messages/${data._id}`, { replace: true });
          }
        } catch (err) {
          toast.error("Erreur d'initialisation du chat");
        }
      };
      initChat();
    }
  }, [location.search, navigate]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await client.get('/messages/conversations');
        setConversations(data);
      } catch (err) {
        toast.error("Erreur chargement conversations");
      }
    };
    fetchConversations();
    
    if (socket) {
      const handleMsgUpdate = () => fetchConversations();
      socket.on('message:received', handleMsgUpdate);
      socket.on('message:unread-update', handleMsgUpdate);
      return () => {
        socket.off('message:received', handleMsgUpdate);
        socket.off('message:unread-update', handleMsgUpdate);
      };
    }
  }, [socket]);

  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      return;
    }
    
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await client.get(`/messages/${matchId}`);
        setMessages(data);
        
        await client.put(`/messages/${matchId}/read`);
        setConversations(prev => prev.map(c => 
          c._id === matchId ? { ...c, unreadCount: 0 } : c
        ));

        const match = conversations.find(c => c._id === matchId);
        if (match) setCurrentMatch(match);
        else {
           const {data: matchData} = await client.get(`/matches/${matchId}`);
           setCurrentMatch(matchData);
        }
      } catch (err) {
        toast.error("Impossible de charger la conversation");
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 50);
      }
    };

    fetchMessages();
    socket?.emit('join:match', matchId);
    return () => {
      socket?.emit('leave:match', matchId);
    };
  }, [matchId, socket]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      if (msg.match === matchId) {
        setMessages(prev => [...prev, msg]);
        setTimeout(scrollToBottom, 50);
      }
    };
    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [socket, matchId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('message:send', { matchId, content: text });
    setText('');
  };

  const handleDeleteChat = async () => {
    if (!window.confirm("Supprimer cette conversation ?")) return;
    try {
      await client.delete(`/messages/${matchId}`);
      toast.success("Discussion supprimée");
      navigate('/home/messages');
      setConversations(prev => prev.filter(c => c._id !== matchId));
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (filter === 'unread') return c.unreadCount > 0;
    return true;
  });

  if (loading && matchId) return <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400">Chargement...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white font-sans">
      {/* Sidebar - WhatsApp Style (Light) */}
      <div className={`w-full md:w-[400px] flex-shrink-0 border-r border-slate-100 flex flex-col ${matchId ? 'hidden md:flex' : 'flex'}`}>
        {/* Header Sidebar */}
        <div className="p-4 bg-slate-50/80 flex items-center justify-between text-slate-600">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Discussions</h2>
          <div className="flex items-center gap-4 text-xl">
             <button className="hover:bg-pink-50 p-2 rounded-full transition-all text-pink-600 font-black border border-slate-200/50 flex items-center justify-center bg-white shadow-sm">
               <FiPlus />
             </button>
             <button className="hover:bg-slate-100 p-2 rounded-full transition-all text-slate-400 border border-slate-200/50 flex items-center justify-center bg-white shadow-sm">
               <FiMoreVertical />
             </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="p-2 space-y-2 border-b border-slate-50">
           <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Rechercher ou démarrer une discussion" 
                className="w-full bg-slate-100/80 rounded-2xl pl-12 pr-4 py-2 text-sm text-slate-700 focus:outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all border border-transparent focus:border-pink-200"
              />
           </div>
           <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide px-1">
              <button 
                onClick={() => setFilter('all')} 
                className={`px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-tighter transition-all border ${filter === 'all' ? 'bg-pink-600 text-white border-pink-700 shadow-lg shadow-pink-100' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
              >
                Toutes
              </button>
              <button 
                onClick={() => setFilter('unread')} 
                className={`px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-tighter transition-all border relative ${filter === 'unread' ? 'bg-pink-600 text-white border-pink-700 shadow-lg shadow-pink-100' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
              >
                Non lues {conversations.some(c => c.unreadCount > 0) && <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center border-2 border-white font-black">{conversations.filter(c => c.unreadCount > 0).length}</span>}
              </button>
              <button className="px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-tighter bg-white text-slate-500 border-slate-100 hover:bg-slate-50 transition-all">Favoris</button>
           </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {filteredConversations.length === 0 ? (
             <div className="p-12 text-center text-slate-300">
               <FiMessageCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p className="text-sm font-bold uppercase tracking-widest">Aucune discussion</p>
             </div>
          ) : (
            filteredConversations.map(c => {
               const other = c.users.find(u => u._id !== user._id);
               const otherAvatar = other?.photos?.find(p => p.isPrimary)?.url || other?.googlePhoto || 'https://placehold.co/150';
               const isActive = matchId === c._id;
               return (
                 <Link 
                   key={c._id} 
                   to={`/home/messages/${c._id}`}
                   className={`flex items-center gap-3 p-4 transition-all hover:bg-slate-50 relative group ${isActive ? 'bg-pink-50/50' : ''}`}
                 >
                   <div className="relative">
                      <img src={otherAvatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform" />
                      {other?.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>}
                   </div>
                   <div className="flex-1 min-w-0 border-b border-slate-50 pb-1 group-hover:border-pink-100 transition-colors">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="text-slate-800 text-[15px] font-black truncate">{other?.firstName} {other?.lastName}</h3>
                        <span className={`text-[11px] font-black ${c.unreadCount > 0 ? 'text-pink-600 animate-pulse' : 'text-slate-400'}`}>
                          {c.updatedAt ? format(new Date(c.updatedAt), 'HH:mm') : '--:--'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center px-0.5">
                        <p className={`text-[13px] truncate flex-1 leading-tight ${c.unreadCount > 0 ? 'text-pink-600 font-black' : 'text-slate-400 font-medium'}`}>
                          {c.unreadCount > 0 ? <span className="bg-pink-50 px-1 rounded mr-1">Nouveau(x)</span> : ''}
                          Cliquez pour discuter...
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="bg-pink-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ml-2 shadow-lg shadow-pink-100">{c.unreadCount}</span>
                        )}
                      </div>
                   </div>
                   {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-600"></div>}
                 </Link>
               );
            })
          )}
        </div>
      </div>

      {/* Chat Area - WhatsApp Style (Light) */}
      {matchId ? (
        <div className="flex-1 flex flex-col relative bg-slate-50">
          {/* Subtle Doodle Background (Light Opacity) */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-pink-100/10" style={{backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px'}}></div>
          
          {/* Chat Header */}
          <div className="h-16 flex-shrink-0 flex items-center justify-between px-4 bg-white z-10 border-b border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <Link to="/home/messages" className="md:hidden p-2 text-slate-400 hover:text-pink-600"><FiChevronLeft /></Link>
              <img 
                src={currentMatch?.users?.find(u => u._id !== user._id)?.photos?.find(p => p.isPrimary)?.url || 'https://placehold.co/150'} 
                alt="" 
                className="w-10 h-10 rounded-full object-cover border border-slate-100"
              />
              <div className="min-w-0">
                <h3 className="font-black text-slate-800 text-[15px] truncate leading-tight">
                  {currentMatch?.users?.find(u => u._id !== user._id)?.firstName} {currentMatch?.users?.find(u => u._id !== user._id)?.lastName}
                </h3>
                <div className="flex items-center gap-1.5">
                   <div className={`w-2 h-2 rounded-full ${currentMatch?.users?.find(u => u._id !== user._id)?.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                   <p className={`text-[10px] font-black uppercase tracking-widest ${currentMatch?.users?.find(u => u._id !== user._id)?.isOnline ? 'text-green-500' : 'text-slate-400'}`}>
                      {currentMatch?.users?.find(u => u._id !== user._id)?.isOnline ? 'en ligne' : 'hors ligne'}
                   </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <button className="flex items-center gap-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-black py-1.5 px-3 rounded-xl border border-pink-100 transition-all shadow-sm shadow-pink-50">
                  <FiVideo className="text-sm" /> Appeler <FiChevronLeft className="rotate-[270deg] ml-0.5 opacity-50" />
               </button>
               <div className="w-[1px] h-6 bg-slate-100 mx-1"></div>
               <button className="hover:bg-slate-50 p-2 rounded-full transition-all text-slate-400 hover:text-slate-600 text-lg"><FiSearch /></button>
               <button onClick={handleDeleteChat} className="hover:bg-rose-50 p-2 rounded-full transition-all text-slate-400 hover:text-rose-600 text-lg"><FiTrash2 /></button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 md:px-20 custom-scrollbar relative z-10">
             <div className="flex justify-center mb-10 sticky top-0 z-20">
                <span className="bg-white/80 backdrop-blur border border-slate-100 text-slate-400 text-[10px] px-4 py-1.5 rounded-full uppercase font-black tracking-widest shadow-sm">Maintenant</span>
             </div>
             
             <div className="space-y-1.5">
               {messages.map((m, i) => {
                 const isMe = m.sender._id === user._id || m.sender === user._id;
                 const prevMsg = messages[i-1];
                 const isFirstInGroup = !prevMsg || prevMsg.sender !== m.sender;
                 
                 return (
                   <div key={m._id || i} className={`flex ${isMe ? 'justify-start text-left' : 'justify-end text-right'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`relative max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${isMe ? 'bg-pink-600 text-white rounded-tl-none shadow-lg shadow-pink-100' : 'bg-white text-slate-800 rounded-tr-none border border-slate-100'}`}>
                          {/* Triangle tip */}
                          {isFirstInGroup && (
                            <div className={`absolute top-0 w-3 h-3 ${isMe ? '-left-2 text-pink-600' : '-right-2 text-white'}`}>
                               <svg viewBox="0 0 8 13" preserveAspectRatio="none" className="w-full h-full"><path d={isMe ? "M6.467 3.568L0 12.193V1h5.188C6.958 1 7.526 2.156 6.467 3.568z" : "M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"} fill="currentColor"></path></svg>
                            </div>
                          )}
                          <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-start -ml-1' : 'justify-end -mr-1'}`}>
                            {isMe && <FiCheckCircle className="w-3 h-3 text-pink-200" />}
                            <span className={`text-[9px] font-black uppercase tracking-tighter ${isMe ? 'text-pink-200' : 'text-slate-300'}`}>{format(new Date(m.createdAt), 'HH:mm')}</span>
                          </div>
                      </div>
                   </div>
                 );
               })}
             </div>
             <div ref={messagesEndRef} className="h-6" />
          </div>

          {/* Input Bar (Light) */}
          <div className="p-3 bg-white flex items-center gap-2 z-10 border-t border-slate-100 shadow-2xl">
            <div className="flex items-center flex-shrink-0">
               <button className="p-2.5 text-slate-400 hover:text-pink-600 hover:bg-slate-50 rounded-full transition-all text-xl"><FiPlus /></button>
               <button className="p-2.5 text-slate-400 hover:text-pink-600 hover:bg-slate-50 rounded-full transition-all text-xl"><FiSmile /></button>
            </div>
            <form onSubmit={handleSend} className="flex-1">
               <input 
                type="text" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Écrivez un message..."
                className="w-full bg-slate-100/50 text-slate-700 rounded-2xl px-5 py-3 text-sm focus:outline-none placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-pink-50 transition-all border border-transparent focus:border-pink-200 font-medium"
              />
            </form>
            <div className="flex items-center px-1 flex-shrink-0">
               {text.trim() ? (
                 <button onClick={handleSend} className="bg-pink-600 text-white p-3 rounded-2xl shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-all text-xl border border-pink-700">
                   <FiSend className="w-5 h-5" />
                 </button>
               ) : (
                 <button className="p-2.5 text-slate-400 hover:text-pink-600 hover:bg-slate-50 rounded-full transition-all text-xl">
                   <FiMic />
                 </button>
               )}
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-white border-b-4 border-pink-600 px-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-50 rounded-full -mr-48 -mt-48 opacity-50 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-50 rounded-full -ml-48 -mb-48 opacity-50 blur-3xl"></div>
          
          <div className="w-56 h-56 mb-12 relative">
             <div className="absolute inset-0 bg-pink-100 rounded-full animate-ping opacity-20"></div>
             <div className="relative w-full h-full bg-white rounded-full shadow-2xl flex items-center justify-center border border-pink-50">
                <FiMessageCircle className="w-24 h-24 text-pink-600" />
             </div>
          </div>
          <h2 className="text-4xl font-black text-slate-800 mb-4 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Haitz Messenger</h2>
          <p className="max-w-md text-center text-lg text-slate-500 font-medium leading-relaxed">
            Commencez à discuter avec vos amis en temps réel.<br/>
            Partagez vos moments favoris avec élégance.
          </p>
          <div className="mt-28 flex items-center gap-3 text-[10px] opacity-60 font-black tracking-[0.2em] uppercase text-slate-400 bg-slate-50 px-6 py-2.5 rounded-full border border-slate-100">
             <FiCheckCircle className="text-pink-600" /> Chiffré et sécurisé
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
