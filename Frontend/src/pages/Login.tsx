import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Terminal, Lock, Mail, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThreeDNetwork from '../components/ThreeDNetwork';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    setIsLoading(true);
    setTimeout(() => {
      login(data.email, data.password);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden" style={{ background: '#050B14' }}>
      {/* Left: Login panel */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-[420px] z-10 flex flex-col justify-center px-10 shrink-0 relative"
        style={{
          background: 'rgba(11, 20, 35, 0.92)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0, 240, 255, 0.1)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
            }}
          >
            <Terminal className="text-[#00F0FF] w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Platform<span style={{ color: '#00F0FF' }}>Ops</span>
            </h1>
            <p className="text-[11px] text-[#475569] mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              SRE Control Center v2.0
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-[#94A3B8] text-sm">Sign in to access your infrastructure dashboard.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569] w-4 h-4" />
              <input
                {...register('email')}
                className="platform-input pl-9"
                placeholder="admin@platformops.internal"
              />
            </div>
            {errors.email && (
              <p className="text-[#FF3366] text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569] w-4 h-4" />
              <input
                type="password"
                {...register('password')}
                className="platform-input pl-9"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="text-[#FF3366] text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              {...register('remember')}
              className="w-4 h-4 rounded border-[rgba(255,255,255,0.1)] bg-[rgba(5,11,20,0.6)] text-[#00F0FF] focus:ring-[#00F0FF] focus:ring-1"
            />
            <label htmlFor="remember" className="text-sm text-[#94A3B8] cursor-pointer">
              Remember this session
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              background: isLoading ? 'rgba(0, 240, 255, 0.08)' : 'rgba(0, 240, 255, 0.12)',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              color: '#00F0FF',
              boxShadow: isLoading ? 'none' : '0 0 20px rgba(0, 240, 255, 0.15)',
            }}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                AUTHENTICATE <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer note */}
        <div className="mt-8 flex items-center gap-2 text-xs text-[#475569]">
          <Shield className="w-3 h-3" />
          <span>Secured with JWT • TLS 1.3</span>
        </div>
      </motion.div>

      {/* Right: 3D Visualization */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center">
        {/* Gradient overlay on left edge */}
        <div
          className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgba(11,20,35,0.92), transparent)' }}
        />
        <ThreeDNetwork />

        {/* HUD Stats */}
        <div
          className="absolute bottom-6 right-6 z-20 p-4 rounded-xl text-xs"
          style={{
            background: 'rgba(5, 11, 20, 0.82)',
            border: '1px solid rgba(0, 240, 255, 0.12)',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'rgba(0, 240, 255, 0.65)',
            lineHeight: 1.9,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
            SYSTEM STATUS: ONLINE
          </div>
          ACTIVE NODES: 7<br />
          REGION: ap-south-1<br />
          LATENCY: 12ms
        </div>

      </div>
    </div>
  );
}
