import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Server, Circle, GitBranch, User, ExternalLink, Boxes } from 'lucide-react';

interface App {
  id: number;
  name: string;
  description: string;
  runtime: string;
  owner: string;
  repo: string;
  version: string;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  lastDeploy: string;
}

const APPS: App[] = [
  { id: 1, name: 'payment-gateway', description: 'Core payment processing microservice', runtime: 'Java / Spring Boot', owner: 'Fintech Squad', repo: 'org/payment-gateway', version: 'v1.8.0', status: 'HEALTHY', lastDeploy: '2h ago' },
  { id: 2, name: 'auth-service', description: 'JWT authentication & authorization', runtime: 'Go 1.21', owner: 'Platform Team', repo: 'org/auth-service', version: 'v3.2.1', status: 'HEALTHY', lastDeploy: '14m ago' },
  { id: 3, name: 'frontend-dashboard', description: 'React SPA for customer portal', runtime: 'Node 20 / React', owner: 'Web Team', repo: 'org/frontend-dashboard', version: 'v5.1.2', status: 'WARNING', lastDeploy: '1h ago' },
  { id: 4, name: 'inventory-worker', description: 'Async inventory sync worker', runtime: 'Python 3.11', owner: 'Data Team', repo: 'org/inventory-worker', version: 'v2.0.4', status: 'CRITICAL', lastDeploy: '31m ago' },
  { id: 5, name: 'notification-svc', description: 'Multi-channel notification dispatcher', runtime: 'Node 20', owner: 'Platform Team', repo: 'org/notification-svc', version: 'v1.3.0', status: 'HEALTHY', lastDeploy: '3h ago' },
  { id: 6, name: 'analytics-engine', description: 'Real-time metrics aggregation', runtime: 'Python 3.11', owner: 'Data Team', repo: 'org/analytics-engine', version: 'v1.0.0', status: 'HEALTHY', lastDeploy: '5h ago' },
];

const STATUS_CONFIG = {
  HEALTHY: { color: '#00FFA3', bg: 'rgba(0,255,163,0.08)', border: 'rgba(0,255,163,0.2)' },
  WARNING: { color: '#FFB800', bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.2)' },
  CRITICAL: { color: '#FF3366', bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.2)' },
};

const StatusBadge = ({ status }: { status: App['status'] }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontFamily: 'JetBrains Mono, monospace' }}
    >
      <Circle className="h-1.5 w-1.5 fill-current" />
      {status}
    </span>
  );
};

export default function Applications() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [runtimeFilter, setRuntimeFilter] = useState('ALL');

  const filtered = APPS.filter(app => {
    const matchSearch = app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.owner.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchRuntime = runtimeFilter === 'ALL' || app.runtime.toLowerCase().includes(runtimeFilter.toLowerCase());
    return matchSearch && matchStatus && matchRuntime;
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#00F0FF]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Catalog
          </p>
          <h1 className="text-3xl font-bold text-white">Application catalog</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">{APPS.length} services registered across the platform</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,240,255,0.25)] bg-[rgba(0,240,255,0.08)] px-4 py-2.5 text-sm font-semibold text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.08)] transition-all hover:bg-[rgba(0,240,255,0.12)]"
        >
          <Plus className="w-4 h-4" /> Register application
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 rounded-2xl border border-[rgba(148,163,184,0.08)] bg-[rgba(11,20,35,0.8)] p-4"
      >
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569] w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="platform-input pl-9"
            style={{ paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="platform-input px-3"
          style={{ width: 'auto', minWidth: '140px', paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
        >
          <option value="ALL">All statuses</option>
          <option value="HEALTHY">Healthy</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={runtimeFilter}
          onChange={e => setRuntimeFilter(e.target.value)}
          className="platform-input px-3"
          style={{ width: 'auto', minWidth: '140px', paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
        >
          <option value="ALL">All runtimes</option>
          <option value="java">Java</option>
          <option value="go">Go</option>
          <option value="python">Python</option>
          <option value="node">Node</option>
        </select>
        <button className="inline-flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-[#94A3B8] transition-colors hover:text-white">
          <Filter className="w-4 h-4" /> More filters
        </button>
      </motion.div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Boxes className="mb-4 h-12 w-12 text-[#475569]" />
          <p className="mb-1 text-lg font-semibold text-white">No applications found</p>
          <p className="text-sm text-[#94A3B8]">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border border-[rgba(148,163,184,0.08)] bg-[rgba(17,29,49,0.82)] p-5 transition-all duration-200 hover:border-[rgba(0,240,255,0.26)] hover:shadow-[0_18px_40px_rgba(0,240,255,0.06)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-white transition-colors group-hover:text-[#00F0FF]">{app.name}</h3>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#475569] opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-1 truncate text-xs text-[#94A3B8]">{app.description}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <div className="mb-4">
                <span
                  className="rounded-lg border border-[rgba(0,240,255,0.12)] bg-[rgba(0,240,255,0.05)] px-2 py-1 text-[10px] text-[#00F0FF]"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {app.runtime}
                </span>
              </div>

              <div className="space-y-2 border-t border-[rgba(255,255,255,0.05)] pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-[#94A3B8]"><User className="w-3.5 h-3.5" /> Owner</span>
                  <span className="text-xs font-medium text-white">{app.owner}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-[#94A3B8]"><GitBranch className="w-3.5 h-3.5" /> Repo</span>
                  <span className="text-xs text-[#00F0FF]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{app.repo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-[#94A3B8]"><Server className="w-3.5 h-3.5" /> Runtime</span>
                  <span className="text-xs font-medium text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{app.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">Last deploy</span>
                  <span className="text-xs text-[#64748b]">{app.lastDeploy}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
