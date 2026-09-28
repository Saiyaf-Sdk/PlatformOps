import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ShieldAlert } from 'lucide-react';
import { Field, Input, Modal, Segmented, Select, Spinner, Textarea } from './ui';
import { useAuth } from '../context/AuthContext';
import { useApplications, useCreateDeployment } from '../lib/queries';
import { errorMessage, problemOf } from '../lib/api';
import { useToast } from './Toaster';
import type { EnvCode } from '../lib/types';

const VERSION = /^v?\d{1,4}\.\d{1,4}\.\d{1,4}([-+.][0-9A-Za-z.-]{1,40})?$/;

export default function DeployModal({ open, onClose, appId, env: initialEnv }: {
  open: boolean; onClose: () => void; appId?: number; env?: EnvCode;
}) {
  const { can } = useAuth();
  const { data: apps } = useApplications();
  const create = useCreateDeployment();
  const toast = useToast();
  const navigate = useNavigate();

  const [applicationId, setApplicationId] = useState<number | ''>(appId ?? '');
  const [env, setEnv] = useState<EnvCode>(initialEnv ?? 'DEV');
  const [version, setVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [force, setForce] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setApplicationId(appId ?? '');
      setEnv(initialEnv ?? 'DEV');
      setVersion('');
      setNotes('');
      setForce(false);
      setTouched(false);
      create.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appId, initialEnv]);

  const app = useMemo(() => apps?.content.find((a) => a.id === applicationId), [apps, applicationId]);
  const canProd = can('ADMIN', 'DEVOPS');
  const versionError = touched && !VERSION.test(version.trim()) ? 'use a semantic version like v2.1.0 or 1.4.0-rc1' : undefined;
  const serverProblem = create.error ? problemOf(create.error) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!applicationId || !VERSION.test(version.trim())) return;
    try {
      const d = await create.mutateAsync({ applicationId: Number(applicationId), environment: env, version: version.trim(), notes: notes.trim() || undefined, force: force || undefined });
      toast({ tone: 'info', title: `${d.application.name} ${d.version} is boarding`, body: `Heading to ${d.environment.displayName}. You can watch it live.` });
      onClose();
      navigate(`/deployments?focus=${d.id}`);
    } catch { /* shown inline */ }
  };

  return (
    <Modal open={open} onClose={onClose} title={<>new <span className="grad">DEPLOYMENT</span></>}
      subtitle="Build, push, roll out and verify — you'll see every stage live.">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Application" error={touched && !applicationId ? 'pick an application' : undefined}>
          {(id) => (
            <Select id={id} value={applicationId} onChange={(e) => setApplicationId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">choose a service…</option>
              {apps?.content.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          )}
        </Field>

        <div>
          <p className="tag mb-2">Destination</p>
          <Segmented id="deploy-env" value={env} onChange={setEnv} options={[
            { value: 'DEV', label: 'dev' },
            { value: 'STAGING', label: 'staging' },
            ...(canProd ? [{ value: 'PRODUCTION' as EnvCode, label: 'PROD' }] : []),
          ]} />
          {!canProd && <p className="mt-2 text-[0.78rem] font-medium text-fg-3">Developers ship to dev and staging. DevOps promotes to production.</p>}
          {env === 'PRODUCTION' && <p className="mt-2 flex items-center gap-1.5 text-[0.8rem] font-semibold text-warn"><ShieldAlert className="h-3.5 w-3.5" /> The same version must have passed Staging first.</p>}
        </div>

        <Field label="Version" error={versionError} hint={app?.currentVersion ? <>production runs <b className="font-mono text-fg-2">{app.currentVersion}</b></> : undefined}>
          {(id) => <Input id={id} value={version} onChange={(e) => setVersion(e.target.value)} onBlur={() => setTouched(true)} placeholder="v2.1.0" autoComplete="off" className="font-mono" />}
        </Field>

        <Field label="Notes (optional)">
          {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="what's in this release?" />}
        </Field>

        {env === 'PRODUCTION' && can('ADMIN') && (
          <label className="flex cursor-pointer items-center gap-2.5 text-[0.85rem] font-medium text-fg-2">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="h-4 w-4 accent-[var(--iris)]" />
            skip the staging check (admin override — audited)
          </label>
        )}

        {serverProblem && (
          <div className="rounded-2xl border border-bad/30 bg-surface p-4 text-[0.875rem] font-semibold text-bad" style={{ borderColor: 'color-mix(in oklab, var(--bad) 35%, transparent)' }}>
            {errorMessage(create.error)}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">cancel</button>
          <button type="submit" disabled={create.isPending} className="btn btn-primary">
            {create.isPending ? <Spinner /> : <Rocket className="h-4 w-4" />} deploy
          </button>
        </div>
      </form>
    </Modal>
  );
}
