import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CheckCircle2, Circle, Database, GitBranch, Rocket, Server, ShieldCheck, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

type Tone = 'cyan' | 'green' | 'amber' | 'red';
const colors: Record<Tone, { color: string; bg: string; border: string }> = {
  cyan: { color: '#00F0FF', bg: 'rgba(0,240,255,0.08)', border: 'rgba(0,240,255,0.2)' },
  green: { color: '#00FFA3', bg: 'rgba(0,255,163,0.08)', border: 'rgba(0,255,163,0.2)' },
  amber: { color: '#FFB800', bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.2)' },
  red: { color: '#FF3366', bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.2)' },
};
const panel = { background: 'rgba(17,29,49,0.8)', border: '1px solid rgba(255,255,255,0.06)' };

function Badge({ label, tone = 'cyan' }: { label: string; tone?: Tone }) {
  const style = colors[tone];
  return <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}><Circle className="h-1.5 w-1.5 fill-current" />{label}</span>;
}
function Header({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#00F0FF]">{eyebrow}</p><h1 className="text-2xl font-bold text-white">{title}</h1><p className="mt-1 text-sm text-[#94A3B8]">{description}</p></div>{action}</motion.div>;
}
function Back({ to, label }: { to: string; label: string }) { return <Link to={to} className="inline-flex items-center gap-2 text-xs text-[#64748B] hover:text-[#00F0FF]"><ArrowLeft className="h-3.5 w-3.5" />{label}</Link>; }
function Info({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) { return <div className="rounded-xl p-4" style={panel}><Icon className="h-4 w-4 text-[#00F0FF]" /><p className="mt-3 text-[10px] uppercase tracking-widest text-[#64748B]">{label}</p><p className="mt-1 text-sm text-white">{value}</p></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs text-[#94A3B8]">{label}</span>{children}</label>; }

import { useApplication, useDeployments, useEnvironments } from '../lib/queries';
import { AppStatusChip, DeployStatusChip, EnvChip } from '../components/badges';
import { Skeleton, ErrorState } from '../components/ui';
import DeployModal from '../components/DeployModal';
import { timeAgo, dateTime } from '../lib/format';
import { useAuth } from '../context/AuthContext';

export function ApplicationDetails() {
  const { applicationId } = useParams();
  const appId = Number(applicationId);
  const { data: app, isLoading, isError, refetch } = useApplication(appId);
  const { data: deployments } = useDeployments({ applicationId: appId });
  const { data: environments } = useEnvironments();
  const { can } = useAuth();
  const [tab, setTab] = useState<'Overview' | 'Environments' | 'Deployments'>('Overview');
  const [deployEnv, setDeployEnv] = useState<'DEV' | 'STAGING' | 'PRODUCTION' | undefined>(undefined);
  const [deployOpen, setDeployOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Back to="/applications" label="Back to applications" />
        <Skeleton className="h-16 w-1/3" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !app) {
    return (
      <div className="space-y-6">
        <Back to="/applications" label="Back to applications" />
        <ErrorState message="Could not load application details. The application may not exist." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Back to="/applications" label="Back to applications" />
      <Header
        eyebrow="Applications / Service Catalogue"
        title={app.name}
        description={app.description}
        action={
          <div className="flex items-center gap-3">
            <AppStatusChip status={app.status} />
            {can('ADMIN', 'DEVOPS', 'DEVELOPER') && (
              <button
                onClick={() => { setDeployEnv(undefined); setDeployOpen(true); }}
                className="btn btn-primary text-xs"
              >
                <Rocket className="h-3.5 w-3.5" /> deploy release
              </button>
            )}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="flex gap-1 border-b border-[rgba(255,255,255,0.08)]">
            {(['Overview', 'Environments', 'Deployments'] as const).map(item => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`px-4 py-3 text-xs font-semibold ${tab === item ? 'border-b-2 border-[#00F0FF] text-[#00F0FF]' : 'text-[#64748B]'}`}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === 'Overview' && (
            <div className="grid grid-cols-2 gap-4">
              <Info label="Runtime" value={app.runtime} icon={Terminal} />
              <Info label="Owner team" value={app.ownerTeam} icon={ShieldCheck} />
              <Info label="Repository" value={app.repoUrl} icon={GitBranch} />
              <Info label="Production release" value={app.currentVersion ?? 'Not deployed yet'} icon={Rocket} />
            </div>
          )}

          {tab === 'Environments' && (
            <div className="space-y-3">
              {environments?.map(env => (
                <div key={env.code} className="flex items-center justify-between gap-4 rounded-xl p-4" style={panel}>
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-[#00F0FF]" />
                    <div>
                      <p className="text-sm font-semibold text-white">{env.displayName} <span className="font-mono text-xs text-[#64748B]">({env.namespace})</span></p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{env.cluster} · {env.podsRunning} pods</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <EnvChip code={env.code} />
                    {can('ADMIN', 'DEVOPS', 'DEVELOPER') && (
                      <button
                        onClick={() => { setDeployEnv(env.code); setDeployOpen(true); }}
                        className="btn btn-ghost text-xs py-1 px-3"
                      >
                        Deploy to {env.code}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Deployments' && (
            <div className="space-y-3">
              {deployments && deployments.content.length > 0 ? (
                deployments.content.map(d => (
                  <Link
                    key={d.id}
                    to={`/deployments?focus=${d.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl p-4 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                    style={panel}
                  >
                    <div className="flex items-center gap-3">
                      <Rocket className="h-4 w-4 text-[#00F0FF]" />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          #{d.id} <span className="font-mono text-[#00F0FF]">{d.version}</span>
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {d.triggeredBy?.fullName ?? 'system'} · {timeAgo(d.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <EnvChip code={d.environment.code} />
                      <DeployStatusChip status={d.status} />
                      <ArrowUpRight className="h-4 w-4 text-[#64748B]" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#64748B]" style={panel}>
                  No deployments recorded for this application yet.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl p-5" style={panel}>
            <p className="text-[10px] uppercase tracking-widest text-[#64748B]">Service health</p>
            <p className="mt-2 text-3xl font-bold text-white capitalize">{app.status.toLowerCase()}</p>
            <p className="mt-1 text-xs text-[#00FFA3]">Registered {timeAgo(app.createdAt)}</p>
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2 text-xs">
              <p className="flex justify-between">
                <span className="text-[#64748B]">Last deployment:</span>
                <span className="text-white">{app.lastDeployedAt ? timeAgo(app.lastDeployedAt) : 'Never'}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#64748B]">Last updated:</span>
                <span className="text-white">{dateTime(app.updatedAt)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <DeployModal
        open={deployOpen}
        appId={app.id}
        env={deployEnv}
        onClose={() => setDeployOpen(false)}
      />
    </div>
  );
}

export function DeploymentDetails() {
  const { deploymentId = '1' } = useParams();
  return <Navigate to={`/deployments?focus=${deploymentId}`} replace />;
}

export function InfrastructureRequests() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState('');
  return <div className="space-y-6"><Back to="/infrastructure" label="Back to infrastructure" /><Header eyebrow="Operations / Self Service" title="Infrastructure Requests" description="Request approved platform resources without a manual ticket handoff." action={<Badge label="SLA: 1 business day" />} /><div className="grid gap-5 lg:grid-cols-3"><div className="rounded-xl p-5 lg:col-span-2" style={panel}><div className="flex items-center gap-3"><Database className="h-5 w-5 text-[#00F0FF]" /><div><h2 className="text-sm font-semibold text-white">New resource request</h2><p className="mt-1 text-xs text-[#64748B]">Requests are checked against capacity and policy.</p></div></div>{submitted ? <div className="mt-8 rounded-lg p-5 text-center" style={{ background: colors.green.bg, border: `1px solid ${colors.green.border}` }}><CheckCircle2 className="mx-auto h-8 w-8 text-[#00FFA3]" /><h3 className="mt-3 font-semibold text-white">Request submitted</h3><p className="mt-1 text-xs text-[#94A3B8]">REQ-2409 is awaiting Platform Team approval.</p><button onClick={() => setSubmitted(false)} className="mt-4 text-xs text-[#00F0FF]">Create another request</button></div> : <form onSubmit={event => { event.preventDefault(); setSubmitted(true); }} className="mt-6 space-y-5"><div className="grid gap-4 md:grid-cols-2"><Field label="Target environment"><select className="platform-input"><option>Development</option><option>Staging</option><option>Production</option></select></Field><Field label="Resource type"><select className="platform-input"><option>Managed database</option><option>Cache cluster</option><option>Object storage</option><option>Kubernetes namespace</option></select></Field><Field label="Region"><select className="platform-input"><option>ap-south-1</option><option>ap-southeast-1</option><option>us-east-1</option></select></Field><Field label="Size"><select className="platform-input"><option>Standard</option><option>Performance</option><option>High availability</option></select></Field></div><Field label="Business justification"><textarea required value={reason} onChange={event => setReason(event.target.value)} rows={4} placeholder="Explain the workload and expected usage..." className="platform-input resize-none" /></Field><div className="flex justify-end gap-3"><button type="button" onClick={() => navigate('/infrastructure')} className="px-4 py-2 text-xs text-[#94A3B8]">Cancel</button><button type="submit" className="rounded-lg border border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.1)] px-4 py-2 text-xs font-semibold text-[#00F0FF]">Submit request</button></div></form>}</div><div className="space-y-5"><div className="rounded-xl p-5" style={panel}><h2 className="text-sm font-semibold text-white">Request checklist</h2><div className="mt-4 space-y-3">{['Cost center is assigned', 'Environment policy is valid', 'Capacity is available', 'Owner is on-call'].map(item => <p key={item} className="flex items-center gap-2 text-xs text-[#CBD5E1]"><CheckCircle2 className="h-4 w-4 text-[#00FFA3]" />{item}</p>)}</div></div><div className="rounded-xl p-5" style={panel}><h2 className="text-sm font-semibold text-white">Recent requests</h2><div className="mt-4 space-y-3">{['REQ-2408 · Cache cluster · Approved', 'REQ-2407 · Object storage · Provisioning'].map(item => <p key={item} className="flex items-center gap-2 text-xs text-[#CBD5E1]"><Circle className="h-2 w-2 fill-[#00FFA3] text-[#00FFA3]" />{item}</p>)}</div></div></div></div></div>;
}
