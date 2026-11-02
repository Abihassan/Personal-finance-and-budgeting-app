/**
 * SplashVideo.tsx
 *
 * Plays the splash video fullscreen, then calls onFinish()
 * so the root layout can hide it and show the real app.
 *
 * Behaviour:
 *  - Video plays once at full screen (no controls, no loop)
 *  - If video fails to load, falls back to a branded still screen
 *    after 2 seconds — the app never gets stuck
 *  - Fades out smoothly when done
 *  - Automatically finishes if playback ends or after 12s max
 *    (safety net so a slow device never hangs on splash)
 */
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');
const MAX_DURATION_MS = 12_000; // safety timeout

interface Props {
  onFinish: () => void;
}

export function SplashVideo({ onFinish }: Props) {
  const opacity     = useSharedValue(1);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calledRef   = useRef(false);

  const fadeOut = useCallback(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (timerRef.current) clearTimeout(timerRef.current);

    opacity.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, () => {
      runOnJS(onFinish)();
    });
  }, [onFinish, opacity]);

  useEffect(() => {
    // Safety net — never hang longer than MAX_DURATION_MS
    timerRef.current = setTimeout(fadeOut, MAX_DURATION_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [fadeOut]);

  const handlePlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    // Fade out as soon as the video reaches its end
    if (status.didJustFinish) {
      fadeOut();
    }
  }, [fadeOut]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.container, animStyle]}>
      {/* Fallback background — shows behind/before video loads */}
      <View style={styles.fallback}>
        <Image
          source={require('../assets/images/sequro.png')}
          style={styles.fallbackLogo}
          resizeMode="contain"
        />
      </View>

      {/* Full-screen video */}
      <Video
        source={require('../assets/images/splash_video.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        isMuted={false}
        onPlaybackStatusUpdate={handlePlaybackStatus}
        onError={() => {
          // Video failed to load — fall back after 2 seconds
          setTimeout(fadeOut, 2000);
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0,
    width: W,
    height: H,
    zIndex: 9999,
    backgroundColor: '#0A0A1A',
  },
  // Fallback still — shows while video is buffering
  fallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0A0A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLogo: {
    width: 180,
    height: 180,
  },
  video: {
    width: W,
    height: H,
  },
});
