import { useId } from 'react';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--sky)" />
          <stop offset="55%" stopColor="var(--iris)" />
          <stop offset="100%" stopColor="var(--lilac)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="var(--primary)" />
      <path d="M14 42h11c7 0 7-20 14-20h11" fill="none" stroke={`url(#${id}g)`} strokeWidth="6" strokeLinecap="round" />
      <circle cx="14" cy="42" r="5" fill="var(--primary)" stroke="var(--sky)" strokeWidth="3.5" />
      <circle cx="50" cy="22" r="6" fill="var(--lilac)" />
    </svg>
  );
}

export default function Logo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'} />
      <span className={`font-display font-extrabold leading-none ${size === 'lg' ? 'text-[1.75rem]' : 'text-[1.35rem]'}`}>
        platform<span className="grad">OPS</span>
      </span>
    </div>
  );
}
