import { useEffect, useId } from 'react';
import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Loader2, X } from 'lucide-react';

/* ── Modal ───────────────────────────────────────────── */
export function Modal({ open, onClose, title, subtitle, children, width = 520 }: {
  open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            data-lenis-prevent
            initial={{ opacity: 0, y: 40, scale: 0.97, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.98, filter: 'blur(6px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="panel beam relative max-h-[92vh] w-full overflow-y-auto !bg-[var(--surface-solid)] p-6 sm:p-8"
            style={{ maxWidth: width }}
          >
            <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
            <h2 className="pr-8 font-display text-[1.9rem] font-extrabold leading-none">{title}</h2>
            {subtitle && <p className="mt-2 text-[0.9rem] font-medium text-fg-2">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ── Form fields ─────────────────────────────────────── */
export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="tag mb-2 block">{label}</label>
      {children(id)}
      {error ? <p className="mt-1.5 text-[0.8rem] font-semibold text-bad">{error}</p>
        : hint ? <p className="mt-1.5 text-[0.78rem] font-medium text-fg-3">{hint}</p> : null}
    </div>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`field ${p.className ?? ''}`} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={`field !h-auto min-h-[88px] py-3 ${p.className ?? ''}`} />
);

export function Select({ className = '', children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`relative ${className}`}>
      <select {...p} className="field h-11 w-full cursor-pointer appearance-none pr-10 text-[0.9rem] font-semibold">{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
    </div>
  );
}

/* ── Segmented control with a sliding pill ───────────── */
export function Segmented<T extends string>({ value, onChange, options, id }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; count?: number }[]; id: string;
}) {
  return (
    <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 backdrop-blur lg:w-auto" data-lenis-prevent>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`relative flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[0.85rem] font-bold transition-colors ${value === o.value ? 'text-primary-ink' : 'text-fg-2 hover:text-fg'}`}>
          {value === o.value && (
            <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-primary shadow-[0_6px_20px_-8px_var(--iris)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
          )}
          <span className="relative">{o.label}</span>
          {o.count !== undefined && <span className={`relative font-mono text-[0.72rem] ${value === o.value ? 'opacity-60' : 'text-fg-3'}`}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ── Feedback ────────────────────────────────────────── */
export const Spinner = ({ className = 'h-4 w-4' }: { className?: string }) => <Loader2 className={`animate-spin ${className}`} />;

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`relative block overflow-hidden rounded-xl bg-surface-2 ${className}`}>
    <motion.span className="absolute inset-0 block -translate-x-full" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in oklab, var(--text) 6%, transparent), transparent)' }}
      animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} />
  </span>;
}

export function EmptyState({ title, body, action }: { title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-16 text-center">
      <p className="font-display text-[2.1rem] font-extrabold leading-none">{title}</p>
      {body && <p className="mt-3 max-w-md font-medium text-fg-3">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-14 text-center">
      <p className="font-display text-[1.8rem] font-extrabold leading-none">couldn’t <span className="grad">LOAD</span> this</p>
      <p className="mt-3 max-w-md font-medium text-fg-3">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn btn-ghost mt-6">try again</button>}
    </div>
  );
}

export function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-4">
      <button className="btn btn-ghost h-9" disabled={page <= 0} onClick={() => onPage(page - 1)}>previous</button>
      <span className="tag">Page {page + 1} of {totalPages}</span>
      <button className="btn btn-ghost h-9" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>next</button>
    </div>
  );
}
