import { useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Search, Plus, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Background from './Background';
import ThemeToggle from './ThemeToggle';
import { LogoMark } from './Logo';
import { Magnetic, RouteProgress } from './fx';

const NAMES: Record<string, string> = {
  dashboard: 'overview', applications: 'applications', environments: 'environments', deployments: 'deployments',
  infrastructure: 'infrastructure', monitoring: 'monitoring', incidents: 'incidents', 'audit-logs': 'audit log', users: 'people',
};

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();
  const page = NAMES[location.pathname.slice(1)] ?? '';

  return (
    <div className="min-h-screen">
      <Background />
      <RouteProgress routeKey={location.pathname} />
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-[276px]">
        <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6">
          <div className="flex h-16 items-center gap-3 rounded-full border border-line glass pl-3 pr-2 backdrop-blur-xl sm:pl-5">
            <button onClick={() => setOpen(true)} className="rounded-full p-2 text-fg-2 hover:bg-surface-2 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <LogoMark className="h-8 w-8 lg:hidden" />

            <div className="hidden items-center gap-2 md:flex">
              <span className="tag">PlatformOps</span>
              <span className="text-fg-3">/</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={page}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="font-display text-[1.05rem] font-bold"
                >
                  {page}
                </motion.span>
              </AnimatePresence>
            </div>

            <label className="ml-auto hidden h-10 w-full max-w-[18rem] items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-fg-3 transition-colors focus-within:border-iris sm:flex">
              <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
              <input type="text" placeholder="search anything…" className="w-full bg-transparent text-[0.875rem] font-medium text-fg placeholder:text-fg-3 focus:outline-none" />
              <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[0.65rem] font-bold">⌘K</kbd>
            </label>

            <div className="ml-auto flex items-center gap-2 sm:ml-0">
              <ThemeToggle />
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-fg-2 transition-colors hover:text-fg" aria-label="Notifications">
                <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-bad ring-2 ring-[var(--surface-solid)]" />
              </button>
              <Magnetic>
                <button className="btn btn-primary">
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">deploy</span>
                </button>
              </Magnetic>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-16 pt-8 sm:px-8 sm:pt-10">
          <div className="mx-auto max-w-[1240px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 30, scale: 0.985, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -16, scale: 0.99, filter: 'blur(8px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
