import { motion } from 'framer-motion';
import { Box, CheckCircle, Activity, ShieldAlert, ArrowUpRight, Clock, Circle, Gauge, TrendingUp } from 'lucide-react';
import ThreeDNetwork from '../components/ThreeDNetwork';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  delay: number;
  trend?: string;
}

const StatCard = ({ title, value, icon: Icon, color, bg, border, delay, trend }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="metric-card p-5"
  >
    <div className="absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl opacity-30" style={{ background: bg, transform: 'translate(25%, -25%)' }} />
    <div className="relative flex items-start justify-between gap-4">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#94A3B8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {title}
        </p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        {trend && (
          <p className="mt-2 flex items-center gap-1 text-xs text-[#00FFA3]">
            <ArrowUpRight className="w-3 h-3" /> {trend}
          </p>
        )}
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0" style={{ background: bg, border: `1px solid ${border}` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </motion.div>
);

const recentDeployments = [
  { app: 'auth-service', version: 'v3.2.1', env: 'production', status: 'SUCCESS', time: '2m ago' },
  { app: 'payment-gateway', version: 'v1.8.0', env: 'staging', status: 'SUCCESS', time: '14m ago' },
  { app: 'inventory-worker', version: 'v2.0.4', env: 'production', status: 'FAILED', time: '31m ago' },
  { app: 'frontend-app', version: 'v5.1.2', env: 'dev', status: 'SUCCESS', time: '1h ago' },
  { app: 'analytics-svc', version: 'v1.0.0', env: 'staging', status: 'BUILDING', time: '1h ago' },
];

const statusColor: Record<string, string> = {
  SUCCESS: '#00FFA3',
  FAILED: '#FF3366',
  BUILDING: '#FFB800',
  PENDING: '#94A3B8',
};

const envBadge: Record<string, { bg: string; color: string }> = {
  production: { bg: 'rgba(255, 51, 102, 0.1)', color: '#FF3366' },
  staging: { bg: 'rgba(0, 255, 163, 0.1)', color: '#00FFA3' },
  dev: { bg: 'rgba(255, 184, 0, 0.1)', color: '#FFB800' },
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#00F0FF]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Runtime Overview
            </p>
            <h1 className="text-3xl font-bold text-white">Platform dashboard</h1>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Platform health overview — <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>Thu, 25 Sep 2026</span>
            </p>
          </div>
          <div className="soft-chip inline-flex items-center gap-2 px-3 py-1.5 text-xs" style={{ color: '#00FFA3', borderColor: 'rgba(0,255,163,0.2)', background: 'rgba(0,255,163,0.05)', fontFamily: 'JetBrains Mono, monospace' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
            ALL SYSTEMS NOMINAL
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Applications" value="24" icon={Box} color="#00F0FF" bg="rgba(0,240,255,0.14)" border="rgba(0,240,255,0.24)" delay={0.05} trend="+2 this week" />
        <StatCard title="Healthy Services" value="98%" icon={CheckCircle} color="#00FFA3" bg="rgba(0,255,163,0.14)" border="rgba(0,255,163,0.24)" delay={0.1} trend="2 degraded" />
        <StatCard title="Deployments Today" value="142" icon={Activity} color="#7B2CBF" bg="rgba(123,44,191,0.14)" border="rgba(123,44,191,0.24)" delay={0.15} trend="+18 vs yesterday" />
        <StatCard title="Active Incidents" value="2" icon={ShieldAlert} color="#FF3366" bg="rgba(255,51,102,0.14)" border="rgba(255,51,102,0.24)" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ minHeight: '380px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="lg:col-span-2 overflow-hidden rounded-2xl border border-[rgba(0,240,255,0.12)] bg-[rgba(11,20,35,0.8)] shadow-[0_20px_50px_rgba(2,6,23,0.4)]"
        >
          <div className="flex items-center justify-between border-b border-[rgba(0,240,255,0.08)] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#00F0FF]" />
              <h2 className="text-sm font-semibold text-white">Infrastructure topology</h2>
            </div>
            <div className="flex gap-3 text-[10px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: '#00FFA3' }}>● PlatformOps</span>
              <span style={{ color: '#7B2CBF' }}>● Jenkins</span>
              <span style={{ color: '#00BFFF' }}>● ECR</span>
              <span style={{ color: '#FF3366' }}>● Production</span>
            </div>
          </div>
          <div className="relative" style={{ minHeight: '300px' }}>
            <ThreeDNetwork />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-2xl border border-[rgba(148,163,184,0.08)] bg-[rgba(17,29,49,0.82)]"
        >
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#94A3B8]" />
              <h2 className="text-sm font-semibold text-white">Recent deployments</h2>
            </div>
            <Clock className="w-4 h-4 text-[#475569]" />
          </div>
          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {recentDeployments.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[rgba(255,255,255,0.02)]">
                <Circle className="w-2 h-2 shrink-0" style={{ fill: statusColor[d.status], color: statusColor[d.status] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{d.app}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[10px]" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>{d.version}</span>
                    <span className="rounded px-1.5 py-0.5 text-[9px] uppercase" style={{ background: envBadge[d.env]?.bg, color: envBadge[d.env]?.color, fontFamily: 'JetBrains Mono, monospace' }}>
                      {d.env}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-[#64748b]">{d.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: 'Development', short: 'DEV', color: '#FFB800', bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.2)', health: 96, pods: 24, version: 'v2.1.0-dev' },
          { name: 'Staging', short: 'STAGING', color: '#00FFA3', bg: 'rgba(0,255,163,0.08)', border: 'rgba(0,255,163,0.2)', health: 99, pods: 18, version: 'v2.0.8-rc1' },
          { name: 'Production', short: 'PROD', color: '#FF3366', bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.2)', health: 100, pods: 48, version: 'v2.0.7' },
        ].map((env, i) => (
          <motion.div
            key={env.short}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            className="rounded-2xl p-5"
            style={{ background: env.bg, border: `1px solid ${env.border}` }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: env.color, fontFamily: 'JetBrains Mono, monospace' }}>{env.short}</p>
                <p className="mt-1 text-white font-semibold">{env.name}</p>
              </div>
              <span className="rounded-full border border-[rgba(0,255,163,0.15)] bg-[rgba(0,255,163,0.08)] px-2 py-0.5 text-[10px] font-medium text-[#00FFA3]">Healthy</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Version</span>
                <span className="font-medium" style={{ color: env.color, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{env.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Pods Running</span>
                <span className="font-medium text-white">{env.pods}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Health Score</span>
                <span className="font-medium text-white">{env.health}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                <div className="h-full rounded-full" style={{ width: `${env.health}%`, background: env.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
