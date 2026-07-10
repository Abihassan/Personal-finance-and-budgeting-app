import React, { useCallback, useEffect, useRef } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import {
  VideoView,
  useVideoPlayer,
} from 'expo-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

const MAX_DURATION_MS = 12000;

interface Props {
  onFinish: () => void;
}

export function SplashVideo({ onFinish }: Props) {
  const opacity = useSharedValue(1);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calledRef = useRef(false);

  const fadeOut = useCallback(() => {
    if (calledRef.current) return;

    calledRef.current = true;

    timerRef.current && clearTimeout(timerRef.current);
    errorTimerRef.current && clearTimeout(errorTimerRef.current);

    opacity.value = withTiming(
      0,
      {
        duration: 500,
        easing: Easing.out(Easing.ease),
      },
      () => {
        runOnJS(onFinish)();
      }
    );
  }, [onFinish]);

  const player = useVideoPlayer(
    require('../assets/images/splash_video.mp4'),
    player => {
      player.loop = false;
      player.muted = false;
      player.play();
    }
  );

  useEffect(() => {
    timerRef.current = setTimeout(fadeOut, MAX_DURATION_MS);

    const subscription = player.addListener(
      'playToEnd',
      fadeOut
    );

    const errorSubscription = player.addListener(
      'statusChange',
      ({ error }) => {
        if (error) {
          errorTimerRef.current = setTimeout(fadeOut, 2000);
        }
      }
    );

    return () => {
      subscription.remove();
      errorSubscription.remove();

      timerRef.current && clearTimeout(timerRef.current);
      errorTimerRef.current && clearTimeout(errorTimerRef.current);
    };
  }, [player, fadeOut]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <View style={styles.fallback}>
        <Image
          source={require('../assets/images/sequro.png')}
          style={styles.fallbackLogo}
          resizeMode="contain"
        />
      </View>

      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: W,
    height: H,
    zIndex: 9999,
    backgroundColor: '#0A0A1A',
  },

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