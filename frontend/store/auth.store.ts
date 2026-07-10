import { create } from 'zustand';
import { TokenService } from '@/auth/token.service';
import { setTokenCache, clearTokenCache, registerLogoutHandler } from '@/api/client';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isHydrated: boolean;
  loading: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  setUser: (user: User) => Promise<void>;
  setLoggedIn: (val: boolean) => void;
  setLoading: (val: boolean) => void;
  setError: (msg: string | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isHydrated: false,
  loading: false,
  error: null,

  async hydrate() {
    const user = await TokenService.getUser<User>();
    const [access, refresh] = await Promise.all([
      TokenService.getAccess(),
      TokenService.getRefresh(),
    ]);
    const hasTokens = !!access && !!refresh;

    // CRITICAL: seed the in-memory cache that client.ts actually reads from.
    // Without this, a returning user with valid saved tokens would still
    // send "Authorization: Bearer null" on their first request after
    // reopening the app, exactly like the bug this fixes on login.
    if (hasTokens && access && refresh) {
      setTokenCache(access, refresh);
    }

    set({
      user,
      isLoggedIn: !!user && hasTokens,
      isHydrated: true,
    });
  },

  async setUser(user) {
    await TokenService.setUser(user);
    set({ user });
  },

  setLoggedIn(val) {
    set({ isLoggedIn: val });
  },

  setLoading(val) {
    set({ loading: val });
  },

  setError(msg) {
    set({ error: msg });
  },

  async logout() {
    clearTokenCache();
    await TokenService.clear();

    set({
      user: null,
      isLoggedIn: false,
      error: null,
    });
  },
}));