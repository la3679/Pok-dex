import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function BootSequence({ onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const sequence = async () => {
      // 0: Initial black screen
      await new Promise(r => setTimeout(r, 400));
      setStage(1); // 1: Logo and text appears
      await new Promise(r => setTimeout(r, 1200));
      setStage(2); // 2: Loading bar fills
      await new Promise(r => setTimeout(r, 800));
      setStage(3); // 3: Fade out
      await new Promise(r => setTimeout(r, 500));
      onComplete();
    };
    sequence();
  }, [onComplete]);

  return (
    <AnimatePresence>
      {stage < 3 && (
        <motion.div
          className="boot-sequence"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#101315',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ee4945'
          }}
        >
          {stage >= 1 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div style={{
                width: '6rem',
                height: '6rem',
                borderRadius: '50%',
                background: 'linear-gradient(#ee4945 0 45%, #f1f5f4 46% 53%, #202628 54%)',
                boxShadow: '0 0 0 4px #191d20, 0 0 30px rgba(238, 73, 69, 0.4)',
                marginBottom: '2rem',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute',
                  inset: '1.5rem',
                  borderRadius: '50%',
                  background: '#f1f5f4',
                  boxShadow: '0 0 0 0.3rem #202628'
                }} />
              </div>
              <h1 style={{ fontFamily: 'DM Mono, monospace', fontSize: '1.2rem', letterSpacing: '0.2em', color: '#f1f5f4', margin: 0 }}>
                POKÉDEX OS
              </h1>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: '#9ca8a8', marginTop: '0.5rem' }}>
                SYSTEM INITIALIZATION
              </p>
              
              {stage >= 2 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '12rem' }}
                  transition={{ duration: 0.6, ease: "linear" }}
                  style={{
                    height: '2px',
                    backgroundColor: '#b7d96c',
                    marginTop: '2rem',
                    boxShadow: '0 0 10px #b7d96c'
                  }}
                />
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
