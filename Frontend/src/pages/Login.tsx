import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import Intro from '../components/Intro';
import { Magnetic, RevealWords, SpotPanel } from '../components/fx';
import { ease } from '../components/motion';
import { errorMessage } from '../lib/api';

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

// the intro runs ~1.9s on the first visit of a session; entrances start as the curtain lifts
const isFirstVisit = () => {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return sessionStorage.getItem('po-intro') !== '1';
  } catch { return false; }
};

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [D] = useState(() => (isFirstVisit() ? 1.7 : 0.1));
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setFormError(null);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
      setIsLoading(false);
    }
  };

  const fillDemo = () => {
    setValue('email', 'admin@platformops.dev', { shouldValidate: true });
    setValue('password', 'Admin@12345', { shouldValidate: true });
  };

  if (isAuthenticated) return <Navigate to={from} replace />;

  return (
    <div className="relative flex min-h-screen flex-col">
      <Intro />
      <Background />

      <motion.header
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: D, ease }}
        className="flex items-center justify-between px-6 pt-6 sm:px-10"
      >
        <Logo />
        <div className="flex items-center gap-5">
          <span className="tag hidden items-center gap-2 sm:flex"><span className="live-dot text-ok" /> All lines running</span>
          <ThemeToggle />
        </div>
      </motion.header>

      <div className="grid flex-1 items-center gap-12 px-6 py-10 sm:px-10 lg:grid-cols-[1.35fr_1fr] xl:gap-24">
        {/* ── story ───────────────────────────── */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: D, ease }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-surface py-1 pl-1 pr-3.5 backdrop-blur"
          >
            <span className="rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold tracking-wide text-white" style={{ background: 'var(--grad)' }}>NEW</span>
            <span className="text-[0.8rem] font-semibold text-fg-2">canary releases, now one click</span>
          </motion.div>

          <h1 className="font-display text-[clamp(3.3rem,8vw,7.4rem)] font-extrabold leading-[0.9]">
            <RevealWords
              delay={D + 0.1}
              parts={[{ t: 'ship' }, { t: 'FASTER.', className: 'grad' }, 'br', { t: 'sleep', className: 'thin' }, { t: 'better.' }]}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1, delay: D + 0.55, ease }}
            className="mt-8 max-w-md text-[1.075rem] font-medium leading-relaxed text-fg-2"
          >
            Every release is a train on the line — from <b className="font-bold text-fg">commit</b> to <b className="font-bold text-fg">PROD</b>.
            PlatformOps shows you where each one is, the moment it moves.
          </motion.p>

          <div className="-mx-2 mt-12 hidden sm:block">
            <ReleaseLine mode="story" delay={D + 0.6} />
          </div>
        </section>

        {/* ── sign in ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96, filter: 'blur(14px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: D + 0.25, ease }}
          className="mx-auto w-full max-w-[440px]"
        >
          <SpotPanel beam className="p-7 sm:p-9">
            <p className="tag">Sign in</p>
            <h2 className="mt-3 font-display text-[2.6rem] font-extrabold leading-none">
              welcome <span className="grad">BACK</span>
            </h2>
            <p className="mt-3 text-[0.95rem] font-medium text-fg-2">Step into the control room.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="tag mb-2 block">Work email</label>
                <input id="email" {...register('email')} className="field" placeholder="you@company.com" autoComplete="email" />
                {errors.email && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-[0.8rem] font-semibold text-bad">{errors.email.message}</motion.p>}
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <label htmlFor="password" className="tag">Password</label>
                  <a href="#" className="text-[0.8rem] font-semibold text-fg-3 transition-colors hover:text-accent-text">forgot?</a>
                </div>
                <div className="relative">
                  <input id="password" type={showPw ? 'text' : 'password'} {...register('password')} className="field pr-12" placeholder="••••••••" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-fg-3 hover:text-fg"
                    aria-label={showPw ? 'Hide password' : 'Show password'}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-[0.8rem] font-semibold text-bad">{errors.password.message}</motion.p>}
              </div>

              <label className="flex cursor-pointer select-none items-center gap-2.5 text-[0.875rem] font-medium text-fg-2">
                <input type="checkbox" {...register('remember')} className="h-4 w-4 rounded accent-[var(--iris)]" />
                keep me signed in for 30 days
              </label>

              {formError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert"
                  className="rounded-2xl border p-3.5 text-[0.85rem] font-semibold text-bad"
                  style={{ borderColor: 'color-mix(in oklab, var(--bad) 35%, transparent)', background: 'color-mix(in oklab, var(--bad) 8%, transparent)' }}>
                  {formError}
                </motion.p>
              )}

              <Magnetic strength={0.12} className="w-full">
                <button type="submit" disabled={isLoading} className="btn btn-primary group h-12 w-full text-[0.95rem]">
                  {isLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-ink border-t-transparent" />
                  ) : (
                    <>enter the <b className="font-extrabold">CONTROL ROOM</b> <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></>
                  )}
                </button>
              </Magnetic>
            </form>

            <div className="my-6 flex items-center gap-4"><span className="h-px flex-1 bg-line" /><span className="tag">or</span><span className="h-px flex-1 bg-line" /></div>
            {import.meta.env.VITE_HIDE_DEMO !== 'true' ? (
              <button type="button" onClick={fillDemo} className="btn btn-ghost h-12 w-full"><KeyRound className="h-4 w-4" /> use the <b className="font-extrabold">DEMO</b> admin account</button>
            ) : (
              <button type="button" className="btn btn-ghost h-12 w-full"><KeyRound className="h-4 w-4" /> continue with SSO</button>
            )}
          </SpotPanel>
        </motion.div>
      </div>

      {/* ── live ticker ────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: D + 0.9 }} className="marquee border-t border-line py-4">
        {[0, 1].map((k) => (
          <div key={k} className="marquee-track" aria-hidden={k === 1}>
            {TICKER.map((t) => (
              <span key={t.app} className="flex items-center gap-3 whitespace-nowrap">
                <span className={`live-dot ${t.ok ? 'text-ok' : 'text-bad'}`} />
                <b className="font-display text-[1.05rem] font-bold">{t.app}</b>
                <span className="font-mono text-[0.78rem] text-fg-3">{t.v}</span>
                <span className="tag !text-fg-2">→ {t.env}</span>
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
