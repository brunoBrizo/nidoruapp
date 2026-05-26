import type { StyleProp, ViewStyle } from "react-native";

import { View } from "../tw";

export const RESTING_BREATHING_ORB_TEST_IDS = {
  core: "resting-breathing-orb-core",
  highlight: "resting-breathing-orb-highlight",
  middleRing: "resting-breathing-orb-middle-ring",
  outerRing: "resting-breathing-orb-outer-ring",
  softGlow: "resting-breathing-orb-soft-glow",
} as const;

type RestingBreathingOrbProps = {
  readonly accessibilityLabel?: string;
  readonly isDecorative?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

export function RestingBreathingOrb({
  accessibilityLabel = "Resting breathing orb preview",
  isDecorative = true,
  style,
  testID = "resting-breathing-orb",
}: RestingBreathingOrbProps) {
  return (
    <View
      accessibilityElementsHidden={isDecorative}
      accessibilityLabel={isDecorative ? undefined : accessibilityLabel}
      accessibilityRole={isDecorative ? undefined : "image"}
      className="h-28 w-28 items-center justify-center"
      importantForAccessibility={isDecorative ? "no-hide-descendants" : "auto"}
      style={style}
      testID={testID}
    >
      <View
        className="absolute h-28 w-28 rounded-full border border-[#7C6FCD]/[0.42]"
        testID={RESTING_BREATHING_ORB_TEST_IDS.outerRing}
      />
      <View
        className="absolute h-20 w-20 rounded-full border border-[#A89CE0]/[0.24] bg-[#7C6FCD]/[0.08]"
        testID={RESTING_BREATHING_ORB_TEST_IDS.middleRing}
      />
      <View
        className="absolute h-[68px] w-[68px] rounded-full bg-[#A89CE0]/[0.35] shadow-[0_0_24px_rgba(168,156,224,0.4)]"
        testID={RESTING_BREATHING_ORB_TEST_IDS.softGlow}
      />
      <View
        className="h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#7C6FCD] shadow-[0_0_24px_rgba(124,111,205,0.5)]"
        testID={RESTING_BREATHING_ORB_TEST_IDS.core}
      >
        <View
          className="h-9 w-9 rounded-full bg-[#EEF0FF]/[0.34]"
          testID={RESTING_BREATHING_ORB_TEST_IDS.highlight}
        />
      </View>
    </View>
  );
}
