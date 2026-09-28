export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="var(--accent)" />
      <path d="M14 42h11c7 0 7-20 14-20h11" fill="none" stroke="var(--accent-ink)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="14" cy="42" r="5.5" fill="var(--accent)" stroke="var(--accent-ink)" strokeWidth="4" />
      <circle cx="50" cy="22" r="6.5" fill="var(--accent-ink)" />
    </svg>
  );
}

export default function Logo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'} />
      <span className={`font-display font-extrabold leading-none ${size === 'lg' ? 'text-[1.75rem]' : 'text-[1.4rem]'}`}>
        platform<span className="text-accent-text">OPS</span>
      </span>
    </div>
  );
}
