import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type Tone = 'success' | 'error' | 'info' | 'warn';
interface Toast { id: number; tone: Tone; title: string; body?: string }

const Ctx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {});
let seq = 0;

const ICON = { success: CheckCircle2, error: XCircle, info: Info, warn: AlertTriangle };
const COLOR = { success: 'var(--ok)', error: 'var(--bad)', info: 'var(--sky)', warn: 'var(--warn)' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++seq;
    setToasts((all) => [...all.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), t.tone === 'error' ? 7000 : 4500);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(380px,calc(100vw-2.5rem))] flex-col gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICON[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 40, filter: 'blur(6px)' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="panel glass pointer-events-auto flex items-start gap-3 !rounded-2xl p-4"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: COLOR[t.tone] }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9rem] font-bold">{t.title}</p>
                  {t.body && <p className="mt-0.5 text-[0.82rem] font-medium text-fg-2">{t.body}</p>}
                </div>
                <button onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} className="rounded-full p-1 text-fg-3 hover:text-fg" aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
