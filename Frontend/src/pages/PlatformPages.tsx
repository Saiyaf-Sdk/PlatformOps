import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEnvironments, useInfrastructure, useMonitoring } from '../lib/queries';
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

function ActionButton({ children, tone = 'cyan', icon: Icon = ArrowUpRight, onClick }: { children: ReactNode; tone?: Tone; icon?: React.ElementType; onClick?: () => void }) {
  const style = TONES[tone];
  return <button onClick={onClick} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-[rgba(255,255,255,0.06)]" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>{children}<Icon className="w-3.5 h-3.5" /></button>;
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

export function Infrastructure() {
  const { data: infra, refetch, isFetching } = useInfrastructure();
  const dbStatus = infra?.resources.find(r => r.id === 'database')?.status ?? 'ONLINE';
  const apiStatus = infra?.resources.find(r => r.id === 'api')?.status ?? 'HEALTHY';
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations / Resources"
        title="Infrastructure"
        description="Inspect the shared compute, data, and networking resources powering the platform."
        action={
          <ActionButton icon={RefreshCw} onClick={() => refetch()}>
            {isFetching ? 'Refreshing...' : 'Refresh resources'}
          </ActionButton>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="API Process" value={apiStatus} detail="Spring Boot 3.4" icon={Server} tone={apiStatus === 'HEALTHY' ? 'green' : 'red'} />
        <Metric label="PostgreSQL" value={dbStatus} detail="Port 5432 · Docker" icon={Database} tone={dbStatus === 'HEALTHY' || dbStatus === 'ONLINE' ? 'green' : 'red'} />
        <Metric label="Environments" value={String(infra?.environments?.length ?? 3)} detail="DEV · STAGING · PROD" icon={Network} tone="purple" />
        <Metric label="Scope" value="Local IDP" detail="DevOps integration active" icon={HardDrive} tone="green" />
      </div>
      <div className="rounded-xl overflow-hidden" style={PANEL}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h2 className="text-sm font-semibold text-white">Live Resource Inventory</h2>
            <p className="text-xs text-[#64748B] mt-1">{infra?.measuredAt ? `Measured ${new Date(infra.measuredAt).toLocaleTimeString()}` : 'Live system resources'}</p>
          </div>
        </div>
        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {(infra?.resources || [
            { id: 'api', name: 'PlatformOps API', type: 'Spring Boot process', status: 'HEALTHY', details: 'Core backend service' },
            { id: 'database', name: 'PlatformOps database', type: 'PostgreSQL connection', status: 'HEALTHY', details: 'Primary datastore' },
          ]).map((resource) => {
            const isOk = resource.status === 'HEALTHY' || resource.status === 'ONLINE';
            const tone: Tone = isOk ? 'green' : 'red';
            const style = TONES[tone];
            return (
              <div key={resource.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="p-2.5 rounded-lg" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                  <Server className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-semibold text-white">{resource.name}</p>
                  <p className="text-xs text-[#64748B] mt-1">{resource.type} · {resource.details}</p>
                </div>
                <StatusBadge label={resource.status} tone={tone} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Monitoring() {
  const { data: mon, refetch, isFetching } = useMonitoring();
  const uptime = mon ? `${Math.floor(mon.uptimeSeconds / 60)}m ${mon.uptimeSeconds % 60}s` : '—';
  const heapMb = mon ? `${Math.round(mon.heapUsedBytes / 1024 / 1024)} MB` : '—';
  const heapMaxMb = mon ? `${Math.round(mon.heapMaxBytes / 1024 / 1024)} MB` : '—';
  const rps = mon?.requests?.requestsPerSecond != null ? mon.requests.requestsPerSecond.toFixed(1) : '0.0';
  const errRate = mon?.requests?.errorPercent != null ? `${mon.requests.errorPercent.toFixed(1)}%` : '0.0%';
  const p95 = mon?.requests?.p95LatencyMs != null ? `${mon.requests.p95LatencyMs} ms` : '12 ms';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations / Observability"
        title="Monitoring"
        description="Live API service signals, runtime metrics, and database connectivity."
        action={
          <ActionButton icon={RefreshCw} onClick={() => refetch()}>
            {isFetching ? 'Refreshing...' : 'Refresh signals'}
          </ActionButton>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={PANEL}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#94A3B8]">API Latency (P95)</p>
            <Activity className="w-4 h-4 text-[#00FFA3]" />
          </div>
          <div className="flex items-end justify-between mt-4">
            <p className="text-2xl font-bold text-white">{p95}</p>
            <span className="text-xs text-[#00FFA3]">healthy</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">Avg: {mon?.requests?.avgLatencyMs ?? 0} ms</p>
        </div>

        <div className="rounded-xl p-5" style={PANEL}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#94A3B8]">Request Throughput</p>
            <Activity className="w-4 h-4 text-[#00F0FF]" />
          </div>
          <div className="flex items-end justify-between mt-4">
            <p className="text-2xl font-bold text-white">{rps} <span className="text-sm font-normal text-[#94A3B8]">req/s</span></p>
            <span className="text-xs text-[#00F0FF]">{mon?.requests?.totalRequests ?? 0} total</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">{mon?.requests?.requestsLastMinute ?? 0} in last minute</p>
        </div>

        <div className="rounded-xl p-5" style={PANEL}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#94A3B8]">Error Rate</p>
            <Activity className="w-4 h-4 text-[#00FFA3]" />
          </div>
          <div className="flex items-end justify-between mt-4">
            <p className="text-2xl font-bold text-white">{errRate}</p>
            <span className="text-xs text-[#00FFA3]">{mon?.requests?.errorCount ?? 0} errors</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">Database: {mon?.databaseHealthy ? 'ONLINE' : 'OFFLINE'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 rounded-xl p-5" style={PANEL}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">JVM & System Health</h2>
              <p className="text-xs text-[#64748B] mt-1">{mon?.source || 'Measured from Spring Boot API process'}</p>
            </div>
            <StatusBadge label={mon?.databaseHealthy ? 'HEALTHY' : 'DEGRADED'} tone={mon?.databaseHealthy ? 'green' : 'amber'} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#94A3B8]">JVM Heap Memory</span>
              <span className="text-white font-mono">{heapMb} / {heapMaxMb}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#94A3B8]">Process Uptime</span>
              <span className="text-white font-mono">{uptime}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#94A3B8]">Database Health Check</span>
              <span className="text-[#00FFA3] font-semibold">{mon?.databaseHealthy ? 'Connected & Valid' : 'Disconnected'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5" style={PANEL}>
          <h2 className="text-sm font-semibold text-white">Platform Signals</h2>
          <p className="text-xs text-[#64748B] mt-1">Status of core components</p>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">REST API</span>
              <StatusBadge label="UP" tone="green" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">PostgreSQL</span>
              <StatusBadge label={mon?.databaseHealthy ? 'UP' : 'DOWN'} tone={mon?.databaseHealthy ? 'green' : 'red'} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">SSE Event Stream</span>
              <StatusBadge label="CONNECTED" tone="cyan" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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