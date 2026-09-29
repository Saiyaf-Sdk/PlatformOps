import type { TokenResponse, User } from './types';

/** Persisted sign-in state. Only this module touches storage. */
export interface Session {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  user: User;
}

const KEY = 'po.session';
let current: Session | null = load();
const listeners = new Set<(s: Session | null) => void>();

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s?.accessToken && s?.refreshToken && s?.user ? s : null;
  } catch {
    return null;
  }
}

function persist(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch { /* storage unavailable: session lives in memory only */ }
}

export const session = {
  get: () => current,
  set(t: TokenResponse) {
    current = { accessToken: t.accessToken, accessTokenExpiresAt: t.accessTokenExpiresAt, refreshToken: t.refreshToken, user: t.user };
    persist(current);
    listeners.forEach((l) => l(current));
  },
  updateUser(user: User) {
    if (!current) return;
    current = { ...current, user };
    persist(current);
    listeners.forEach((l) => l(current));
  },
  clear() {
    current = null;
    persist(null);
    listeners.forEach((l) => l(null));
  },
  subscribe(fn: (s: Session | null) => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  /** True when the access token expires within the next `withinMs`. */
  isExpiring(withinMs = 30_000) {
    if (!current) return true;
    return new Date(current.accessTokenExpiresAt).getTime() - Date.now() < withinMs;
  },
};

// keep tabs in sync (sign out in one tab → signed out everywhere)
window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  current = load();
  listeners.forEach((l) => l(current));
});
