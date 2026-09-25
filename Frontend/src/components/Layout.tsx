import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex" style={{ background: '#050B14' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: '256px' }}>
        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-6 sticky top-0 z-30"
          style={{
            background: 'rgba(11, 20, 35, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0, 240, 255, 0.08)',
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-56"
            style={{
              background: 'rgba(5, 11, 20, 0.6)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <Search className="w-4 h-4 text-[#475569] shrink-0" />
            <input
              type="text"
              placeholder="Search resources..."
              className="bg-transparent border-none text-sm text-white focus:outline-none w-full placeholder-[#475569]"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF3366] rounded-full animate-pulse" />
            </button>
            <div className="h-6 w-px bg-[rgba(255,255,255,0.08)]" />
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                style={{
                  background: 'rgba(123, 44, 191, 0.2)',
                  border: '1px solid rgba(123, 44, 191, 0.4)',
                  color: '#7B2CBF',
                }}
              >
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white leading-none">{user?.name}</p>
                <p className="text-[10px] text-[#475569] mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {user?.role}
                </p>
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
