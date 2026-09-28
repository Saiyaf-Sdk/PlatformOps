import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import ReleaseLine from '../components/ReleaseLine';
import Background from '../components/Background';
import ThemeToggle from '../components/ThemeToggle';
import { ease } from '../components/motion';

const loginSchema = z.object({
  email: z.string().email('that doesn’t look like an email'),
  password: z.string().min(6, 'use at least 6 characters'),
  remember: z.boolean().optional(),
});
type LoginForm = z.infer<typeof loginSchema>;

const TICKER = [
  { app: 'auth-service', v: 'v3.2.1', env: 'PROD', ok: true },
  { app: 'payment-gateway', v: 'v1.8.0', env: 'STAGING', ok: true },
  { app: 'frontend-dashboard', v: 'v5.1.2', env: 'DEV', ok: true },
  { app: 'notification-svc', v: 'v1.3.0', env: 'PROD', ok: true },
  { app: 'inventory-worker', v: 'v2.0.4', env: 'PROD', ok: false },
  { app: 'analytics-engine', v: 'v1.0.0', env: 'STAGING', ok: true },
];

const word = (i: number) => ({
  initial: { opacity: 0, y: '60%', rotate: 3 },
  animate: { opacity: 1, y: '0%', rotate: 0 },
  transition: { duration: 0.9, delay: 0.1 + i * 0.09, ease },
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginForm) => {
    setIsLoading(true);
    setTimeout(() => { login(data.email, data.password); navigate('/dashboard'); }, 900);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <Background />

      <header className="flex items-center justify-between px-6 pt-6 sm:px-10">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="tag hidden items-center gap-2 sm:flex"><span className="live-dot text-ok" /> All lines running</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="grid flex-1 items-center gap-12 px-6 py-10 sm:px-10 lg:grid-cols-[1.35fr_1fr] xl:gap-20">
        {/* ── story ───────────────────────────── */}
        <section>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="tag mb-6">
            {'// '}Release control for platform teams
          </motion.p>

          <h1 className="font-display text-[clamp(3.4rem,8.2vw,7.6rem)] font-extrabold leading-[0.86]">
            <span className="block overflow-hidden pb-[0.06em]">
              <motion.span className="inline-block" {...word(0)}>ship</motion.span>{' '}
              <motion.span className="hl inline-block" {...word(1)}>FASTER</motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span className="outline-text inline-block" {...word(2)}>sleep</motion.span>{' '}
              <motion.span className="shimmer-text inline-block" {...word(3)}>better.</motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5, ease }}
            className="mt-7 max-w-md text-[1.05rem] font-medium leading-relaxed text-fg-2"
          >
            Every release is a train on the line — from <b className="text-fg">commit</b> to <b className="text-fg">PROD</b>.
            Know where each one is, always.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.65, ease }}
            className="-mx-2 mt-10 hidden sm:block"
          >
            <ReleaseLine mode="story" />
          </motion.div>
        </section>

        {/* ── sign in ─────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.9, delay: 0.25, ease }}
          className="panel mx-auto w-full max-w-[430px] p-7 sm:p-9"
        >
          <p className="tag">Sign in</p>
          <h2 className="mt-3 font-display text-[2.6rem] font-extrabold leading-none">
            welcome <span className="text-accent-text">BACK</span>
          </h2>
          <p className="mt-3 text-[0.95rem] font-medium text-fg-2">Step into the control room.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="tag mb-2 block">Work email</label>
              <input id="email" {...register('email')} className="field" placeholder="you@company.com" autoComplete="email" />
              {errors.email && <p className="mt-1.5 text-[0.8rem] font-semibold text-bad">{errors.email.message}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label htmlFor="password" className="tag">Password</label>
                <a href="#" className="text-[0.8rem] font-semibold text-fg-3 transition-colors hover:text-accent-text">forgot?</a>
              </div>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'} {...register('password')} className="field pr-12"
                  placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-fg-3 hover:text-fg"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-[0.8rem] font-semibold text-bad">{errors.password.message}</p>}
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2.5 text-[0.875rem] font-medium text-fg-2">
              <input type="checkbox" {...register('remember')} className="h-4 w-4 rounded accent-[var(--accent)]" />
              keep me signed in for 30 days
            </label>

            <button type="submit" disabled={isLoading} className="btn btn-accent btn-shine group h-12 w-full text-[0.95rem]">
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-ink border-t-transparent" />
              ) : (
                <>enter the <b className="font-extrabold">CONTROL ROOM</b> <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4"><span className="h-px flex-1 bg-line" /><span className="tag">or</span><span className="h-px flex-1 bg-line" /></div>

          <button type="button" className="btn btn-ghost h-12 w-full"><KeyRound className="h-4 w-4" /> continue with SSO</button>
        </motion.section>
      </div>

      {/* ── live ticker ────────────────────────── */}
      <div className="marquee border-t border-line py-4">
        {[0, 1].map((k) => (
          <div key={k} className="marquee-track" aria-hidden={k === 1}>
            {TICKER.map((t) => (
              <span key={t.app} className="flex items-center gap-3 whitespace-nowrap text-[0.9rem]">
                <span className={`h-2 w-2 rounded-full ${t.ok ? 'bg-ok' : 'bg-bad'}`} />
                <b className="font-display text-[1.05rem] font-bold">{t.app}</b>
                <span className="font-mono text-[0.8rem] text-fg-3">{t.v}</span>
                <span className="tag !text-fg-2">→ {t.env}</span>
                <span className="text-fg-3">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
