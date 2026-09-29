import { useId } from 'react';
import { motion } from 'framer-motion';

/**
 * ReleaseLine — the delivery pipeline as a transit line.
 * The track draws itself, stations light up in sequence,
 * and releases travel as glowing comets from commit to PROD.
 */

type Station = { id: string; x: number; y: number; name: string; story: string; version: string; color?: string };

const PATH = 'M60 170 H300 C350 170 350 90 400 90 H640 C690 90 690 170 740 170 H940';

const STATIONS: Station[] = [
  { id: 'commit', x: 60, y: 170, name: 'commit', story: 'GIT PUSH', version: 'main·5ce2778' },
  { id: 'build', x: 210, y: 170, name: 'jenkins', story: 'BUILD + TEST', version: 'build #1284' },
  { id: 'image', x: 460, y: 90, name: 'ECR', story: 'IMAGE SIGNED', version: 'sha 9f2c1a' },
  { id: 'dev', x: 590, y: 90, name: 'dev', story: 'SMOKE TESTS', version: 'v2.1.0-dev', color: 'var(--amber)' },
  { id: 'staging', x: 800, y: 170, name: 'staging', story: 'CANARY 10%', version: 'v2.0.8-rc1', color: 'var(--sky)' },
  { id: 'prod', x: 940, y: 170, name: 'PROD', story: 'LIVE ON K8S', version: 'v2.0.7', color: 'var(--iris)' },
];

const DUR = 10;
const TRAINS = [0, 3.33, 6.66];
const TAIL = [0, 0.05, 0.1, 0.16, 0.22, 0.29, 0.37];

export type StationValues = Partial<Record<'commit' | 'build' | 'image' | 'dev' | 'staging' | 'prod', string>>;

export default function ReleaseLine({ mode = 'story', className = '', delay = 0.2, values }: {
  mode?: 'story' | 'status'; className?: string; delay?: number; values?: StationValues;
}) {
  const uid = useId().replace(/:/g, '');
  const ease = [0.65, 0, 0.35, 1] as const;

  return (
    <svg viewBox="0 0 1000 250" className={`h-auto w-full overflow-visible ${className}`} role="img" aria-label="Release pipeline from commit to production">
      <defs>
        <linearGradient id={`${uid}r`} gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="940" y2="0">
          <stop offset="0%" stopColor="var(--text-3)" />
          <stop offset="38%" stopColor="var(--text-2)" />
          <stop offset="60%" stopColor="var(--amber)" />
          <stop offset="82%" stopColor="var(--sky)" />
          <stop offset="100%" stopColor="var(--iris)" />
        </linearGradient>
        <filter id={`${uid}g`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* track bed + rail draw in */}
      <motion.path d={PATH} fill="none" stroke="var(--border)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay, ease }} />
      <motion.path d={PATH} fill="none" stroke={`url(#${uid}r)`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay: delay + 0.1, ease }} />

      {/* comets */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 1.6, duration: 0.8 }}>
        {TRAINS.map((t) => (
          <g key={t} filter={`url(#${uid}g)`}>
            {TAIL.map((lag, k) => (
              <circle key={k} r={Math.max(1.2, 5.5 - k * 0.7)} fill={k === 0 ? 'var(--text)' : 'var(--iris)'} opacity={k === 0 ? 1 : 0.75 - k * 0.1}>
                <animateMotion dur={`${DUR}s`} begin={`${(lag - t).toFixed(3)}s`} repeatCount="indefinite" path={PATH} calcMode="spline"
                  keyPoints="0;1" keyTimes="0;1" keySplines="0.45 0 0.55 1" />
              </circle>
            ))}
          </g>
        ))}
      </motion.g>

      {/* stations */}
      {STATIONS.map((s, i) => {
        const above = s.y < 130;
        const nameY = above ? s.y - 44 : s.y + 46;
        const subY = above ? s.y - 24 : s.y + 66;
        const env = Boolean(s.color);
        const d = delay + 0.35 + i * 0.22;
        return (
          <motion.g key={s.id} initial={{ opacity: 0, y: above ? -8 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: d, ease: [0.16, 1, 0.3, 1] }}>
            {env ? (
              <>
                <circle cx={s.x} cy={s.y} r="14" fill="none" stroke={s.color} strokeWidth="1.5">
                  <animate attributeName="r" values="12;30" dur="2.6s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0" dur="2.6s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={s.x} cy={s.y} r="12" fill="var(--bg)" stroke={s.color} strokeWidth="3" />
                <circle cx={s.x} cy={s.y} r="4.5" fill={s.color} filter={`url(#${uid}g)`} />
              </>
            ) : (
              <circle cx={s.x} cy={s.y} r="8" fill="var(--bg)" stroke="var(--text-2)" strokeWidth="2.5" />
            )}
            <text x={s.x} y={nameY} textAnchor="middle" fill="var(--text)"
              style={{ font: '750 21px "Bricolage Grotesque Variable", sans-serif', letterSpacing: '-0.035em' }}>
              {s.name}
            </text>
            <text x={s.x} y={subY} textAnchor="middle"
              fill={env && mode === 'status' ? s.color : 'var(--text-3)'}
              style={{ font: '500 11.5px "JetBrains Mono Variable", monospace', letterSpacing: mode === 'story' ? '0.14em' : '0.02em' }}>
              {mode === 'status' ? (values?.[s.id as keyof StationValues] ?? s.version) : s.story}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
