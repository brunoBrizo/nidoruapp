import {
  windDownContextGoalOptions,
  type WindDownContextGoal,
  type WindDownRoutineUiState,
} from "@nidoru/domain";
import {
  CheckCircle2,
  ChevronRight,
  CloudRain,
  Moon,
  Pause,
  Volume2,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react-native";
import { useContext, type ReactNode } from "react";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import Svg, {
  Circle as SvgCircle,
  Defs,
  LinearGradient,
  Pattern,
  Rect,
  Stop,
} from "react-native-svg";
import { StatusBar } from "expo-status-bar";

import { NidoruButton, OrbStage } from "../design-system";
import { Pressable, Text, View, cn } from "../tw";

export type WindDownActiveRoutineView = {
  readonly breathworkDurationSeconds: number;
  readonly phaseLabel: string;
  readonly remainingSeconds: number;
  readonly soundLabel: string;
  readonly uiState: Extract<WindDownRoutineUiState, "active_winddown" | "daily_calm">;
};

export type WindDownVisualStateId =
  | "quick_context"
  | "active_winddown"
  | "daily_calm"
  | "transition_card"
  | "body_cue"
  | "ambient_handoff"
  | "dimmed_idle"
  | "tap_to_wake"
  | "audio_interruption"
  | "completion"
  | "partial_stop"
  | "background_recovery";

type WindDownSessionState = Exclude<WindDownVisualStateId, "quick_context">;

type WindDownSessionHandlers = {
  readonly onClose?: () => void;
  readonly onContinue?: () => void;
  readonly onFadeNow?: () => void;
  readonly onSkipForTonight?: () => void;
  readonly onStop?: () => void;
  readonly onWake?: () => void;
};

type WindDownScreenProps =
  | {
      readonly state: "preparing";
    }
  | {
      readonly onSelectGoal: (goal: WindDownContextGoal) => void;
      readonly state: "quick_context";
    }
  | (WindDownSessionHandlers & {
      readonly activeRoutine?: WindDownActiveRoutineView;
      readonly state: "active" | WindDownSessionState;
    });

const defaultActiveRoutine = {
  breathworkDurationSeconds: 300,
  phaseLabel: "Inhale",
  remainingSeconds: 298,
  soundLabel: "Rain",
  uiState: "active_winddown",
} as const satisfies WindDownActiveRoutineView;

const dailyCalmRoutine = {
  ...defaultActiveRoutine,
  breathworkDurationSeconds: 600,
  remainingSeconds: 582,
  uiState: "daily_calm",
} as const satisfies WindDownActiveRoutineView;

const iconByGoal: Record<WindDownContextGoal, LucideIcon> = {
  calm_racing_thoughts: Wind,
  fall_asleep_faster: Moon,
  wake_up_fewer_times: Waves,
};

export function WindDownScreen(props: WindDownScreenProps) {
  if (props.state === "preparing") {
    return (
      <WindDownFrame centered>
        <View className="absolute h-[240px] w-[240px] rounded-full bg-[#7C6FCD]/10 shadow-[0_0_82px_rgba(124,111,205,0.22)]" />
        <Text
          accessibilityRole="header"
          className="text-center font-nidoru-primary-semibold text-2xl leading-[30px] text-[#EEF0FF]"
          selectable
        >
          Settling the room.
        </Text>
        <Text
          className="mt-2 text-center font-nidoru-primary-regular text-[15px] leading-[22px] text-[#8A8FA8]"
          selectable
        >
          Your Wind-Down will start here.
        </Text>
      </WindDownFrame>
    );
  }

  if (props.state === "quick_context") {
    return (
      <WindDownFrame stateId="quick_context">
        <View className="flex-1 px-[18px] pt-[78px] pb-[34px]">
          <View className="gap-[11px]">
            <Text
              className="font-nidoru-data-regular text-[13px] uppercase leading-[18px] tracking-[0.31em] text-[#A89CE0]"
              selectable
            >
              TONIGHT
            </Text>
            <Text
              accessibilityRole="header"
              className="font-nidoru-primary-regular text-[30px] leading-9 text-[#EEF0FF]"
              selectable
            >
              What’s your goal tonight?
            </Text>
            <Text
              className="font-nidoru-primary-regular text-base leading-[22px] text-[#EEF0FF]/60"
              selectable
            >
              We’ll start the right wind-down for you.
            </Text>
          </View>

          <View className="mt-12 gap-3">
            {windDownContextGoalOptions.map((option, index) => (
              <WindDownContextOption
                isRecommended={index === 0}
                key={option.value}
                onPress={() => props.onSelectGoal(option.value)}
                option={option}
              />
            ))}
          </View>

          <View className="items-center gap-4 pt-[88px]">
            <Pressable
              accessibilityHint="Starts the default 4-7-8 Wind-Down and remembers it for next time."
              accessibilityLabel="Skip"
              accessibilityRole="button"
              className="min-h-12 min-w-24 items-center justify-center rounded-full active:scale-[0.96]"
              onPress={() => props.onSelectGoal("fall_asleep_faster")}
            >
              <Text
                className="font-nidoru-primary-semibold text-lg leading-6 text-[#EEF0FF]/80"
                selectable={false}
              >
                Skip
              </Text>
            </Pressable>
            <Text
              className="text-center font-nidoru-primary-regular text-base leading-[22px] text-[#4A4E6A]"
              selectable
            >
              We’ll remember this.
            </Text>
          </View>
        </View>
      </WindDownFrame>
    );
  }

  const state =
    props.state === "active" ? (props.activeRoutine?.uiState ?? "active_winddown") : props.state;

  if (state === "active_winddown" || state === "daily_calm") {
    return (
      <BreathworkState
        activeRoutine={
          props.activeRoutine ?? (state === "daily_calm" ? dailyCalmRoutine : defaultActiveRoutine)
        }
        state={state}
      />
    );
  }

  if (state === "transition_card") {
    return (
      <WindDownFrame stateId="transition_card">
        <View className="flex-1 justify-center px-8 pb-24">
          <Text
            accessibilityRole="header"
            className="max-w-[260px] font-nidoru-primary-semibold text-[28px] leading-[34px] text-[#EEF0FF]"
            selectable
          >
            Good. Now let your body relax.
          </Text>
          <View className="mt-8 flex-row items-center gap-2">
            <Text
              className="font-nidoru-primary-regular text-xs leading-4 text-[#8A8FA8]"
              selectable
            >
              Body relaxation starts in
            </Text>
            <View className="h-6 w-6 items-center justify-center rounded-full border border-[#7C6FCD]/40 bg-[#14172B]/70">
              <Text
                className="font-nidoru-data-regular text-xs leading-4 text-[#EEF0FF] tabular-nums"
                selectable
              >
                5
              </Text>
            </View>
          </View>
          <View className="mt-auto items-center gap-4">
            <QuietPill label="Next. Body relaxation" onPress={props.onContinue} />
            <Text
              className="text-center font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]"
              selectable
            >
              Rain softly playing
            </Text>
          </View>
        </View>
      </WindDownFrame>
    );
  }

  if (state === "body_cue") {
    return (
      <WindDownFrame stateId="body_cue">
        <View className="flex-1 justify-between px-8 pt-[82px] pb-[34px]">
          <View className="items-center">
            <View className="h-1 w-10 rounded-full bg-[#EEF0FF]/24" />
          </View>
          <View className="gap-3">
            <Text
              className="font-nidoru-data-regular text-[11px] uppercase leading-4 tracking-[0.22em] text-[#4A4E6A]"
              selectable
            >
              BODY RELAXATION
            </Text>
            <Text
              accessibilityRole="header"
              className="font-nidoru-primary-semibold text-[25px] leading-[32px] text-[#EEF0FF]"
              selectable
            >
              Soften your shoulders.
            </Text>
            <Text
              className="font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]"
              selectable
            >
              Let the weight of the day drop a little.
            </Text>
          </View>
          <View className="items-center gap-24">
            <Text
              className="font-nidoru-data-light text-base leading-6 text-[#A89CE0] tabular-nums"
              selectable
            >
              01:42
            </Text>
            <View className="items-center gap-5">
              <Text
                className="font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]"
                selectable
              >
                Rain softly playing
              </Text>
              <QuietPill label="Stop" onPress={props.onStop} subdued />
            </View>
          </View>
        </View>
      </WindDownFrame>
    );
  }

  if (state === "ambient_handoff") {
    return (
      <WindDownFrame stateId="ambient_handoff">
        <View className="flex-1 px-[30px] pt-[74px] pb-[32px]">
          <View className="items-center gap-2">
            <Text
              className="font-nidoru-data-regular text-[11px] uppercase leading-4 tracking-[0.22em] text-[#4A4E6A]"
              selectable
            >
              SLEEP SOUNDS
            </Text>
            <Text
              accessibilityRole="header"
              className="font-nidoru-primary-semibold text-[21px] leading-7 text-[#EEF0FF]"
              selectable
            >
              Rain is playing
            </Text>
            <Text
              className="text-center font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]"
              selectable
            >
              Screen will dim. Audio keeps going.
            </Text>
          </View>
          <View className="mt-14 items-center">
            <TimerHalo value="29:58" />
          </View>
          <View className="mt-11 gap-2 rounded-[24px] border border-white/[0.04] bg-[#0D0F1A]/58 p-5 shadow-[inset_0_1px_0_rgba(238,240,255,0.04)]">
            <AmbientOption
              description="Audio stays locked"
              icon={CloudRain}
              label="Continue"
              onPress={props.onContinue}
            />
            <AmbientOption
              description="Lower over 2 min"
              icon={Volume2}
              label="Fade"
              onPress={props.onFadeNow}
            />
            <AmbientOption
              description="No session guilt"
              icon={Pause}
              label="Stop anytime"
              onPress={props.onStop}
            />
          </View>
          <View className="mt-auto items-center gap-4">
            <QuietPill label="Stop sound" onPress={props.onStop} subdued />
            <Text
              className="text-center font-nidoru-primary-regular text-xs leading-4 text-[#4A4E6A]"
              selectable
            >
              Dimming in 0:28{"\n"}Audio continues after the app sleeps
            </Text>
          </View>
        </View>
      </WindDownFrame>
    );
  }

  if (state === "dimmed_idle") {
    return (
      <WindDownFrame dimmed onPress={props.onWake} stateId="dimmed_idle">
        <View className="flex-1 items-center justify-center px-8">
          <Text
            accessibilityRole="header"
            className="font-nidoru-data-light text-[48px] leading-[58px] text-[#EEF0FF]/74 tabular-nums"
            selectable
          >
            29:28
          </Text>
          <Text
            className="mt-1 text-center font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]"
            selectable
          >
            Rain continues
          </Text>
          <View className="absolute bottom-[84px] items-center gap-1">
            <Text
              className="font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]"
              selectable
            >
              Tap to wake controls
            </Text>
            <Text
              className="font-nidoru-primary-regular text-xs leading-4 text-[#4A4E6A]"
              selectable
            >
              Audio keeps playing in the dark
            </Text>
          </View>
        </View>
      </WindDownFrame>
    );
  }

  if (state === "tap_to_wake") {
    return (
      <WindDownFrame stateId="tap_to_wake">
        <View className="flex-1 items-center px-[30px] pt-[82px] pb-[34px]">
          <Text
            className="font-nidoru-data-regular text-[11px] uppercase leading-4 tracking-[0.2em] text-[#4A4E6A]"
            selectable
          >
            SLEEP SOUNDS
          </Text>
          <Text
            accessibilityRole="header"
            className="mt-2 font-nidoru-primary-semibold text-[21px] leading-7 text-[#EEF0FF]"
            selectable
          >
            Rain is playing
          </Text>
          <Text className="font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]" selectable>
            Audio keeps going while locked
          </Text>
          <View className="mt-20">
            <TimerHalo value="29:21" />
          </View>
          <View className="mt-10 flex-row gap-3">
            <QuietPill label="Stop" onPress={props.onStop} subdued />
            <QuietPill label="Fade now" onPress={props.onFadeNow} subdued />
          </View>
          <QuietPill className="mt-3" label="Keep playing" onPress={props.onContinue} />
          <Text
            className="mt-auto text-center font-nidoru-primary-regular text-xs leading-4 text-[#4A4E6A]"
            selectable
          >
            Screen dims again in 0:31{"\n"}Tap anywhere for controls
          </Text>
        </View>
      </WindDownFrame>
    );
  }

  if (state === "audio_interruption") {
    return (
      <WindDownFrame stateId="audio_interruption">
        <View className="flex-1 px-[28px] pt-[76px] pb-[34px]">
          <View className="items-center gap-2">
            <Text
              className="font-nidoru-data-regular text-[11px] uppercase leading-4 tracking-[0.22em] text-[#4A4E6A]"
              selectable
            >
              SLEEP SOUNDS
            </Text>
            <Text
              accessibilityRole="header"
              className="font-nidoru-primary-semibold text-[21px] leading-7 text-[#EEF0FF]"
              selectable
            >
              Rain resumed
            </Text>
            <Text
              className="text-center font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]"
              selectable
            >
              Audio paused briefly, then continued.
            </Text>
          </View>
          <View className="mt-12 items-center">
            <View className="h-[92px] w-[92px] items-center justify-center rounded-full bg-[#7C6FCD]/14 shadow-[0_0_42px_rgba(124,111,205,0.24)]">
              <Volume2 color="#A89CE0" size={30} strokeWidth={1.5} />
            </View>
            <Text
              className="mt-7 font-nidoru-primary-semibold text-sm leading-5 text-[#EEF0FF]"
              selectable
            >
              Playing now
            </Text>
            <Text
              className="font-nidoru-data-regular text-xs leading-4 text-[#8A8FA8] tabular-nums"
              selectable
            >
              24:18 remaining
            </Text>
          </View>
          <View className="mt-10 gap-4 rounded-[24px] border border-white/[0.04] bg-[#0D0F1A]/58 p-5">
            <StatusLine title="Stopped" description="Interruption came in" />
            <StatusLine title="Faded" description="Volume lowered safely" />
            <StatusLine active title="Resumed" description="Rain is playing again" />
          </View>
          <NidoruButton className="mt-8 rounded-full bg-[#7C6FCD]/80" onPress={props.onContinue}>
            Keep playing
          </NidoruButton>
          <QuietPill className="mt-4" label="Stop sound" onPress={props.onStop} subdued />
          <Text
            className="mt-auto text-center font-nidoru-primary-regular text-xs leading-4 text-[#4A4E6A]"
            selectable
          >
            Screen dims again in 0:25
          </Text>
        </View>
      </WindDownFrame>
    );
  }

  if (state === "completion") {
    return (
      <WindDownFrame stateId="completion">
        <TerminalState
          actionLabel="Close"
          eyebrow="WIND-DOWN COMPLETE"
          icon={CheckCircle2}
          items={[
            ["Audio ended", "Rain faded down"],
            ["Session saved", "Ready for tomorrow check-in"],
            ["Screen can sleep.", "Power lock released"],
          ]}
          onAction={props.onClose}
          title="Rest now."
        />
      </WindDownFrame>
    );
  }

  if (state === "partial_stop") {
    return (
      <WindDownFrame stateId="partial_stop">
        <TerminalState
          actionLabel="Continue with rain"
          eyebrow="WIND-DOWN PAUSED"
          icon={Pause}
          items={[
            ["Breathwork saved", "Completed earlier"],
            ["Body cue paused", "Nothing lost"],
            ["Sound available", "Continue any time"],
          ]}
          onAction={props.onContinue}
          secondaryActionLabel="Close"
          onSecondaryAction={props.onClose}
          title="You can stop here."
          subtitle="We saved what you completed tonight."
        />
      </WindDownFrame>
    );
  }

  return (
    <WindDownFrame stateId="background_recovery">
      <TerminalState
        actionLabel="Continue"
        eyebrow="WIND-DOWN SAVED"
        icon={CloudRain}
        items={[
          ["Breathwork saved", "Completed before backgrounding"],
          ["Routine paused", "Waiting at the next step"],
          ["Rain ready", "Sound can continue safely"],
        ]}
        onAction={props.onContinue}
        secondaryActionLabel="Skip for tonight"
        onSecondaryAction={props.onSkipForTonight}
        title="You’re back."
        subtitle="Breathwork was saved while you were away."
      />
    </WindDownFrame>
  );
}

function WindDownFrame({
  centered = false,
  children,
  dimmed = false,
  onPress,
  stateId,
}: {
  readonly centered?: boolean;
  readonly children: ReactNode;
  readonly dimmed?: boolean;
  readonly onPress?: (() => void) | undefined;
  readonly stateId?: WindDownVisualStateId;
}) {
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
  const frameClassName = cn(
    "flex-1 overflow-hidden bg-[#090B14]",
    centered ? "items-center justify-center px-8" : null,
  );

  const content = (
    <>
      <StatusBar hidden />
      <WindDownBackground dimmed={dimmed} />
      {dimmed ? <View className="absolute inset-0 bg-black/30" pointerEvents="none" /> : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        className={frameClassName}
        onPress={onPress}
        style={safeAreaStyle}
        testID={stateId ? `wind-down-state-${stateId}` : undefined}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      className={frameClassName}
      style={safeAreaStyle}
      testID={stateId ? `wind-down-state-${stateId}` : undefined}
    >
      {content}
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
      className={cn(
        "min-h-[72px] flex-row items-center gap-3.5 rounded-[17px] border px-[13px] active:scale-[0.96]",
        "shadow-[inset_0_1px_0_rgba(238,240,255,0.04)]",
        isRecommended
          ? "border-[#7C6FCD]/50 bg-[#14172B]/75 shadow-[inset_0_1px_0_rgba(238,240,255,0.06),0_0_22px_rgba(124,111,205,0.18)]"
          : "border-white/[0.08] bg-[#0D0F1A]/70",
      )}
      onPress={onPress}
    >
      <View
        className={cn(
          "h-11 w-11 items-center justify-center rounded-[22px]",
          isRecommended ? "bg-[#7C6FCD]/18" : null,
        )}
      >
        <Icon color="#A89CE0" size={26} strokeWidth={1.55} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text
          className="font-nidoru-primary-semibold text-[17px] leading-[21px] text-[#EEF0FF]"
          selectable
        >
          {option.label}
        </Text>
        <Text
          className="font-nidoru-primary-regular text-sm leading-[18px] text-[#EEF0FF]/62"
          selectable
        >
          {option.subtitle}
        </Text>
      </View>
      <ChevronRight color="rgba(168, 156, 224, 0.72)" size={24} strokeWidth={1.6} />
    </Pressable>
  );
}

function BreathworkState({
  activeRoutine,
  state,
}: {
  readonly activeRoutine: WindDownActiveRoutineView;
  readonly state: Extract<WindDownVisualStateId, "active_winddown" | "daily_calm">;
}) {
  const isDailyCalm = state === "daily_calm";
  const title = isDailyCalm ? "Daily Calm" : "Let's wind down.";

  return (
    <WindDownFrame stateId={state}>
      <View className="flex-1 px-7 pt-[78px]">
        <View className="items-center gap-2">
          <Text
            accessibilityRole="header"
            className={cn(
              "text-center font-nidoru-primary-semibold text-[29px] leading-9 text-[#EEF0FF]",
              isDailyCalm ? "text-[24px] leading-8" : null,
            )}
            selectable
          >
            {title}
          </Text>
          {isDailyCalm ? (
            <Text
              className="text-center font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]"
              selectable
            >
              Coherent breathing for wind-down
            </Text>
          ) : null}
        </View>

        <View
          className={cn(
            "flex-1 items-center justify-center",
            isDailyCalm ? "min-h-[430px]" : "min-h-[420px]",
          )}
        >
          <OrbStage
            accessibilityHint="Guides the current Wind-Down breath phase."
            accessibilityLabel={`${activeRoutine.phaseLabel} breathing phase`}
            accessibilityRole="image"
            className={cn(
              "relative h-[280px] w-[280px]",
              isDailyCalm ? "h-[300px] w-[300px]" : null,
            )}
            isDecorative={false}
            testID="wind-down-active-orb"
          >
            <View
              className={cn(
                "absolute h-[280px] w-[280px] rounded-full border border-[#A89CE0]/15 bg-[#7C6FCD]/[0.08]",
                isDailyCalm ? "h-[300px] w-[300px]" : null,
              )}
            />
            <View
              className={cn(
                "absolute h-[232px] w-[232px] rounded-full border border-[#A89CE0]/15 bg-[#7C6FCD]/[0.16]",
                isDailyCalm ? "h-[244px] w-[244px]" : null,
              )}
            />
            <View
              className={cn(
                "absolute h-[182px] w-[182px] rounded-full border border-[#A89CE0]/25 bg-[#7C6FCD]/25",
                isDailyCalm ? "h-[196px] w-[196px]" : null,
              )}
            />
            <View className="absolute h-[156px] w-[156px] items-center justify-center overflow-hidden rounded-full border border-white/20 bg-[#4C427D]/95 shadow-[0_0_46px_rgba(124,111,205,0.42)]">
              <View className="absolute h-[136px] w-[136px] rounded-full bg-white/[0.07]" />
              <Text
                className="font-nidoru-primary-semibold text-[32px] leading-[38px] text-[#EEF0FF]"
                selectable={false}
              >
                {activeRoutine.phaseLabel}
              </Text>
              <Text
                className="mt-1.5 font-nidoru-data-regular text-lg leading-7 tracking-[0.18em] text-[#EEF0FF]/85 tabular-nums"
                selectable
              >
                {formatRemainingTime(activeRoutine.remainingSeconds)}
              </Text>
              {isDailyCalm ? (
                <Text
                  className="mt-1 font-nidoru-primary-regular text-[11px] leading-4 text-[#EEF0FF]/55"
                  selectable
                >
                  4.5 in · 4.5 out
                </Text>
              ) : null}
            </View>
          </OrbStage>
        </View>

        <View className="items-center gap-[58px] pb-[26px]">
          <Text
            className="text-center font-nidoru-primary-regular text-lg leading-6 text-[#EEF0FF]/65"
            selectable
          >
            {activeRoutine.soundLabel} softly playing
          </Text>
          <Text
            className="text-center font-nidoru-primary-regular text-[15px] leading-[22px] text-[#4A4E6A]/65"
            selectable
          >
            Swipe down to exit
          </Text>
        </View>
      </View>
    </WindDownFrame>
  );
}

function TimerHalo({ value }: { readonly value: string }) {
  return (
    <View className="h-[168px] w-[168px] items-center justify-center rounded-full border border-[#7C6FCD]/25 bg-[#0D0F1A]/20 shadow-[0_0_42px_rgba(124,111,205,0.12)]">
      <Text
        className="font-nidoru-data-light text-[43px] leading-[52px] text-[#EEF0FF] tabular-nums"
        selectable
      >
        {value}
      </Text>
      <Text className="font-nidoru-primary-regular text-xs leading-4 text-[#4A4E6A]" selectable>
        remaining
      </Text>
    </View>
  );
}

function AmbientOption({
  description,
  icon: Icon,
  label,
  onPress,
}: {
  readonly description: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly onPress?: (() => void) | undefined;
}) {
  return (
    <Pressable
      accessibilityHint={description}
      accessibilityLabel={label}
      accessibilityRole="button"
      className="min-h-11 flex-row items-center gap-3 rounded-[14px] px-1 active:scale-[0.96]"
      onPress={onPress}
    >
      <Icon color="#A89CE0" size={18} strokeWidth={1.45} />
      <View className="min-w-0 flex-1">
        <Text
          className="font-nidoru-primary-semibold text-sm leading-5 text-[#EEF0FF]"
          selectable={false}
        >
          {label}
        </Text>
        <Text className="font-nidoru-primary-regular text-xs leading-4 text-[#4A4E6A]" selectable>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function QuietPill({
  className,
  label,
  onPress,
  subdued = false,
}: {
  readonly className?: string;
  readonly label: string;
  readonly onPress?: (() => void) | undefined;
  readonly subdued?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className={cn(
        "min-h-10 min-w-[112px] items-center justify-center rounded-full border px-5 active:scale-[0.96]",
        subdued
          ? "border-white/[0.07] bg-transparent"
          : "border-[#7C6FCD]/30 bg-[#1C2040]/70 shadow-[inset_0_1px_0_rgba(238,240,255,0.05)]",
        className,
      )}
      onPress={onPress}
    >
      <Text
        className={cn(
          "font-nidoru-primary-semibold text-xs leading-4",
          subdued ? "text-[#8A8FA8]" : "text-[#EEF0FF]/85",
        )}
        selectable={false}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StatusLine({
  active = false,
  description,
  title,
}: {
  readonly active?: boolean;
  readonly description: string;
  readonly title: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View
        className={cn(
          "mt-1 h-3 w-3 rounded-full border",
          active ? "border-[#A89CE0] bg-[#7C6FCD]/70" : "border-[#4A4E6A]/70",
        )}
      />
      <View className="min-w-0 flex-1">
        <Text className="font-nidoru-primary-semibold text-sm leading-5 text-[#EEF0FF]" selectable>
          {title}
        </Text>
        <Text className="font-nidoru-primary-regular text-xs leading-4 text-[#4A4E6A]" selectable>
          {description}
        </Text>
      </View>
    </View>
  );
}

function TerminalState({
  actionLabel,
  eyebrow,
  icon: Icon,
  items,
  onAction,
  onSecondaryAction,
  secondaryActionLabel,
  subtitle,
  title,
}: {
  readonly actionLabel: string;
  readonly eyebrow: string;
  readonly icon: LucideIcon;
  readonly items: readonly (readonly [string, string])[];
  readonly onAction?: (() => void) | undefined;
  readonly onSecondaryAction?: (() => void) | undefined;
  readonly secondaryActionLabel?: string;
  readonly subtitle?: string;
  readonly title: string;
}) {
  return (
    <View className="flex-1 px-[28px] pt-[80px] pb-[34px]">
      <View className="items-center gap-2">
        <Text
          className="font-nidoru-data-regular text-[11px] uppercase leading-4 tracking-[0.22em] text-[#4A4E6A]"
          selectable
        >
          {eyebrow}
        </Text>
        <Text
          accessibilityRole="header"
          className="text-center font-nidoru-primary-semibold text-[23px] leading-[30px] text-[#EEF0FF]"
          selectable
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-center font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]"
            selectable
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View className="mt-20 items-center">
        <View className="h-[92px] w-[92px] items-center justify-center rounded-full border border-[#7C6FCD]/30 bg-[#0D0F1A]/45 shadow-[0_0_36px_rgba(124,111,205,0.16)]">
          <Icon color="#A89CE0" size={30} strokeWidth={1.45} />
        </View>
        <Text
          className="mt-7 text-center font-nidoru-primary-semibold text-sm leading-5 text-[#EEF0FF]"
          selectable
        >
          {items[0]?.[0]}
        </Text>
        <Text
          className="text-center font-nidoru-primary-regular text-xs leading-4 text-[#4A4E6A]"
          selectable
        >
          {items[0]?.[1]}
        </Text>
      </View>

      <View className="mt-10 gap-4 rounded-[24px] border border-white/[0.04] bg-[#0D0F1A]/58 p-5">
        {items.map(([label, description]) => (
          <StatusLine description={description} key={label} title={label} />
        ))}
      </View>

      <View className="mt-auto gap-3">
        <QuietPill label={actionLabel} onPress={onAction} />
        {secondaryActionLabel ? (
          <QuietPill label={secondaryActionLabel} onPress={onSecondaryAction} subdued />
        ) : null}
        <Text
          className="text-center font-nidoru-primary-regular text-xs leading-4 text-[#4A4E6A]"
          selectable
        >
          Nothing else needs attention tonight.
        </Text>
      </View>
    </View>
  );
}

function WindDownBackground({ dimmed = false }: { readonly dimmed?: boolean }) {
  return (
    <View className="absolute inset-0" pointerEvents="none" testID="wind-down-background">
      <Svg height="100%" width="100%">
        <Defs>
          <Pattern height="8" id="windDownDots" patternUnits="userSpaceOnUse" width="8">
            <SvgCircle cx="1" cy="1" fill="#242845" opacity={dimmed ? 0.18 : 0.34} r="0.8" />
          </Pattern>
          <LinearGradient id="windDownLowGlow" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#090B14" stopOpacity="1" />
            <Stop offset="0.52" stopColor="#101427" stopOpacity="1" />
            <Stop offset="1" stopColor={dimmed ? "#0A0C16" : "#181C38"} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#windDownLowGlow)" height="100%" width="100%" x="0" y="0" />
        <Rect
          fill="url(#windDownDots)"
          height="100%"
          opacity={dimmed ? 0.3 : 0.58}
          width="100%"
          x="0"
          y="0"
        />
      </Svg>
      <View className="absolute -bottom-[108px] left-14 right-14 h-[260px] rounded-full bg-[#7C6FCD]/[0.08] shadow-[0_0_84px_rgba(124,111,205,0.2)]" />
      <View className="absolute inset-x-0 bottom-0 h-40 bg-[#0D0F1A]/20" />
    </View>
  );
}

function formatRemainingTime(totalSeconds: number): string {
  const boundedSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(boundedSeconds / 60);
  const seconds = boundedSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
