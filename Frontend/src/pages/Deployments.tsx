import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, Check, GitCommit, Hammer, Package, Plus, RotateCcw, Server, ShieldCheck, X } from 'lucide-react';
import { Magnetic, RevealWords, SpotPanel } from '../components/fx';
import { ease, rise } from '../components/motion';
import { DeployStatusChip, EnvChip } from '../components/badges';
import { EmptyState, ErrorState, Modal, Pager, Segmented, Select, Skeleton, Spinner } from '../components/ui';
import DeployModal from '../components/DeployModal';
import { useToast } from '../components/Toaster';
import { useAuth } from '../context/AuthContext';
import { useApplications, useCancelDeployment, useDeployment, useDeploymentLogs, useDeployments, useRollback } from '../lib/queries';
import { errorMessage } from '../lib/api';
import { clock, dateTime, duration, timeAgo } from '../lib/format';
import type { Deployment, DeploymentStatus, EnvCode, Stage } from '../lib/types';

const STAGES: { key: Stage; label: string; icon: typeof Hammer }[] = [
  { key: 'BUILD', label: 'build & test', icon: Hammer },
  { key: 'IMAGE', label: 'push image', icon: Package },
  { key: 'DEPLOY', label: 'roll out', icon: Server },
  { key: 'VERIFY', label: 'verify', icon: ShieldCheck },
];

type StageState = 'done' | 'active' | 'failed' | 'cancelled' | 'pending';

function stageState(d: Deployment, s: Stage): StageState {
  const idx = STAGES.findIndex((x) => x.key === s);
  const cur = d.currentStage ? STAGES.findIndex((x) => x.key === d.currentStage) : -1;
  if (d.status === 'SUCCEEDED') return 'done';
  if (d.status === 'QUEUED') return 'pending';
  if (idx < cur) return 'done';
  if (idx > cur) return 'pending';
  return d.status === 'RUNNING' ? 'active' : d.status === 'FAILED' ? 'failed' : 'cancelled';
}

const STATE_COLOR: Record<StageState, string> = {
  done: 'var(--ok)', active: 'var(--sky)', failed: 'var(--bad)', cancelled: 'var(--text-3)', pending: 'var(--border-strong)',
};

function Progress({ d }: { d: Deployment }) {
  const color = d.status === 'FAILED' ? 'var(--bad)' : d.status === 'SUCCEEDED' ? 'var(--ok)' : d.status === 'CANCELLED' ? 'var(--text-3)' : 'var(--sky)';
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <motion.div className="h-full rounded-full" style={{ background: d.status === 'RUNNING' ? 'var(--grad)' : color, boxShadow: d.status === 'RUNNING' ? '0 0 12px var(--iris)' : undefined }}
        initial={false} animate={{ width: `${d.progress}%` }} transition={{ duration: 0.8, ease }} />
      {d.status === 'RUNNING' && (
        <motion.div className="absolute inset-y-0 w-16" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)' }}
          animate={{ left: ['-10%', '110%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }} />
      )}
    </div>
  );
}

function DeploymentDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: d } = useDeployment(id);
  const { data: logs } = useDeploymentLogs(id);
  const { can } = useAuth();
  const cancel = useCancelDeployment();
  const rollback = useRollback();
  const toast = useToast();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [logs?.length]);

  const active = d?.status === 'QUEUED' || d?.status === 'RUNNING';
  const mayAct = d && (can('ADMIN', 'DEVOPS') || (can('DEVELOPER') && d.environment.code !== 'PRODUCTION'));

  const doCancel = async () => {
    try { await cancel.mutateAsync(id); toast({ tone: 'info', title: 'Stopping deployment', body: 'It will halt at the next safe point.' }); }
    catch (e) { toast({ tone: 'error', title: 'Couldn’t cancel', body: errorMessage(e) }); }
  };
  const doRollback = async () => {
    try {
      const r = await rollback.mutateAsync({ id, reason: d?.failureReason ? 'automatic suggestion after failure' : undefined });
      toast({ tone: 'info', title: `Rolling back to ${r.version}`, body: `${r.application.name} on ${r.environment.displayName}` });
      onClose();
    } catch (e) { toast({ tone: 'error', title: 'Couldn’t roll back', body: errorMessage(e) }); }
  };

  return (
    <Modal open onClose={onClose} width={760}
      title={d ? <>{d.application.name} <span className="grad">{d.version}</span></> : <>deployment <span className="grad">#{id}</span></>}
      subtitle={d ? <span className="flex flex-wrap items-center gap-2"><EnvChip code={d.environment.code} /> <DeployStatusChip status={d.status} />
        <span className="text-fg-3">#{d.id} · by {d.triggeredBy?.fullName ?? 'system'} · {timeAgo(d.createdAt)}</span></span> : undefined}>
      {!d ? <Skeleton className="h-64" /> : (
        <div className="space-y-6">
          {/* stage timeline */}
          <div className="grid grid-cols-4 gap-2">
            {STAGES.map((s, i) => {
              const st = stageState(d, s.key);
              const Icon = st === 'done' ? Check : st === 'failed' ? X : st === 'cancelled' ? Ban : s.icon;
              return (
                <motion.div key={s.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, ease }}
                  className="relative flex flex-col items-center rounded-2xl border border-line bg-surface p-3 text-center">
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full border-2"
                    style={{ borderColor: STATE_COLOR[st], color: STATE_COLOR[st], boxShadow: st === 'active' ? '0 0 18px var(--sky)' : undefined }}>
                    {st === 'active' && <span className="absolute inset-0 animate-ping rounded-full border-2" style={{ borderColor: 'var(--sky)', opacity: 0.4 }} />}
                    <Icon className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  <span className="mt-2 text-[0.78rem] font-bold">{s.label}</span>
                  <span className="tag mt-0.5 !text-[0.58rem]">{st}</span>
                </motion.div>
              );
            })}
          </div>
          <Progress d={d} />

          {d.failureReason && (
            <div className="rounded-2xl border p-4 text-[0.875rem] font-semibold text-bad" style={{ borderColor: 'color-mix(in oklab, var(--bad) 35%, transparent)', background: 'color-mix(in oklab, var(--bad) 8%, transparent)' }}>
              {d.failureReason}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-4 text-[0.85rem] sm:grid-cols-4">
            <div><dt className="tag">Build</dt><dd className="mt-1 font-mono font-semibold">{d.buildNumber ? `#${d.buildNumber}` : '—'}</dd></div>
            <div><dt className="tag">Commit</dt><dd className="mt-1 flex items-center gap-1 font-mono font-semibold"><GitCommit className="h-3.5 w-3.5 text-fg-3" />{d.commitSha?.slice(0, 7) ?? '—'}</dd></div>
            <div><dt className="tag">Duration</dt><dd className="mt-1 font-semibold">{duration(d.durationSeconds)}</dd></div>
            <div><dt className="tag">Started</dt><dd className="mt-1 font-semibold">{dateTime(d.startedAt ?? d.createdAt)}</dd></div>
          </dl>
          {d.imageUri && <p className="truncate font-mono text-[0.75rem] text-fg-3">{d.imageUri}</p>}
          {d.notes && <p className="text-[0.875rem] font-medium text-fg-2">“{d.notes}”</p>}

          {/* live log */}
          <div>
            <p className="tag mb-2 flex items-center gap-2">Pipeline log {active && <span className="live-dot text-sky" />}</p>
            <div ref={logRef} data-lenis-prevent className="h-64 overflow-y-auto rounded-2xl border border-line bg-[#05060a] p-4 font-mono text-[0.75rem] leading-relaxed text-[#c9d1dc]">
              {!logs?.length && <p className="text-[#5d6470]">{active ? 'waiting for the first stage…' : 'no log lines were kept for this run'}</p>}
              <AnimatePresence initial={false}>
                {logs?.map((l) => (
                  <motion.div key={l.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex gap-3">
                    <span className="shrink-0 text-[#5d6470]">{clock(l.at)}</span>
                    <span className="w-14 shrink-0 text-[#8e8cff]">{l.stage}</span>
                    <span className={l.level === 'ERROR' ? 'text-[#ff6b72]' : l.level === 'WARN' ? 'text-[#f6bd5b]' : ''}>{l.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {mayAct && (
            <div className="flex flex-wrap justify-end gap-2">
              {active && (
                <button onClick={doCancel} disabled={cancel.isPending || d.cancelRequested} className="btn btn-ghost">
                  {cancel.isPending ? <Spinner /> : <Ban className="h-4 w-4" />} {d.cancelRequested ? 'stopping…' : 'cancel'}
                </button>
              )}
              {!active && (
                <button onClick={doRollback} disabled={rollback.isPending} className="btn btn-primary">
                  {rollback.isPending ? <Spinner /> : <RotateCcw className="h-4 w-4" />} roll back to previous
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function Deployments() {
  const [params, setParams] = useSearchParams();
  const { can } = useAuth();
  const [env, setEnv] = useState<EnvCode | 'ALL'>('ALL');
  const [status, setStatus] = useState<DeploymentStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [newOpen, setNewOpen] = useState(false);
  const appId = params.get('app') ? Number(params.get('app')) : undefined;
  const focus = params.get('focus') ? Number(params.get('focus')) : undefined;

  const { data: apps } = useApplications();
  const { data, isLoading, isError, error, refetch } = useDeployments({ applicationId: appId, environment: env, status, page, size: 20 });
  const appName = useMemo(() => apps?.content.find((a) => a.id === appId)?.name, [apps, appId]);

  const setParam = (k: string, v?: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <motion.p {...rise(0)} className="tag">Pipeline · {data?.totalElements ?? '…'} runs{appName ? ` · ${appName}` : ''}</motion.p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold leading-[0.98]">
            <RevealWords delay={0.06} parts={[{ t: 'every' }, { t: 'DEPARTURE,', className: 'grad' }, 'br', { t: 'every', className: 'thin' }, { t: 'arrival.' }]} />
          </h1>
        </div>
        {can('ADMIN', 'DEVOPS', 'DEVELOPER') && (
          <motion.div {...rise(0.3)} className="self-start md:self-auto">
            <Magnetic><button className="btn btn-primary" onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" strokeWidth={2.5} /> new deployment</button></Magnetic>
          </motion.div>
        )}
      </header>

      <motion.div {...rise(0.12)} className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Segmented id="dep-env" value={env} onChange={(v) => { setEnv(v); setPage(0); }} options={[
          { value: 'ALL', label: 'all lines' }, { value: 'DEV', label: 'dev' }, { value: 'STAGING', label: 'staging' }, { value: 'PRODUCTION', label: 'PROD' },
        ]} />
        <Select value={status} onChange={(e) => { setStatus(e.target.value as DeploymentStatus | 'ALL'); setPage(0); }} className="w-full lg:w-44">
          <option value="ALL">any status</option>
          <option value="RUNNING">running</option>
          <option value="QUEUED">queued</option>
          <option value="SUCCEEDED">arrived</option>
          <option value="FAILED">halted</option>
          <option value="CANCELLED">cancelled</option>
        </Select>
        <Select value={appId ?? ''} onChange={(e) => { setParam('app', e.target.value || undefined); setPage(0); }} className="w-full lg:ml-auto lg:w-60">
          <option value="">all applications</option>
          {apps?.content.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 !rounded-2xl" />)}</div>
      ) : !data?.content.length ? (
        <EmptyState title={<>no <span className="grad">TRAINS</span> yet</>} body="Nothing matches these filters. Start a deployment to see it move down the line." />
      ) : (
        <SpotPanel className="overflow-hidden">
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {data.content.map((d, i) => (
                <motion.li key={d.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03, ease }}>
                  <button onClick={() => setParam('focus', String(d.id))} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-6 py-4 text-left transition-colors hover:bg-surface-2 md:grid-cols-[5rem_1.6fr_7rem_1fr_7rem]">
                    <span className="hidden font-mono text-[0.8rem] text-fg-3 md:block">#{d.id}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{d.application.name} <span className="font-mono text-[0.78rem] font-medium text-fg-3">{d.version}</span></span>
                      <span className="mt-0.5 block truncate text-[0.78rem] font-medium text-fg-3">
                        {d.rollbackOfId ? `↩ rollback of #${d.rollbackOfId} · ` : ''}{d.triggeredBy?.fullName ?? 'system'} · {timeAgo(d.createdAt)}
                      </span>
                    </span>
                    <span className="hidden md:block"><EnvChip code={d.environment.code} /></span>
                    <span className="col-span-2 flex items-center gap-3 md:col-span-1">
                      <Progress d={d} />
                      <span className="w-10 shrink-0 text-right font-mono text-[0.72rem] text-fg-3">{d.progress}%</span>
                    </span>
                    <span className="row-start-1 justify-self-end md:row-auto"><DeployStatusChip status={d.status} /></span>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
        </SpotPanel>
      )}

      {focus && <DeploymentDetail id={focus} onClose={() => setParam('focus')} />}
      <DeployModal open={newOpen} appId={appId} onClose={() => setNewOpen(false)} />
    </div>
  );
}
