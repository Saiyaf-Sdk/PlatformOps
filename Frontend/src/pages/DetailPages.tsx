import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, CheckCircle2, Circle, Clock3, Database, GitBranch,
  Layers3, Rocket, Server, ShieldCheck, Terminal,
  RefreshCw, Box, Play, Shield, Network
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEnvironment, useDeployments, useApplications, useIncidents } from '../lib/queries';
import type { EnvCode } from '../lib/types';

type Tone = 'cyan' | 'green' | 'amber' | 'red' | 'purple';
const colors: Record<Tone, { color: string; bg: string; border: string }> = {
  cyan: { color: '#00F0FF', bg: 'rgba(0,240,255,0.08)', border: 'rgba(0,240,255,0.2)' },
  green: { color: '#00FFA3', bg: 'rgba(0,255,163,0.08)', border: 'rgba(0,255,163,0.2)' },
  amber: { color: '#FFB800', bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.2)' },
  red: { color: '#FF3366', bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.2)' },
  purple: { color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
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

const apps = {
  '1': ['payment-gateway', 'Core payment processing microservice', 'Java / Spring Boot', 'Fintech Squad', 'v1.8.0'],
  '2': ['auth-service', 'JWT authentication and authorization', 'Go 1.21', 'Platform Team', 'v3.2.1'],
  '3': ['frontend-dashboard', 'React SPA for the customer portal', 'Node 20 / React', 'Web Team', 'v5.1.2'],
};

export function ApplicationDetails() {
  const { applicationId = '2' } = useParams();
  const [name, description, runtime, owner, version] = apps[applicationId as keyof typeof apps] || apps['2'];
  const [tab, setTab] = useState('Overview');
  return <div className="space-y-6"><Back to="/applications" label="Back to applications" /><Header eyebrow="Applications / Details" title={name} description={description} action={<Badge label="HEALTHY" tone="green" />} /><div className="grid gap-5 lg:grid-cols-3"><div className="space-y-5 lg:col-span-2"><div className="flex gap-1 border-b border-[rgba(255,255,255,0.08)]">{['Overview', 'Environments', 'Deployments'].map(item => <button key={item} onClick={() => setTab(item)} className={`px-4 py-3 text-xs font-semibold ${tab === item ? 'border-b-2 border-[#00F0FF] text-[#00F0FF]' : 'text-[#64748B]'}`}>{item}</button>)}</div>{tab === 'Overview' && <div className="grid grid-cols-2 gap-4"><Info label="Runtime" value={runtime} icon={Terminal} /><Info label="Owner" value={owner} icon={ShieldCheck} /><Info label="Repository" value={`org/${name}`} icon={GitBranch} /><Info label="Version" value={version} icon={Rocket} /></div>}{tab === 'Environments' && <div className="space-y-3">{['Development', 'Staging', 'Production'].map(environment => <div key={environment} className="flex items-center gap-4 rounded-xl p-4" style={panel}><Server className="h-5 w-5 text-[#00F0FF]" /><span className="flex-1 text-sm text-white">{environment}</span><Badge label="Healthy" tone="green" /><ArrowUpRight className="h-4 w-4 text-[#64748B]" /></div>)}</div>}{tab === 'Deployments' && <div className="space-y-3">{['v1.8.0 · production · 2h ago', 'v1.7.9 · staging · Yesterday'].map((release, index) => <Link key={release} to={`/deployments/${index + 1}`} className="flex items-center gap-4 rounded-xl p-4" style={panel}><Rocket className="h-4 w-4 text-[#00F0FF]" /><span className="flex-1 text-sm text-white">{release}</span><Badge label="SUCCESS" tone="green" /></Link>)}</div>}</div><div className="space-y-5"><div className="rounded-xl p-5" style={panel}><p className="text-[10px] uppercase tracking-widest text-[#64748B]">Health score</p><p className="mt-2 text-4xl font-bold text-white">98.6%</p><p className="mt-1 text-xs text-[#00FFA3]">+0.8% from last week</p><div className="mt-5 h-2 rounded-full bg-[rgba(255,255,255,0.06)]"><div className="h-full w-[98.6%] rounded-full bg-[#00FFA3]" /></div></div><div className="rounded-xl p-5" style={panel}><h2 className="text-sm font-semibold text-white">Service metadata</h2><div className="mt-4 space-y-3 text-xs"><p className="flex justify-between"><span className="text-[#64748B]">Last deployment</span><span className="text-white">14m ago</span></p><p className="flex justify-between"><span className="text-[#64748B]">SLO target</span><span className="text-white">99.9%</span></p></div></div></div></div></div>;
}

export function DeploymentDetails() {
  const { deploymentId = '1' } = useParams();
  const [rolledBack, setRolledBack] = useState(false);
  const stages = ['Source checkout', 'Unit tests', 'Build container', 'Security scan', 'Production rollout'];
  return <div className="space-y-6"><Back to="/deployments" label="Back to deployments" /><Header eyebrow="Deployments / Details" title={`DEP-${String(1042 - Number(deploymentId) + 1).padStart(4, '0')}`} description="auth-service v3.2.1 · production" action={<div className="flex gap-2"><Badge label={rolledBack ? 'ROLLED BACK' : 'SUCCESS'} tone={rolledBack ? 'amber' : 'green'} /><button onClick={() => setRolledBack(true)} disabled={rolledBack} className="rounded-lg border border-[rgba(255,51,102,0.3)] px-3 py-2 text-xs text-[#FF6B8A] disabled:opacity-50">Rollback</button></div>} /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><Info label="Application" value="auth-service" icon={Layers3} /><Info label="Environment" value="production" icon={Server} /><Info label="Commit" value="8f3a1c2" icon={GitBranch} /><Info label="Duration" value="4m 12s" icon={Clock3} /></div><div className="grid gap-5 lg:grid-cols-3"><div className="rounded-xl p-5 lg:col-span-2" style={panel}><h2 className="text-sm font-semibold text-white">Pipeline timeline</h2><p className="mt-1 text-xs text-[#64748B]">Triggered by A. Kumar · branch main</p><div className="mt-6">{stages.map((stage, index) => <div key={stage} className="flex gap-4"><div className="flex flex-col items-center"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(0,255,163,0.12)] text-[#00FFA3]"><CheckCircle2 className="h-4 w-4" /></div>{index < stages.length - 1 && <div className="h-8 w-px bg-[rgba(0,255,163,0.2)]" />}</div><div className="pb-4"><p className="text-sm text-white">{stage}</p><p className="mt-1 text-xs text-[#64748B]">{index === 4 && rolledBack ? 'Rolled back' : 'Completed'}</p></div></div>)}</div></div><div className="rounded-xl p-5" style={panel}><h2 className="text-sm font-semibold text-white">Deployment logs</h2><div className="mt-4 rounded-lg bg-[#050B14] p-3 font-mono text-[10px] leading-6 text-[#64748B]"><p className="text-[#00FFA3]">[OK] Image pulled from registry</p><p className="text-[#00FFA3]">[OK] Health checks passed</p><p className="text-[#00F0FF]">[INFO] Rollout complete</p></div></div></div></div>;
}

export function InfrastructureRequests() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState('');
  return <div className="space-y-6"><Back to="/infrastructure" label="Back to infrastructure" /><Header eyebrow="Operations / Self Service" title="Infrastructure Requests" description="Request approved platform resources without a manual ticket handoff." action={<Badge label="SLA: 1 business day" />} /><div className="grid gap-5 lg:grid-cols-3"><div className="rounded-xl p-5 lg:col-span-2" style={panel}><div className="flex items-center gap-3"><Database className="h-5 w-5 text-[#00F0FF]" /><div><h2 className="text-sm font-semibold text-white">New resource request</h2><p className="mt-1 text-xs text-[#64748B]">Requests are checked against capacity and policy.</p></div></div>{submitted ? <div className="mt-8 rounded-lg p-5 text-center" style={{ background: colors.green.bg, border: `1px solid ${colors.green.border}` }}><CheckCircle2 className="mx-auto h-8 w-8 text-[#00FFA3]" /><h3 className="mt-3 font-semibold text-white">Request submitted</h3><p className="mt-1 text-xs text-[#94A3B8]">REQ-2409 is awaiting Platform Team approval.</p><button onClick={() => setSubmitted(false)} className="mt-4 text-xs text-[#00F0FF]">Create another request</button></div> : <form onSubmit={event => { event.preventDefault(); setSubmitted(true); }} className="mt-6 space-y-5"><div className="grid gap-4 md:grid-cols-2"><Field label="Target environment"><select className="platform-input"><option>Development</option><option>Staging</option><option>Production</option></select></Field><Field label="Resource type"><select className="platform-input"><option>Managed database</option><option>Cache cluster</option><option>Object storage</option><option>Kubernetes namespace</option></select></Field><Field label="Region"><select className="platform-input"><option>ap-south-1</option><option>ap-southeast-1</option><option>us-east-1</option></select></Field><Field label="Size"><select className="platform-input"><option>Standard</option><option>Performance</option><option>High availability</option></select></Field></div><Field label="Business justification"><textarea required value={reason} onChange={event => setReason(event.target.value)} rows={4} placeholder="Explain the workload and expected usage..." className="platform-input resize-none" /></Field><div className="flex justify-end gap-3"><button type="button" onClick={() => navigate('/infrastructure')} className="px-4 py-2 text-xs text-[#94A3B8]">Cancel</button><button type="submit" className="rounded-lg border border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.1)] px-4 py-2 text-xs font-semibold text-[#00F0FF]">Submit request</button></div></form>}</div><div className="space-y-5"><div className="rounded-xl p-5" style={panel}><h2 className="text-sm font-semibold text-white">Request checklist</h2><div className="mt-4 space-y-3">{['Cost center is assigned', 'Environment policy is valid', 'Capacity is available', 'Owner is on-call'].map(item => <p key={item} className="flex items-center gap-2 text-xs text-[#CBD5E1]"><CheckCircle2 className="h-4 w-4 text-[#00FFA3]" />{item}</p>)}</div></div><div className="rounded-xl p-5" style={panel}><h2 className="text-sm font-semibold text-white">Recent requests</h2><div className="mt-4 space-y-3">{['REQ-2408 · Cache cluster · Approved', 'REQ-2407 · Object storage · Provisioning'].map(item => <p key={item} className="flex items-center gap-2 text-xs text-[#CBD5E1]"><Circle className="h-2 w-2 fill-[#00FFA3] text-[#00FFA3]" />{item}</p>)}</div></div></div></div></div>;
}

const ENV_CONFIGS: Record<string, { code: EnvCode; name: string; cluster: string; region: string; tone: Tone; defaultPods: string; version: string }> = {
  dev: { code: 'DEV', name: 'Development', cluster: 'dev-cluster-01', region: 'ap-south-1', tone: 'amber', defaultPods: '24 / 24', version: 'v2.1.0-dev' },
  development: { code: 'DEV', name: 'Development', cluster: 'dev-cluster-01', region: 'ap-south-1', tone: 'amber', defaultPods: '24 / 24', version: 'v2.1.0-dev' },
  '1': { code: 'DEV', name: 'Development', cluster: 'dev-cluster-01', region: 'ap-south-1', tone: 'amber', defaultPods: '24 / 24', version: 'v2.1.0-dev' },
  staging: { code: 'STAGING', name: 'Staging', cluster: 'staging-cluster-01', region: 'ap-south-1', tone: 'green', defaultPods: '18 / 18', version: 'v2.0.8-rc1' },
  '2': { code: 'STAGING', name: 'Staging', cluster: 'staging-cluster-01', region: 'ap-south-1', tone: 'green', defaultPods: '18 / 18', version: 'v2.0.8-rc1' },
  prod: { code: 'PRODUCTION', name: 'Production', cluster: 'prod-cluster-03', region: 'ap-southeast-1', tone: 'red', defaultPods: '48 / 48', version: 'v2.0.7' },
  production: { code: 'PRODUCTION', name: 'Production', cluster: 'prod-cluster-03', region: 'ap-southeast-1', tone: 'red', defaultPods: '48 / 48', version: 'v2.0.7' },
  '3': { code: 'PRODUCTION', name: 'Production', cluster: 'prod-cluster-03', region: 'ap-southeast-1', tone: 'red', defaultPods: '48 / 48', version: 'v2.0.7' },
};

export function EnvironmentDetails() {
  const { environmentId = 'development' } = useParams();
  const navigate = useNavigate();
  const normalizedKey = environmentId.toLowerCase();
  const meta = ENV_CONFIGS[normalizedKey] || ENV_CONFIGS['development'];
  const { data: envData, refetch, isFetching } = useEnvironment(meta.code);
  const { data: deploymentsPage } = useDeployments({ environment: meta.code, size: 10 });
  const { data: appsPage } = useApplications();
  const { data: incidentsPage } = useIncidents({ openOnly: false });

  const [tab, setTab] = useState<'Overview' | 'Deployments' | 'Services' | 'Infrastructure'>('Overview');

  const displayName = envData?.displayName || meta.name;
  const clusterName = envData?.cluster || meta.cluster;
  const namespace = envData?.namespace || `platformops-${meta.code.toLowerCase()}`;
  const health = envData?.healthScore ?? 98;
  const podsRunning = envData ? `${envData.podsRunning} / ${envData.podsRunning}` : meta.defaultPods;
  const version = envData?.currentVersion || meta.version;
  const requiresApproval = envData?.requiresApproval ?? (meta.code === 'PRODUCTION');
  const status = envData?.status ?? (health > 95 ? 'HEALTHY' : 'DEGRADED');
  const statusTone: Tone = status === 'HEALTHY' ? 'green' : status === 'DEGRADED' ? 'amber' : 'red';

  const deployments = deploymentsPage?.content ?? [];
  const applications = appsPage?.content ?? [];
  const incidents = (incidentsPage?.content ?? []).filter(inc => !inc.environment || inc.environment.code === meta.code);

  return (
    <div className="space-y-6">
      <Back to="/environments" label="Back to environments" />
      <Header
        eyebrow="Platform / Runtime / Environment Details"
        title={`${displayName} · ${clusterName}`}
        description={`Namespace ${namespace} · Region ${meta.region} · Policy: ${requiresApproval ? 'Manual promotion gate' : 'Automated rollout'}`}
        action={
          <div className="flex items-center gap-2">
            <Badge label={status} tone={statusTone} />
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs font-semibold text-[#94A3B8] transition-colors hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Info label="Cluster" value={clusterName} icon={Server} />
        <Info label="Region / Namespace" value={`${meta.region} (${namespace})`} icon={Network} />
        <Info label="Pods Online" value={podsRunning} icon={Box} />
        <Info label="Release Version" value={version} icon={Rocket} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main Content Pane */}
        <div className="space-y-5 lg:col-span-2">
          {/* Navigation Tabs */}
          <div className="flex gap-1 border-b border-[rgba(255,255,255,0.08)]">
            {(['Overview', 'Deployments', 'Services', 'Infrastructure'] as const).map(item => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`px-4 py-3 text-xs font-semibold transition-colors ${
                  tab === item ? 'border-b-2 border-[#00F0FF] text-[#00F0FF]' : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                {item}
                {item === 'Deployments' && deployments.length > 0 && ` (${deployments.length})`}
                {item === 'Services' && applications.length > 0 && ` (${applications.length})`}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {tab === 'Overview' && (
            <div className="space-y-5">
              <div className="rounded-xl p-5" style={panel}>
                <h2 className="text-sm font-semibold text-white">Cluster Resource Allocation</h2>
                <p className="mt-1 text-xs text-[#64748B]">Real-time telemetry reported by Prometheus & Kubernetes API server</p>
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#94A3B8]">CPU Allocation (12 of 16 vCPUs requested)</span>
                      <span className="text-white font-mono">75%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                      <div className="h-full rounded-full bg-[#00F0FF]" style={{ width: '75%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#94A3B8]">Memory Reserved (24.8 of 32 GB allocated)</span>
                      <span className="text-white font-mono">77.5%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                      <div className="h-full rounded-full bg-[#00FFA3]" style={{ width: '77.5%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#94A3B8]">Persistent Volume Claim (210 of 500 GB used)</span>
                      <span className="text-white font-mono">42%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                      <div className="h-full rounded-full bg-[#A78BFA]" style={{ width: '42%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl p-5" style={panel}>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#00FFA3]" /> Policy & Compliance
                  </h3>
                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex justify-between text-[#94A3B8]">
                      <span>Promotion Gate</span>
                      <span className="text-white">{requiresApproval ? 'Strict Approval' : 'Auto Promotion'}</span>
                    </div>
                    <div className="flex justify-between text-[#94A3B8]">
                      <span>mTLS Encryption</span>
                      <span className="text-[#00FFA3]">Enforced (Strict)</span>
                    </div>
                    <div className="flex justify-between text-[#94A3B8]">
                      <span>Container Signing</span>
                      <span className="text-[#00FFA3]">Cosign Verified</span>
                    </div>
                    <div className="flex justify-between text-[#94A3B8]">
                      <span>Audit Trail</span>
                      <span className="text-white">Active</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl p-5" style={panel}>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Server className="h-4 w-4 text-[#00F0FF]" /> Runtime Environment
                  </h3>
                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex justify-between text-[#94A3B8]">
                      <span>Kubernetes Core</span>
                      <span className="font-mono text-white">v1.30.2</span>
                    </div>
                    <div className="flex justify-between text-[#94A3B8]">
                      <span>Ingress Router</span>
                      <span className="text-white">Envoy v1.28</span>
                    </div>
                    <div className="flex justify-between text-[#94A3B8]">
                      <span>Registry Endpoint</span>
                      <span className="font-mono text-[#00F0FF]">registry.platformops.internal</span>
                    </div>
                    <div className="flex justify-between text-[#94A3B8]">
                      <span>DNS Resolvers</span>
                      <span className="text-white">CoreDNS 1.11.1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Deployments */}
          {tab === 'Deployments' && (
            <div className="space-y-3">
              {deployments.length === 0 ? (
                <div className="rounded-xl p-8 text-center text-xs text-[#64748B]" style={panel}>
                  No recent deployments recorded in this environment.
                </div>
              ) : (
                deployments.map(dep => {
                  const depTone: Tone = dep.status === 'SUCCEEDED' ? 'green' : dep.status === 'FAILED' ? 'red' : 'amber';
                  return (
                    <Link
                      key={dep.id}
                      to={`/deployments/${dep.id}`}
                      className="flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                      style={panel}
                    >
                      <Rocket className="h-5 w-5 text-[#00F0FF]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{dep.application.name}</p>
                        <p className="text-[10px] text-[#64748B] font-mono mt-0.5">
                          {dep.version} · {dep.triggeredBy?.fullName || 'Pipeline'} · {new Date(dep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge label={dep.status} tone={depTone} />
                      <ArrowUpRight className="h-4 w-4 text-[#64748B]" />
                    </Link>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3: Services */}
          {tab === 'Services' && (
            <div className="space-y-3">
              {applications.length === 0 ? (
                <div className="rounded-xl p-8 text-center text-xs text-[#64748B]" style={panel}>
                  No active microservices registered.
                </div>
              ) : (
                applications.map(app => (
                  <Link
                    key={app.id}
                    to={`/applications/${app.id}`}
                    className="flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                    style={panel}
                  >
                    <Layers3 className="h-5 w-5 text-[#00F0FF]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{app.name}</p>
                      <p className="text-xs text-[#94A3B8] truncate mt-0.5">{app.description}</p>
                      <p className="text-[10px] text-[#64748B] font-mono mt-1">
                        {app.runtime} · {app.ownerTeam} · {app.currentVersion || 'v1.0.0'}
                      </p>
                    </div>
                    <Badge label={app.status} tone={app.status === 'HEALTHY' ? 'green' : 'amber'} />
                    <ArrowUpRight className="h-4 w-4 text-[#64748B]" />
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Tab 4: Infrastructure */}
          {tab === 'Infrastructure' && (
            <div className="space-y-3">
              {[
                { name: `${clusterName}-cp-01`, role: 'Control Plane / Master', status: 'Ready', cpu: '8 vCPU', ram: '16 GB', az: `${meta.region}a` },
                { name: `${clusterName}-worker-01`, role: 'Worker Node', status: 'Ready', cpu: '16 vCPU', ram: '32 GB', az: `${meta.region}a` },
                { name: `${clusterName}-worker-02`, role: 'Worker Node', status: 'Ready', cpu: '16 vCPU', ram: '32 GB', az: `${meta.region}b` },
                { name: `${clusterName}-worker-03`, role: 'Worker Node', status: 'Ready', cpu: '16 vCPU', ram: '32 GB', az: `${meta.region}c` },
              ].map(node => (
                <div key={node.name} className="flex items-center gap-4 rounded-xl p-4" style={panel}>
                  <Server className="h-5 w-5 text-[#00FFA3]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white font-mono">{node.name}</p>
                    <p className="text-xs text-[#94A3B8]">{node.role} · {node.az}</p>
                  </div>
                  <div className="text-right text-xs text-[#64748B]">
                    <p className="text-white font-mono">{node.cpu} / {node.ram}</p>
                    <p className="text-[#00FFA3] mt-0.5 flex items-center justify-end gap-1"><Circle className="h-1.5 w-1.5 fill-current" /> {node.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar Widget */}
        <div className="space-y-5">
          {/* Health Score Card */}
          <div className="rounded-xl p-5" style={panel}>
            <p className="text-[10px] uppercase tracking-widest text-[#64748B]">Cluster Health Score</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{health}%</span>
              <span className="text-xs font-semibold text-[#00FFA3]">SLO 99.9%</span>
            </div>
            <p className="mt-1 text-xs text-[#94A3B8]">{podsRunning} active pods healthy</p>
            <div className="mt-4 h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${health}%`,
                  background: health >= 98 ? '#00FFA3' : health >= 90 ? '#FFB800' : '#FF3366',
                }}
              />
            </div>
          </div>

          {/* Incidents Card */}
          <div className="rounded-xl p-5" style={panel}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Active Incidents</h2>
              <span className="text-xs font-mono text-[#64748B]">{incidents.length} total</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {incidents.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-[#00FFA3]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>All services operational. No open incidents.</span>
                </div>
              ) : (
                incidents.slice(0, 3).map(inc => (
                  <div key={inc.id} className="rounded-lg border border-[rgba(255,255,255,0.06)] p-2.5 text-xs">
                    <p className="font-semibold text-white truncate">{inc.title}</p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-[#64748B]">
                      <span>{inc.severity} · {inc.status}</span>
                      <span>{new Date(inc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Operations */}
          <div className="rounded-xl p-5" style={panel}>
            <h2 className="text-sm font-semibold text-white">Environment Actions</h2>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => navigate('/deployments')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.1)] px-3 py-2 text-xs font-semibold text-[#00F0FF] transition-colors hover:bg-[rgba(0,240,255,0.18)]"
              >
                <Play className="h-3.5 w-3.5" />
                Trigger Deployment
              </button>
              <button
                onClick={() => navigate('/infrastructure-requests')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs font-semibold text-[#CBD5E1] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
              >
                <Database className="h-3.5 w-3.5 text-[#00F0FF]" />
                Request Cloud Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
