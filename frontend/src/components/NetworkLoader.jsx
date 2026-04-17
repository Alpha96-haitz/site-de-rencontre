import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkLoader() {
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    const start = () => setActiveRequests(prev => prev + 1);
    const end = () => setActiveRequests(prev => Math.max(0, prev - 1));

    window.addEventListener('api-request-start', start);
    window.addEventListener('api-request-end', end);
    return () => {
      window.removeEventListener('api-request-start', start);
      window.removeEventListener('api-request-end', end);
    };
  }, []);

  return (
    <AnimatePresence>
      {activeRequests > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.5 } }}
          className="fixed top-0 left-0 right-0 z-[10000] h-[3px] pointer-events-none"
        >
          <motion.div 
            initial={{ width: '0%', opacity: 1 }}
            animate={{ width: '90%' }}
            transition={{ duration: 8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 shadow-[0_0_15px_rgba(244,63,94,0.6)]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
