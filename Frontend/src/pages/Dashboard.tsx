import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight, Boxes, HeartPulse, Rocket, Siren } from 'lucide-react';
import type { ElementType } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import ReleaseLine from '../components/ReleaseLine';
import { CountUp, SpotPanel } from '../components/fx';
import { ease, rise } from '../components/motion';

const KPIS: { label: string; value: number; unit?: string; note: string; tone: string; icon: ElementType }[] = [
  { label: 'Applications', value: 24, note: '+2 this week', tone: 'text-ok', icon: Boxes },
  { label: 'Healthy', value: 98, unit: '%', note: '2 running degraded', tone: 'text-warn', icon: HeartPulse },
  { label: 'Deploys today', value: 142, note: '+18 vs yesterday', tone: 'text-ok', icon: Rocket },
  { label: 'Incidents', value: 2, note: '1 needs an owner', tone: 'text-bad', icon: Siren },
];

type Status = 'live' | 'building' | 'failed';
type Env = 'dev' | 'staging' | 'production';

const DEPARTURES: { time: string; app: string; version: string; env: Env; status: Status; by: string }[] = [
  { time: '14:02', app: 'auth-service', version: 'v3.2.1', env: 'production', status: 'live', by: 'Nimal' },
  { time: '13:50', app: 'payment-gateway', version: 'v1.8.0', env: 'staging', status: 'live', by: 'Aisha' },
  { time: '13:33', app: 'inventory-worker', version: 'v2.0.4', env: 'production', status: 'failed', by: 'Kavin' },
  { time: '13:04', app: 'frontend-dashboard', version: 'v5.1.2', env: 'dev', status: 'live', by: 'Sara' },
  { time: '12:58', app: 'analytics-engine', version: 'v1.0.0', env: 'staging', status: 'building', by: 'Ravi' },
];

const ENV: Record<Env, { color: string; label: string }> = {
  dev: { color: 'var(--amber)', label: 'DEV' },
  staging: { color: 'var(--violet)', label: 'STAGING' },
  production: { color: 'var(--coral)', label: 'PROD' },
};

const STATUS: Record<Status, { text: string; cls: string }> = {
  live: { text: 'arrived', cls: 'text-ok' },
  building: { text: 'boarding', cls: 'text-warn' },
  failed: { text: 'HALTED', cls: 'text-bad' },
};

const VOLUME = [96, 118, 104, 131, 88, 34, 22, 112, 125, 117, 139, 101, 41, 142].map((v, i) => ({ d: 'MTWTFSS'[i % 7], v }));

const ENVIRONMENTS: { key: Env; name: string; health: number; pods: number; version: string; since: string }[] = [
  { key: 'dev', name: 'development', health: 96, pods: 24, version: 'v2.1.0-dev', since: 'updated 12 min ago' },
  { key: 'staging', name: 'staging', health: 99, pods: 18, version: 'v2.0.8-rc1', since: 'canary at 10%' },
  { key: 'production', name: 'production', health: 100, pods: 48, version: 'v2.0.7', since: 'stable for 3 days' },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const first = (user?.name?.split(' ')[0] ?? 'there').toUpperCase();
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-8">
      {/* ── masthead ───────────────────────────── */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <motion.p {...rise(0)} className="tag">{today}</motion.p>
          <h1 className="mt-3 font-display text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold leading-[0.98]">
            <motion.span className="inline-block" {...rise(0.05)}>good {greeting()},</motion.span>{' '}
            <motion.span className="hl inline-block" {...rise(0.12)}>{first}</motion.span>
            <br />
            <motion.span className="inline-block text-fg-3" {...rise(0.2)}>lines are <span className="shimmer-text">mostly clear.</span></motion.span>
          </h1>
        </div>
        <motion.div {...rise(0.25)} className="flex flex-wrap gap-2">
          <span className="chip text-ok"><span className="live-dot" /> 22 / 24 ON TIME</span>
          <span className="chip text-bad">1 HALTED</span>
        </motion.div>
      </header>

      {/* ── KPIs ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <motion.div key={k.label} {...rise(0.1 + i * 0.06)}>
            <SpotPanel className="h-full p-5 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="tag">{k.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-fg-2">
                  <k.icon className="h-4 w-4" strokeWidth={2.1} />
                </span>
              </div>
              <p className="mt-5 font-display text-[3.4rem] font-extrabold leading-none">
                <CountUp to={k.value} />
                {k.unit && <span className="text-[2rem] text-fg-3">{k.unit}</span>}
              </p>
              <p className={`mt-3 text-[0.8rem] font-bold ${k.tone}`}>{k.note}</p>
            </SpotPanel>
          </motion.div>
        ))}
      </div>

      {/* ── release line ───────────────────────── */}
      <motion.div {...rise(0.3)}>
        <SpotPanel className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 px-6 pt-6">
            <div>
              <p className="tag">Live map</p>
              <h2 className="mt-1.5 font-display text-[1.75rem] font-extrabold leading-none">the release <span className="text-accent-text">LINE</span></h2>
            </div>
            <div className="flex items-center gap-4">
              {Object.values(ENV).map((e) => (
                <span key={e.label} className="tag flex items-center gap-1.5 !text-fg-2">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: e.color }} /> {e.label}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto px-2 pb-5 pt-3 sm:px-6">
            <ReleaseLine mode="status" className="min-w-[680px]" />
          </div>
        </SpotPanel>
      </motion.div>

      {/* ── departures + volume ────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <motion.div {...rise(0.35)}>
          <SpotPanel className="h-full overflow-hidden">
            <div className="flex items-end justify-between gap-4 px-6 pb-4 pt-6">
              <div>
                <p className="tag">Latest deployments</p>
                <h2 className="mt-1.5 font-display text-[1.75rem] font-extrabold leading-none">departures</h2>
              </div>
              <Link to="/deployments" className="group flex shrink-0 items-center gap-1 text-[0.85rem] font-bold text-fg-2 hover:text-fg">
                view all <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[0.9rem]">
                <thead>
                  <tr className="border-y border-line">
                    {['Time', 'Service', 'Line', 'By', 'Status'].map((h, i) => (
                      <th key={h} className={`tag py-3 font-semibold ${i === 0 ? 'px-6' : ''} ${i === 4 ? 'px-6 text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEPARTURES.map((d, i) => {
                    const env = ENV[d.env];
                    const st = STATUS[d.status];
                    return (
                      <motion.tr
                        key={d.app}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + i * 0.07, duration: 0.5, ease }}
                        className="group border-b border-line transition-colors last:border-0 hover:bg-surface-2"
                      >
                        <td className="px-6 py-3.5 font-mono text-[0.82rem] font-semibold text-fg-3 num">{d.time}</td>
                        <td className="py-3.5">
                          <span className="font-bold">{d.app}</span>
                          <span className="ml-2 font-mono text-[0.75rem] text-fg-3">{d.version}</span>
                        </td>
                        <td className="py-3.5">
                          <span className="chip font-mono !text-[0.68rem] tracking-wider" style={{ color: env.color }}>
                            <i className="h-1.5 w-1.5 rounded-full" style={{ background: env.color }} />{env.label}
                          </span>
                        </td>
                        <td className="py-3.5 font-medium text-fg-2">{d.by}</td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={`chip ${st.cls}`}>
                            {d.status === 'failed' ? <span className="live-dot" /> : <i className="h-1.5 w-1.5 rounded-full bg-current" />}
                            {st.text}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SpotPanel>
        </motion.div>

        <motion.div {...rise(0.4)}>
          <SpotPanel className="flex h-full flex-col p-6">
            <p className="tag">Deploy volume · 14 days</p>
            <div className="mt-3 flex items-end gap-3">
              <span className="font-display text-[3.4rem] font-extrabold leading-none"><CountUp to={1370} /></span>
              <span className="mb-2 flex items-center gap-0.5 rounded-full bg-accent px-2 py-0.5 text-[0.78rem] font-extrabold text-accent-ink">
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={3} /> 12%
              </span>
            </div>
            <div className="mt-6 h-44 min-h-[176px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={VOLUME} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="barHot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 11, fontFamily: 'JetBrains Mono Variable', fontWeight: 600 }} />
                  <Tooltip
                    cursor={{ fill: 'var(--surface-2)', radius: 8 }}
                    contentStyle={{ background: 'var(--accent)', border: 'none', borderRadius: 999, color: 'var(--accent-ink)', fontSize: 12, fontWeight: 800, padding: '4px 12px' }}
                    itemStyle={{ color: 'var(--accent-ink)', padding: 0 }}
                    labelStyle={{ display: 'none' }}
                    formatter={(v) => [`${v} deploys`, '']}
                    separator=""
                  />
                  <Bar dataKey="v" radius={[6, 6, 6, 6]} animationDuration={1200}>
                    {VOLUME.map((_, i) => <Cell key={i} fill={i === VOLUME.length - 1 ? 'url(#barHot)' : 'var(--border-strong)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SpotPanel>
        </motion.div>
      </div>

      {/* ── environments ───────────────────────── */}
      <section>
        <motion.div {...rise(0.45)} className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-[2.25rem] font-extrabold leading-none">environ<span className="text-fg-3">MENTS</span></h2>
          <span className="tag">3 lines</span>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-3">
          {ENVIRONMENTS.map((e, i) => {
            const c = ENV[e.key].color;
            return (
              <motion.div key={e.key} {...rise(0.5 + i * 0.07)}>
                <SpotPanel className="h-full overflow-hidden p-6 hover:-translate-y-1">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-25 blur-2xl" style={{ background: c }} />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <span className="tag" style={{ color: c }}>{ENV[e.key].label}</span>
                      <h3 className="mt-1.5 font-display text-[1.6rem] font-extrabold leading-none">{e.name}</h3>
                      <p className="mt-1.5 text-[0.82rem] font-medium text-fg-3">{e.since}</p>
                    </div>
                    <span className="chip text-ok"><span className="live-dot" /> healthy</span>
                  </div>

                  <p className="relative mt-8 font-display text-[3.2rem] font-extrabold leading-none">
                    <CountUp to={e.health} /><span className="text-[1.8rem] text-fg-3">%</span>
                  </p>
                  <div className="relative mt-3 flex gap-[3px]">
                    {Array.from({ length: 25 }).map((_, j) => (
                      <motion.span
                        key={j}
                        initial={{ scaleY: 0.2, opacity: 0.2 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{ delay: 0.7 + i * 0.1 + j * 0.02, duration: 0.4 }}
                        className="h-2.5 flex-1 origin-bottom rounded-[3px]"
                        style={{ background: j < Math.round(e.health / 4) ? c : 'var(--surface-2)' }}
                      />
                    ))}
                  </div>

                  <dl className="relative mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4">
                    <div>
                      <dt className="tag">Version</dt>
                      <dd className="mt-1 font-mono text-[0.85rem] font-bold" style={{ color: c }}>{e.version}</dd>
                    </div>
                    <div>
                      <dt className="tag">Pods</dt>
                      <dd className="mt-1 font-display text-[1.1rem] font-extrabold num">{e.pods}</dd>
                    </div>
                  </dl>
                </SpotPanel>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
