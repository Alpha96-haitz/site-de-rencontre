import React from 'react';
import { FiX, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function MatchModal({ match, onClose }) {
  if (!match) return null;

  const otherUser = match.users?.find(u => u._id !== localStorage.getItem('userId')) || match.users?.[0];
  const userPhoto = localStorage.getItem('userPhoto') || 'https://placehold.co/150';
  const otherPhoto = otherUser?.photos?.find(p => p.isPrimary)?.url || otherUser?.googlePhoto || 'https://placehold.co/150';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        />

        {/* Content */}
        <motion.div 
          initial={{ scale: 0.5, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 100 }}
          className="relative bg-gradient-to-b from-slate-900 to-black w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl border border-white/10 p-8 text-center"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 mb-2 italic tracking-tighter">
              C'est un Match !
            </h2>
            <p className="text-white/60 font-medium mb-10 text-sm">Vous et {otherUser?.firstName} vous plaisez mutuellement.</p>
          </motion.div>

          <div className="flex items-center justify-center gap-4 mb-12">
            <motion.div 
              initial={{ x: -50, rotate: -20, opacity: 0 }}
              animate={{ x: 20, rotate: -10, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl"
            >
              <img src={userPhoto} alt="Me" className="w-full h-full object-cover" />
            </motion.div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="z-10 bg-white p-3 rounded-full shadow-xl"
            >
              <FiHeart className="w-8 h-8 text-rose-500 fill-current animate-pulse" />
            </motion.div>

            <motion.div 
              initial={{ x: 50, rotate: 20, opacity: 0 }}
              animate={{ x: -20, rotate: 10, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl"
            >
              <img src={otherPhoto} alt={otherUser?.firstName} className="w-full h-full object-cover" />
            </motion.div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = `/home/messages?user=${otherUser?._id}`}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-2xl font-black shadow-lg shadow-pink-900/20 flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
            >
              <FiMessageCircle className="w-5 h-5" /> Envoyer un message
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-white/5 text-white/80 rounded-2xl font-bold hover:bg-white/10 transition-all"
            >
              Continuer à naviguer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
