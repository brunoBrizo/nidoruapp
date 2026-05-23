import { colors, typography } from "@nidoru/ui-tokens";
import { StatusBar } from "expo-status-bar";
import { Bell, Pause, Vibrate } from "lucide-react-native";
import type { ReactNode } from "react";
import { useContext } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

export const RESCUE_ME_SCREEN_STATES = [
  "active-launch",
  "active-phase",
  "active-reassurance",
  "complete",
  "sound-handoff",
  "sound-handoff-alt",
] as const;

export type RescueMeScreenState = (typeof RESCUE_ME_SCREEN_STATES)[number];

type ActiveState = Extract<
  RescueMeScreenState,
  "active-launch" | "active-phase" | "active-reassurance"
>;

type ActiveStateConfig = {
  readonly phase: "Inhale" | "Hold" | "Exhale";
  readonly timer: string;
  readonly coreSize: number;
  readonly glowScale: number;
  readonly timerOffset: number;
  readonly accessibilityLabel: string;
  readonly showReassurance: boolean;
};

const activeStateConfig: Record<ActiveState, ActiveStateConfig> = {
  "active-launch": {
    accessibilityLabel: "Inhale breathing phase",
    coreSize: 132,
    glowScale: 0.86,
    phase: "Inhale",
    showReassurance: false,
    timer: "03:29",
    timerOffset: 58,
  },
  "active-phase": {
    accessibilityLabel: "Hold breathing phase",
    coreSize: 162,
    glowScale: 1,
    phase: "Hold",
    showReassurance: false,
    timer: "03:29",
    timerOffset: 50,
  },
  "active-reassurance": {
    accessibilityLabel: "Exhale breathing phase",
    coreSize: 132,
    glowScale: 0.92,
    phase: "Exhale",
    showReassurance: true,
    timer: "02:14",
    timerOffset: 48,
  },
};

const screenStateSet = new Set<string>(RESCUE_ME_SCREEN_STATES);

export function parseRescueMeScreenState(
  value: string | readonly string[] | undefined,
): RescueMeScreenState {
  const state = Array.isArray(value) ? value[0] : value;

  return state && screenStateSet.has(state) ? (state as RescueMeScreenState) : "active-launch";
}

export function RescueMeScreen({ state }: { readonly state: RescueMeScreenState }) {
  const safeAreaInsets = useContext(SafeAreaInsetsContext) ?? {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };
  const { height } = useWindowDimensions();
  const isCompactHeight = height < 760;
  const rootStyle = [
    styles.screen,
    {
      paddingBottom: Math.max(safeAreaInsets.bottom, 0),
      paddingTop: Math.max(safeAreaInsets.top, 0),
    },
  ];

  return (
    <View style={rootStyle} testID={`rescue-me-screen-${state}`}>
      <StatusBar hidden />
      <RescueMeBackground />
      {state === "complete" ? (
        <CompletionState compact={isCompactHeight} />
      ) : state === "sound-handoff" || state === "sound-handoff-alt" ? (
        <SoundHandoffState compact={isCompactHeight} state={state} />
      ) : (
        <ActiveSessionState compact={isCompactHeight} state={state} />
      )}
    </View>
  );
}

function RescueMeBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="rescue-me-background">
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 390 844" width="100%">
        <Defs>
          <RadialGradient
            cx="195"
            cy="360"
            fx="195"
            fy="360"
            gradientUnits="userSpaceOnUse"
            id="rescue-center-wash"
            r="430"
          >
            <Stop offset="0" stopColor="#242A52" stopOpacity="0.18" />
            <Stop offset="0.38" stopColor="#171B36" stopOpacity="0.14" />
            <Stop offset="0.7" stopColor="#101326" stopOpacity="0.06" />
            <Stop offset="1" stopColor="#0D0F1A" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx="195"
            cy="300"
            fx="195"
            fy="300"
            gradientUnits="userSpaceOnUse"
            id="rescue-orb-wash"
            r="250"
          >
            <Stop offset="0" stopColor="#7C6FCD" stopOpacity="0.1" />
            <Stop offset="0.42" stopColor="#7C6FCD" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#7C6FCD" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect fill="url(#rescue-center-wash)" height="844" width="390" x="0" y="0" />
        <Rect fill="url(#rescue-orb-wash)" height="844" width="390" x="0" y="0" />
      </Svg>
    </View>
  );
}

function ActiveSessionState({
  compact,
  state,
}: {
  readonly compact: boolean;
  readonly state: ActiveState;
}) {
  const config = activeStateConfig[state];
  const orbLift = compact ? -30 : -18;

  return (
    <>
      <View style={[styles.activeMain, { transform: [{ translateY: orbLift }] }]}>
        <BreathingOrb
          accessibilityLabel={config.accessibilityLabel}
          coreSize={config.coreSize}
          glowScale={config.glowScale}
          phase={config.phase}
        />
        <Text
          accessibilityLabel={`Time remaining ${config.timer}`}
          selectable
          style={[styles.timer, { marginTop: config.timerOffset }]}
        >
          {config.timer}
        </Text>
      </View>

      {config.showReassurance ? (
        <Text selectable style={styles.reassurance}>
          You’re doing enough. Stay with the next breath.
        </Text>
      ) : null}

      <ActiveControls />
    </>
  );
}

function BreathingOrb({
  accessibilityLabel,
  coreSize,
  glowScale,
  phase,
}: {
  readonly accessibilityLabel: string;
  readonly coreSize: number;
  readonly glowScale: number;
  readonly phase: string;
}) {
  const outerSize = 280 * glowScale;
  const midSize = 220 * glowScale;
  const innerSize = 180 * glowScale;

  return (
    <View
      accessibilityHint="Guides the current breath phase."
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="timer"
      style={styles.orbStage}
      testID="rescue-me-orb"
    >
      <View
        pointerEvents="none"
        style={[
          styles.outerGlow,
          {
            borderRadius: outerSize / 2,
            height: outerSize,
            width: outerSize,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.midGlow,
          {
            borderRadius: midSize / 2,
            height: midSize,
            width: midSize,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.innerGlow,
          {
            borderRadius: innerSize / 2,
            height: innerSize,
            width: innerSize,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.pulseRing,
          {
            borderRadius: coreSize * 0.68,
            height: coreSize * 1.36,
            width: coreSize * 1.36,
          },
        ]}
      />
      <View
        style={[
          styles.orbCore,
          {
            borderRadius: coreSize / 2,
            height: coreSize,
            width: coreSize,
          },
        ]}
        testID="rescue-me-orb-core"
      >
        <Svg height="100%" viewBox="0 0 132 132" width="100%">
          <Defs>
            <LinearGradient id="rescue-orb-core-gradient" x1="0" x2="1" y1="1" y2="0">
              <Stop offset="0" stopColor="#7C6FCD" stopOpacity="0.95" />
              <Stop offset="1" stopColor="#A89CE0" stopOpacity="0.96" />
            </LinearGradient>
            <LinearGradient id="rescue-orb-highlight" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Circle cx="66" cy="66" fill="url(#rescue-orb-core-gradient)" r="66" />
          <Circle cx="66" cy="46" fill="url(#rescue-orb-highlight)" r="66" />
        </Svg>
        <Text selectable={false} style={styles.phaseLabel}>
          {phase}
        </Text>
      </View>
    </View>
  );
}

function ActiveControls() {
  return (
    <View style={styles.controls} testID="rescue-me-controls">
      <ControlButton accessibilityLabel="Audio cue: Bell" label="Bell">
        <Bell color={colors.dark.textSecondary.value} size={22} strokeWidth={1.5} />
      </ControlButton>

      <Pressable
        accessibilityHint="Pauses this Rescue Me session."
        accessibilityLabel="Pause Rescue Me session"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => undefined}
        style={styles.pauseButton}
      >
        <Pause color={colors.dark.textPrimary.value} size={30} strokeWidth={1.45} />
      </Pressable>

      <ControlButton accessibilityLabel="Haptics on" label="Haptics">
        <Vibrate color={colors.dark.textSecondary.value} size={22} strokeWidth={1.45} />
      </ControlButton>
    </View>
  );
}

function ControlButton({
  accessibilityLabel,
  children,
  label,
}: {
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly label: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => undefined}
      style={styles.controlButton}
    >
      <View style={styles.controlIcon}>{children}</View>
      <Text selectable={false} style={styles.controlLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function CompletionState({ compact }: { readonly compact: boolean }) {
  return (
    <View style={[styles.centeredState, compact && styles.centeredStateCompact]}>
      <MiniOrb />
      <Text accessibilityRole="header" selectable style={styles.completionTitle}>
        That took courage to start.
      </Text>
      <Text selectable style={styles.completionCopy}>
        You completed 5 breath cycles.
      </Text>
      <Pressable
        accessibilityLabel="Continue with a calming sound"
        accessibilityRole="button"
        onPress={() => undefined}
        style={styles.primaryAction}
      >
        <Text selectable={false} style={styles.primaryActionText}>
          Continue with a calming sound
        </Text>
      </Pressable>
      <ReturnHomeButton />
    </View>
  );
}

function SoundHandoffState({
  compact,
  state,
}: {
  readonly compact: boolean;
  readonly state: Extract<RescueMeScreenState, "sound-handoff" | "sound-handoff-alt">;
}) {
  return (
    <View
      style={[styles.centeredState, styles.handoffState, compact && styles.centeredStateCompact]}
    >
      <SoundBars variant={state} />
      <Text accessibilityRole="header" selectable style={styles.handoffTitle}>
        Rain is playing
      </Text>
      <Text selectable style={styles.handoffCopy}>
        Works offline. You can stop anytime.
      </Text>
      <Pressable
        accessibilityLabel="Pause Rain sound"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => undefined}
        style={styles.soundPauseButton}
      >
        <Pause color={colors.dark.textPrimary.value} size={28} strokeWidth={1.5} />
      </Pressable>
      <Text selectable={false} style={styles.soundLabel}>
        Rain
      </Text>
      <ReturnHomeButton />
    </View>
  );
}

function MiniOrb() {
  return (
    <View style={styles.miniOrbStage} testID="rescue-me-complete-orb">
      <View style={styles.miniOrbGlow} />
      <View style={styles.miniOrbCore}>
        <Svg height="100%" viewBox="0 0 64 64" width="100%">
          <Defs>
            <LinearGradient id="rescue-mini-orb-gradient" x1="0" x2="1" y1="1" y2="0">
              <Stop offset="0" stopColor="#7C6FCD" stopOpacity="0.96" />
              <Stop offset="1" stopColor="#A89CE0" stopOpacity="0.96" />
            </LinearGradient>
          </Defs>
          <Circle cx="32" cy="32" fill="url(#rescue-mini-orb-gradient)" r="32" />
        </Svg>
      </View>
    </View>
  );
}

function SoundBars({
  variant,
}: {
  readonly variant: Extract<RescueMeScreenState, "sound-handoff" | "sound-handoff-alt">;
}) {
  const bars = variant === "sound-handoff" ? [24, 18, 14] : [8, 14, 24];

  return (
    <View style={styles.soundBarsStage} testID={`rescue-me-${variant}-bars`}>
      <View style={styles.soundBarsGlow} />
      <View style={styles.soundBars}>
        {bars.map((height, index) => (
          <View
            key={`${variant}-${height}-${index}`}
            style={[styles.soundBar, { height, opacity: 0.52 + index * 0.16 }]}
          />
        ))}
      </View>
    </View>
  );
}

function ReturnHomeButton() {
  return (
    <Pressable
      accessibilityLabel="Return home"
      accessibilityRole="button"
      hitSlop={10}
      onPress={() => undefined}
      style={styles.returnHomeButton}
    >
      <Text selectable={false} style={styles.returnHomeText}>
        Return home
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeMain: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  centeredState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 56,
  },
  centeredStateCompact: {
    transform: [{ translateY: -18 }],
  },
  completionCopy: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 22,
    marginTop: 12,
    textAlign: "center",
  },
  completionTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 19,
    letterSpacing: 0,
    lineHeight: 27,
    marginTop: 54,
    textAlign: "center",
  },
  controlButton: {
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    minWidth: 44,
    width: 64,
  },
  controlIcon: {
    alignItems: "center",
    backgroundColor: "rgba(20, 23, 43, 0.6)",
    borderColor: "rgba(238, 240, 255, 0.06)",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  controlLabel: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 11,
    letterSpacing: 0,
    lineHeight: 14,
    textAlign: "center",
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    gap: 38,
    justifyContent: "center",
    minHeight: 160,
    paddingBottom: 30,
    paddingHorizontal: 28,
  },
  handoffCopy: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 20,
    marginTop: 12,
    textAlign: "center",
  },
  handoffState: {
    justifyContent: "center",
  },
  handoffTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 20,
    letterSpacing: 0,
    lineHeight: 28,
    marginTop: 54,
    textAlign: "center",
  },
  innerGlow: {
    backgroundColor: "rgba(168, 156, 224, 0.18)",
    boxShadow: "0 0 34px rgba(168, 156, 224, 0.22)",
    position: "absolute",
  },
  midGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.12)",
    boxShadow: "0 0 54px rgba(124, 111, 205, 0.24)",
    position: "absolute",
  },
  miniOrbCore: {
    borderRadius: 32,
    height: 64,
    overflow: "hidden",
    width: 64,
  },
  miniOrbGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.16)",
    borderRadius: 90,
    boxShadow: "0 0 42px rgba(124, 111, 205, 0.36)",
    height: 180,
    position: "absolute",
    width: 180,
  },
  miniOrbStage: {
    alignItems: "center",
    height: 116,
    justifyContent: "center",
    width: 180,
  },
  orbCore: {
    alignItems: "center",
    boxShadow: "0 0 44px rgba(124, 111, 205, 0.4)",
    justifyContent: "center",
    overflow: "hidden",
  },
  orbStage: {
    alignItems: "center",
    height: 300,
    justifyContent: "center",
    width: 300,
  },
  outerGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.04)",
    borderColor: "rgba(124, 111, 205, 0.16)",
    borderWidth: 1,
    boxShadow: "0 0 72px rgba(124, 111, 205, 0.18)",
    position: "absolute",
  },
  pauseButton: {
    alignItems: "center",
    backgroundColor: "rgba(28, 32, 64, 0.64)",
    borderColor: "rgba(124, 111, 205, 0.28)",
    borderRadius: 34,
    borderWidth: 1,
    boxShadow: "0 0 24px rgba(124, 111, 205, 0.1)",
    height: 68,
    justifyContent: "center",
    marginTop: -16,
    minHeight: 44,
    minWidth: 44,
    width: 68,
  },
  phaseLabel: {
    color: "rgba(238, 240, 255, 0.9)",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
    letterSpacing: 0.2,
    lineHeight: 22,
    position: "absolute",
    textAlign: "center",
  },
  primaryAction: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.dark.primary.value,
    borderRadius: 13,
    justifyContent: "center",
    marginTop: 46,
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    textAlign: "center",
  },
  pulseRing: {
    borderColor: "rgba(168, 156, 224, 0.42)",
    borderWidth: 1.2,
    opacity: 0.22,
    position: "absolute",
  },
  reassurance: {
    alignSelf: "center",
    backgroundColor: undefined,
    bottom: 194,
    color: "rgba(138, 143, 168, 0.78)",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 12,
    letterSpacing: 0,
    lineHeight: 18,
    paddingHorizontal: 32,
    position: "absolute",
    textAlign: "center",
  },
  returnHomeButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: 12,
  },
  returnHomeText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    textAlign: "center",
  },
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
    overflow: "hidden",
  },
  soundBar: {
    backgroundColor: colors.dark.primaryGlow.value,
    borderRadius: 9999,
    width: 4,
  },
  soundBars: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    height: 30,
    justifyContent: "center",
  },
  soundBarsGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.12)",
    borderRadius: 120,
    boxShadow: "0 0 54px rgba(124, 111, 205, 0.22)",
    height: 210,
    position: "absolute",
    width: 210,
  },
  soundBarsStage: {
    alignItems: "center",
    height: 112,
    justifyContent: "center",
    width: 210,
  },
  soundLabel: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 11,
    letterSpacing: 0,
    lineHeight: 14,
    marginTop: 10,
    textAlign: "center",
  },
  soundPauseButton: {
    alignItems: "center",
    backgroundColor: "rgba(28, 32, 64, 0.64)",
    borderColor: "rgba(124, 111, 205, 0.34)",
    borderRadius: 25,
    borderWidth: 1,
    boxShadow: "0 0 24px rgba(124, 111, 205, 0.12)",
    height: 50,
    justifyContent: "center",
    marginTop: 58,
    minHeight: 44,
    minWidth: 44,
    width: 50,
  },
  timer: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 17,
    fontVariant: ["tabular-nums"],
    letterSpacing: 3,
    lineHeight: 24,
    opacity: 0.8,
    textAlign: "center",
  },
});
