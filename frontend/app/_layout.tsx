import 'react-native-gesture-handler';
import { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthGuard } from '@/auth/auth.guard';
import { COLORS, STALE_TIME } from '@/utils/constants';
import { SplashVideo } from '@/components/SplashVideo';

// Keep the native splash visible until we are ready to swap it for the video
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [showVideo, setShowVideo] = useState(true);

  // As soon as this layout mounts, hide the native PNG splash
  // and let our video component take over
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleVideoFinish = useCallback(() => {
    setShowVideo(false);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <AuthGuard>
          <StatusBar style="light"/>

          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.bg },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="modals/add-transaction"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="modals/add-account"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="modals/add-investment"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="modals/add-budget"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="modals/ask-sequro"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack>

          {/* Video splash sits on top of everything via zIndex:9999.
              Once onFinish fires it unmounts completely — zero performance cost. */}
          {showVideo && <SplashVideo onFinish={handleVideoFinish} />}
        </AuthGuard>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
