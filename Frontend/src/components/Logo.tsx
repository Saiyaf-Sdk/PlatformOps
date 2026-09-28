interface LogoProps {
  size?: 'sm' | 'lg';
  tone?: 'ink' | 'paper';
}

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--ink)" />
      <path d="M14 40h12c6 0 6-16 12-16h12" fill="none" stroke="var(--paper)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="14" cy="40" r="5" fill="var(--ink)" stroke="var(--paper)" strokeWidth="3.5" />
      <circle cx="50" cy="24" r="6" fill="var(--signal)" />
    </svg>
  );
}

export default function Logo({ size = 'sm', tone = 'ink' }: LogoProps) {
  const text = size === 'lg' ? 'text-[1.75rem]' : 'text-[1.3rem]';
  const color = tone === 'ink' ? 'text-ink' : 'text-paper';
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'} />
      <span className={`${text} ${color} leading-none tracking-[-0.03em] font-semibold`}>
        platform<span className="font-display italic font-normal text-signal tracking-normal">ops</span>
      </span>
    </div>
  );
}
