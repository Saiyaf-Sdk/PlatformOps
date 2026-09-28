import { useRef, useState } from 'react';
import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { motion, useInView, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { ease } from './motion';

const setSpot = (e: MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

/** Glass panel whose fill and border light up under the cursor. */
export function SpotPanel({ children, className = '', beam = false, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode; beam?: boolean }) {
  return (
    <div onMouseMove={setSpot} className={`panel spot ${beam ? 'beam' : ''} ${className}`} {...rest}>
      {children}
    </div>
  );
}

/** 3D tilt card with a moving glare. */
export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const rx = useSpring(0, { stiffness: 180, damping: 18 });
  const ry = useSpring(0, { stiffness: 180, damping: 18 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx}% ${gy}%, rgba(255,255,255,0.10), transparent 45%)`;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    setSpot(e);
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 10);
    rx.set((0.5 - py) * 10);
    gx.set(px * 100); gy.set(py * 100);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };

  return (
    <div style={{ perspective: 1000 }} className="h-full">
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className={`panel spot group h-full ${className}`}
      >
        <motion.div className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: glare }} />
        <div style={{ transform: 'translateZ(30px)' }} className="relative h-full">{children}</div>
      </motion.div>
    </div>
  );
}

/** Pulls its child toward the cursor — for primary buttons. */
export function Magnetic({ children, strength = 0.35, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const x = useSpring(0, { stiffness: 220, damping: 15, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 15, mass: 0.4 });
  return (
    <motion.div
      className={`inline-flex ${className}`}
      style={{ x, y }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}

/** Rolling-digit counter: each digit spins into place like an odometer. */
export function Odometer({ value, className = '', delay = 0 }: { value: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <span ref={ref} className={`inline-flex overflow-hidden leading-none num ${className}`} aria-label={value}>
      {value.split('').map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={i} aria-hidden="true">{ch}</span>;
        const d = Number(ch);
        return (
          <span key={i} className="relative inline-block h-[1em] overflow-hidden" aria-hidden="true">
            <motion.span
              className="flex flex-col"
              initial={{ y: '0em' }}
              animate={inView ? { y: `-${d + 10}em` } : undefined}
              transition={{ duration: 1.6 + i * 0.15, delay, ease }}
            >
              {Array.from({ length: 20 }).map((_, n) => <span key={n} className="block h-[1em]">{n % 10}</span>)}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

type Part = { t: string; className?: string };

/** Headline whose words rise out of a mask one after another. */
export function RevealWords({ parts, delay = 0, stagger = 0.08, className = '' }: { parts: (Part | 'br')[]; delay?: number; stagger?: number; className?: string }) {
  let i = 0;
  return (
    <span className={className}>
      {parts.map((p, k) => {
        if (p === 'br') return <br key={k} />;
        return p.t.split(' ').map((w, j) => {
          const idx = i++;
          return (
            <span key={`${k}-${j}`} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
              <motion.span
                className={`inline-block ${p.className ?? ''}`}
                initial={{ y: '105%', rotate: 4, opacity: 0, filter: 'blur(8px)' }}
                animate={{ y: '0%', rotate: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.1, delay: delay + idx * stagger, ease }}
              >
                {w}
              </motion.span>
              {' '}
            </span>
          );
        });
      })}
    </span>
  );
}

/** Sparkline that draws itself. */
export function Spark({ data, color = 'var(--iris)', className = '' }: { data: number[]; color?: string; className?: string }) {
  const w = 120, h = 36;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [ (i / (data.length - 1)) * w, h - 4 - ((v - min) / (max - min || 1)) * (h - 8) ]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const [id] = useState(() => `sp${Math.random().toString(36).slice(2, 8)}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.6 }} />
      <motion.path d={d} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease }} />
    </svg>
  );
}

/** Thin gradient bar that sweeps across the top on every route change. */
export function RouteProgress({ routeKey }: { routeKey: string }) {
  return (
    <motion.div
      key={routeKey}
      className="pointer-events-none fixed left-0 top-0 z-[60] h-[2px] w-full origin-left"
      style={{ background: 'var(--grad)', boxShadow: '0 0 12px var(--iris)' }}
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: 1, opacity: [1, 1, 0] }}
      transition={{ duration: 0.9, ease, opacity: { times: [0, 0.7, 1], duration: 0.9 } }}
    />
  );
}
