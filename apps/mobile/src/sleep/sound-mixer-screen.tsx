import {
  Asterisk,
  ChartNoAxesColumn,
  ChevronLeft,
  Cloud,
  CloudLightning,
  CloudRain,
  Coffee,
  Disc3,
  Droplet,
  Flame,
  Headphones,
  Leaf,
  Magnet,
  MoonStar,
  PlusCircle,
  Radio,
  Timer,
  Waves,
  Wind,
} from "lucide-react-native";
import type { ElementType } from "react";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { Pressable, ScrollView, Text, View, cn } from "../tw";

type MixerIconProps = {
  readonly color?: string;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly testID?: string;
};

type MixerIcon = ElementType<MixerIconProps>;

type SavedMix = {
  readonly id: string;
  readonly label: string;
  readonly icons: readonly MixerIcon[];
};

type SoundCard = {
  readonly id: string;
  readonly label: string;
  readonly Icon: MixerIcon;
  readonly volume?: 34 | 58 | 72;
};

type SoundCategory = {
  readonly id: string;
  readonly label: string;
  readonly sounds: readonly SoundCard[];
};

const colors = {
  active: "#7C6FCD",
  activeSoft: "#A89CE0",
  inactive: "#A1A7C4",
  muted: "#6A7095",
  text: "#EEF0FF",
} as const;

const savedMixes: readonly SavedMix[] = [
  { id: "rain-hearth", label: "Rain Hearth", icons: [CloudRain, Flame] },
  { id: "forest-fan", label: "Forest Fan", icons: [Leaf, Asterisk] },
] as const;

const soundCategories: readonly SoundCategory[] = [
  {
    id: "rain",
    label: "Rain",
    sounds: [
      { id: "light-rain", label: "Light Rain", Icon: CloudRain, volume: 72 },
      { id: "heavy-rain", label: "Heavy Rain", Icon: Cloud },
      { id: "rain-on-window", label: "Rain on Window", Icon: AppWindowIcon },
      { id: "thunderstorm", label: "Thunderstorm", Icon: CloudLightning },
    ],
  },
  {
    id: "nature",
    label: "Nature",
    sounds: [
      { id: "ocean-waves", label: "Ocean Waves", Icon: Waves },
      { id: "forest", label: "Forest", Icon: Leaf },
      { id: "river-stream", label: "River Stream", Icon: Droplet },
      { id: "wind", label: "Wind", Icon: Wind },
    ],
  },
  {
    id: "noise",
    label: "Noise",
    sounds: [
      { id: "white-noise", label: "White Noise", Icon: Radio },
      { id: "brown-noise", label: "Brown Noise", Icon: ChartNoAxesColumn, volume: 58 },
      { id: "pink-noise", label: "Pink Noise", Icon: Disc3 },
    ],
  },
  {
    id: "environment",
    label: "Environment",
    sounds: [
      { id: "fireplace-crackling", label: "Fireplace Crackling", Icon: Flame, volume: 34 },
      { id: "cafe-ambience", label: "Cafe Ambience", Icon: Coffee },
      { id: "fan", label: "Fan", Icon: Asterisk },
    ],
  },
  {
    id: "tones",
    label: "Tones",
    sounds: [
      { id: "432hz-tone", label: "432Hz Tone", Icon: Magnet },
      { id: "delta-wave-binaural", label: "Delta Wave Binaural", Icon: Headphones },
    ],
  },
] as const;

const activeSounds = soundCategories
  .flatMap((category) => category.sounds)
  .filter((sound) => sound.volume !== undefined);

const timerOptions = ["20", "30", "45", "60", "∞"] as const;

export function SoundMixerScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#0D0F1A]" testID="sound-mixer-screen">
      <StatusBar hidden />
      <ScrollView
        className="flex-1 bg-[#0D0F1A]"
        contentContainerClassName="pb-[252px]"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        testID="sound-mixer-scroll"
      >
        <View className="px-5 pt-12 pb-2">
          <View className="mb-1 min-h-8 flex-row items-center justify-between">
            <Pressable
              accessibilityHint="Returns to the previous sleep screen."
              accessibilityLabel="Back to Sleep"
              accessibilityRole="button"
              className="-ml-2 h-11 w-11 items-center justify-center rounded-[14px] active:scale-[0.96]"
              onPress={() => {
                router.back();
              }}
              testID="sound-mixer-back"
            >
              <ChevronLeft color={colors.text} size={22} strokeWidth={1.5} />
            </Pressable>

            <Text
              accessibilityRole="header"
              className="-ml-1 flex-1 text-center font-nidoru-primary-regular text-[22px] font-medium leading-[28px] text-[#EEF0FF]"
              selectable
            >
              Sound Mixer
            </Text>

            <View
              className="ml-2 min-h-[29px] items-center justify-center rounded-full border border-[#1E2236] bg-[#1C2040] px-2.5 py-[5px]"
              testID="sound-mixer-offline-pill"
            >
              <Text className="font-nidoru-primary-semibold text-[11px] leading-[14px] tracking-wide text-[#A89CE0]">
                Offline pack
              </Text>
            </View>
          </View>

          <Text
            className="ml-1 mt-0.5 font-nidoru-primary-regular text-sm font-light leading-5 text-[#8A8FA8]"
            selectable
          >
            Layer sounds for tonight.
          </Text>
        </View>

        <View className="mt-1 pl-5">
          <Text className="ml-1 mb-3 font-nidoru-primary-semibold text-[11px] leading-4 tracking-[0.1em] text-[#4A4E6A]">
            SAVED MIXES
          </Text>
          <ScrollView
            className="w-full"
            contentContainerClassName="gap-2 pr-5 pb-2"
            horizontal
            showsHorizontalScrollIndicator={false}
            testID="sound-mixer-saved-mixes-row"
          >
            {savedMixes.map((mix) => (
              <SavedMixChip key={mix.id} mix={mix} />
            ))}
            <Pressable
              accessibilityLabel="Create new saved mix"
              accessibilityRole="button"
              className="h-10 shrink-0 flex-row items-center gap-1.5 rounded-[14px] border border-dashed border-[#1E2236] px-3.5 active:scale-[0.96]"
              testID="sound-mixer-new-mix-chip"
            >
              <PlusCircle color={colors.inactive} size={16} strokeWidth={1.5} />
              <Text className="font-nidoru-primary-regular text-[13px] leading-[18px] tracking-wide text-[#A1A7C4]">
                New mix
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        <View className="mt-4 px-5">
          <View
            className="h-[52px] flex-row items-center justify-between rounded-[16px] border border-[#1E2236]/50 bg-[#14172B]/70 px-4"
            testID="sound-mixer-timer-card"
          >
            <View className="flex-row items-center gap-3.5">
              <Timer color={colors.active} size={20} strokeWidth={1.5} />
              <View>
                <Text className="font-nidoru-primary-regular text-sm leading-[18px] tracking-wide text-[#EEF0FF]">
                  Timer <Text className="text-[#4A4E6A]">·</Text>{" "}
                  <Text className="font-nidoru-data-regular text-[#A89CE0] tabular-nums">
                    30 min
                  </Text>
                </Text>
                <Text className="mt-0.5 font-nidoru-primary-regular text-xs font-light leading-4 tracking-wide text-[#8A8FA8]">
                  Fade starts in{" "}
                  <Text className="font-nidoru-data-regular tabular-nums">28 min</Text>
                </Text>
              </View>
            </View>
            <View className="h-8 w-8 items-center justify-center">
              <ProgressRing
                progress={0.93}
                size={32}
                strokeColor={colors.active}
                strokeWidth={2}
                trackColor="#1E2236"
              />
              <View className="absolute inset-0 items-center justify-center">
                <MoonStar color={colors.activeSoft} size={14} strokeWidth={1.5} />
              </View>
            </View>
          </View>
        </View>

        <View className="mt-5 gap-6 px-5 pb-10">
          {soundCategories.map((category) => (
            <View key={category.id}>
              <Text className="ml-1 mb-3 font-nidoru-primary-semibold text-[11px] leading-4 tracking-[0.1em] text-[#4A4E6A]">
                {category.label.toUpperCase()}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {category.sounds.map((sound) => (
                  <SoundCardButton key={sound.id} sound={sound} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-[96px] left-4 right-4 z-40 gap-3.5 rounded-[24px] border border-[#1E2236]/80 bg-[#14172B]/95 p-3.5 shadow-[0_-8px_30px_rgba(13,15,26,0.9)]"
        testID="sound-mixer-active-strip"
      >
        <View className="flex-row items-center justify-between px-1">
          <View>
            <Text className="font-nidoru-primary-semibold text-[15px] leading-5 tracking-wide text-[#EEF0FF]">
              Tonight mix
            </Text>
            <Text className="mt-0.5 font-nidoru-primary-regular text-xs leading-4 tracking-wide text-[#A1A7C4]">
              3 active layers
            </Text>
          </View>
          <View className="flex-row gap-1.5">
            {activeSounds.map((sound) => (
              <ActiveMiniIcon key={sound.id} sound={sound} />
            ))}
          </View>
        </View>

        <View className="h-11 flex-row gap-3">
          <View
            className="flex-1 flex-row items-center rounded-[14px] border border-[#1E2236]/60 bg-[#0D0F1A] p-1"
            testID="sound-mixer-timer-segments"
          >
            {timerOptions.map((option) => {
              const selected = option === "30";

              return (
                <Pressable
                  accessibilityLabel={`${option} minute timer${selected ? ", selected" : ""}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={cn(
                    "h-full flex-1 items-center justify-center rounded-[10px]",
                    selected ? "border border-[#2D3359]/50 bg-[#1C2040]" : null,
                  )}
                  key={option}
                  testID={`sound-mixer-timer-option-${option}`}
                >
                  <Text
                    className={cn(
                      "font-nidoru-data-regular text-[13px] leading-[18px] tabular-nums",
                      selected ? "text-[#EEF0FF]" : "text-[#6A7095]",
                    )}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityHint="Opens the Save Mix sheet."
            accessibilityLabel="Save Mix"
            accessibilityRole="button"
            className="h-full shrink-0 items-center justify-center rounded-[14px] bg-[#7C6FCD] px-4 shadow-[0_0_15px_rgba(124,111,205,0.25)] active:scale-[0.96]"
            testID="sound-mixer-save-mix"
          >
            <Text className="font-nidoru-primary-semibold text-[13px] leading-[18px] tracking-wide text-white">
              Save Mix
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SavedMixChip({ mix }: { readonly mix: SavedMix }) {
  return (
    <Pressable
      accessibilityLabel={`${mix.label} saved mix`}
      accessibilityRole="button"
      className="h-10 shrink-0 flex-row items-center gap-2 rounded-[14px] border border-[#1E2236]/60 bg-[#14172B] px-3.5 active:scale-[0.96]"
      testID={`sound-mixer-saved-mix-${mix.id}`}
    >
      <View className="flex-row -space-x-1 opacity-80">
        {mix.icons.map((Icon, index) => (
          <View
            className="h-5 w-5 items-center justify-center rounded-full border border-[#1E2236] bg-[#1C2040]"
            key={`${mix.id}-${index}`}
          >
            <Icon color={colors.activeSoft} size={10} strokeWidth={1.5} />
          </View>
        ))}
      </View>
      <Text className="font-nidoru-primary-regular text-[13px] leading-[18px] tracking-wide text-[#EEF0FF]">
        {mix.label}
      </Text>
    </Pressable>
  );
}

function SoundCardButton({ sound }: { readonly sound: SoundCard }) {
  const isActive = sound.volume !== undefined;
  const Icon = sound.Icon;
  const accessibilityLabel = isActive
    ? `${sound.label} active sound at ${sound.volume}% volume`
    : `${sound.label} sound`;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      className={cn(
        "h-[128px] grow basis-[47.2%] items-center justify-center rounded-[20px] border p-3.5 active:scale-[0.98]",
        isActive
          ? "overflow-hidden border-[#7C6FCD]/40 bg-[#1C2040] shadow-[0_0_25px_rgba(124,111,205,0.15)]"
          : "border-[#1E2236]/60 bg-[#14172B]",
      )}
      testID={`sound-mixer-sound-${sound.id}`}
    >
      {isActive ? (
        <View className="absolute inset-0 bg-gradient-to-b from-[#7C6FCD]/[0.12] to-transparent" />
      ) : null}

      <View
        className={cn(
          "relative mb-2.5 items-center justify-center",
          isActive ? "h-[72px] w-[72px]" : "h-16 w-16",
        )}
      >
        {isActive ? (
          <ProgressRing
            progress={(sound.volume ?? 0) / 100}
            size={72}
            strokeColor={colors.active}
            strokeWidth={2.5}
            trackColor={colors.active}
            trackOpacity={0.2}
          />
        ) : (
          <ProgressRing
            progress={0}
            size={64}
            strokeColor="transparent"
            strokeWidth={1.5}
            trackColor={colors.muted}
            trackOpacity={0.4}
          />
        )}

        <View className="absolute inset-0 items-center justify-center">
          <Icon
            color={isActive ? colors.text : colors.inactive}
            size={isActive ? 32 : 28}
            strokeWidth={1.5}
          />
        </View>

        {isActive ? (
          <View className="absolute -bottom-1 z-20 rounded-[8px] border border-[#7C6FCD]/60 bg-[#1C2040] px-2 py-1 shadow-sm">
            <Text className="font-nidoru-data-regular text-xs leading-none text-[#EEF0FF] tabular-nums">
              {`${sound.volume}%`}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        className={cn(
          "text-center font-nidoru-primary-regular text-sm leading-[18px] tracking-wide",
          isActive ? "font-nidoru-primary-semibold text-[#EEF0FF]" : "text-[#A1A7C4]",
        )}
        selectable={false}
      >
        {sound.label}
      </Text>
    </Pressable>
  );
}

function ActiveMiniIcon({ sound }: { readonly sound: SoundCard }) {
  const Icon = sound.Icon;

  return (
    <View
      accessibilityLabel={`${sound.label} active layer`}
      accessibilityRole="image"
      accessible
      className="h-9 w-9 items-center justify-center rounded-full border border-[#2D3359] bg-[#1C2040]"
      testID={`sound-mixer-active-layer-${sound.id}`}
    >
      <Icon color={colors.activeSoft} size={16} strokeWidth={1.5} />
    </View>
  );
}

function ProgressRing({
  progress,
  size,
  strokeColor,
  strokeWidth,
  trackColor,
  trackOpacity = 1,
}: {
  readonly progress: number;
  readonly size: number;
  readonly strokeColor: string;
  readonly strokeWidth: number;
  readonly trackColor: string;
  readonly trackOpacity?: number;
}) {
  const radius = size / 2 - strokeWidth * 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        fill="none"
        opacity={trackOpacity}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {progress > 0 ? (
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
          stroke={strokeColor}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      ) : null}
    </Svg>
  );
}

function AppWindowIcon({
  color = "currentColor",
  size = 24,
  strokeWidth = 1.5,
  testID,
}: MixerIconProps) {
  const testProps = testID ? { testID } : {};

  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size} {...testProps}>
      <Rect height="14" rx="2.5" stroke={color} strokeWidth={strokeWidth} width="16" x="4" y="5" />
      <Line
        stroke={color}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        x1="4"
        x2="20"
        y1="9"
        y2="9"
      />
      <Circle cx="7" cy="7" fill={color} r="0.75" />
      <Circle cx="10" cy="7" fill={color} r="0.75" />
    </Svg>
  );
}
