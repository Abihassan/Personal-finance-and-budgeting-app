import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, isHydrated, hydrate } = useAuthStore();

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    hydrate().catch(console.error);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuth = segments[0] === '(auth)';

    if (!isLoggedIn && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuth) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isHydrated, segments]);

  return <>{children}</>;
}