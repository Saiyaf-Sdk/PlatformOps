import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      onClick={(e) => toggle({ x: e.clientX, y: e.clientY })}
      className={`relative flex h-10 w-[4.25rem] items-center rounded-full border border-line-strong bg-surface p-1 transition-colors ${className}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-ink ${dark ? 'ml-auto' : ''}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {dark ? <Moon className="h-4 w-4" strokeWidth={2.25} /> : <Sun className="h-4 w-4" strokeWidth={2.25} />}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
