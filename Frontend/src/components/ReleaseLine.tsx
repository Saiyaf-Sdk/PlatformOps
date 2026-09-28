/**
 * ReleaseLine — the delivery pipeline drawn as a transit line.
 * Every release is a train running from commit to production.
 */

type Station = { id: string; x: number; y: number; name: string; story: string; version: string; color?: string };

const PATH = 'M60 170 H300 C350 170 350 90 400 90 H640 C690 90 690 170 740 170 H940';

const STATIONS: Station[] = [
  { id: 'commit', x: 60, y: 170, name: 'commit', story: 'GIT PUSH', version: 'main·5ce2778' },
  { id: 'build', x: 210, y: 170, name: 'jenkins', story: 'BUILD + TEST', version: 'build #1284' },
  { id: 'image', x: 460, y: 90, name: 'ECR', story: 'IMAGE SIGNED', version: 'sha 9f2c1a' },
  { id: 'dev', x: 590, y: 90, name: 'dev', story: 'SMOKE TESTS', version: 'v2.1.0-dev', color: 'var(--amber)' },
  { id: 'staging', x: 800, y: 170, name: 'staging', story: 'CANARY 10%', version: 'v2.0.8-rc1', color: 'var(--violet)' },
  { id: 'prod', x: 940, y: 170, name: 'PROD', story: 'LIVE ON K8S', version: 'v2.0.7', color: 'var(--coral)' },
];

export default function ReleaseLine({ mode = 'story', className = '' }: { mode?: 'story' | 'status'; className?: string }) {
  return (
    <svg viewBox="0 0 1000 250" className={`h-auto w-full overflow-visible ${className}`} role="img" aria-label="Release pipeline from commit to production">
      <defs>
        <linearGradient id="rail" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--text-3)" />
          <stop offset="55%" stopColor="var(--text)" />
          <stop offset="100%" stopColor="var(--coral)" />
        </linearGradient>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <path d={PATH} fill="none" stroke="url(#rail)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d={PATH} fill="none" stroke="var(--bg)" strokeWidth="2" strokeDasharray="3 13" strokeLinecap="round">
        <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="1.2s" repeatCount="indefinite" />
      </path>

      {[0, 3.2, 6.4].map((d) => (
        <g key={d} filter="url(#glow)">
          <circle r="7.5" fill="var(--accent)" stroke="var(--accent-ink)" strokeWidth="2.5">
            <animateMotion dur="9.6s" begin={`-${d}s`} repeatCount="indefinite" path={PATH} />
          </circle>
        </g>
      ))}

      {STATIONS.map((s) => {
        const above = s.y < 130;
        const nameY = above ? s.y - 46 : s.y + 46;
        const subY = above ? s.y - 26 : s.y + 66;
        const env = Boolean(s.color);
        return (
          <g key={s.id}>
            {env ? (
              <>
                <circle cx={s.x} cy={s.y} r="22" fill={s.color} opacity="0.18">
                  <animate attributeName="r" values="16;26;16" dur="2.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.35;0;0.35" dur="2.8s" repeatCount="indefinite" />
                </circle>
                <circle cx={s.x} cy={s.y} r="15" fill="var(--bg)" stroke={s.color} strokeWidth="6" />
                <circle cx={s.x} cy={s.y} r="4.5" fill={s.color} />
              </>
            ) : (
              <circle cx={s.x} cy={s.y} r="10.5" fill="var(--bg)" stroke="var(--text)" strokeWidth="4.5" />
            )}
            <text x={s.x} y={nameY} textAnchor="middle" fill="var(--text)"
              style={{ font: '800 22px "Bricolage Grotesque Variable", sans-serif', letterSpacing: '-0.03em' }}>
              {s.name}
            </text>
            <text x={s.x} y={subY} textAnchor="middle"
              fill={env && mode === 'status' ? s.color : 'var(--text-3)'}
              style={{ font: '600 12.5px "JetBrains Mono Variable", monospace', letterSpacing: mode === 'story' ? '0.12em' : '0' }}>
              {mode === 'status' ? s.version : s.story}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
