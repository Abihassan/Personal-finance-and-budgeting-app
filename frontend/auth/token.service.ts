import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  USER: 'user',
} as const;

export const TokenService = {
  async setTokens(access: string, refresh: string) {
    await AsyncStorage.multiSet([
      [KEYS.ACCESS, access],
      [KEYS.REFRESH, refresh],
    ]);
  },

  async getAccess(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ACCESS);
  },

  async getRefresh(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.REFRESH);
  },

  async setUser(user: object) {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async getUser<T>() {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async hasTokens() {
    const [access, refresh] = await Promise.all([
      AsyncStorage.getItem(KEYS.ACCESS),
      AsyncStorage.getItem(KEYS.REFRESH),
    ]);

    return !!access && !!refresh;
  },

  async clear() {
    await AsyncStorage.multiRemove([
      KEYS.ACCESS,
      KEYS.REFRESH,
      KEYS.USER,
    ]);
  },
};