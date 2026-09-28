import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Plus, UserPlus } from 'lucide-react';
import { Magnetic, RevealWords, SpotPanel } from '../components/fx';
import { ease, rise } from '../components/motion';
import { ErrorState, Field, Input, Modal, Select, Skeleton, Spinner } from '../components/ui';
import { useToast } from '../components/Toaster';
import { useAuth } from '../context/AuthContext';
import { useCreateUser, useUnlockUser, useUpdateUser, useUsers } from '../lib/queries';
import { errorMessage, problemOf } from '../lib/api';
import { ROLE_LABEL, initials, timeAgo } from '../lib/format';
import type { Role } from '../lib/types';

const ROLES: Role[] = ['ADMIN', 'DEVOPS', 'DEVELOPER', 'VIEWER'];
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateUser();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'DEVELOPER' as Role });
  const [touched, setTouched] = useState(false);
  const server = create.error ? problemOf(create.error) : null;
  const errs = touched ? {
    email: !/^\S+@\S+\.\S+$/.test(form.email) ? 'enter a valid email' : server?.code === 'email_taken' ? server.detail : server?.errors?.email,
    fullName: form.fullName.trim().length < 2 ? 'at least 2 characters' : undefined,
    password: !PASSWORD_RULE.test(form.password) ? '8–72 characters with a letter and a number' : undefined,
  } : {};
  const close = () => { onClose(); setForm({ email: '', fullName: '', password: '', role: 'DEVELOPER' }); setTouched(false); create.reset(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!/^\S+@\S+\.\S+$/.test(form.email) || form.fullName.trim().length < 2 || !PASSWORD_RULE.test(form.password)) return;
    try {
      const u = await create.mutateAsync({ ...form, email: form.email.trim(), fullName: form.fullName.trim() });
      toast({ tone: 'success', title: `${u.fullName} added`, body: `Signed up as ${ROLE_LABEL[u.role]}. Share the temporary password securely.` });
      close();
    } catch { /* inline */ }
  };

  return (
    <Modal open={open} onClose={close} title={<>add a <span className="grad">PERSON</span></>} subtitle="They can sign in straight away with the password you set.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" error={errs.fullName}>{(id) => <Input id={id} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />}</Field>
        <Field label="Work email" error={errs.email}>{(id) => <Input id={id} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Temporary password" error={errs.password}>{(id) => <Input id={id} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" className="font-mono" />}</Field>
          <Field label="Role">{(id) => <Select id={id} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Select>}</Field>
        </div>
        {server && server.code !== 'email_taken' && !server.errors && <p className="text-[0.85rem] font-semibold text-bad">{errorMessage(create.error)}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-ghost" onClick={close}>cancel</button>
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>{create.isPending ? <Spinner /> : <UserPlus className="h-4 w-4" />} add person</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const { data, isLoading, isError, error, refetch } = useUsers();
  const update = useUpdateUser();
  const unlock = useUnlockUser();
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);

  const run = async (p: Promise<unknown>, ok: string) => {
    try { await p; toast({ tone: 'success', title: ok }); } catch (e) { toast({ tone: 'error', title: 'Not changed', body: errorMessage(e) }); }
  };

  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <motion.p {...rise(0)} className="tag">People & access · {data?.totalElements ?? '…'} accounts</motion.p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold leading-[0.98]">
            <RevealWords delay={0.06} parts={[{ t: 'the right' }, { t: 'KEYS,', className: 'grad' }, 'br', { t: 'the right', className: 'thin' }, { t: 'hands.' }]} />
          </h1>
        </div>
        <motion.div {...rise(0.3)} className="self-start md:self-auto">
          <Magnetic><button className="btn btn-primary" onClick={() => setInviteOpen(true)}><Plus className="h-4 w-4" strokeWidth={2.5} /> add person</button></Magnetic>
        </motion.div>
      </header>

      {isLoading ? <Skeleton className="h-96 !rounded-3xl" /> : (
        <SpotPanel className="overflow-hidden">
          <ul className="divide-y divide-line">
            {data?.content.map((u, i) => {
              const self = u.id === me?.id;
              return (
                <motion.li key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03, ease }}
                  className={`flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center ${u.enabled ? '' : 'opacity-60'}`}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky via-iris to-lilac font-display text-[0.95rem] font-extrabold text-white">{initials(u.fullName)}</span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{u.fullName} {self && <span className="tag ml-1">you</span>}</p>
                      <p className="truncate text-[0.8rem] font-medium text-fg-3">{u.email} · {u.lastLoginAt ? `seen ${timeAgo(u.lastLoginAt)}` : 'never signed in'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {u.locked && (
                      <button className="btn btn-ghost h-9 text-[0.8rem] !text-bad" onClick={() => run(unlock.mutateAsync(u.id), `${u.fullName} unlocked`)}>
                        <Lock className="h-3.5 w-3.5" /> unlock
                      </button>
                    )}
                    <select value={u.role} disabled={self || update.isPending} aria-label="Role"
                      onChange={(e) => run(update.mutateAsync({ id: u.id, role: e.target.value as Role }), `${u.fullName} is now ${ROLE_LABEL[e.target.value as Role]}`)}
                      className="field h-9 w-40 cursor-pointer !rounded-full py-0 text-[0.8rem] font-semibold">
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                    <button disabled={self || update.isPending}
                      onClick={() => run(update.mutateAsync({ id: u.id, enabled: !u.enabled }), `${u.fullName} ${u.enabled ? 'disabled' : 'enabled'}`)}
                      className={`btn h-9 text-[0.8rem] ${u.enabled ? 'btn-ghost' : 'btn-primary'}`}>
                      {u.enabled ? 'disable' : 'enable'}
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </SpotPanel>
      )}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
