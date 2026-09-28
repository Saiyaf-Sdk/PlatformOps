import type { AppStatus, DeploymentStatus, EnvCode, IncidentStatus, Severity } from '../lib/types';
import { ENV_META } from '../lib/format';

const DEPLOY: Record<DeploymentStatus, { text: string; cls: string; live?: boolean }> = {
  QUEUED: { text: 'queued', cls: 'text-fg-2' },
  RUNNING: { text: 'running', cls: 'text-sky', live: true },
  SUCCEEDED: { text: 'arrived', cls: 'text-ok' },
  FAILED: { text: 'HALTED', cls: 'text-bad', live: true },
  CANCELLED: { text: 'cancelled', cls: 'text-fg-3' },
};

export function DeployStatusChip({ status }: { status: DeploymentStatus }) {
  const s = DEPLOY[status];
  return (
    <span className={`chip ${s.cls}`}>
      {s.live ? <span className="live-dot" /> : <i className="h-1.5 w-1.5 rounded-full bg-current" />}
      {s.text}
    </span>
  );
}

const APP: Record<AppStatus, { text: string; cls: string }> = {
  HEALTHY: { text: 'healthy', cls: 'text-ok' },
  WARNING: { text: 'degraded', cls: 'text-warn' },
  CRITICAL: { text: 'FAILING', cls: 'text-bad' },
};

export function AppStatusChip({ status }: { status: AppStatus }) {
  const s = APP[status];
  return (
    <span className={`chip ${s.cls}`}>
      {status === 'CRITICAL' ? <span className="live-dot" /> : <i className="h-1.5 w-1.5 rounded-full bg-current" />}
      {s.text}
    </span>
  );
}

export function EnvChip({ code }: { code: EnvCode }) {
  const m = ENV_META[code];
  return (
    <span className="chip font-mono !text-[0.66rem] tracking-wider" style={{ color: m.color }}>
      <i className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />{m.short}
    </span>
  );
}

const SEV_COLOR: Record<Severity, string> = { SEV1: 'var(--bad)', SEV2: 'var(--bad)', SEV3: 'var(--warn)', SEV4: 'var(--sky)' };

export function SeverityChip({ severity }: { severity: Severity }) {
  return <span className="chip font-mono !text-[0.68rem]" style={{ color: SEV_COLOR[severity] }}>{severity}</span>;
}

const INC: Record<IncidentStatus, { text: string; cls: string; live?: boolean }> = {
  OPEN: { text: 'OPEN', cls: 'text-bad', live: true },
  ACKNOWLEDGED: { text: 'acknowledged', cls: 'text-warn' },
  RESOLVED: { text: 'resolved', cls: 'text-ok' },
};

export function IncidentStatusChip({ status }: { status: IncidentStatus }) {
  const s = INC[status];
  return (
    <span className={`chip ${s.cls}`}>
      {s.live ? <span className="live-dot" /> : <i className="h-1.5 w-1.5 rounded-full bg-current" />}
      {s.text}
    </span>
  );
}
