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
      `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium ${
        isActive
          ? 'bg-[rgba(0,240,255,0.1)] text-[#00F0FF] border-l-2 border-[#00F0FF] pl-[10px]'
          : 'text-[#94A3B8] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
      }`
    }
  >
    <Icon className="w-4 h-4 shrink-0" />
    <span>{label}</span>
  </NavLink>
);

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

const Section = ({ label, children }: SectionProps) => (
  <div>
    <p className="px-3 text-[10px] font-semibold text-[#475569] uppercase tracking-widest mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {label}
    </p>
    <div className="space-y-0.5">{children}</div>
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
        background: 'rgba(11, 20, 35, 0.95)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(0, 240, 255, 0.1)',
      }}
    >
      {/* Logo */}
      <div className="p-5 pb-4 border-b border-[rgba(0,240,255,0.08)]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.2)]">
            <Terminal className="w-5 h-5 text-[#00F0FF]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">
              Platform<span className="text-[#00F0FF]">Ops</span>
            </h1>
            <p className="text-[10px] text-[#475569] mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              SRE Control Center
            </p>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-b border-[rgba(0,240,255,0.05)]">
        <div className="flex items-center gap-2 text-[11px] text-[#475569]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse shrink-0" />
          ALL SYSTEMS NOMINAL
        </div>
      </div>

      {/* Nav */}
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

      {/* User footer */}
      <div className="p-3 border-t border-[rgba(0,240,255,0.08)]">
        <div className="flex items-center gap-3 p-2.5 rounded-lg mb-2 bg-[rgba(255,255,255,0.02)]">
          <div className="w-8 h-8 rounded-lg bg-[rgba(123,44,191,0.3)] border border-[rgba(123,44,191,0.4)] flex items-center justify-center text-[#7B2CBF] font-bold text-xs shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-[#475569] truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{user?.role || 'DEVOPS_ADMIN'}</p>
          </div>
        </div>
        <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.04)] rounded-md transition-colors">
          <Settings className="w-4 h-4" /> Settings
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#FF3366] hover:bg-[rgba(255,51,102,0.08)] rounded-md transition-colors mt-0.5"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
