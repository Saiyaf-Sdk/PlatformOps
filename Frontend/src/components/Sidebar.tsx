import type { ElementType, ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Boxes, Layers, Rocket, Server, LineChart, Siren, ScrollText, Users, LogOut, Settings2, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

interface NavItemProps {
  to: string;
  icon: ElementType;
  label: string;
  badge?: string;
  onNavigate?: () => void;
}

const NavItem = ({ to, icon: Icon, label, badge, onNavigate }: NavItemProps) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) =>
      `group flex items-center gap-3 rounded-full pl-3 pr-2.5 h-10 text-[0.9rem] transition-colors ${
        isActive ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-card hover:text-ink'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.75} />
        <span className="flex-1">{label}</span>
        {badge && (
          <span className={`chip h-5 px-2 text-[0.7rem] ${isActive ? 'bg-signal text-white' : 'bg-bad-soft text-bad'}`}>
            {badge}
          </span>
        )}
      </>
    )}
  </NavLink>
);

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="px-3 mb-1.5 font-display italic text-[1.05rem] text-ink-3">{label}</p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* mobile scrim */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[264px] flex-col border-r border-line bg-paper-2 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <Logo />
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-2 hover:bg-card lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          <div className="space-y-0.5">
            <NavItem to="/dashboard" icon={LayoutGrid} label="Overview" onNavigate={onClose} />
          </div>
          <Section label="Delivery">
            <NavItem to="/applications" icon={Boxes} label="Applications" onNavigate={onClose} />
            <NavItem to="/environments" icon={Layers} label="Environments" onNavigate={onClose} />
            <NavItem to="/deployments" icon={Rocket} label="Deployments" onNavigate={onClose} />
          </Section>
          <Section label="Operations">
            <NavItem to="/infrastructure" icon={Server} label="Infrastructure" onNavigate={onClose} />
            <NavItem to="/monitoring" icon={LineChart} label="Monitoring" onNavigate={onClose} />
            <NavItem to="/incidents" icon={Siren} label="Incidents" badge="2" onNavigate={onClose} />
          </Section>
          <Section label="Governance">
            <NavItem to="/audit-logs" icon={ScrollText} label="Audit log" onNavigate={onClose} />
            <NavItem to="/users" icon={Users} label="People & access" onNavigate={onClose} />
          </Section>
        </nav>

        {/* status ticket */}
        <div className="mx-3 mb-3 rounded-2xl border border-line bg-card p-3.5">
          <div className="flex items-center gap-2 text-[0.8rem] text-ok">
            <span className="live-dot" />
            <span className="font-medium">All lines running</span>
          </div>
          <p className="mt-1 text-[0.78rem] text-ink-3">
            Uptime <span className="num font-mono text-ink-2">99.98%</span> · ap-south-1
          </p>
        </div>

        <div className="border-t border-line px-3 py-3">
          <div className="flex items-center gap-3 px-1.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal-soft font-display text-lg text-signal">
              {user?.name?.charAt(0) ?? 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.875rem] font-medium">{user?.name ?? 'Admin'}</p>
              <p className="truncate text-[0.75rem] text-ink-3">DevOps admin</p>
            </div>
            <button className="rounded-full p-2 text-ink-3 hover:bg-card hover:text-ink" aria-label="Settings">
              <Settings2 className="h-4 w-4" />
            </button>
            <button onClick={handleLogout} className="rounded-full p-2 text-ink-3 hover:bg-bad-soft hover:text-bad" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
