import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, GitBranch, ArrowUpRight, ChevronDown } from 'lucide-react';
import { Magnetic, RevealWords, TiltCard } from '../components/fx';
import { ease, rise } from '../components/motion';

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
  HEALTHY: { label: 'healthy', cls: 'text-ok' },
  WARNING: { label: 'degraded', cls: 'text-warn' },
  CRITICAL: { label: 'FAILING', cls: 'text-bad' },
} as const;

const RUNTIMES = [
  { key: 'ALL', label: 'all runtimes' },
  { key: 'java', label: 'Java' },
  { key: 'go', label: 'Go' },
  { key: 'python', label: 'Python' },
  { key: 'node', label: 'Node' },
];

function monogram(runtime: string) {
  const r = runtime.toLowerCase();
  if (r.startsWith('java')) return { t: 'JV', c: 'var(--lilac)' };
  if (r.startsWith('go')) return { t: 'GO', c: 'var(--iris)' };
  if (r.startsWith('python')) return { t: 'PY', c: 'var(--amber)' };
  return { t: 'JS', c: 'var(--ok)' };
}

type Filter = 'ALL' | App['status'];

export default function Applications() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Filter>('ALL');
  const [runtime, setRuntime] = useState('ALL');

  const counts = useMemo(() => ({
    ALL: APPS.length,
    HEALTHY: APPS.filter((a) => a.status === 'HEALTHY').length,
    WARNING: APPS.filter((a) => a.status === 'WARNING').length,
    CRITICAL: APPS.filter((a) => a.status === 'CRITICAL').length,
  }), []);

  const filtered = APPS.filter((app) => {
    const q = search.toLowerCase();
    return (app.name.toLowerCase().includes(q) || app.owner.toLowerCase().includes(q))
      && (status === 'ALL' || app.status === status)
      && (runtime === 'ALL' || app.runtime.toLowerCase().includes(runtime));
  });

  const tabs: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'all' }, { key: 'HEALTHY', label: 'healthy' },
    { key: 'WARNING', label: 'degraded' }, { key: 'CRITICAL', label: 'failing' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <motion.p {...rise(0)} className="tag">Service catalogue</motion.p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold leading-[0.98]">
            <RevealWords delay={0.06} parts={[{ t: 'every' }, { t: 'SERVICE,', className: 'grad' }, 'br', { t: 'one', className: 'thin' }, { t: 'place.' }]} />
          </h1>
        </div>
        <motion.div {...rise(0.3)} className="self-start md:self-auto">
          <Magnetic>
            <button className="btn btn-primary"><Plus className="h-4 w-4" strokeWidth={2.5} /> register app</button>
          </Magnetic>
        </motion.div>
      </header>

      {/* ── filters ───────────────────────────── */}
      <motion.div {...rise(0.12)} className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 backdrop-blur lg:w-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setStatus(t.key)}
              className={`relative flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[0.875rem] font-bold transition-colors ${
                status === t.key ? 'text-primary-ink' : 'text-fg-2 hover:text-fg'
              }`}>
              {status === t.key && (
                <motion.span layoutId="app-filter" className="absolute inset-0 rounded-full bg-primary shadow-[0_6px_20px_-8px_var(--iris)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
              )}
              <span className="relative">{t.label}</span>
              <span className={`relative font-mono text-[0.72rem] ${status === t.key ? 'opacity-60' : 'text-fg-3'}`}>{counts[t.key]}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-48">
          <select value={runtime} onChange={(e) => setRuntime(e.target.value)}
            className="field h-11 w-full cursor-pointer appearance-none rounded-full pr-10 text-[0.875rem] font-bold">
            {RUNTIMES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
        </div>

        <label className="flex h-11 w-full items-center gap-2.5 rounded-full border border-line-strong bg-surface px-4 text-fg-3 transition-colors focus-within:border-iris lg:ml-auto lg:max-w-xs">
          <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="filter by name or team"
            className="w-full bg-transparent text-[0.9rem] font-medium text-fg placeholder:text-fg-3 focus:outline-none" />
        </label>
      </motion.div>

      {/* ── grid ──────────────────────────────── */}
      <motion.div layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((app, i) => {
            const m = monogram(app.runtime);
            const s = STATUS[app.status];
            return (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.45, delay: i * 0.04, ease }}
              >
                <TiltCard className="cursor-pointer p-6"><div className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl font-display text-[1.25rem] font-extrabold"
                      style={{ color: m.c, background: `color-mix(in oklab, ${m.c} 15%, transparent)` }}>
                      {m.t}
                      <span className="absolute inset-0 rounded-2xl border" style={{ borderColor: `color-mix(in oklab, ${m.c} 35%, transparent)` }} />
                    </div>
                    <span className={`chip ${s.cls}`}>
                      {app.status === 'CRITICAL' ? <span className="live-dot" /> : <i className="h-1.5 w-1.5 rounded-full bg-current" />}
                      {s.label}
                    </span>
                  </div>

                  <h3 className="mt-5 flex items-center gap-1.5 font-display text-[1.45rem] font-extrabold leading-tight">
                    {app.name}
                    <ArrowUpRight className="h-5 w-5 -translate-x-1 text-accent-text opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </h3>
                  <p className="mt-1.5 text-[0.9rem] font-medium leading-relaxed text-fg-2">{app.description}</p>
                  <p className="mt-4 flex items-center gap-1.5 font-mono text-[0.75rem] font-semibold text-fg-3">
                    <GitBranch className="h-3.5 w-3.5" /> {app.repo}
                  </p>

                  <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-line pt-4 text-[0.82rem]" style={{ marginTop: '1.25rem' }}>
                    <div><dt className="tag">Team</dt><dd className="mt-1 truncate font-bold">{app.owner}</dd></div>
                    <div><dt className="tag">Ver</dt><dd className="mt-1 font-mono font-bold">{app.version}</dd></div>
                    <div><dt className="tag">Shipped</dt><dd className="mt-1 font-bold">{app.lastDeploy}</dd></div>
                  </dl>
                  <p className="tag mt-4 !text-[0.62rem]">{app.runtime}</p>
                </div></TiltCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel flex flex-col items-center px-6 py-20 text-center">
          <p className="font-display text-[2.5rem] font-extrabold leading-none">nothing on this <span className="grad">LINE</span></p>
          <p className="mt-3 font-medium text-fg-3">try another search, or clear the filters.</p>
          <button onClick={() => { setSearch(''); setStatus('ALL'); setRuntime('ALL'); }} className="btn btn-ghost mt-6">clear filters</button>
        </motion.div>
      )}
    </div>
  );
}
