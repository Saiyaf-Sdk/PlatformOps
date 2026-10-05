import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { session } from './session';
import type { TokenResponse } from './types';

export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8081/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const s = session.get();
  if (s && !config.headers.Authorization) config.headers.Authorization = `Bearer ${s.accessToken}`;
  return config;
});

// ── single-flight refresh ────────────────────────────────────────────
let refreshing: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  const s = session.get();
  if (!s) return Promise.resolve(null);
  refreshing = axios
    .post<TokenResponse>(`${API_URL}/auth/refresh`, { refreshToken: s.refreshToken }, { timeout: 15_000 })
    .then((r) => {
      session.set(r.data);
      return r.data.accessToken;
    })
    .catch((err: AxiosError) => {
      // only a definitive "no" from the server ends the session; network blips don't
      if (err.response && [400, 401, 403].includes(err.response.status)) session.clear();
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** Returns a token that is valid for at least 30s more (refreshing if needed). */
export async function freshAccessToken(): Promise<string | null> {
  if (!session.get()) return null;
  if (!session.isExpiring()) return session.get()!.accessToken;
  return refreshAccessToken();
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const url = original?.url ?? '';
    if (error.response?.status === 401 && original && !original._retried && !url.includes('/auth/')) {
      original._retried = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` };
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

// ── error helpers ────────────────────────────────────────────────────
export interface Problem {
  status?: number;
  code?: string;
  detail?: string;
  errors?: Record<string, string>;
}

export function problemOf(err: unknown): Problem {
  if (axios.isAxiosError(err)) {
    if (!err.response) return { code: 'network', detail: 'Can’t reach the PlatformOps API. Is the backend running?' };
    const data = (err.response.data ?? {}) as Problem;
    return { status: err.response.status, code: data.code, detail: data.detail, errors: data.errors };
  }
  return { detail: err instanceof Error ? err.message : 'Something went wrong' };
}

export function errorMessage(err: unknown): string {
  const p = problemOf(err);
  if (p.errors && Object.keys(p.errors).length) {
    return Object.entries(p.errors).map(([f, m]) => `${f}: ${m}`).join(' · ');
  }
  return p.detail || 'Something went wrong';
}
