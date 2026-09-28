import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell, Search, Plus, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { LogoMark } from './Logo';

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
            <button onClick={() => setOpen(true)} className="-ml-1 rounded-full p-2 text-ink-2 hover:bg-card lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <LogoMark className="h-7 w-7 lg:hidden" />

            <label className="group ml-1 hidden h-10 w-full max-w-sm items-center gap-2.5 rounded-full border border-line-2 bg-card px-4 text-ink-3 focus-within:border-ink sm:flex">
              <Search className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <input
                type="text"
                placeholder="Search services, releases, people"
                className="w-full bg-transparent text-[0.9rem] text-ink placeholder:text-ink-3 focus:outline-none"
              />
              <kbd className="hidden rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[0.7rem] text-ink-3 md:block">⌘K</kbd>
            </label>

            <div className="ml-auto flex items-center gap-2">
              <button className="relative rounded-full p-2.5 text-ink-2 hover:bg-card hover:text-ink" aria-label="Notifications">
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-paper bg-signal" />
              </button>
              <button className="btn btn-ink">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New deployment</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-[1240px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
