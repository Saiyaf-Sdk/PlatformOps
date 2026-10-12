import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEnvironments } from '../lib/queries';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Clock3,
  Cpu,
  Database,
  FileText,
  GitBranch,
  HardDrive,
  MoreHorizontal,
  Network,
  Play,
  RefreshCw,
  Search,
  Server,
  Shield,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';

type Tone = 'cyan' | 'green' | 'amber' | 'red' | 'purple';

const TONES: Record<Tone, { color: string; bg: string; border: string }> = {
  cyan: { color: '#00F0FF', bg: 'rgba(0,240,255,0.08)', border: 'rgba(0,240,255,0.2)' },
  green: { color: '#00FFA3', bg: 'rgba(0,255,163,0.08)', border: 'rgba(0,255,163,0.2)' },
  amber: { color: '#FFB800', bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.2)' },
  red: { color: '#FF3366', bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.2)' },
  purple: { color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
};

const PANEL = { background: 'rgba(17, 29, 49, 0.8)', border: '1px solid rgba(255,255,255,0.06)' };

function StatusBadge({ label, tone = 'cyan' }: { label: string; tone?: Tone }) {
  const style = TONES[tone];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}`, fontFamily: 'JetBrains Mono, monospace' }}>
      <Circle className="w-1.5 h-1.5 fill-current" />
      {label}
    </span>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{eyebrow}</p>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-[#94A3B8] text-sm mt-1">{description}</p>
      </div>
      {action}
    </motion.div>
  );
}

function ActionButton({ children, tone = 'cyan', icon: Icon = ArrowUpRight }: { children: ReactNode; tone?: Tone; icon?: React.ElementType }) {
  const style = TONES[tone];
  return <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-[rgba(255,255,255,0.06)]" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>{children}<Icon className="w-3.5 h-3.5" /></button>;
}

function Metric({ label, value, detail, icon: Icon, tone = 'cyan' }: { label: string; value: string; detail: string; icon: React.ElementType; tone?: Tone }) {
  const style = TONES[tone];
  return <div className="rounded-xl p-4" style={PANEL}><div className="flex items-center justify-between mb-3"><span className="text-[10px] uppercase tracking-widest text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{label}</span><Icon className="w-4 h-4" style={{ color: style.color }} /></div><p className="text-2xl font-bold text-white">{value}</p><p className="text-xs mt-1" style={{ color: style.color }}>{detail}</p></div>;
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569] w-4 h-4" /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="platform-input pl-9" /></div>;
}

const ENVIRONMENTS = [
  { name: 'Development', code: 'dev', region: 'ap-south-1', cluster: 'dev-cluster-01', services: 18, pods: '24 / 24', health: 96, version: 'v2.1.0-dev', tone: 'amber' as Tone, status: 'HEALTHY' },
  { name: 'Staging', code: 'staging', region: 'ap-south-1', cluster: 'staging-cluster-01', services: 18, pods: '18 / 18', health: 99, version: 'v2.0.8-rc1', tone: 'green' as Tone, status: 'HEALTHY' },
  { name: 'Production', code: 'production', region: 'ap-southeast-1', cluster: 'prod-cluster-03', services: 24, pods: '48 / 48', health: 100, version: 'v2.0.7', tone: 'red' as Tone, status: 'HEALTHY' },
];

export function Environments() {
  const navigate = useNavigate();
  const { data: apiEnvs, isFetching, refetch } = useEnvironments();

  const envs = useMemo(() => {
    return ENVIRONMENTS.map(env => {
      const match = apiEnvs?.find(e => e.code.toLowerCase() === env.code.toLowerCase());
      if (!match) return env;
      return {
        ...env,
        cluster: match.cluster || env.cluster,
        health: match.healthScore ?? env.health,
        pods: match.podsRunning ? `${match.podsRunning} / ${match.podsRunning}` : env.pods,
        version: match.currentVersion || env.version,
        status: match.status,
      };
    });
  }, [apiEnvs]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform / Runtime"
        title="Environments"
        description="Manage deployment targets, clusters, and release health across every stage."
        action={
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-[rgba(255,255,255,0.06)]"
            style={{ color: '#00F0FF', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Sync inventory
          </button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric label="Managed environments" value={String(envs.length)} detail="All regions connected" icon={Server} />
        <Metric label="Services online" value="60 / 60" detail="100% registration coverage" icon={CheckCircle2} tone="green" />
        <Metric label="Cluster capacity" value="68%" detail="12 nodes available" icon={Cpu} tone="purple" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {envs.map((env, index) => {
          const style = TONES[env.tone];
          const badgeTone: Tone = env.status === 'DEGRADED' ? 'amber' : env.status === 'DOWN' ? 'red' : 'green';
          return (
            <motion.article
              key={env.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => navigate(`/environments/${env.code}`)}
              className="rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg group"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: style.color, fontFamily: 'JetBrains Mono, monospace' }}>
                    {env.name}
                  </p>
                  <h2 className="text-lg font-semibold text-white mt-1 group-hover:text-[#00F0FF] transition-colors">{env.cluster}</h2>
                </div>
                <StatusBadge label={env.status ? env.status.toLowerCase() : 'healthy'} tone={badgeTone} />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6 text-xs">
                <div>
                  <p className="text-[#64748B]">Region</p>
                  <p className="text-white mt-1">{env.region}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Services</p>
                  <p className="text-white mt-1">{env.services} registered</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Pods running</p>
                  <p className="text-white mt-1">{env.pods}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Release</p>
                  <p className="mt-1" style={{ color: style.color, fontFamily: 'JetBrains Mono, monospace' }}>{env.version}</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#94A3B8]">Health score</span>
                  <span className="text-white">{env.health}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${env.health}%`, background: style.color }} />
                </div>
              </div>
              <Link
                to={`/environments/${env.code}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold group-hover:underline"
                style={{ color: style.color }}
              >
                View environment details <ArrowUpRight className="inline w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

const DEPLOYMENTS = [
  { app: 'auth-service', version: 'v3.2.1', env: 'production', status: 'SUCCESS', branch: 'main', actor: 'A. Kumar', time: '2 min ago', duration: '4m 12s' },
  { app: 'payment-gateway', version: 'v1.8.0', env: 'staging', status: 'SUCCESS', branch: 'release/1.8', actor: 'S. Patel', time: '14 min ago', duration: '6m 45s' },
  { app: 'inventory-worker', version: 'v2.0.4', env: 'production', status: 'FAILED', branch: 'main', actor: 'J. Thomas', time: '31 min ago', duration: '2m 08s' },
  { app: 'analytics-engine', version: 'v1.0.0', env: 'staging', status: 'BUILDING', branch: 'feature/streaming', actor: 'R. Singh', time: '1 hour ago', duration: '-' },
  { app: 'frontend-dashboard', version: 'v5.1.2', env: 'development', status: 'SUCCESS', branch: 'develop', actor: 'M. Shah', time: '1 hour ago', duration: '3m 31s' },
];

const deploymentTone = (status: string): Tone => status === 'SUCCESS' ? 'green' : status === 'FAILED' ? 'red' : 'amber';

export function Deployments() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const filtered = useMemo(() => DEPLOYMENTS.filter(item => (filter === 'ALL' || item.status === filter) && `${item.app} ${item.branch} ${item.actor}`.toLowerCase().includes(search.toLowerCase())), [filter, search]);
  return <div className="space-y-6"><PageHeader eyebrow="Platform / Delivery" title="Deployments" description="Track release activity, pipeline state, and rollout history." action={<ActionButton icon={Play}>Start deployment</ActionButton>} /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Metric label="Today" value="142" detail="+18 vs yesterday" icon={Activity} tone="purple" /><Metric label="Successful" value="138" detail="97.2% success rate" icon={CheckCircle2} tone="green" /><Metric label="In progress" value="2" detail="Across 2 environments" icon={Activity} tone="amber" /><Metric label="Failed" value="2" detail="Needs investigation" icon={XCircle} tone="red" /></div><div className="flex flex-wrap gap-3 p-4 rounded-xl" style={PANEL}><SearchBar value={search} onChange={setSearch} placeholder="Search app, branch, or actor..." /><select value={filter} onChange={event => setFilter(event.target.value)} className="platform-input px-3" style={{ width: 'auto', minWidth: '130px' }}><option value="ALL">All statuses</option><option value="SUCCESS">Success</option><option value="BUILDING">Building</option><option value="FAILED">Failed</option></select></div><div className="rounded-xl overflow-x-auto" style={PANEL}><table className="w-full text-left min-w-[760px]"><thead><tr className="border-b border-[rgba(255,255,255,0.06)] text-[10px] uppercase tracking-widest text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}><th className="px-5 py-4">Application</th><th>Environment</th><th>Pipeline</th><th>Actor</th><th>Duration</th><th>State</th><th /></tr></thead><tbody>{filtered.map(item => <tr key={`${item.app}-${item.version}`} className="border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)]"><td className="px-5 py-4"><p className="text-sm font-semibold text-white">{item.app}</p><p className="text-[10px] text-[#64748B] mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.version} · {item.time}</p></td><td className="text-xs text-[#CBD5E1] capitalize">{item.env}</td><td><span className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8]"><GitBranch className="w-3.5 h-3.5" />{item.branch}</span></td><td className="text-xs text-[#CBD5E1]">{item.actor}</td><td className="text-xs text-[#94A3B8]">{item.duration}</td><td><StatusBadge label={item.status} tone={deploymentTone(item.status)} /></td><td className="pr-5"><button aria-label={`More actions for ${item.app}`} className="p-2 text-[#64748B] hover:text-white"><MoreHorizontal className="w-4 h-4" /></button></td></tr>)}</tbody></table></div></div>;
}

const RESOURCES = [
  { name: 'prod-cluster-03', type: 'Kubernetes cluster', region: 'ap-southeast-1', status: 'ONLINE', usage: 72, icon: Server, tone: 'green' as Tone },
  { name: 'platform-postgres', type: 'Managed database', region: 'ap-south-1', status: 'ONLINE', usage: 48, icon: Database, tone: 'green' as Tone },
  { name: 'platform-cache', type: 'Redis cluster', region: 'ap-south-1', status: 'DEGRADED', usage: 84, icon: HardDrive, tone: 'amber' as Tone },
  { name: 'edge-gateway', type: 'Load balancer', region: 'global', status: 'ONLINE', usage: 39, icon: Network, tone: 'green' as Tone },
];

export function Infrastructure() {
  return <div className="space-y-6"><PageHeader eyebrow="Operations / Resources" title="Infrastructure" description="Inspect the shared compute, data, and networking resources powering the platform." action={<ActionButton icon={RefreshCw}>Refresh resources</ActionButton>} /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Metric label="Nodes" value="12" detail="10 ready · 2 draining" icon={Server} /><Metric label="CPU allocated" value="64%" detail="8.6 cores available" icon={Cpu} tone="purple" /><Metric label="Storage" value="41%" detail="2.4 TB remaining" icon={HardDrive} tone="amber" /><Metric label="Network" value="99.99%" detail="No packet loss detected" icon={Network} tone="green" /></div><div className="rounded-xl overflow-hidden" style={PANEL}><div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]"><div><h2 className="text-sm font-semibold text-white">Resource inventory</h2><p className="text-xs text-[#64748B] mt-1">Last checked 30 seconds ago</p></div><button className="text-[#64748B] hover:text-white"><MoreHorizontal className="w-4 h-4" /></button></div><div className="divide-y divide-[rgba(255,255,255,0.04)]">{RESOURCES.map(resource => { const Icon = resource.icon; const tone = TONES[resource.tone]; return <div key={resource.name} className="flex flex-wrap items-center gap-4 px-5 py-4"><div className="p-2.5 rounded-lg" style={{ color: tone.color, background: tone.bg, border: `1px solid ${tone.border}` }}><Icon className="w-5 h-5" /></div><div className="flex-1 min-w-[180px]"><p className="text-sm font-semibold text-white">{resource.name}</p><p className="text-xs text-[#64748B] mt-1">{resource.type} · {resource.region}</p></div><div className="w-44"><div className="flex justify-between text-[10px] text-[#64748B] mb-1"><span>Capacity used</span><span className="text-white">{resource.usage}%</span></div><div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)]"><div className="h-full rounded-full" style={{ width: `${resource.usage}%`, background: tone.color }} /></div></div><StatusBadge label={resource.status} tone={resource.tone} /><button className="p-2 text-[#64748B] hover:text-white"><ArrowUpRight className="w-4 h-4" /></button></div>; })}</div></div></div>;
}

const MONITORING = [
  { name: 'API latency p95', value: '184 ms', change: '+12 ms', tone: 'amber' as Tone, points: '12,34 38,30 64,35 90,22 116,28 142,19 168,24 194,17' },
  { name: 'Request throughput', value: '8.4k / min', change: '+8.2%', tone: 'green' as Tone, points: '12,42 38,37 64,40 90,27 116,32 142,19 168,25 194,12' },
  { name: 'Error rate', value: '0.18%', change: '-0.06%', tone: 'green' as Tone, points: '12,19 38,27 64,22 90,35 116,31 142,40 168,34 194,44' },
];

export function Monitoring() {
  return <div className="space-y-6"><PageHeader eyebrow="Operations / Observability" title="Monitoring" description="Live service signals, SLO performance, and alerts across production workloads." action={<ActionButton icon={RefreshCw}>Refresh signals</ActionButton>} /><div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{MONITORING.map(signal => { const tone = TONES[signal.tone]; return <div key={signal.name} className="rounded-xl p-5" style={PANEL}><div className="flex items-center justify-between"><p className="text-xs text-[#94A3B8]">{signal.name}</p><Activity className="w-4 h-4" style={{ color: tone.color }} /></div><div className="flex items-end justify-between mt-4"><p className="text-2xl font-bold text-white">{signal.value}</p><span className="text-xs" style={{ color: tone.color }}>{signal.change}</span></div><svg viewBox="0 0 206 56" className="w-full h-14 mt-4" preserveAspectRatio="none"><polyline points={signal.points} fill="none" stroke={tone.color} strokeWidth="2" /></svg></div>; })}</div><div className="grid grid-cols-1 xl:grid-cols-3 gap-5"><div className="xl:col-span-2 rounded-xl p-5" style={PANEL}><div className="flex items-center justify-between mb-5"><div><h2 className="text-sm font-semibold text-white">Service health</h2><p className="text-xs text-[#64748B] mt-1">Current status by critical dependency</p></div><StatusBadge label="98% healthy" tone="green" /></div><div className="space-y-4">{['auth-service', 'payment-gateway', 'inventory-worker', 'notification-svc', 'analytics-engine'].map((service, index) => <div key={service} className="flex items-center gap-3"><span className={`w-2 h-2 rounded-full ${index === 2 ? 'bg-[#FFB800]' : 'bg-[#00FFA3]'}`} /><span className="text-sm text-white flex-1">{service}</span><span className="text-xs text-[#64748B]">{index === 2 ? 'degraded' : `${99 + (index % 2)}.9% uptime`}</span><span className="w-20 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)]"><span className={`block h-full rounded-full ${index === 2 ? 'bg-[#FFB800] w-3/4' : 'bg-[#00FFA3] w-full'}`} /></span></div>)}</div></div><div className="rounded-xl p-5" style={PANEL}><h2 className="text-sm font-semibold text-white">Alert policy</h2><p className="text-xs text-[#64748B] mt-1">Rules evaluated in the last hour</p><div className="mt-5 space-y-4">{[['Latency budget', 'Within budget', 'green'], ['Error budget', '12% remaining', 'amber'], ['On-call coverage', 'Covered', 'green']].map(([label, value, tone]) => <div key={label} className="flex items-center justify-between"><span className="text-xs text-[#94A3B8]">{label}</span><StatusBadge label={value} tone={tone as Tone} /></div>)}</div></div></div></div>;
}

const INCIDENTS = [
  { id: 'INC-2048', title: 'Inventory sync lag above threshold', severity: 'SEV-2', status: 'INVESTIGATING', service: 'inventory-worker', owner: 'J. Thomas', opened: '31 min ago', tone: 'red' as Tone },
  { id: 'INC-2047', title: 'Redis replica failover completed', severity: 'SEV-3', status: 'MONITORING', service: 'platform-cache', owner: 'A. Kumar', opened: '1h ago', tone: 'amber' as Tone },
  { id: 'INC-2046', title: 'Elevated payment gateway latency', severity: 'SEV-3', status: 'RESOLVED', service: 'payment-gateway', owner: 'S. Patel', opened: '3h ago', tone: 'green' as Tone },
];

export function Incidents() {
  return <div className="space-y-6"><PageHeader eyebrow="Operations / Response" title="Incidents" description="Coordinate active incidents, ownership, and post-incident follow-up." action={<ActionButton tone="red" icon={AlertTriangle}>Declare incident</ActionButton>} /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Metric label="Active incidents" value="2" detail="1 requires attention" icon={AlertTriangle} tone="red" /><Metric label="Mean time to ack" value="4m" detail="-2m this week" icon={Clock3} tone="green" /><Metric label="Resolved today" value="6" detail="100% within SLO" icon={CheckCircle2} tone="green" /><Metric label="Open actions" value="14" detail="Across 3 postmortems" icon={FileText} tone="amber" /></div><div className="space-y-3">{INCIDENTS.map(incident => <article key={incident.id} className="rounded-xl p-5 flex flex-wrap items-center gap-4" style={{ ...PANEL, borderLeft: `3px solid ${TONES[incident.tone].color}` }}><div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: TONES[incident.tone].bg, color: TONES[incident.tone].color }}><AlertTriangle className="w-5 h-5" /></div><div className="flex-1 min-w-[240px]"><div className="flex items-center gap-2"><span className="text-[10px] text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{incident.id}</span><StatusBadge label={incident.severity} tone={incident.tone} /></div><h2 className="text-sm font-semibold text-white mt-2">{incident.title}</h2><p className="text-xs text-[#64748B] mt-1">{incident.service} · opened {incident.opened}</p></div><div className="text-right"><StatusBadge label={incident.status} tone={incident.status === 'RESOLVED' ? 'green' : incident.tone} /><p className="text-xs text-[#94A3B8] mt-2">Owner: <span className="text-white">{incident.owner}</span></p></div><button className="p-2 text-[#64748B] hover:text-white"><ArrowUpRight className="w-4 h-4" /></button></article>)}</div></div>;
}

const AUDIT_LOGS = [
  ['A. Kumar', 'Deployed auth-service v3.2.1', 'DEPLOYMENT', '2 min ago', 'green' as Tone],
  ['S. Patel', 'Updated staging environment variables', 'CONFIGURATION', '14 min ago', 'amber' as Tone],
  ['J. Thomas', 'Acknowledged INC-2048', 'INCIDENT', '31 min ago', 'red' as Tone],
  ['M. Shah', 'Registered frontend-dashboard', 'APPLICATION', '1h ago', 'cyan' as Tone],
  ['System', 'Rotated platform API token', 'SECURITY', '2h ago', 'purple' as Tone],
];

export function AuditLogs() {
  const [search, setSearch] = useState('');
  const rows = AUDIT_LOGS.filter(row => row.join(' ').toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6"><PageHeader eyebrow="Governance / Traceability" title="Audit Logs" description="Immutable activity history for deployments, configuration, access, and incidents." action={<ActionButton icon={FileText}>Export logs</ActionButton>} /><div className="grid grid-cols-2 lg:grid-cols-3 gap-4"><Metric label="Events today" value="1,284" detail="+9.4% compared to yesterday" icon={FileText} /><Metric label="Security events" value="18" detail="No unauthorized access" icon={Shield} tone="green" /><Metric label="Retention" value="90 days" detail="Encrypted at rest" icon={Clock3} tone="purple" /></div><div className="flex flex-wrap gap-3 p-4 rounded-xl" style={PANEL}><SearchBar value={search} onChange={setSearch} placeholder="Search actor, event, or resource..." /><button className="px-3 rounded-lg text-xs text-[#94A3B8]" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>All event types</button><button className="px-3 rounded-lg text-xs text-[#94A3B8]" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Last 24 hours</button></div><div className="rounded-xl overflow-x-auto" style={PANEL}><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-[rgba(255,255,255,0.06)] text-[10px] uppercase tracking-widest text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}><th className="px-5 py-4">Actor</th><th>Event</th><th>Category</th><th>Time</th><th /></tr></thead><tbody>{rows.map(([actor, event, category, time, tone]) => <tr key={`${actor}-${event}`} className="border-b border-[rgba(255,255,255,0.04)] last:border-0"><td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-sm text-white"><span className="w-6 h-6 rounded-md bg-[rgba(0,240,255,0.08)] text-[#00F0FF] text-[10px] flex items-center justify-center">{actor.charAt(0)}</span>{actor}</span></td><td className="text-xs text-[#CBD5E1]">{event}</td><td><StatusBadge label={category} tone={tone as Tone} /></td><td className="text-xs text-[#64748B]">{time}</td><td className="pr-5 text-right"><button className="p-2 text-[#64748B] hover:text-white"><MoreHorizontal className="w-4 h-4" /></button></td></tr>)}</tbody></table></div></div>;
}

const USERS = [
  { name: 'Admin User', email: 'admin@platformops.internal', role: 'DEVOPS_ADMIN', team: 'Platform', lastSeen: 'Now', tone: 'purple' as Tone },
  { name: 'Anita Kumar', email: 'anita.kumar@platformops.internal', role: 'SRE_ENGINEER', team: 'Reliability', lastSeen: '4 min ago', tone: 'green' as Tone },
  { name: 'Sanjay Patel', email: 'sanjay.patel@platformops.internal', role: 'RELEASE_MANAGER', team: 'Fintech Squad', lastSeen: '18 min ago', tone: 'cyan' as Tone },
  { name: 'Jaya Thomas', email: 'jaya.thomas@platformops.internal', role: 'DEVELOPER', team: 'Data Team', lastSeen: '1h ago', tone: 'amber' as Tone },
];

export function UsersPage() {
  const [search, setSearch] = useState('');
  const rows = USERS.filter(user => `${user.name} ${user.email} ${user.team}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6"><PageHeader eyebrow="Administration / Access" title="Users" description="Manage platform access, teams, and operational ownership." action={<ActionButton icon={UserPlus}>Invite user</ActionButton>} /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Metric label="Total users" value="24" detail="4 teams represented" icon={Users} /><Metric label="Active now" value="8" detail="33% of members" icon={Activity} tone="green" /><Metric label="Admin roles" value="3" detail="Review quarterly" icon={Shield} tone="purple" /><Metric label="Pending invites" value="2" detail="Expire in 6 days" icon={Clock3} tone="amber" /></div><div className="flex flex-wrap gap-3 p-4 rounded-xl" style={PANEL}><SearchBar value={search} onChange={setSearch} placeholder="Search name, email, or team..." /><button className="px-3 rounded-lg text-xs text-[#94A3B8]" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>All roles</button></div><div className="rounded-xl overflow-x-auto" style={PANEL}><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-[rgba(255,255,255,0.06)] text-[10px] uppercase tracking-widest text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}><th className="px-5 py-4">User</th><th>Role</th><th>Team</th><th>Last active</th><th /></tr></thead><tbody>{rows.map(user => <tr key={user.email} className="border-b border-[rgba(255,255,255,0.04)] last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: TONES[user.tone].bg, color: TONES[user.tone].color }}>{user.name.charAt(0)}</div><div><p className="text-sm font-semibold text-white">{user.name}</p><p className="text-xs text-[#64748B] mt-1">{user.email}</p></div></div></td><td><StatusBadge label={user.role} tone={user.tone} /></td><td className="text-xs text-[#CBD5E1]">{user.team}</td><td className="text-xs text-[#94A3B8]">{user.lastSeen}</td><td className="pr-5 text-right"><button className="p-2 text-[#64748B] hover:text-white"><MoreHorizontal className="w-4 h-4" /></button></td></tr>)}</tbody></table></div></div>;
}