import { colors } from "@nidoru/ui-tokens";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

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
      importantForAccessibility={isDecorative ? "no-hide-descendants" : "auto"}
      style={[styles.orbStage, style]}
      testID={testID}
    >
      <View
        style={[styles.orbRing, styles.orbOuterRing]}
        testID={RESTING_BREATHING_ORB_TEST_IDS.outerRing}
      />
      <View
        style={[styles.orbRing, styles.orbMiddleRing]}
        testID={RESTING_BREATHING_ORB_TEST_IDS.middleRing}
      />
      <View style={styles.orbSoftGlow} testID={RESTING_BREATHING_ORB_TEST_IDS.softGlow} />
      <View style={styles.orbCore} testID={RESTING_BREATHING_ORB_TEST_IDS.core}>
        <View style={styles.orbHighlight} testID={RESTING_BREATHING_ORB_TEST_IDS.highlight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbStage: {
    alignItems: "center",
    height: 112,
    justifyContent: "center",
  },
  orbRing: {
    position: "absolute",
  },
  orbOuterRing: {
    borderColor: "rgba(124, 111, 205, 0.42)",
    borderRadius: 56,
    borderWidth: 1,
    height: 112,
    width: 112,
  },
  orbMiddleRing: {
    backgroundColor: "rgba(124, 111, 205, 0.08)",
    borderColor: "rgba(168, 156, 224, 0.24)",
    borderRadius: 40,
    borderWidth: 1,
    height: 80,
    width: 80,
  },
  orbSoftGlow: {
    backgroundColor: "rgba(168, 156, 224, 0.35)",
    borderRadius: 34,
    boxShadow: "0 0 24px rgba(168, 156, 224, 0.4)",
    height: 68,
    position: "absolute",
    width: 68,
  },
  orbCore: {
    alignItems: "center",
    backgroundColor: colors.dark.primary.value,
    borderRadius: 28,
    boxShadow: "0 0 24px rgba(124, 111, 205, 0.5)",
    height: 56,
    justifyContent: "center",
    overflow: "hidden",
    width: 56,
  },
  orbHighlight: {
    backgroundColor: "rgba(238, 240, 255, 0.34)",
    borderRadius: 18,
    height: 36,
    width: 36,
  },
});
