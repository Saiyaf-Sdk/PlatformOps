import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { LogoMark } from './Logo';
import { easeInOut } from './motion';

/**
 * One-time (per browser session) opening sequence:
 * logo draws in, a counter runs to 100, then the curtain lifts.
 */
export default function Intro() {
  const [show, setShow] = useState(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      return sessionStorage.getItem('po-intro') !== '1';
    } catch { return false; }
  });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!show) return;
    try { sessionStorage.setItem('po-intro', '1'); } catch { /* ignore */ }
    const c = animate(0, 100, { duration: 1.5, ease: [0.7, 0, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) });
    const t = setTimeout(() => setShow(false), 1850);
    return () => { c.stop(); clearTimeout(t); };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          onClick={() => setShow(false)}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          initial={{ clipPath: 'inset(0 0 0% 0)' }}
          transition={{ duration: 1, ease: easeInOut }}
        >
          <motion.div initial={{ scale: 0.6, opacity: 0, filter: 'blur(12px)' }} animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <LogoMark className="h-16 w-16" />
          </motion.div>
          <div className="mt-8 h-px w-56 overflow-hidden bg-line">
            <motion.div className="h-full origin-left" style={{ background: 'var(--grad)' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, ease: [0.7, 0, 0.3, 1] }} />
          </div>
          <div className="mt-4 flex w-56 justify-between">
            <span className="tag">Warming up the line</span>
            <span className="tag num !text-fg">{String(n).padStart(3, '0')}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
