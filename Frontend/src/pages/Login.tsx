import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import ReleaseLine from '../components/ReleaseLine';

const loginSchema = z.object({
  email: z.string().email('That doesn’t look like an email address'),
  password: z.string().min(6, 'Use at least 6 characters'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const ease = [0.22, 1, 0.36, 1] as const;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    setIsLoading(true);
    setTimeout(() => {
      login(data.email, data.password);
      navigate('/dashboard');
    }, 900);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.25fr_1fr]">
      {/* ── Story side ───────────────────────────── */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line px-12 py-10 lg:flex xl:px-16">
        <Logo />

        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="mb-5 flex items-center gap-2 text-[0.9rem] text-ink-2"
          >
            <span className="live-dot text-ok" /> 142 releases arrived on time today
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05, ease }}
            className="font-display text-[clamp(3.25rem,6vw,5.75rem)] leading-[0.95] tracking-[-0.02em]"
          >
            Every release,<br />
            <em className="text-signal">right on schedule.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12, ease }}
            className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-ink-2"
          >
            PlatformOps runs your delivery pipeline like a railway — from the first
            commit to production, you always know where every train is.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }}
            className="mt-12 -mx-4"
          >
            <ReleaseLine mode="story" />
          </motion.div>
        </div>

        <div className="flex items-center gap-6 text-[0.8rem] text-ink-3">
          <span>ap-south-1</span>
          <span className="h-3 w-px bg-line-2" />
          <span><span className="num font-mono text-ink-2">12 ms</span> median latency</span>
          <span className="h-3 w-px bg-line-2" />
          <span><span className="num font-mono text-ink-2">7</span> stations online</span>
        </div>
      </section>

      {/* ── Sign-in side ─────────────────────────── */}
      <section className="flex flex-col px-6 py-10 sm:px-12">
        <div className="lg:hidden"><Logo /></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease }}
          className="m-auto w-full max-w-[380px] py-12"
        >
          <h2 className="font-display text-[2.75rem] leading-none">Welcome back</h2>
          <p className="mt-3 text-[0.95rem] text-ink-2">Sign in to the control room.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-[0.85rem] font-medium text-ink-2">Work email</label>
              <input id="email" {...register('email')} className="field" placeholder="you@company.com" autoComplete="email" />
              {errors.email && <p className="mt-1.5 text-[0.8rem] text-bad">{errors.email.message}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label htmlFor="password" className="text-[0.85rem] font-medium text-ink-2">Password</label>
                <a href="#" className="text-[0.8rem] text-ink-3 underline-offset-4 hover:text-ink hover:underline">Forgot it?</a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  {...register('password')}
                  className="field pr-11"
                  placeholder="At least 6 characters"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-ink-3 hover:text-ink"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-[0.8rem] text-bad">{errors.password.message}</p>}
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2.5 text-[0.875rem] text-ink-2">
              <input type="checkbox" {...register('remember')} className="h-4 w-4 rounded accent-[var(--ink)]" />
              Keep me signed in for 30 days
            </label>

            <button type="submit" disabled={isLoading} className="btn btn-ink h-12 w-full text-[0.95rem] disabled:opacity-80">
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper border-t-transparent" />
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4 text-[0.8rem] text-ink-3">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>

          <button type="button" className="btn btn-ghost h-12 w-full">Continue with single sign-on</button>

          <p className="mt-10 text-center text-[0.8rem] text-ink-3">
            Protected by SSO, JWT and TLS 1.3. Access is logged.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
