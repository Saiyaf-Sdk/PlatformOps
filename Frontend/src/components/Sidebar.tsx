import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Box, Server, Rocket, Activity, ShieldAlert, FileText, Users, LogOut, Settings, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
        isActive
          ? 'bg-[rgba(0,240,255,0.1)] text-[#00F0FF] border border-[rgba(0,240,255,0.2)] shadow-[0_0_18px_rgba(0,240,255,0.08)]'
          : 'text-[#94A3B8] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
      }`
    }
  >
    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
      ({ isActive }: { isActive: boolean }) => isActive ? 'bg-[rgba(0,240,255,0.12)]' : 'bg-[rgba(255,255,255,0.02)] group-hover:bg-[rgba(255,255,255,0.05)]'
    }`}>
      <Icon className="w-4 h-4 shrink-0" />
    </span>
    <span>{label}</span>
  </NavLink>
);

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

const Section = ({ label, children }: SectionProps) => (
  <div>
    <p className="px-3 text-[10px] font-semibold text-[#475569] uppercase tracking-[0.22em] mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {label}
    </p>
    <div className="space-y-1">{children}</div>
  </div>
);

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="w-64 h-screen flex flex-col fixed left-0 top-0 z-40"
      style={{
        background: 'rgba(11, 20, 35, 0.94)',
        backdropFilter: 'blur(18px)',
        borderRight: '1px solid rgba(148, 163, 184, 0.08)',
        boxShadow: '0 0 0 1px rgba(0,240,255,0.04)',
      }}
    >
      <div className="p-5 pb-4 border-b border-[rgba(148,163,184,0.08)]">
        <div className="flex items-center gap-3">
          <div className="relative p-2 rounded-xl bg-[rgba(0,240,255,0.09)] border border-[rgba(0,240,255,0.2)] shadow-[0_0_20px_rgba(0,240,255,0.08)]">
            <Terminal className="w-5 h-5 text-[#00F0FF]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">
              Platform<span className="text-[#00F0FF]">Ops</span>
            </h1>
            <p className="text-[10px] text-[#475569] mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              SRE COMMAND
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-[rgba(148,163,184,0.08)]">
        <div className="flex items-center justify-between rounded-lg border border-[rgba(0,255,163,0.14)] bg-[rgba(0,255,163,0.04)] px-2.5 py-1.5 text-[10px] text-[#00FFA3]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
            SYSTEM ONLINE
          </span>
          <span>99.98%</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        <Section label="Overview">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        </Section>
        <Section label="Platform">
          <NavItem to="/applications" icon={Box} label="Applications" />
          <NavItem to="/environments" icon={Server} label="Environments" />
          <NavItem to="/deployments" icon={Rocket} label="Deployments" />
        </Section>
        <Section label="Operations">
          <NavItem to="/infrastructure" icon={Server} label="Infrastructure" />
          <NavItem to="/monitoring" icon={Activity} label="Monitoring" />
          <NavItem to="/incidents" icon={ShieldAlert} label="Incidents" />
        </Section>
        <Section label="Governance">
          <NavItem to="/audit-logs" icon={FileText} label="Audit Logs" />
        </Section>
        <Section label="Administration">
          <NavItem to="/users" icon={Users} label="Users" />
        </Section>
      </nav>

      <div className="p-3 border-t border-[rgba(148,163,184,0.08)]">
        <div className="flex items-center gap-3 p-2.5 rounded-xl mb-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
          <div className="w-9 h-9 rounded-lg bg-[rgba(123,44,191,0.2)] border border-[rgba(123,44,191,0.35)] flex items-center justify-center text-[#c084fc] font-bold text-xs shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-[#475569] truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{user?.role || 'DEVOPS_ADMIN'}</p>
          </div>
        </div>
        <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.04)] rounded-lg transition-colors">
          <Settings className="w-4 h-4" /> Settings
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#FF3366] hover:bg-[rgba(255,51,102,0.08)] rounded-lg transition-colors mt-1"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
