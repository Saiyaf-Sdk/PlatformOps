import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TITLES: Record<string, string> = {
  environments: 'Environments',
  deployments: 'Deployments',
  infrastructure: 'Infrastructure',
  monitoring: 'Monitoring',
  incidents: 'Incidents',
  'audit-logs': 'Audit log',
  users: 'People & access',
};

export default function ComingSoon() {
  const { pathname } = useLocation();
  const title = TITLES[pathname.replace('/', '')] ?? 'This page';

  return (
    <div className="card flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <svg viewBox="0 0 240 40" className="mb-8 w-60" aria-hidden="true">
        <path d="M8 20 H232" stroke="var(--line-2)" strokeWidth="6" strokeDasharray="22 12" strokeLinecap="round" />
        <circle cx="120" cy="20" r="11" fill="var(--card)" stroke="var(--signal)" strokeWidth="5" />
      </svg>
      <p className="text-[0.9rem] text-ink-3">Station under construction</p>
      <h1 className="mt-3 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-none">
        {title} <em className="text-signal">arrives soon.</em>
      </h1>
      <p className="mt-4 max-w-md text-[0.95rem] text-ink-2">
        We are laying track for this part of PlatformOps. Until then, the overview has the essentials.
      </p>
      <Link to="/dashboard" className="btn btn-ink mt-8">
        <ArrowLeft className="h-4 w-4" /> Back to overview
      </Link>
    </div>
  );
}
