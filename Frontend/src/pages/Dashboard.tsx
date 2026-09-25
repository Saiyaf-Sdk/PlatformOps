import { motion } from 'framer-motion';
import { Box, CheckCircle, Activity, ShieldAlert, ArrowUpRight, Clock, Circle } from 'lucide-react';
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
    className="rounded-xl p-5 relative overflow-hidden"
    style={{ background: 'rgba(17, 29, 49, 0.8)', border: `1px solid rgba(255,255,255,0.06)` }}
  >
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none" style={{ background: bg, opacity: 0.15, transform: 'translate(30%, -30%)' }} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-widest mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {title}
        </p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        {trend && (
          <p className="text-xs text-[#00FFA3] mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {trend}
          </p>
        )}
      </div>
      <div className="p-2.5 rounded-lg shrink-0" style={{ background: bg, border: `1px solid ${border}` }}>
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
      {/* Page Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-[#94A3B8] text-sm mt-0.5">
              Platform health overview — <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#475569' }}>Thu, 25 Sep 2026</span>
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(0,255,163,0.06)', border: '1px solid rgba(0,255,163,0.15)', color: '#00FFA3', fontFamily: 'JetBrains Mono, monospace' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
            ALL SYSTEMS NOMINAL
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Applications" value="24" icon={Box} color="#00F0FF" bg="rgba(0,240,255,0.15)" border="rgba(0,240,255,0.2)" delay={0.05} trend="+2 this week" />
        <StatCard title="Healthy Services" value="98%" icon={CheckCircle} color="#00FFA3" bg="rgba(0,255,163,0.15)" border="rgba(0,255,163,0.2)" delay={0.1} trend="2 degraded" />
        <StatCard title="Deployments Today" value="142" icon={Activity} color="#7B2CBF" bg="rgba(123,44,191,0.15)" border="rgba(123,44,191,0.2)" delay={0.15} trend="+18 vs yesterday" />
        <StatCard title="Active Incidents" value="2" icon={ShieldAlert} color="#FF3366" bg="rgba(255,51,102,0.15)" border="rgba(255,51,102,0.2)" delay={0.2} />
      </div>

      {/* Middle section: 3D Topology + Recent Deployments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ minHeight: '380px' }}>
        {/* 3D Topology */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="lg:col-span-2 rounded-xl overflow-hidden flex flex-col"
          style={{ background: 'rgba(11, 20, 35, 0.85)', border: '1px solid rgba(0,240,255,0.08)' }}
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(0,240,255,0.06)]">
            <h2 className="text-sm font-semibold text-white">Infrastructure Topology</h2>
            <div className="flex gap-3 text-[10px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: '#00FFA3' }}>● PlatformOps</span>
              <span style={{ color: '#7B2CBF' }}>● Jenkins</span>
              <span style={{ color: '#00BFFF' }}>● ECR</span>
              <span style={{ color: '#FF3366' }}>● Production</span>
            </div>
          </div>
          <div className="flex-1 relative" style={{ minHeight: '300px' }}>
            <ThreeDNetwork />
          </div>
        </motion.div>

        {/* Recent Deployments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-xl flex flex-col"
          style={{ background: 'rgba(17, 29, 49, 0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(255,255,255,0.05)]">
            <h2 className="text-sm font-semibold text-white">Recent Deployments</h2>
            <Clock className="w-4 h-4 text-[#475569]" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
            {recentDeployments.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <Circle className="w-2 h-2 shrink-0" style={{ fill: statusColor[d.status], color: statusColor[d.status] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{d.app}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#475569' }}>{d.version}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: envBadge[d.env]?.bg, color: envBadge[d.env]?.color, fontFamily: 'JetBrains Mono, monospace' }}>
                      {d.env}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-[#475569] shrink-0">{d.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Environment Status */}
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
            className="rounded-xl p-5"
            style={{ background: env.bg, border: `1px solid ${env.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: env.color, fontFamily: 'JetBrains Mono, monospace' }}>{env.short}</p>
                <p className="text-white font-semibold mt-0.5">{env.name}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(0,255,163,0.1)', color: '#00FFA3', border: '1px solid rgba(0,255,163,0.2)' }}>Healthy</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Version</span>
                <span className="font-medium" style={{ color: env.color, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{env.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Pods Running</span>
                <span className="text-white font-medium">{env.pods}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Health Score</span>
                <span className="text-white font-medium">{env.health}%</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${env.health}%`, background: env.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
