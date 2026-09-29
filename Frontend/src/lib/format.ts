import type { EnvCode, Role } from './types';

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });

export function timeAgo(iso?: string, now = Date.now()): string {
  if (!iso) return '—';
  const s = Math.round((new Date(iso).getTime() - now) / 1000);
  const a = Math.abs(s);
  if (a < 45) return 'just now';
  if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  if (a < 86400 * 30) return rtf.format(Math.round(s / 86400), 'day');
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const clock = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

export const dateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export function duration(sec?: number): string {
  if (sec === undefined || sec === null) return '—';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  return m < 60 ? `${m}m ${sec % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export const ENV_META: Record<EnvCode, { label: string; short: string; color: string }> = {
  DEV: { label: 'development', short: 'DEV', color: 'var(--amber)' },
  STAGING: { label: 'staging', short: 'STAGING', color: 'var(--sky)' },
  PRODUCTION: { label: 'production', short: 'PROD', color: 'var(--iris)' },
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrator',
  DEVOPS: 'DevOps',
  DEVELOPER: 'Developer',
  VIEWER: 'Viewer',
};

export const initials = (name?: string) =>
  (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
