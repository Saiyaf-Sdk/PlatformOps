import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import ReleaseLine from '../components/ReleaseLine';

const ease = [0.22, 1, 0.36, 1] as const;
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease },
});

const KPIS = [
  { label: 'Applications', value: '24', note: '+2 this week', tone: 'text-ok' },
  { label: 'Healthy services', value: '98', unit: '%', note: '2 running degraded', tone: 'text-warn' },
  { label: 'Deploys today', value: '142', note: '+18 vs yesterday', tone: 'text-ok' },
  { label: 'Open incidents', value: '2', note: '1 needs an owner', tone: 'text-bad' },
];

type DeployStatus = 'live' | 'building' | 'failed';

const DEPARTURES: { time: string; app: string; version: string; env: 'dev' | 'staging' | 'production'; status: DeployStatus; by: string }[] = [
  { time: '14:02', app: 'auth-service', version: 'v3.2.1', env: 'production', status: 'live', by: 'Nimal' },
  { time: '13:50', app: 'payment-gateway', version: 'v1.8.0', env: 'staging', status: 'live', by: 'Aisha' },
  { time: '13:33', app: 'inventory-worker', version: 'v2.0.4', env: 'production', status: 'failed', by: 'Kavin' },
  { time: '13:04', app: 'frontend-dashboard', version: 'v5.1.2', env: 'dev', status: 'live', by: 'Sara' },
  { time: '12:58', app: 'analytics-engine', version: 'v1.0.0', env: 'staging', status: 'building', by: 'Ravi' },
];

const ENV_STYLE = {
  dev: { color: 'var(--warn)', soft: 'var(--warn-soft)', label: 'Dev' },
  staging: { color: 'var(--cobalt)', soft: 'var(--cobalt-soft)', label: 'Staging' },
  production: { color: 'var(--signal)', soft: 'var(--signal-soft)', label: 'Production' },
};

const STATUS_STYLE: Record<DeployStatus, { text: string; cls: string }> = {
  live: { text: 'Arrived', cls: 'bg-ok-soft text-ok' },
  building: { text: 'Boarding', cls: 'bg-warn-soft text-warn' },
  failed: { text: 'Halted', cls: 'bg-bad-soft text-bad' },
};

const VOLUME = [
  { d: 'M', v: 96 }, { d: 'T', v: 118 }, { d: 'W', v: 104 }, { d: 'T', v: 131 }, { d: 'F', v: 88 },
  { d: 'S', v: 34 }, { d: 'S', v: 22 }, { d: 'M', v: 112 }, { d: 'T', v: 125 }, { d: 'W', v: 117 },
  { d: 'T', v: 139 }, { d: 'F', v: 101 }, { d: 'S', v: 41 }, { d: 'M', v: 142 },
];

const ENVIRONMENTS = [
  { key: 'dev' as const, name: 'Development', health: 96, pods: 24, version: 'v2.1.0-dev', since: 'Updated 12 min ago' },
  { key: 'staging' as const, name: 'Staging', health: 99, pods: 18, version: 'v2.0.8-rc1', since: 'Canary at 10%' },
  { key: 'production' as const, name: 'Production', health: 100, pods: 48, version: 'v2.0.7', since: 'Stable for 3 days' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const first = user?.name?.split(' ')[0] ?? 'there';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-10">
      {/* ── Masthead ─────────────────────────── */}
      <motion.header {...rise()} className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.9rem] text-ink-3">{today}</p>
          <h1 className="mt-2 font-display text-[clamp(2.5rem,5vw,3.75rem)] leading-[1] tracking-[-0.02em]">
            {greeting()}, {first}. <em className="text-ink-3">Lines are mostly clear.</em>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip bg-ok-soft text-ok"><span className="live-dot" /> 22 of 24 on time</span>
          <span className="chip bg-bad-soft text-bad">1 halted</span>
        </div>
      </motion.header>

      {/* ── KPI strip ────────────────────────── */}
      <motion.section {...rise(0.05)} className="card grid grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className={`p-6 ${i % 2 === 1 ? 'border-l border-line' : ''} ${i > 1 ? 'border-t border-line lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''}`}
          >
            <p className="label">{k.label}</p>
            <p className="mt-3 font-display text-[3.25rem] leading-none num">
              {k.value}
              {k.unit && <span className="text-[2rem] text-ink-3">{k.unit}</span>}
            </p>
            <p className={`mt-3 text-[0.8rem] font-medium ${k.tone}`}>{k.note}</p>
          </div>
        ))}
      </motion.section>

      {/* ── Release line ─────────────────────── */}
      <motion.section {...rise(0.1)} className="card overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-6 pt-6">
          <div>
            <h2 className="text-[1.15rem] font-medium">The release line</h2>
            <p className="mt-1 text-[0.875rem] text-ink-3">What is sitting at each station right now.</p>
          </div>
          <div className="flex items-center gap-4 text-[0.8rem] text-ink-2">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-warn" /> Dev</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-cobalt" /> Staging</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-signal" /> Production</span>
          </div>
        </div>
        <div className="overflow-x-auto px-2 pb-4 pt-2 sm:px-6">
          <ReleaseLine mode="status" className="min-w-[680px]" />
        </div>
      </motion.section>

      {/* ── Departures + volume ──────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <motion.section {...rise(0.15)} className="card overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
            <div>
              <h2 className="text-[1.15rem] font-medium">Departures</h2>
              <p className="mt-1 text-[0.875rem] text-ink-3">Latest deployments across all lines.</p>
            </div>
            <a href="/deployments" className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[0.85rem] text-ink-2 hover:text-ink">
              All deployments <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[0.9rem]">
              <thead>
                <tr className="border-y border-line text-[0.78rem] text-ink-3">
                  <th className="px-6 py-2.5 font-normal">Time</th>
                  <th className="py-2.5 font-normal">Service</th>
                  <th className="py-2.5 font-normal">Line</th>
                  <th className="py-2.5 font-normal">By</th>
                  <th className="px-6 py-2.5 text-right font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {DEPARTURES.map((d) => {
                  const env = ENV_STYLE[d.env];
                  const st = STATUS_STYLE[d.status];
                  return (
                    <tr key={d.app + d.time} className="border-b border-line last:border-0 transition-colors hover:bg-paper/60">
                      <td className="px-6 py-3.5 font-mono text-[0.85rem] text-ink-2 num">{d.time}</td>
                      <td className="py-3.5">
                        <span className="font-medium">{d.app}</span>
                        <span className="ml-2 font-mono text-[0.78rem] text-ink-3">{d.version}</span>
                      </td>
                      <td className="py-3.5">
                        <span className="chip" style={{ background: env.soft, color: env.color }}>
                          <i className="h-1.5 w-1.5 rounded-full" style={{ background: env.color }} />
                          {env.label}
                        </span>
                      </td>
                      <td className="py-3.5 text-ink-2">{d.by}</td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`chip ${st.cls}`}>{st.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section {...rise(0.2)} className="card flex flex-col p-6">
          <h2 className="text-[1.15rem] font-medium">Deploy volume</h2>
          <p className="mt-1 text-[0.875rem] text-ink-3">Last 14 days</p>
          <div className="mt-6 flex items-end gap-3">
            <span className="font-display text-[3.25rem] leading-none num">1,370</span>
            <span className="mb-1.5 flex items-center gap-0.5 text-[0.85rem] font-medium text-ok">
              <ArrowUpRight className="h-4 w-4" /> 12%
            </span>
          </div>
          <div className="mt-6 h-44 min-h-[176px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={VOLUME} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: 'var(--paper-2)' }}
                  contentStyle={{ background: 'var(--ink)', border: 'none', borderRadius: 10, color: 'var(--paper)', fontSize: 12 }}
                  itemStyle={{ color: 'var(--paper)' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(v) => [`${v} deploys`, '']}
                  separator=""
                />
                <Bar dataKey="v" radius={[5, 5, 5, 5]}>
                  {VOLUME.map((_, i) => (
                    <Cell key={i} fill={i === VOLUME.length - 1 ? 'var(--signal)' : 'var(--line-2)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </div>

      {/* ── Environments ─────────────────────── */}
      <section>
        <motion.h2 {...rise(0.2)} className="mb-4 font-display text-[2rem] leading-none">Environments</motion.h2>
        <div className="grid gap-6 md:grid-cols-3">
          {ENVIRONMENTS.map((e, i) => {
            const s = ENV_STYLE[e.key];
            return (
              <motion.article
                key={e.key}
                {...rise(0.25 + i * 0.05)}
                className="card group relative overflow-hidden p-6 transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: s.color }} />
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[1.1rem] font-medium">{e.name}</h3>
                    <p className="mt-1 text-[0.82rem] text-ink-3">{e.since}</p>
                  </div>
                  <span className="chip bg-ok-soft text-ok">Healthy</span>
                </div>

                <div className="mt-8 flex items-end justify-between">
                  <p className="font-display text-[3rem] leading-none num">
                    {e.health}<span className="text-[1.75rem] text-ink-3">%</span>
                  </p>
                  <p className="pb-1 text-right text-[0.82rem] text-ink-3">health score</p>
                </div>
                {/* segmented meter */}
                <div className="mt-3 flex gap-[3px]">
                  {Array.from({ length: 25 }).map((_, j) => (
                    <span
                      key={j}
                      className="h-2 flex-1 rounded-[2px]"
                      style={{ background: j < Math.round(e.health / 4) ? s.color : 'var(--paper-2)' }}
                    />
                  ))}
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[0.85rem]">
                  <div>
                    <dt className="text-ink-3">Version</dt>
                    <dd className="mt-0.5 font-mono text-[0.85rem]" style={{ color: s.color }}>{e.version}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Pods running</dt>
                    <dd className="mt-0.5 font-medium num">{e.pods}</dd>
                  </div>
                </dl>
              </motion.article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
