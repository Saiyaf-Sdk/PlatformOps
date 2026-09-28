import type { ElementType, ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, Boxes, Layers, Rocket, Server, Activity, Siren, ScrollText, Users, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../lib/queries';
import { ROLE_LABEL, initials } from '../lib/format';
import Logo from './Logo';

interface NavItemProps { to: string; icon: ElementType; label: string; badge?: string; onNavigate?: () => void }

const NavItem = ({ to, icon: Icon, label, badge, onNavigate }: NavItemProps) => (
  <NavLink to={to} onClick={onNavigate} className="relative block">
    {({ isActive }) => (
      <span className={`relative flex h-10 items-center gap-3 rounded-full pl-3.5 pr-2.5 text-[0.9rem] font-semibold transition-colors ${
        isActive ? 'text-fg' : 'text-fg-2 hover:text-fg'
      }`}>
        {isActive && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 rounded-full border border-line-strong bg-surface-2 shadow-[0_8px_24px_-12px_var(--iris)]"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full" style={{ background: 'var(--grad)', boxShadow: '0 0 10px var(--iris)' }} />
          </motion.span>
        )}
        <Icon className={`relative h-[17px] w-[17px] shrink-0 transition-colors ${isActive ? 'text-accent-text' : ''}`} strokeWidth={2} />
        <span className="relative flex-1">{label}</span>
        {badge && (
          <span className={`relative flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[0.68rem] font-bold ${
            'bg-bad text-white shadow-[0_0_12px_var(--bad)]'
          }`}>{badge}</span>
        )}
      </span>
    )}
  </NavLink>
);

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="tag mb-2 px-3.5">{label}</p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logout, user, can } = useAuth();
  const navigate = useNavigate();
  const { data: dash } = useDashboard();
  const openIncidents = dash?.kpis.openIncidents ?? 0;
  const uptime = dash ? (dash.environments.find((e) => e.code === 'PRODUCTION')?.healthScore ?? 100) : null;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        className={`fixed inset-y-3 left-3 z-50 flex w-[252px] flex-col rounded-[26px] border border-line glass transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-[110%]'
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-6 pt-6">
          <Logo />
          <button onClick={onClose} className="rounded-full p-1.5 text-fg-2 hover:bg-surface-2 lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav data-lenis-prevent className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          <div><NavItem to="/dashboard" icon={LayoutGrid} label="overview" onNavigate={onClose} /></div>
          <Section label="Delivery">
            <NavItem to="/applications" icon={Boxes} label="applications" onNavigate={onClose} />
            <NavItem to="/environments" icon={Layers} label="environments" onNavigate={onClose} />
            <NavItem to="/deployments" icon={Rocket} label="deployments" onNavigate={onClose} />
          </Section>
          <Section label="Operations">
            <NavItem to="/infrastructure" icon={Server} label="infrastructure" onNavigate={onClose} />
            <NavItem to="/monitoring" icon={Activity} label="monitoring" onNavigate={onClose} />
            <NavItem to="/incidents" icon={Siren} label="incidents" badge={openIncidents > 0 ? String(openIncidents) : undefined} onNavigate={onClose} />
          </Section>
          <Section label="Governance">
            {can('ADMIN', 'DEVOPS') && <NavItem to="/audit-logs" icon={ScrollText} label="audit log" onNavigate={onClose} />}
            {can('ADMIN') && <NavItem to="/users" icon={Users} label="people & access" onNavigate={onClose} />}
          </Section>
        </nav>

        <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-line bg-surface p-3.5">
          <div className="flex items-center justify-between">
            <span className="tag !text-ok">Prod health</span>
            <span className="live-dot text-ok" />
          </div>
          <p className="mt-2 font-display text-[1.6rem] font-extrabold leading-none num">{uptime ?? '—'}<span className="text-fg-3">%</span></p>
          <div className="mt-2.5 flex h-6 items-end gap-[3px]">
            {[6, 9, 7, 12, 10, 14, 11, 16, 13, 18, 15, 20, 17, 22].map((h, i) => (
              <motion.span
                key={i}
                initial={{ height: 2 }}
                animate={{ height: h }}
                transition={{ delay: 0.4 + i * 0.03, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 rounded-[2px] bg-ok opacity-70"
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-line px-4 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky via-iris to-lilac font-display text-base font-extrabold text-white">
            {initials(user?.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.875rem] font-bold">{user?.fullName ?? ''}</p>
            <p className="tag truncate !text-[0.6rem]">{user ? ROLE_LABEL[user.role] : ''}</p>
          </div>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            className="rounded-full p-2 text-fg-3 transition-colors hover:bg-surface-2 hover:text-bad"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
