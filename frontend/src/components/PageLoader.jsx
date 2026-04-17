import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

export default function PageLoader({ label = 'Haitz' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative">
         <motion.div
           animate={{ 
             scale: [1, 1.05, 1],
             opacity: [0.8, 1, 0.8]
           }}
           transition={{
             duration: 2,
             repeat: Infinity,
             ease: "easeInOut"
           }}
           className="relative z-10"
         >
           <img src={logo} alt="HAITZ" className="h-20 object-contain drop-shadow-2xl" />
         </motion.div>
         
         {/* Decorative Glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-pink-500/20 blur-[60px] rounded-full animate-pulse" />
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        {/* Modern Loader Bar */}
        <div className="w-40 h-[3px] bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
           <motion.div 
             initial={{ left: '-100%' }}
             animate={{ left: '100%' }}
             transition={{ 
               repeat: Infinity, 
               duration: 1.8, 
               ease: "linear" 
             }}
             className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"
           />
        </div>
        
        {/* Loading Text */}
        <div className="overflow-hidden">
           <motion.p 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] translate-x-[0.2em]"
           >
             Chargement
           </motion.p>
        </div>
      </div>
    </div>
  );
}
