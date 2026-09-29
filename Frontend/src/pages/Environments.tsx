import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Boxes, Cpu, Server } from 'lucide-react';
import { Odometer, RevealWords, SpotPanel, TiltCard } from '../components/fx';
import { ease, reveal, rise } from '../components/motion';
import { DeployStatusChip } from '../components/badges';
import { ErrorState, Skeleton } from '../components/ui';
import { useDeployments, useEnvironments } from '../lib/queries';
import { errorMessage } from '../lib/api';
import { ENV_META, timeAgo } from '../lib/format';
import type { Environment } from '../lib/types';

function Recent({ env }: { env: Environment }) {
  const { data, isLoading } = useDeployments({ environment: env.code, size: 5 });
  return (
    <ul className="divide-y divide-line">
      {isLoading && [0, 1, 2].map((i) => <li key={i} className="py-3"><Skeleton className="h-5" /></li>)}
      {data?.content.map((d) => (
        <li key={d.id}>
          <Link to={`/deployments?focus=${d.id}`} className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-accent-text">
            <span className="min-w-0 truncate text-[0.875rem] font-bold">{d.application.name} <span className="font-mono text-[0.75rem] font-medium text-fg-3">{d.version}</span></span>
            <span className="flex shrink-0 items-center gap-2"><span className="text-[0.75rem] text-fg-3">{timeAgo(d.createdAt)}</span><DeployStatusChip status={d.status} /></span>
          </Link>
        </li>
      ))}
      {data && !data.content.length && <li className="py-3 text-[0.85rem] text-fg-3">no deployments yet</li>}
    </ul>
  );
}

export default function Environments() {
  const { data, isLoading, isError, error, refetch } = useEnvironments();
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <header>
        <motion.p {...rise(0)} className="tag">k3s clusters · {data?.length ?? '…'} lines</motion.p>
        <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold leading-[0.98]">
          <RevealWords delay={0.06} parts={[{ t: 'three' }, { t: 'LINES,', className: 'grad' }, 'br', { t: 'one', className: 'thin' }, { t: 'journey.' }]} />
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[30rem] !rounded-3xl" />)}
        {data?.map((e, i) => {
          const m = ENV_META[e.code];
          const statusCls = e.status === 'HEALTHY' ? 'text-ok' : e.status === 'DEGRADED' ? 'text-warn' : 'text-bad';
          return (
            <motion.div key={e.code} {...rise(0.15 + i * 0.08)} className="flex flex-col gap-4">
              <TiltCard className="overflow-hidden p-6">
                <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full opacity-30 blur-3xl" style={{ background: m.color }} />
                <div className="relative flex items-start justify-between">
                  <div>
                    <span className="tag" style={{ color: m.color }}>{m.short}{e.requiresApproval ? ' · GATED' : ''}</span>
                    <h2 className="mt-1.5 font-display text-[2rem] font-extrabold leading-none">{m.label}</h2>
                  </div>
                  <span className={`chip ${statusCls}`}><span className="live-dot" /> {e.status.toLowerCase()}</span>
                </div>
                <p className="relative mt-8 font-display text-[4rem] font-extrabold leading-none">
                  <Odometer value={String(e.healthScore)} delay={0.3 + i * 0.1} /><span className="text-[2rem] text-fg-3">%</span>
                </p>
                <p className="tag relative mt-1">health score</p>
                <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <motion.div className="h-full rounded-full" style={{ background: m.color, boxShadow: `0 0 16px ${m.color}` }}
                    initial={{ width: 0 }} animate={{ width: `${e.healthScore}%` }} transition={{ duration: 1.6, delay: 0.4 + i * 0.1, ease }} />
                </div>
                <dl className="relative mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[0.85rem]">
                  <div><dt className="tag flex items-center gap-1"><Server className="h-3 w-3" />Cluster</dt><dd className="mt-1 font-mono font-semibold">{e.cluster}</dd></div>
                  <div><dt className="tag flex items-center gap-1"><Boxes className="h-3 w-3" />Namespace</dt><dd className="mt-1 truncate font-mono font-semibold">{e.namespace}</dd></div>
                  <div><dt className="tag flex items-center gap-1"><Cpu className="h-3 w-3" />Pods</dt><dd className="mt-1 font-display text-[1.2rem] font-extrabold">{e.podsRunning}</dd></div>
                  <div><dt className="tag">Version</dt><dd className="mt-1 truncate font-mono font-semibold" style={{ color: m.color }}>{e.currentVersion ?? '—'}</dd></div>
                </dl>
                <p className="relative mt-4 text-[0.8rem] font-medium text-fg-3">{e.lastDeployedAt ? `last rollout ${timeAgo(e.lastDeployedAt)}` : 'nothing deployed yet'}</p>
              </TiltCard>
              <motion.div {...reveal(0.1)}>
                <SpotPanel className="p-5">
                  <p className="tag mb-1">Recent on this line</p>
                  <Recent env={e} />
                </SpotPanel>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, ease }} className="text-center text-[0.8rem] font-medium text-fg-3">
        Production is gated: a version must pass Staging before it can be promoted.
      </motion.p>
    </div>
  );
}
