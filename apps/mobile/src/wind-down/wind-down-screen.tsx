import {
  windDownContextGoalOptions,
  type WindDownContextGoal,
  type WindDownRoutineUiState,
} from "@nidoru/domain";
import { colors, spacing, typography } from "@nidoru/ui-tokens";
import { ChevronRight, Moon, Waves, Wind, type LucideIcon } from "lucide-react-native";
import { useContext } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Pattern, Rect, Stop } from "react-native-svg";
import { StatusBar } from "expo-status-bar";

export type WindDownActiveRoutineView = {
  readonly breathworkDurationSeconds: number;
  readonly phaseLabel: string;
  readonly remainingSeconds: number;
  readonly soundLabel: string;
  readonly uiState: Extract<WindDownRoutineUiState, "active_winddown" | "daily_calm">;
};

type WindDownScreenProps =
  | {
      readonly state: "preparing";
    }
  | {
      readonly onSelectGoal: (goal: WindDownContextGoal) => void;
      readonly state: "quick_context";
    }
  | {
      readonly activeRoutine: WindDownActiveRoutineView;
      readonly state: "active";
    };

const iconByGoal: Record<WindDownContextGoal, LucideIcon> = {
  calm_racing_thoughts: Wind,
  fall_asleep_faster: Moon,
  wake_up_fewer_times: Waves,
};

export function WindDownScreen(props: WindDownScreenProps) {
  const safeAreaInsets = useContext(SafeAreaInsetsContext) ?? {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };
  const safeAreaStyle = {
    paddingBottom: Math.max(safeAreaInsets.bottom, 0),
    paddingTop: Math.max(safeAreaInsets.top, 0),
  };

  if (props.state === "preparing") {
    return (
      <View style={[styles.screen, styles.centeredScreen, safeAreaStyle]}>
        <StatusBar hidden />
        <WindDownBackground />
        <View style={styles.preparingGlow} />
        <Text accessibilityRole="header" selectable style={styles.preparingTitle}>
          Settling the room.
        </Text>
        <Text selectable style={styles.preparingSubtitle}>
          Your Wind-Down will start here.
        </Text>
      </View>
    );
  }

  if (props.state === "active") {
    return (
      <View style={[styles.screen, safeAreaStyle]} testID="wind-down-active-screen">
        <StatusBar hidden />
        <WindDownBackground />
        <View style={styles.activeContent}>
          <Text accessibilityRole="header" selectable style={styles.activeTitle}>
            Let’s wind down.
          </Text>

          <View style={styles.activeOrbSection}>
            <View
              accessibilityHint="Guides the current Wind-Down breath phase."
              accessibilityLabel={`${props.activeRoutine.phaseLabel} breathing phase`}
              accessibilityRole="image"
              style={styles.activeOrb}
              testID="wind-down-active-orb"
            >
              <View style={styles.activeOuterRing} />
              <View style={styles.activeMiddleRing} />
              <View style={styles.activeInnerRing} />
              <View style={styles.activeCore}>
                <View style={styles.activeCoreGlow} />
                <Text selectable={false} style={styles.activePhaseLabel}>
                  {props.activeRoutine.phaseLabel}
                </Text>
                <Text selectable style={styles.activeTimer}>
                  {formatRemainingTime(props.activeRoutine.remainingSeconds)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.activeFooter}>
            <Text selectable style={styles.ambientText}>
              {props.activeRoutine.soundLabel} softly playing
            </Text>
            <Text selectable style={styles.exitHint}>
              Swipe down to exit
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, safeAreaStyle]} testID="wind-down-quick-context-screen">
      <StatusBar hidden />
      <WindDownBackground />
      <View style={styles.contextContent}>
        <View style={styles.contextHeader}>
          <Text selectable style={styles.eyebrow}>
            TONIGHT
          </Text>
          <Text accessibilityRole="header" selectable style={styles.contextTitle}>
            What’s your goal tonight?
          </Text>
          <Text selectable style={styles.contextSubtitle}>
            We’ll start the right wind-down for you.
          </Text>
        </View>

        <View style={styles.optionList}>
          {windDownContextGoalOptions.map((option, index) => (
            <WindDownContextOption
              isRecommended={index === 0}
              key={option.value}
              onPress={() => props.onSelectGoal(option.value)}
              option={option}
            />
          ))}
        </View>

        <View style={styles.skipArea}>
          <Pressable
            accessibilityHint="Starts the default 4-7-8 Wind-Down and remembers it for next time."
            accessibilityLabel="Skip"
            accessibilityRole="button"
            onPress={() => props.onSelectGoal("fall_asleep_faster")}
            style={({ pressed }) => [styles.skipButton, pressed ? styles.pressedSubtle : null]}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
          <Text selectable style={styles.rememberText}>
            We’ll remember this.
          </Text>
        </View>
      </View>
    </View>
  );
}

function WindDownContextOption({
  isRecommended,
  onPress,
  option,
}: {
  readonly isRecommended: boolean;
  readonly onPress: () => void;
  readonly option: (typeof windDownContextGoalOptions)[number];
}) {
  const Icon = iconByGoal[option.value];

  return (
    <Pressable
      accessibilityHint={`Starts ${option.subtitle.replace(" · ", " with ")} and remembers this Wind-Down goal.`}
      accessibilityLabel={option.label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        isRecommended ? styles.optionRowRecommended : null,
        pressed ? styles.pressedOption : null,
      ]}
    >
      <View style={[styles.optionIconFrame, isRecommended ? styles.recommendedIconFrame : null]}>
        <Icon color={colors.dark.primaryGlow.value} size={28} strokeWidth={1.55} />
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionLabel}>{option.label}</Text>
        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
      </View>
      <ChevronRight color="rgba(168, 156, 224, 0.72)" size={24} strokeWidth={1.6} />
    </Pressable>
  );
}

function WindDownBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="wind-down-background">
      <Svg height="100%" width="100%">
        <Defs>
          <Pattern height="8" id="windDownDots" patternUnits="userSpaceOnUse" width="8">
            <Circle cx="1" cy="1" fill="#242845" opacity="0.34" r="0.8" />
          </Pattern>
          <LinearGradient id="windDownLowGlow" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#0D0F1A" stopOpacity="1" />
            <Stop offset="0.52" stopColor="#11152A" stopOpacity="1" />
            <Stop offset="1" stopColor="#181C38" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#windDownLowGlow)" height="100%" width="100%" x="0" y="0" />
        <Rect fill="url(#windDownDots)" height="100%" opacity="0.58" width="100%" x="0" y="0" />
      </Svg>
      <View style={styles.bottomFade} />
    </View>
  );
}

function formatRemainingTime(totalSeconds: number): string {
  const boundedSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(boundedSeconds / 60);
  const seconds = boundedSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  activeContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 78,
  },
  activeCore: {
    alignItems: "center",
    backgroundColor: "rgba(76, 66, 125, 0.94)",
    borderColor: "rgba(238, 240, 255, 0.2)",
    borderRadius: 78,
    borderWidth: 1,
    boxShadow: "0 0 46px rgba(124, 111, 205, 0.42)",
    height: 156,
    justifyContent: "center",
    overflow: "hidden",
    position: "absolute",
    width: 156,
  },
  activeCoreGlow: {
    backgroundColor: "rgba(238, 240, 255, 0.07)",
    borderRadius: 68,
    height: 136,
    position: "absolute",
    width: 136,
  },
  activeFooter: {
    alignItems: "center",
    gap: 58,
    paddingBottom: 26,
  },
  activeInnerRing: {
    backgroundColor: "rgba(124, 111, 205, 0.28)",
    borderColor: "rgba(168, 156, 224, 0.24)",
    borderRadius: 91,
    borderWidth: 1,
    height: 182,
    position: "absolute",
    width: 182,
  },
  activeMiddleRing: {
    backgroundColor: "rgba(124, 111, 205, 0.18)",
    borderColor: "rgba(168, 156, 224, 0.16)",
    borderRadius: 116,
    borderWidth: 1,
    height: 232,
    position: "absolute",
    width: 232,
  },
  activeOrb: {
    alignItems: "center",
    height: 280,
    justifyContent: "center",
    width: 280,
  },
  activeOrbSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 420,
  },
  activeOuterRing: {
    backgroundColor: "rgba(124, 111, 205, 0.08)",
    borderColor: "rgba(168, 156, 224, 0.14)",
    borderRadius: 140,
    borderWidth: 1,
    height: 280,
    position: "absolute",
    width: 280,
  },
  activePhaseLabel: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 32,
    lineHeight: 38,
  },
  activeTimer: {
    color: "rgba(238, 240, 255, 0.86)",
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    letterSpacing: 3,
    lineHeight: 28,
    marginTop: 6,
  },
  activeTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 29,
    letterSpacing: 0,
    lineHeight: 36,
    textAlign: "center",
  },
  ambientText: {
    color: "rgba(238, 240, 255, 0.64)",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },
  bottomFade: {
    backgroundColor: "rgba(124, 111, 205, 0.08)",
    borderRadius: 180,
    bottom: -108,
    boxShadow: "0 0 84px rgba(124, 111, 205, 0.2)",
    height: 260,
    left: 56,
    position: "absolute",
    right: 56,
  },
  centeredScreen: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  contextContent: {
    flex: 1,
    paddingBottom: 34,
    paddingHorizontal: 18,
    paddingTop: 78,
  },
  contextHeader: {
    gap: 11,
  },
  contextSubtitle: {
    color: "rgba(238, 240, 255, 0.58)",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  contextTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 30,
    letterSpacing: 0,
    lineHeight: 36,
  },
  eyebrow: {
    color: colors.dark.primaryGlow.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 13,
    letterSpacing: 4,
    lineHeight: 18,
  },
  exitHint: {
    color: "rgba(74, 78, 106, 0.62)",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  optionCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  optionIconFrame: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  optionLabel: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 17,
    lineHeight: 21,
  },
  optionList: {
    gap: 12,
    marginTop: 48,
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: "rgba(13, 15, 26, 0.72)",
    borderColor: "rgba(238, 240, 255, 0.08)",
    borderRadius: 17,
    borderWidth: 1,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.04)",
    flexDirection: "row",
    gap: 14,
    minHeight: 72,
    paddingHorizontal: 13,
    transform: [{ scale: 1 }],
  },
  optionRowRecommended: {
    backgroundColor: "rgba(20, 23, 43, 0.76)",
    borderColor: "rgba(124, 111, 205, 0.48)",
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.06), 0 0 22px rgba(124, 111, 205, 0.18)",
  },
  optionSubtitle: {
    color: "rgba(238, 240, 255, 0.62)",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 14,
    lineHeight: 18,
  },
  preparingGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.08)",
    borderRadius: 120,
    boxShadow: "0 0 82px rgba(124, 111, 205, 0.22)",
    height: 240,
    position: "absolute",
    width: 240,
  },
  preparingSubtitle: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  preparingTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
  },
  pressedOption: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  pressedSubtle: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  recommendedIconFrame: {
    backgroundColor: "rgba(124, 111, 205, 0.18)",
  },
  rememberText: {
    color: "rgba(74, 78, 106, 0.72)",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
    overflow: "hidden",
  },
  skipArea: {
    alignItems: "center",
    gap: 16,
    paddingTop: 88,
  },
  skipButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    minWidth: 96,
    transform: [{ scale: 1 }],
  },
  skipText: {
    color: "rgba(238, 240, 255, 0.76)",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },
});
