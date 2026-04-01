import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiSend, FiImage, FiMoreVertical, FiChevronLeft, FiCheck, FiCheckCircle } from 'react-icons/fi';
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
  const messagesEndRef = useRef(null);
  const socket = getSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Charger la liste des conversations
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
  }, []);

  // Charger l'historique des messages et rejoindre la salle
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
        
        // Trouver le match actuel dans la liste
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
    socket?.emit('message:read', matchId);

    return () => {
      socket?.emit('leave:match', matchId);
    };
  }, [matchId, socket, conversations]);

  // Écouter les nouveaux messages
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

    socket.emit('message:send', {
      matchId,
      content: text
    });
    setText('');
  };

  if (loading && matchId) return <div className="flex-1 flex items-center justify-center">Chargement...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Sidebar Conversations */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-slate-100 flex flex-col ${matchId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
             <div className="p-8 text-center text-slate-400">
               <p className="font-bold">Pas encore d'amis ?</p>
               <Link to="/home/discover" className="text-pink-600 text-xs font-black uppercase mt-2 block">C'est par ici !</Link>
             </div>
          ) : (
            conversations.map(c => {
               const other = c.users.find(u => u._id !== user._id);
               const otherAvatar = other?.photos?.find(p => p.isPrimary)?.url || other?.googlePhoto || 'https://placehold.co/150';
               return (
                 <Link 
                   key={c._id} 
                   to={`/home/messages/${c._id}`}
                   className={`flex items-center gap-3 p-4 hover:bg-slate-50 transition-all border-b border-slate-50 ${matchId === c._id ? 'bg-pink-50/30' : ''}`}
                 >
                   <div className="relative">
                     <img src={otherAvatar} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm" />
                     {other?.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>}
                   </div>
                   <div className="min-w-0">
                     <p className="font-bold text-slate-800 truncate">{other?.firstName} {other?.lastName}</p>
                     <p className="text-xs text-slate-400 truncate font-medium">Cliquer pour discuter...</p>
                   </div>
                 </Link>
               );
            })
          )}
        </div>
      </div>

      {/* Zone de Chat */}
      {matchId ? (
        <div className="flex-1 flex flex-col relative bg-slate-50/30">
          {/* Header Chat */}
          <div className="h-16 flex items-center justify-between px-4 bg-white border-b border-slate-100 shadow-sm z-10">
            <div className="flex items-center gap-3">
              <Link to="/home/messages" className="md:hidden p-2 text-slate-500"><FiChevronLeft /></Link>
              <div className="flex items-center gap-3">
                <img 
                  src={currentMatch?.users?.find(u => u._id !== user._id)?.photos?.find(p => p.isPrimary)?.url || 'https://placehold.co/150'} 
                  alt="" 
                  className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-sm"
                />
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight">
                    {currentMatch?.users?.find(u => u._id !== user._id)?.firstName}
                  </h3>
                  <p className="text-[10px] uppercase font-black tracking-widest text-green-500">En ligne</p>
                </div>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><FiMoreVertical /></button>
          </div>

          {/* Liste des Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {messages.map((m, i) => {
               const isMe = m.sender._id === user._id || m.sender === user._id;
               return (
                 <div key={m._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                   <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe ? 'bg-pink-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                      <p className="text-[15px] leading-relaxed">{m.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end text-pink-200' : 'text-slate-300'}`}>
                        <span className="text-[9px] font-bold uppercase tracking-tighter">{format(new Date(m.createdAt), 'HH:mm')}</span>
                        {isMe && <FiCheckCircle className="w-2.5 h-2.5" />}
                      </div>
                   </div>
                 </div>
               );
             })}
             <div ref={messagesEndRef} />
          </div>

          {/* Formulaire d'envoi */}
          <div className="p-4 bg-white border-t border-slate-100">
            <form onSubmit={handleSend} className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-pink-200 transition-all">
              <button type="button" className="text-slate-400 hover:text-pink-500"><FiImage className="w-5 h-5" /></button>
              <input 
                type="text" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Votre message..."
                className="flex-1 bg-transparent border-none outline-none py-2 text-slate-700 font-medium"
              />
              <button type="submit" disabled={!text.trim()} className="bg-pink-600 text-white p-2 rounded-xl shadow-lg shadow-pink-100 disabled:opacity-50 active:scale-90 transition-all">
                <FiSend className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-400 bg-slate-50/30">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-100 border-2 border-slate-50">
             <FiMessageCircle className="w-8 h-8 text-pink-500 opacity-50" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Vos Conversations</h2>
          <p className="max-w-xs text-center text-sm font-medium">Sélectionnez une discussion à gauche pour commencer à discuter avec vos nouveaux amis.</p>
        </div>
      )}
    </div>
  );
}
