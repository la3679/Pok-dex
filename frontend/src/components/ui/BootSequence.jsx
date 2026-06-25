import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function BootSequence({ onComplete }) {
  const [stage, setStage] = useState(0);
  const [shouldBoot, setShouldBoot] = useState(false);

  useEffect(() => {
    // Only boot once per session
    const hasBooted = sessionStorage.getItem('pokedexBooted');
    if (hasBooted) {
      if (onComplete) onComplete();
      return;
    }
    
    setShouldBoot(true);
    
    const sequence = async () => {
      // 0: Initial black screen (fast)
      await new Promise(r => setTimeout(r, 100));
      setStage(1); // 1: Power on & Radar
      await new Promise(r => setTimeout(r, 700));
      setStage(2); // 2: Loading Data & Progress
      await new Promise(r => setTimeout(r, 600));
      setStage(3); // 3: Fade out
      
      sessionStorage.setItem('pokedexBooted', 'true');
      if (onComplete) onComplete();
    };
    
    sequence();
  }, [onComplete]);

  if (!shouldBoot) return null;

  return (
    <AnimatePresence>
      {stage < 3 && (
        <motion.div
          className="boot-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Radar background */}
          <div className="boot-screen__radar" />
          
          {stage >= 1 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}
            >
              <div className="boot-screen__orb" />
              
              <h1 style={{ fontFamily: 'DM Mono, monospace', fontSize: '1.4rem', letterSpacing: '0.2em', color: '#f0f0f0', margin: 0 }}>
                SYSTEM ONLINE
              </h1>
              
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: '#88929b', marginTop: '0.5rem' }}>
                {stage === 1 ? 'SCANNING ENVIRONMENT...' : 'LOADING FIELD DATA...'}
              </p>
              
              {stage >= 2 && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '14rem' }}
                    transition={{ duration: 0.5, ease: "linear" }}
                    style={{
                      height: '3px',
                      backgroundColor: '#4ade80',
                      boxShadow: '0 0 10px #4ade80'
                    }}
                  />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: '#4ade80', marginTop: '0.5rem', fontWeight: 'bold' }}
                  >
                    DEX READY
                  </motion.p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
