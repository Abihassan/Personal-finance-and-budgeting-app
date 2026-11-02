import axios, { InternalAxiosRequestConfig } from 'axios';
import { TokenService } from '@/auth/token.service';

const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? "https://personal-finance-and-budgeting-app.onrender.com").replace(/\/$/, '');

// TEMPORARY DEBUG — remove after confirming the env var loads.
// Watch Metro terminal output when the app starts.
// Must print the Railway URL, not localhost:8081.
if (__DEV__) console.log('[Sequro] BASE_URL =', BASE_URL);

export { BASE_URL };

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  // 30 seconds — Railway free tier can take up to 20s to wake from hibernation.
  // The first request after inactivity will be slow; subsequent ones are fast.
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────────
// LOGOUT CALLBACK (breaks circular import)
// client.ts needs to trigger a logout when a refresh
// fails, but auth.store.ts also needs to import from
// client.ts (setTokenCache/clearTokenCache). Rather than
// importing useAuthStore here — which created the
// require-cycle warning — auth.store.ts registers itself
// once at module load via registerLogoutHandler().
// ─────────────────────────────────────────────
let onForceLogout: (() => void) | null = null;

export const registerLogoutHandler = (fn: () => void) => {
  onForceLogout = fn;
};


// ─────────────────────────────────────────────
// TOKEN CACHE (IMPORTANT FIX)
// AsyncStorage is async → we cache tokens in memory
// ─────────────────────────────────────────────
export let accessTokenCache: string | null = null;
let refreshTokenCache: string | null = null;


// call this once after login/register
export const setTokenCache = (access: string, refresh: string) => {
  accessTokenCache = access;
  refreshTokenCache = refresh;
};


// ─────────────────────────────────────────────
// REQUEST INTERCEPTOR
// ─────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = accessTokenCache;

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  }
);


// ─────────────────────────────────────────────
// REFRESH CONTROL
// ─────────────────────────────────────────────
let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  queue.forEach((cb) => cb(token));
  queue = [];
};


// retry helper
const retryRequest = (config: any, token: string) => {
  config.headers = config.headers ?? {};
  config.headers['Authorization'] = `Bearer ${token}`;
  return apiClient(config);
};


// ─────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// ─────────────────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // backend unreachable
    if (!error.response) {
      error.userMessage = `Cannot reach backend at ${BASE_URL}`;
      return Promise.reject(error);
    }

    // not auth error
    if (error.response.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    // queue requests while refreshing
    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token: string) => {
          resolve(retryRequest(original, token));
        });
      });
    }

    isRefreshing = true;

    const refreshToken = refreshTokenCache;

    // ─────────────────────────────────────────────
    // CRITICAL FIX: prevent 422 forever
    // ─────────────────────────────────────────────
    if (!refreshToken || typeof refreshToken !== 'string') {
      isRefreshing = false;
      onForceLogout?.();
      return Promise.reject(error);
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/refresh`,
        {
          refresh_token: refreshToken.trim(),
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const data = res.data;

      if (!data?.access_token || !data?.refresh_token) {
        throw new Error('Invalid refresh response');
      }

      // update cache
      accessTokenCache = data.access_token;
      refreshTokenCache = data.refresh_token;

      // update storage
      await TokenService.setTokens(data.access_token, data.refresh_token);

      processQueue(data.access_token);

      return retryRequest(original, data.access_token);
    } catch (e) {
      queue = [];
      accessTokenCache = null;
      refreshTokenCache = null;

      await TokenService.clear();
      onForceLogout?.();

      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─────────────────────────────────────────────
// CACHE → CLEAR (called from auth.store.logout())
// ─────────────────────────────────────────────
export const clearTokenCache = () => {
  accessTokenCache = null;
  refreshTokenCache = null;
};