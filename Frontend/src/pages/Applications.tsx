import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Server, Circle, GitBranch, User, ExternalLink, Box } from 'lucide-react';

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
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontFamily: 'JetBrains Mono, monospace' }}
    >
      <Circle className="w-1.5 h-1.5 fill-current" />
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
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Application Catalog</h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">{APPS.length} services registered across the platform</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: 'rgba(0, 240, 255, 0.1)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            color: '#00F0FF',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)',
          }}
        >
          <Plus className="w-4 h-4" /> Register Application
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(11, 20, 35, 0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569] w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="platform-input pl-9"
            style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="platform-input px-3"
          style={{ width: 'auto', minWidth: '130px', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="HEALTHY">Healthy</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={runtimeFilter}
          onChange={e => setRuntimeFilter(e.target.value)}
          className="platform-input px-3"
          style={{ width: 'auto', minWidth: '130px', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
        >
          <option value="ALL">All Runtimes</option>
          <option value="java">Java</option>
          <option value="go">Go</option>
          <option value="python">Python</option>
          <option value="node">Node</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <Filter className="w-4 h-4" /> More Filters
        </button>
      </motion.div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Box className="w-12 h-12 text-[#475569] mb-4" />
          <p className="text-white font-semibold mb-1">No applications found</p>
          <p className="text-[#94A3B8] text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-5 cursor-pointer group transition-all duration-200"
              style={{
                background: 'rgba(17, 29, 49, 0.8)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.border = '1px solid rgba(0,240,255,0.25)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,240,255,0.05)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white group-hover:text-[#00F0FF] transition-colors truncate">
                      {app.name}
                    </h3>
                    <ExternalLink className="w-3.5 h-3.5 text-[#475569] opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                  </div>
                  <p className="text-[#94A3B8] text-xs mt-0.5 truncate">{app.description}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              {/* Runtime pill */}
              <div className="mb-4">
                <span
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.1)', color: '#00F0FF', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {app.runtime}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 pt-3 border-t border-[rgba(255,255,255,0.05)] text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#94A3B8] text-xs"><User className="w-3 h-3" /> Owner</span>
                  <span className="text-white text-xs font-medium">{app.owner}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#94A3B8] text-xs"><GitBranch className="w-3 h-3" /> Repository</span>
                  <span className="text-[#00F0FF] text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{app.repo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#94A3B8] text-xs"><Server className="w-3 h-3" /> Production</span>
                  <span className="text-white text-xs font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{app.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8] text-xs">Last Deploy</span>
                  <span className="text-[#475569] text-xs">{app.lastDeploy}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
