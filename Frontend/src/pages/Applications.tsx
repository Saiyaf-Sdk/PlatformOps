import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Server, GitBranch, User, ExternalLink } from 'lucide-react';
import { useApplications, useCreateApplication, type NewApplication } from '../lib/queries';
import type { AppStatus } from '../lib/types';
import { errorMessage, problemOf } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toaster';
import { Modal, Field, Input, Select, Segmented, Spinner, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { Magnetic, RevealWords } from '../components/fx';
import { rise } from '../components/motion';
import { AppStatusChip } from '../components/badges';
import DeployModal from '../components/DeployModal';

const RUNTIMES = [
  { key: 'ALL', label: 'all runtimes' },
  { key: 'java', label: 'Java' },
  { key: 'go', label: 'Go' },
  { key: 'python', label: 'Python' },
  { key: 'node', label: 'Node' },
];

type StatusFilter = 'ALL' | AppStatus;
const NAME_RULE = /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/;
const REPO_RULE = /^(https:\/\/[\w.-]+\/[\w.-]+\/[\w.-]+(\.git)?|[\w.-]+\/[\w.-]+)$/;

function RegisterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateApplication();
  const toast = useToast();
  const empty: NewApplication = { name: '', description: '', runtime: 'Java 21 / Spring Boot', ownerTeam: '', repoUrl: '' };
  const [form, setForm] = useState<NewApplication>(empty);
  const [touched, setTouched] = useState(false);
  const set = (k: keyof NewApplication) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const server = create.error ? problemOf(create.error).errors ?? {} : {};
  const errors: Partial<Record<keyof NewApplication, string>> = touched ? {
    name: !NAME_RULE.test(form.name) ? 'lowercase letters, numbers and dashes; must start with a letter' : server.name,
    description: !form.description.trim() ? 'say what it does' : server.description,
    ownerTeam: !form.ownerTeam.trim() ? 'which team owns it?' : server.ownerTeam,
    repoUrl: !REPO_RULE.test(form.repoUrl.trim()) ? 'owner/repo or an https git URL' : server.repoUrl,
  } : {};
  const valid = NAME_RULE.test(form.name) && form.description.trim() && form.ownerTeam.trim() && REPO_RULE.test(form.repoUrl.trim());

  const close = () => { onClose(); setForm(empty); setTouched(false); create.reset(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    try {
      const a = await create.mutateAsync({ ...form, description: form.description.trim(), ownerTeam: form.ownerTeam.trim(), repoUrl: form.repoUrl.trim() });
      toast({ tone: 'success', title: `${a.name} registered`, body: 'It’s ready for its first deployment.' });
      close();
    } catch { /* shown below */ }
  };

  return (
    <Modal open={open} onClose={close} title={<>register an <span className="grad">APP</span></>} subtitle="Add a service to the platform so it can ride the release line.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Name" error={errors.name} hint="becomes the Kubernetes deployment name">
          {(id) => <Input id={id} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toLowerCase() }))} placeholder="checkout-service" className="font-mono" autoComplete="off" />}
        </Field>
        <Field label="Description" error={errors.description}>
          {(id) => <Input id={id} value={form.description} onChange={set('description')} placeholder="Handles the checkout flow" maxLength={500} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Runtime">
            {(id) => (
              <Select id={id} value={form.runtime} onChange={set('runtime')}>
                {['Java 21 / Spring Boot', 'Go 1.22', 'Python 3.12', 'Node 20', 'Node 20 / React', 'Rust 1.80', '.NET 8'].map((r) => <option key={r}>{r}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Owner team" error={errors.ownerTeam}>
            {(id) => <Input id={id} value={form.ownerTeam} onChange={set('ownerTeam')} placeholder="Platform Team" maxLength={80} />}
          </Field>
        </div>
        <Field label="Repository" error={errors.repoUrl}>
          {(id) => <Input id={id} value={form.repoUrl} onChange={set('repoUrl')} placeholder="org/checkout-service" className="font-mono" />}
        </Field>
        {create.error && !Object.keys(server).length && <p className="text-[0.85rem] font-semibold text-bad">{errorMessage(create.error)}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-ghost" onClick={close}>cancel</button>
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>{create.isPending ? <Spinner /> : <Plus className="h-4 w-4" />} register</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Applications() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [runtime, setRuntime] = useState('ALL');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [deployFor, setDeployFor] = useState<number | null>(null);

  const { can } = useAuth();
  const { data, isLoading, isError, error, refetch } = useApplications();

  const apps = useMemo(() => data?.content ?? [], [data]);
  const counts = useMemo(() => ({
    ALL: apps.length,
    HEALTHY: apps.filter((a) => a.status === 'HEALTHY').length,
    WARNING: apps.filter((a) => a.status === 'WARNING').length,
    CRITICAL: apps.filter((a) => a.status === 'CRITICAL').length,
  }), [apps]);

  const filtered = apps.filter((app) => {
    const q = search.toLowerCase();
    return (app.name.toLowerCase().includes(q) || app.ownerTeam.toLowerCase().includes(q))
      && (status === 'ALL' || app.status === status)
      && (runtime === 'ALL' || app.runtime.toLowerCase().includes(runtime));
  });

  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <motion.p {...rise(0)} className="tag">Service catalogue · {apps.length} registered</motion.p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold leading-[0.98]">
            <RevealWords delay={0.06} parts={[{ t: 'every' }, { t: 'SERVICE,', className: 'grad' }, 'br', { t: 'one', className: 'thin' }, { t: 'place.' }]} />
          </h1>
        </div>
        {can('ADMIN', 'DEVOPS', 'DEVELOPER') && (
          <motion.div {...rise(0.3)} className="self-start md:self-auto">
            <Magnetic>
              <button className="btn btn-primary" onClick={() => setRegisterOpen(true)}><Plus className="h-4 w-4" strokeWidth={2.5} /> register app</button>
            </Magnetic>
          </motion.div>
        )}
      </header>

      <motion.div {...rise(0.12)} className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Segmented id="app-filter" value={status} onChange={setStatus} options={[
          { value: 'ALL', label: 'all', count: counts.ALL },
          { value: 'HEALTHY', label: 'healthy', count: counts.HEALTHY },
          { value: 'WARNING', label: 'degraded', count: counts.WARNING },
          { value: 'CRITICAL', label: 'failing', count: counts.CRITICAL },
        ]} />
        <Select value={runtime} onChange={(e) => setRuntime(e.target.value)} className="w-full lg:w-48">
          {RUNTIMES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </Select>
        <label className="flex h-11 w-full items-center gap-2.5 rounded-full border border-line-strong bg-surface px-4 text-fg-3 transition-colors focus-within:border-iris lg:ml-auto lg:max-w-xs">
          <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="filter by name or team"
            className="w-full bg-transparent text-[0.9rem] font-medium text-fg placeholder:text-fg-3 focus:outline-none" />
        </label>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-80 !rounded-3xl" />)}</div>
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
              onClick={() => navigate(`/applications/${app.id}`)}
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
                <AppStatusChip status={app.status} />
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
                  <span className="text-white text-xs font-medium">{app.ownerTeam}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#94A3B8] text-xs"><GitBranch className="w-3 h-3" /> Repository</span>
                  <span className="text-[#00F0FF] text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{app.repoUrl}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#94A3B8] text-xs"><Server className="w-3 h-3" /> Production</span>
                  <span className="text-white text-xs font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{app.currentVersion ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8] text-xs">Last Deploy</span>
                  <span className="text-[#475569] text-xs">{app.lastDeployedAt ?? '—'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState title={<>nothing on this <span className="grad">LINE</span></>}
          body={apps.length ? 'Try another search, or clear the filters.' : 'Register your first service to get started.'}
          action={apps.length
            ? <button onClick={() => { setSearch(''); setStatus('ALL'); setRuntime('ALL'); }} className="btn btn-ghost">clear filters</button>
            : can('ADMIN', 'DEVOPS', 'DEVELOPER') && <button onClick={() => setRegisterOpen(true)} className="btn btn-primary"><Plus className="h-4 w-4" /> register app</button>} />
      )}

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <DeployModal open={deployFor !== null} appId={deployFor ?? undefined} onClose={() => setDeployFor(null)} />
    </div>
  );
}
