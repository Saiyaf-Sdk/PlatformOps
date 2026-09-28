/**
 * ReleaseLine — the signature visual of PlatformOps.
 * The delivery pipeline drawn as a transit line: every release is a
 * train that departs from a commit and arrives in production.
 */

type Station = {
  id: string;
  x: number;
  y: number;
  name: string;
  story: string;
  version: string;
  color?: string; // environment stations get a line colour
};

const PATH = 'M60 170 H300 C350 170 350 90 400 90 H640 C690 90 690 170 740 170 H940';

const STATIONS: Station[] = [
  { id: 'commit', x: 60, y: 170, name: 'Commit', story: 'git push', version: 'main · 5ce2778' },
  { id: 'build', x: 210, y: 170, name: 'Jenkins', story: 'build & test', version: 'build #1284' },
  { id: 'image', x: 460, y: 90, name: 'Amazon ECR', story: 'image signed', version: 'sha 9f2c1a' },
  { id: 'dev', x: 590, y: 90, name: 'Dev', story: 'smoke tests', version: 'v2.1.0-dev', color: 'var(--warn)' },
  { id: 'staging', x: 800, y: 170, name: 'Staging', story: 'canary 10%', version: 'v2.0.8-rc1', color: 'var(--cobalt)' },
  { id: 'prod', x: 940, y: 170, name: 'Production', story: 'live on k8s', version: 'v2.0.7', color: 'var(--signal)' },
];

interface ReleaseLineProps {
  mode?: 'story' | 'status';
  className?: string;
}

export default function ReleaseLine({ mode = 'story', className = '' }: ReleaseLineProps) {
  return (
    <svg viewBox="0 0 1000 250" className={`w-full h-auto ${className}`} role="img" aria-label="Release pipeline from commit to production">
      {/* rail */}
      <path d={PATH} fill="none" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d={PATH} fill="none" stroke="var(--paper)" strokeWidth="1.5" strokeDasharray="2 12" strokeLinecap="round" opacity="0.7" />

      {/* trains */}
      {[0, 3.2, 6.4].map((delay) => (
        <g key={delay}>
          <circle r="13" fill="var(--signal)" opacity="0.18">
            <animateMotion dur="9.6s" begin={`-${delay}s`} repeatCount="indefinite" path={PATH} />
          </circle>
          <circle r="6.5" fill="var(--signal)" stroke="var(--card)" strokeWidth="2.5">
            <animateMotion dur="9.6s" begin={`-${delay}s`} repeatCount="indefinite" path={PATH} />
          </circle>
        </g>
      ))}

      {/* stations */}
      {STATIONS.map((s) => {
        const above = s.y < 130;
        const nameY = above ? s.y - 44 : s.y + 42;
        const subY = above ? s.y - 24 : s.y + 62;
        const isEnv = Boolean(s.color);
        return (
          <g key={s.id}>
            {isEnv ? (
              <>
                <circle cx={s.x} cy={s.y} r="15" fill="var(--card)" stroke={s.color} strokeWidth="6" />
                <circle cx={s.x} cy={s.y} r="4" fill={s.color} />
              </>
            ) : (
              <circle cx={s.x} cy={s.y} r="10" fill="var(--card)" stroke="var(--ink)" strokeWidth="4.5" />
            )}
            <text x={s.x} y={nameY} textAnchor="middle" fill="var(--ink)" style={{ font: '500 19px "Geist Variable", Geist, sans-serif', letterSpacing: '-0.01em' }}>
              {s.name}
            </text>
            <text
              x={s.x}
              y={subY}
              textAnchor="middle"
              fill={isEnv && mode === 'status' ? s.color : 'var(--ink-3)'}
              style={{ font: mode === 'status' ? '500 14px "Geist Mono", monospace' : 'italic 17px "Instrument Serif", serif' }}
            >
              {mode === 'status' ? s.version : s.story}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
