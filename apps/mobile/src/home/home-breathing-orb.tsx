import { useEffect, useRef } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { RESTING_BREATHING_ORB_TEST_IDS } from "../breathing/breathing-orb";
import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";
import { ReactNativeAnimatedView, View } from "../tw";

export const HOME_ORB_MOTION = {
  corePulseDurationMs: 6000,
  isDecorativeOnly: true,
  ringPulseDurationMs: 6000,
  spinDurationMs: 12000,
} as const;

type HomeBreathingOrbProps = {
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

export function HomeBreathingOrb({
  style,
  testID = "home-resting-breathing-orb",
}: HomeBreathingOrbProps) {
  const reduceMotionPreference = useReduceMotionPreference();
  const reduceMotionEnabled =
    !reduceMotionPreference.isResolved || reduceMotionPreference.reduceMotionEnabled;
  const spinProgress = useRef(new Animated.Value(0)).current;
  const pulseProgress = useRef(new Animated.Value(0)).current;
  const spin = spinProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const ringScale = pulseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.08],
  });
  const ringOpacity = pulseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.05],
  });
  const glowOpacity = pulseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });
  const coreScale = pulseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const coreOpacity = pulseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  useEffect(() => {
    spinProgress.setValue(0);
    pulseProgress.setValue(0);

    if (reduceMotionEnabled) {
      return;
    }

    const spinAnimation = Animated.loop(
      Animated.timing(spinProgress, {
        duration: HOME_ORB_MOTION.spinDurationMs,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      }),
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseProgress, {
          duration: HOME_ORB_MOTION.corePulseDurationMs / 2,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulseProgress, {
          duration: HOME_ORB_MOTION.corePulseDurationMs / 2,
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [pulseProgress, reduceMotionEnabled, spinProgress]);

  return (
    <View
      accessibilityElementsHidden
      className="h-28 w-[116px] items-center justify-center"
      importantForAccessibility="no-hide-descendants"
      style={style}
      testID={testID}
    >
      <ReactNativeAnimatedView
        className="absolute h-[116px] w-[116px]"
        pointerEvents="none"
        style={{ transform: [{ rotate: spin }] }}
        testID="home-orb-arc-layer"
      >
        <Svg height={116} viewBox="0 0 100 100" width={116}>
          <Circle
            cx="50"
            cy="50"
            fill="none"
            opacity={0.15}
            r="48"
            stroke="#7C6FCD"
            strokeWidth="0.5"
          />
          <Circle
            cx="50"
            cy="50"
            fill="none"
            opacity={0.7}
            r="48"
            stroke="#7C6FCD"
            strokeDasharray="60 241.6"
            strokeDashoffset="0"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <Circle
            cx="50"
            cy="50"
            fill="none"
            opacity={0.5}
            r="48"
            stroke="#A89CE0"
            strokeDasharray="106 195.6"
            strokeDashoffset="-66"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <Circle
            cx="50"
            cy="50"
            fill="none"
            opacity={0.4}
            r="48"
            stroke="#8A8FA8"
            strokeDasharray="117 184.6"
            strokeDashoffset="-178"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </Svg>
      </ReactNativeAnimatedView>

      <ReactNativeAnimatedView
        className="absolute h-[84px] w-[84px] rounded-full border border-[#7C6FCD]/20"
        pointerEvents="none"
        style={{
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }}
        testID="home-orb-pulse-ring"
      />
      <View
        className="absolute h-[68px] w-[68px] rounded-full border border-[#A89CE0]/15 bg-[#7C6FCD]/5 shadow-[inset_0_0_12px_rgba(168,156,224,0.1)]"
        testID={RESTING_BREATHING_ORB_TEST_IDS.middleRing}
      />
      <ReactNativeAnimatedView
        className="absolute h-14 w-14 rounded-full bg-[#A89CE0]/40 shadow-[0_0_24px_rgba(168,156,224,0.4)]"
        style={{ opacity: glowOpacity }}
        testID={RESTING_BREATHING_ORB_TEST_IDS.softGlow}
      />
      <ReactNativeAnimatedView
        className="absolute h-[42px] w-[42px] overflow-hidden rounded-full shadow-[0_0_24px_rgba(124,111,205,0.5)]"
        style={{ opacity: coreOpacity, transform: [{ scale: coreScale }] }}
        testID={RESTING_BREATHING_ORB_TEST_IDS.core}
      >
        <Svg height={42} viewBox="0 0 42 42" width={42}>
          <Defs>
            <LinearGradient id="home-orb-core-gradient" x1="0" x2="1" y1="1" y2="0">
              <Stop offset="0" stopColor="#7C6FCD" stopOpacity="0.9" />
              <Stop offset="1" stopColor="#A89CE0" stopOpacity="0.9" />
            </LinearGradient>
            <LinearGradient id="home-orb-highlight-gradient" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor="#EEF0FF" stopOpacity="0.3" />
              <Stop offset="1" stopColor="#EEF0FF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Circle cx="21" cy="21" fill="url(#home-orb-core-gradient)" r="21" />
          <Circle
            cx="21"
            cy="14"
            fill="url(#home-orb-highlight-gradient)"
            r="21"
            testID={RESTING_BREATHING_ORB_TEST_IDS.highlight}
          />
        </Svg>
      </ReactNativeAnimatedView>
    </View>
  );
}
