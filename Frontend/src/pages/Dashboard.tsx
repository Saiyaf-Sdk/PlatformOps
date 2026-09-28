import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight, Boxes, HeartPulse, Rocket, Siren } from 'lucide-react';
import type { ElementType } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import ReleaseLine from '../components/ReleaseLine';
import { Odometer, RevealWords, Spark, SpotPanel, TiltCard } from '../components/fx';
import { ease, reveal, rise } from '../components/motion';

const KPIS: { label: string; value: string; unit?: string; note: string; tone: string; icon: ElementType; spark: number[]; color: string }[] = [
  { label: 'Applications', value: '24', note: '+2 this week', tone: 'text-ok', icon: Boxes, spark: [14, 15, 15, 17, 18, 18, 20, 21, 22, 24], color: 'var(--sky)' },
  { label: 'Healthy', value: '98', unit: '%', note: '2 running degraded', tone: 'text-warn', icon: HeartPulse, spark: [99, 100, 99, 99, 97, 98, 99, 98, 97, 98], color: 'var(--ok)' },
  { label: 'Deploys today', value: '142', note: '+18 vs yesterday', tone: 'text-ok', icon: Rocket, spark: [40, 62, 55, 80, 74, 96, 104, 118, 124, 142], color: 'var(--iris)' },
  { label: 'Incidents', value: '2', note: '1 needs an owner', tone: 'text-bad', icon: Siren, spark: [0, 1, 0, 0, 2, 1, 3, 1, 2, 2], color: 'var(--bad)' },
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
  staging: { color: 'var(--sky)', label: 'STAGING' },
  production: { color: 'var(--iris)', label: 'PROD' },
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

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; };

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
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold leading-[0.98]">
            <RevealWords
              delay={0.08}
              parts={[{ t: `good ${greeting()},` }, { t: `${first}.`, className: 'grad' }, 'br', { t: 'lines are', className: 'thin' }, { t: 'mostly clear.', className: 'text-fg-2' }]}
            />
          </h1>
        </div>
        <motion.div {...rise(0.45)} className="flex flex-wrap gap-2">
          <span className="chip text-ok"><span className="live-dot" /> 22 / 24 ON TIME</span>
          <span className="chip text-bad">1 HALTED</span>
        </motion.div>
      </header>

      {/* ── KPIs ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <motion.div key={k.label} {...rise(0.2 + i * 0.07)}>
            <SpotPanel className="h-full overflow-hidden p-5">
              <div className="flex items-center justify-between">
                <p className="tag">{k.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface-2" style={{ color: k.color }}>
                  <k.icon className="h-4 w-4" strokeWidth={2} />
                </span>
              </div>
              <p className="mt-5 font-display text-[3.4rem] font-extrabold leading-none">
                <Odometer value={k.value} delay={0.3 + i * 0.08} />
                {k.unit && <span className="text-[2rem] text-fg-3">{k.unit}</span>}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className={`text-[0.8rem] font-bold ${k.tone}`}>{k.note}</p>
                <Spark data={k.spark} color={k.color} className="hidden h-9 w-24 shrink-0 sm:block" />
              </div>
            </SpotPanel>
          </motion.div>
        ))}
      </div>

      {/* ── release line ───────────────────────── */}
      <motion.div {...rise(0.45)}>
        <SpotPanel beam className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 px-6 pt-6">
            <div>
              <p className="tag">Live map</p>
              <h2 className="mt-1.5 font-display text-[1.9rem] font-extrabold leading-none">the release <span className="grad">LINE</span></h2>
            </div>
            <div className="flex items-center gap-4">
              {Object.values(ENV).map((e) => (
                <span key={e.label} className="tag flex items-center gap-1.5 !text-fg-2">
                  <i className="h-2 w-2 rounded-full" style={{ background: e.color, boxShadow: `0 0 10px ${e.color}` }} /> {e.label}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto px-2 pb-5 pt-3 sm:px-6" data-lenis-prevent>
            <ReleaseLine mode="status" delay={0.6} className="min-w-[680px]" />
          </div>
        </SpotPanel>
      </motion.div>

      {/* ── departures + volume ────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <motion.div {...reveal(0)}>
          <SpotPanel className="h-full overflow-hidden">
            <div className="flex items-end justify-between gap-4 px-6 pb-4 pt-6">
              <div>
                <p className="tag">Latest deployments</p>
                <h2 className="mt-1.5 font-display text-[1.9rem] font-extrabold leading-none">departures</h2>
              </div>
              <Link to="/deployments" className="group flex shrink-0 items-center gap-1 text-[0.85rem] font-bold text-fg-2 transition-colors hover:text-fg">
                view all <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="overflow-x-auto" data-lenis-prevent>
              <table className="w-full min-w-[560px] text-left text-[0.9rem]">
                <thead>
                  <tr className="border-y border-line">
                    {['Time', 'Service', 'Line', 'By', 'Status'].map((h, i) => (
                      <th key={h} className={`tag py-3 font-medium ${i === 0 ? 'px-6' : ''} ${i === 4 ? 'px-6 text-right' : ''}`}>{h}</th>
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
                        initial={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
                        whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 + i * 0.08, duration: 0.8, ease }}
                        className="border-b border-line transition-colors duration-300 last:border-0 hover:bg-surface-2"
                      >
                        <td className="px-6 py-4 font-mono text-[0.8rem] text-fg-3 num">{d.time}</td>
                        <td className="py-4">
                          <span className="font-bold">{d.app}</span>
                          <span className="ml-2 font-mono text-[0.74rem] text-fg-3">{d.version}</span>
                        </td>
                        <td className="py-4">
                          <span className="chip font-mono !text-[0.66rem] tracking-wider" style={{ color: env.color }}>
                            <i className="h-1.5 w-1.5 rounded-full" style={{ background: env.color }} />{env.label}
                          </span>
                        </td>
                        <td className="py-4 font-medium text-fg-2">{d.by}</td>
                        <td className="px-6 py-4 text-right">
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

        <motion.div {...reveal(0.1)}>
          <SpotPanel className="flex h-full flex-col p-6">
            <p className="tag">Deploy volume · 14 days</p>
            <div className="mt-3 flex items-end gap-3">
              <span className="font-display text-[3.4rem] font-extrabold leading-none"><Odometer value="1,370" /></span>
              <span className="chip mb-2 text-ok"><ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} /> 12%</span>
            </div>
            <div className="mt-6 h-44 min-h-[176px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={VOLUME} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="barHot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--lilac)" />
                      <stop offset="50%" stopColor="var(--iris)" />
                      <stop offset="100%" stopColor="var(--sky)" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="barCold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--text-3)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="var(--text-3)" stopOpacity={0.12} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 10.5, fontFamily: 'JetBrains Mono Variable' }} />
                  <Tooltip
                    cursor={{ fill: 'var(--surface-2)', radius: 8 }}
                    contentStyle={{ background: 'var(--primary)', border: 'none', borderRadius: 999, color: 'var(--primary-ink)', fontSize: 12, fontWeight: 700, padding: '4px 12px', boxShadow: '0 8px 24px -8px var(--iris)' }}
                    itemStyle={{ color: 'var(--primary-ink)', padding: 0 }}
                    labelStyle={{ display: 'none' }}
                    formatter={(v) => [`${v} deploys`, '']}
                    separator=""
                  />
                  <Bar dataKey="v" radius={[6, 6, 3, 3]} animationDuration={1400} animationEasing="ease-out">
                    {VOLUME.map((_, i) => <Cell key={i} fill={i === VOLUME.length - 1 ? 'url(#barHot)' : 'url(#barCold)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SpotPanel>
        </motion.div>
      </div>

      {/* ── environments ───────────────────────── */}
      <section>
        <motion.div {...reveal(0)} className="mb-5 mt-4 flex items-end justify-between">
          <h2 className="font-display text-[2.4rem] font-extrabold leading-none">environ<span className="thin">ments</span></h2>
          <span className="tag">3 lines · all green</span>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-3">
          {ENVIRONMENTS.map((e, i) => {
            const c = ENV[e.key].color;
            return (
              <motion.div key={e.key} {...reveal(i * 0.1)}>
                <TiltCard className="overflow-hidden p-6">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-30 blur-3xl" style={{ background: c }} />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <span className="tag" style={{ color: c }}>{ENV[e.key].label}</span>
                      <h3 className="mt-1.5 font-display text-[1.65rem] font-extrabold leading-none">{e.name}</h3>
                      <p className="mt-1.5 text-[0.82rem] font-medium text-fg-3">{e.since}</p>
                    </div>
                    <span className="chip text-ok"><span className="live-dot" /> healthy</span>
                  </div>

                  <p className="relative mt-8 font-display text-[3.2rem] font-extrabold leading-none">
                    <Odometer value={String(e.health)} delay={0.2 + i * 0.1} /><span className="text-[1.8rem] text-fg-3">%</span>
                  </p>
                  <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, color-mix(in oklab, ${c} 30%, transparent), ${c})`, boxShadow: `0 0 16px ${c}` }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${e.health}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.8, delay: 0.3 + i * 0.12, ease }}
                    />
                  </div>

                  <dl className="relative mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4">
                    <div>
                      <dt className="tag">Version</dt>
                      <dd className="mt-1 font-mono text-[0.85rem] font-semibold" style={{ color: c }}>{e.version}</dd>
                    </div>
                    <div>
                      <dt className="tag">Pods</dt>
                      <dd className="mt-1 font-display text-[1.15rem] font-extrabold num">{e.pods}</dd>
                    </div>
                  </dl>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
