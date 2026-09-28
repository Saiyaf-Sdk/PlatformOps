import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, Plus, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="app-shell flex" style={{ background: 'rgba(5, 11, 20, 0.5)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: '256px' }}>
        <header
          className="sticky top-0 z-30 border-b border-[rgba(148,163,184,0.08)] px-6 py-3"
          style={{
            background: 'rgba(11, 20, 35, 0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.12)] bg-[rgba(5,11,20,0.62)] px-3 py-2.5 w-full max-w-md">
                <Search className="w-4 h-4 text-[#64748b] shrink-0" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  className="bg-transparent border-none text-sm text-white focus:outline-none w-full placeholder-[#64748b]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,240,255,0.22)] bg-[rgba(0,240,255,0.08)] px-3 py-2 text-sm font-medium text-[#00F0FF] hover:bg-[rgba(0,240,255,0.12)] transition-colors">
                <Plus className="w-4 h-4" />
                New deployment
              </button>
              <button className="relative p-2.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-colors border border-[rgba(148,163,184,0.08)]">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF3366] animate-pulse" />
              </button>
              <div className="h-8 w-px bg-[rgba(148,163,184,0.12)]" />
              <div className="flex items-center gap-3 rounded-xl border border-[rgba(148,163,184,0.08)] bg-[rgba(255,255,255,0.02)] px-2.5 py-1.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    background: 'rgba(123, 44, 191, 0.2)',
                    border: '1px solid rgba(123, 44, 191, 0.4)',
                    color: '#d8b4fe',
                  }}
                >
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white leading-none">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] text-[#475569] mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {user?.role || 'SRE_ADMIN'}
                  </p>
                </div>
                <ArrowUpRight className="hidden md:block w-4 h-4 text-[#64748b]" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
