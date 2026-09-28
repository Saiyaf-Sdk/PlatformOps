import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      onClick={(e) => toggle({ x: e.clientX, y: e.clientY })}
      className="relative flex h-10 w-[4.5rem] items-center rounded-full border border-line-strong bg-surface p-1"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun className={`absolute left-3 h-3.5 w-3.5 transition-opacity ${dark ? 'opacity-40' : 'opacity-0'}`} />
      <Moon className={`absolute right-3 h-3.5 w-3.5 transition-opacity ${dark ? 'opacity-0' : 'opacity-40'}`} />
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 520, damping: 34 }}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-ink shadow-[0_4px_14px_-4px_var(--iris)] ${dark ? 'ml-auto' : ''}`}
      >
        {dark ? <Moon className="h-4 w-4" strokeWidth={2.2} /> : <Sun className="h-4 w-4" strokeWidth={2.2} />}
      </motion.span>
    </button>
  );
}
