import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, GitBranch, ArrowUpRight } from 'lucide-react';

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

const STATUS = {
  HEALTHY: { label: 'Healthy', cls: 'text-ok', soft: 'bg-ok-soft text-ok' },
  WARNING: { label: 'Degraded', cls: 'text-warn', soft: 'bg-warn-soft text-warn' },
  CRITICAL: { label: 'Failing', cls: 'text-bad', soft: 'bg-bad-soft text-bad' },
} as const;

const RUNTIMES = [
  { key: 'ALL', label: 'All runtimes' },
  { key: 'java', label: 'Java' },
  { key: 'go', label: 'Go' },
  { key: 'python', label: 'Python' },
  { key: 'node', label: 'Node' },
];

function monogram(runtime: string) {
  const r = runtime.toLowerCase();
  if (r.startsWith('java')) return { t: 'Jv', bg: 'var(--signal-soft)', fg: 'var(--signal)' };
  if (r.startsWith('go')) return { t: 'Go', bg: 'var(--cobalt-soft)', fg: 'var(--cobalt)' };
  if (r.startsWith('python')) return { t: 'Py', bg: 'var(--warn-soft)', fg: 'var(--warn)' };
  return { t: 'Js', bg: 'var(--ok-soft)', fg: 'var(--ok)' };
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function Applications() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | App['status']>('ALL');
  const [runtime, setRuntime] = useState('ALL');

  const counts = useMemo(() => ({
    ALL: APPS.length,
    HEALTHY: APPS.filter((a) => a.status === 'HEALTHY').length,
    WARNING: APPS.filter((a) => a.status === 'WARNING').length,
    CRITICAL: APPS.filter((a) => a.status === 'CRITICAL').length,
  }), []);

  const filtered = APPS.filter((app) => {
    const q = search.toLowerCase();
    const matchSearch = app.name.toLowerCase().includes(q) || app.owner.toLowerCase().includes(q);
    const matchStatus = status === 'ALL' || app.status === status;
    const matchRuntime = runtime === 'ALL' || app.runtime.toLowerCase().includes(runtime);
    return matchSearch && matchStatus && matchRuntime;
  });

  const tabs: { key: 'ALL' | App['status']; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'HEALTHY', label: 'Healthy' },
    { key: 'WARNING', label: 'Degraded' },
    { key: 'CRITICAL', label: 'Failing' },
  ];

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
        className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="text-[0.9rem] text-ink-3">Service catalogue</p>
          <h1 className="mt-2 font-display text-[clamp(2.5rem,5vw,3.75rem)] leading-none tracking-[-0.02em]">
            Applications <em className="text-ink-3 num">({APPS.length})</em>
          </h1>
          <p className="mt-3 max-w-lg text-[0.95rem] text-ink-2">
            Every service on the platform, who owns it, and how it is doing.
          </p>
        </div>
        <button className="btn btn-ink self-start md:self-auto">
          <Plus className="h-4 w-4" /> Register application
        </button>
      </motion.header>

      {/* ── Filters ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05, ease }}
        className="flex flex-col gap-3 lg:flex-row lg:items-center"
      >
        <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-line-2 bg-card p-1 lg:w-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`flex h-8 shrink-0 items-center gap-2 rounded-full px-3.5 text-[0.85rem] transition-colors ${
                status === t.key ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {t.label}
              <span className={`num text-[0.75rem] ${status === t.key ? 'text-paper/60' : 'text-ink-3'}`}>{counts[t.key]}</span>
            </button>
          ))}
        </div>

        <select
          value={runtime}
          onChange={(e) => setRuntime(e.target.value)}
          className="field h-10 w-full cursor-pointer appearance-none rounded-full bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10 text-[0.875rem] lg:w-44"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238f897c' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
        >
          {RUNTIMES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>

        <label className="flex h-10 w-full items-center gap-2.5 rounded-full border border-line-2 bg-card px-4 text-ink-3 focus-within:border-ink lg:ml-auto lg:max-w-xs">
          <Search className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name or team"
            className="w-full bg-transparent text-[0.9rem] text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </label>
      </motion.div>

      {/* ── Grid ────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center px-6 py-24 text-center">
          <p className="font-display text-[2.25rem] leading-none">Nothing on this line.</p>
          <p className="mt-3 text-[0.95rem] text-ink-3">Try another search, or clear the filters.</p>
          <button
            onClick={() => { setSearch(''); setStatus('ALL'); setRuntime('ALL'); }}
            className="btn btn-ghost mt-6"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((app, i) => {
            const m = monogram(app.runtime);
            const s = STATUS[app.status];
            return (
              <motion.article
                key={app.id}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 + i * 0.04, ease }}
                className="card group flex cursor-pointer flex-col p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-2 hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-[1.5rem] italic"
                    style={{ background: m.bg, color: m.fg }}
                  >
                    {m.t}
                  </div>
                  <span className={`chip ${s.soft}`}>
                    {app.status === 'CRITICAL' ? <span className="live-dot" /> : <i className="h-1.5 w-1.5 rounded-full bg-current" />}
                    {s.label}
                  </span>
                </div>

                <h3 className="mt-5 flex items-center gap-1.5 text-[1.1rem] font-medium">
                  {app.name}
                  <ArrowUpRight className="h-4 w-4 text-ink-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </h3>
                <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-2">{app.description}</p>

                <p className="mt-4 flex items-center gap-1.5 font-mono text-[0.78rem] text-ink-3">
                  <GitBranch className="h-3.5 w-3.5" /> {app.repo}
                </p>

                <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-[0.8rem]">
                  <div>
                    <dt className="text-ink-3">Team</dt>
                    <dd className="mt-0.5 truncate font-medium">{app.owner}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Version</dt>
                    <dd className="mt-0.5 font-mono">{app.version}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Deployed</dt>
                    <dd className="mt-0.5">{app.lastDeploy}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-[0.78rem] text-ink-3">{app.runtime}</p>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
