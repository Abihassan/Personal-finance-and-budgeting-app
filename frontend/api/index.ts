import { apiClient, BASE_URL, accessTokenCache } from './client';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    apiClient.post('/auth/register', { name, email, password }),

  refresh: (refresh_token: string) =>
    apiClient.post('/auth/refresh', { refresh_token }),

  logout: () => apiClient.post('/auth/logout'),
};


// ─── Accounts ─────────────────────────────
export const accountsApi = {
  list: () => apiClient.get('/accounts'),
  create: (payload: any) => apiClient.post('/accounts', payload),
  delete: (id: string) => apiClient.delete(`/accounts/${id}`),
};


// ─── Transactions ─────────────────────────
export const transactionsApi = {
  list: (type?: string, limit = 50) =>
    apiClient.get('/transactions', { params: { type, limit } }),
  create: (payload: any) => apiClient.post('/transactions', payload),
  delete: (id: string) => apiClient.delete(`/transactions/${id}`),
};


// ─── Budgets ──────────────────────────────
export const budgetsApi = {
  list: () => apiClient.get('/budgets'),
  create: (payload: any) => apiClient.post('/budgets', payload),
  delete: (id: string) => apiClient.delete(`/budgets/${id}`),
};


// ─── Investments ──────────────────────────
export const investmentsApi = {
  list: () => apiClient.get('/investments'),
  create: (payload: any) => apiClient.post('/investments', payload),
  delete: (id: string) => apiClient.delete(`/investments/${id}`),
};


// ─── Reports ──────────────────────────────
export const reportsApi = {
  breakdown: () => apiClient.get('/reports/breakdown'),
  transfers: () => apiClient.get('/reports/transfers'),
  netWorth: (period: string) =>
    apiClient.get('/reports/net-worth', { params: { period } }),
};


// ─── AI Chat (SSE) ────────────────────────
// Uses the in-memory accessTokenCache directly (synchronous) instead of
// calling TokenService.getAccess() which is async and would return a
// Promise object — not the actual token string — when used this way.
export const aiApi = {
  chat: (messages: any[]) => {
    const token = accessTokenCache;   // sync read from module-level cache

    return fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ messages }),
    });
  },
};
