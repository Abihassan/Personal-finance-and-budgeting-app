import { authApi } from '@/api';
import { TokenService } from './token.service';
import { setTokenCache } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';

export const AuthService = {
  async login(email: string, password: string) {
    const store = useAuthStore.getState();
    store.setLoading(true);
    store.setError(null);
    try {
      const { data } = await authApi.login(email, password);
      // Order matters: populate the in-memory cache FIRST so the very next
      // request (e.g. GET /accounts fired right after login) has a token to
      // send. AsyncStorage is also written so the session survives app restart.
      setTokenCache(data.access_token, data.refresh_token);
      await TokenService.setTokens(data.access_token, data.refresh_token);
      await store.setUser(data.user);
      store.setLoggedIn(true);
      return data;
    } catch (err: any) {
      // userMessage is set by our axios interceptor when there is no response
      // (i.e. the phone cannot reach the backend server at all)
      const msg =
        err.userMessage ??                          // network unreachable
        err.response?.data?.detail ??               // FastAPI error body
        'Login failed. Check your credentials.';
      store.setError(msg);
      throw err;
    } finally {
      store.setLoading(false);
    }
  },

  async register(name: string, email: string, password: string) {
    const store = useAuthStore.getState();
    store.setLoading(true);
    store.setError(null);
    try {
      const { data } = await authApi.register(name, email, password);
      setTokenCache(data.access_token, data.refresh_token);
      await TokenService.setTokens(data.access_token, data.refresh_token);
      await store.setUser(data.user);
      store.setLoggedIn(true);
      return data;
    } catch (err: any) {
      const msg =
        err.userMessage ??
        err.response?.data?.detail ??
        'Registration failed. Please try again.';
      store.setError(msg);
      throw err;
    } finally {
      store.setLoading(false);
    }
  },

  async logout() {
    try { await authApi.logout(); } catch { /* best effort — clear locally regardless */ }
    useAuthStore.getState().logout();
  },
};
