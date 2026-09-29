import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { rise } from '../components/motion';

const TITLES: Record<string, string> = {
  environments: 'environments', deployments: 'deployments', infrastructure: 'infrastructure',
  monitoring: 'monitoring', incidents: 'incidents', 'audit-logs': 'audit log', users: 'people',
};

export default function ComingSoon() {
  const { pathname } = useLocation();
  const title = TITLES[pathname.slice(1)] ?? 'this page';

  return (
    <div className="panel beam flex min-h-[64vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <svg viewBox="0 0 320 40" className="mb-10 w-72 max-w-full" aria-hidden="true">
        <path d="M10 20 H310" stroke="var(--border-strong)" strokeWidth="6" strokeDasharray="24 12" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" from="0" to="-72" dur="1.6s" repeatCount="indefinite" />
        </path>
        <circle r="9" cy="20" fill="var(--text)" style={{ filter: 'drop-shadow(0 0 8px var(--iris))' }}>
          <animate attributeName="cx" values="30;290;30" dur="5s" repeatCount="indefinite" />
        </circle>
      </svg>
      <motion.p {...rise(0)} className="tag">Station under construction</motion.p>
      <motion.h1 {...rise(0.06)} className="mt-4 font-display text-[clamp(2.6rem,7vw,5.25rem)] font-extrabold leading-[0.9]">
        {title}<br /><span className="grad">ARRIVING</span> <span className="thin">soon.</span>
      </motion.h1>
      <motion.p {...rise(0.12)} className="mt-6 max-w-md font-medium text-fg-2">
        We’re laying track for this part of PlatformOps. The overview has the essentials until then.
      </motion.p>
      <motion.div {...rise(0.18)}>
        <Link to="/dashboard" className="btn btn-primary mt-8"><ArrowLeft className="h-4 w-4" /> back to overview</Link>
      </motion.div>
    </div>
  );
}
