import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function Index() {
  const { isLoggedIn } = useAuthStore();
  return <Redirect href={isLoggedIn ? '/(tabs)' : '/(auth)/login'} />;
}
