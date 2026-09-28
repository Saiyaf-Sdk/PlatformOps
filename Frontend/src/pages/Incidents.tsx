import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, Plus, RotateCcw, Siren } from 'lucide-react';
import { Magnetic, RevealWords, SpotPanel } from '../components/fx';
import { ease, rise } from '../components/motion';
import { EnvChip, IncidentStatusChip, SeverityChip } from '../components/badges';
import { EmptyState, ErrorState, Field, Input, Modal, Segmented, Select, Skeleton, Spinner, Textarea } from '../components/ui';
import { useToast } from '../components/Toaster';
import { useAuth } from '../context/AuthContext';
import { useApplications, useCreateIncident, useIncidents, useUpdateIncident, useUsers } from '../lib/queries';
import { errorMessage } from '../lib/api';
import { timeAgo } from '../lib/format';
import type { EnvCode, Incident, IncidentStatus, Severity } from '../lib/types';

function NewIncidentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateIncident();
  const { data: apps } = useApplications();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('SEV3');
  const [appId, setAppId] = useState<number | ''>('');
  const [env, setEnv] = useState<EnvCode | ''>('');
  const [touched, setTouched] = useState(false);

  const close = () => { onClose(); setTitle(''); setDescription(''); setSeverity('SEV3'); setAppId(''); setEnv(''); setTouched(false); create.reset(); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!title.trim()) return;
    try {
      await create.mutateAsync({ title: title.trim(), description: description.trim() || undefined, severity, applicationId: appId || undefined, environment: env || undefined });
      toast({ tone: 'warn', title: 'Incident opened', body: title.trim() });
      close();
    } catch { /* inline */ }
  };

  return (
    <Modal open={open} onClose={close} title={<>report an <span className="grad">INCIDENT</span></>} subtitle="Something's wrong? Get it on the board so the right people see it.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="What's happening?" error={touched && !title.trim() ? 'give it a short title' : undefined}>
          {(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="Checkout returns 503 for some users" />}
        </Field>
        <div>
          <p className="tag mb-2">Severity</p>
          <Segmented id="new-sev" value={severity} onChange={setSeverity} options={[
            { value: 'SEV1', label: 'SEV1' }, { value: 'SEV2', label: 'SEV2' }, { value: 'SEV3', label: 'SEV3' }, { value: 'SEV4', label: 'SEV4' },
          ]} />
          <p className="mt-2 text-[0.78rem] font-medium text-fg-3">SEV1 = customers are down · SEV4 = minor annoyance</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Application">
            {(id) => <Select id={id} value={appId} onChange={(e) => setAppId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">not specific</option>
              {apps?.content.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>}
          </Field>
          <Field label="Environment">
            {(id) => <Select id={id} value={env} onChange={(e) => setEnv(e.target.value as EnvCode | '')}>
              <option value="">not specific</option><option value="DEV">dev</option><option value="STAGING">staging</option><option value="PRODUCTION">production</option>
            </Select>}
          </Field>
        </div>
        <Field label="Details (optional)">
          {(id) => <Textarea id={id} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="what you saw, when it started, links…" />}
        </Field>
        {create.error && <p className="text-[0.85rem] font-semibold text-bad">{errorMessage(create.error)}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-ghost" onClick={close}>cancel</button>
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>{create.isPending ? <Spinner /> : <Siren className="h-4 w-4" />} open incident</button>
        </div>
      </form>
    </Modal>
  );
}

function IncidentRow({ i, index }: { i: Incident; index: number }) {
  const { can } = useAuth();
  const update = useUpdateIncident();
  const { data: people } = useUsers();
  const toast = useToast();
  const manage = can('ADMIN', 'DEVOPS');

  const act = async (body: Parameters<typeof update.mutateAsync>[0], msg: string) => {
    try { await update.mutateAsync(body); toast({ tone: 'success', title: msg, body: i.title }); }
    catch (e) { toast({ tone: 'error', title: 'Update failed', body: errorMessage(e) }); }
  };

  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ delay: Math.min(index, 8) * 0.04, ease }}
      className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center">
      <div className="flex shrink-0 items-center gap-2 lg:w-44">
        <SeverityChip severity={i.severity} />
        <IncidentStatusChip status={i.status} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold leading-snug">{i.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.78rem] font-medium text-fg-3">
          {i.application && <span className="font-mono">{i.application.name}</span>}
          {i.environment && <EnvChip code={i.environment.code} />}
          <span>opened {timeAgo(i.createdAt)}{i.reportedBy ? ` by ${i.reportedBy.fullName}` : ' by the pipeline'}</span>
          {i.resolvedAt && <span>· resolved {timeAgo(i.resolvedAt)}</span>}
          {i.deploymentId && <Link to={`/deployments?focus=${i.deploymentId}`} className="text-accent-text hover:underline">deployment #{i.deploymentId}</Link>}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {manage ? (
          <select
            value={i.assignee?.id ?? ''}
            disabled={update.isPending}
            onChange={(e) => act(e.target.value ? { id: i.id, assigneeId: Number(e.target.value) } : { id: i.id, unassign: true }, 'Assignee updated')}
            className="field h-9 w-40 cursor-pointer !rounded-full py-0 text-[0.8rem] font-semibold"
            aria-label="Assignee">
            <option value="">unassigned</option>
            {people?.content.filter((p) => p.enabled).map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
        ) : (
          <span className="text-[0.8rem] font-semibold text-fg-2">{i.assignee?.fullName ?? 'unassigned'}</span>
        )}
        {manage && i.status === 'OPEN' && (
          <button className="btn btn-ghost h-9 text-[0.8rem]" disabled={update.isPending} onClick={() => act({ id: i.id, status: 'ACKNOWLEDGED' }, 'Acknowledged')}><Eye className="h-3.5 w-3.5" /> ack</button>
        )}
        {manage && i.status !== 'RESOLVED' && (
          <button className="btn btn-primary h-9 text-[0.8rem]" disabled={update.isPending} onClick={() => act({ id: i.id, status: 'RESOLVED' }, 'Resolved')}><CheckCircle2 className="h-3.5 w-3.5" /> resolve</button>
        )}
        {manage && i.status === 'RESOLVED' && (
          <button className="btn btn-ghost h-9 text-[0.8rem]" disabled={update.isPending} onClick={() => act({ id: i.id, status: 'OPEN' }, 'Reopened')}><RotateCcw className="h-3.5 w-3.5" /> reopen</button>
        )}
      </div>
    </motion.li>
  );
}

export default function Incidents() {
  const { can } = useAuth();
  const [view, setView] = useState<'OPEN_ONLY' | IncidentStatus | 'ALL'>('OPEN_ONLY');
  const [newOpen, setNewOpen] = useState(false);
  const filters = view === 'OPEN_ONLY' ? { openOnly: true } : view === 'ALL' ? {} : { status: view };
  const { data, isLoading, isError, error, refetch } = useIncidents(filters);

  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <motion.p {...rise(0)} className="tag">On-call board</motion.p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold leading-[0.98]">
            <RevealWords delay={0.06} parts={[{ t: 'calm' }, { t: 'RESPONSE,', className: 'grad' }, 'br', { t: 'fast', className: 'thin' }, { t: 'recovery.' }]} />
          </h1>
        </div>
        {can('ADMIN', 'DEVOPS', 'DEVELOPER') && (
          <motion.div {...rise(0.3)} className="self-start md:self-auto">
            <Magnetic><button className="btn btn-primary" onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" strokeWidth={2.5} /> report incident</button></Magnetic>
          </motion.div>
        )}
      </header>

      <motion.div {...rise(0.12)}>
        <Segmented id="inc-view" value={view} onChange={setView} options={[
          { value: 'OPEN_ONLY', label: 'needs attention' }, { value: 'OPEN', label: 'open' }, { value: 'ACKNOWLEDGED', label: 'acknowledged' },
          { value: 'RESOLVED', label: 'resolved' }, { value: 'ALL', label: 'all' },
        ]} />
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 !rounded-2xl" />)}</div>
      ) : !data?.content.length ? (
        <EmptyState title={<>all <span className="grad">QUIET</span></>} body={view === 'OPEN_ONLY' ? 'No open incidents. Enjoy it.' : 'Nothing here with this filter.'} />
      ) : (
        <SpotPanel className="overflow-hidden">
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {data.content.map((i, idx) => <IncidentRow key={i.id} i={i} index={idx} />)}
            </AnimatePresence>
          </ul>
        </SpotPanel>
      )}
      <NewIncidentModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
