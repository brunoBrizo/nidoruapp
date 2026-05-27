import { type Href, useRouter } from "expo-router";

import { CardFade } from "../surfaces/card-fade";
import { Pressable, ScrollView, Text, View, cn } from "../tw";
import { markWindDownPerformanceStart } from "../wind-down/wind-down-performance-proof";
import {
  SolarAltArrowRightLinearIcon,
  SolarBookBookmarkLinearIcon,
  SolarCloudRainLinearIcon,
  SolarClockCircleLinearIcon,
  SolarFireLinearIcon,
  SolarPlayLinearIcon,
  SolarSoundwaveLinearIcon,
  SolarWaterdropsLinearIcon,
  SolarWindLinearIcon,
  type SleepIconComponent,
} from "./sleep-icons";

type MixerLayer = {
  readonly label: string;
  readonly volume: 70 | 55 | 35;
  readonly Icon: SleepIconComponent;
};

type QuickSound = {
  readonly label: string;
  readonly Icon: SleepIconComponent;
};

const sleepRoutes = {
  sounds: "/sleep/sounds",
  stories: "/sleep/stories",
  windDown: "/sleep/wind-down",
} as const satisfies Record<string, Href>;

const mixerLayers = [
  { label: "Rain", volume: 70, Icon: SolarCloudRainLinearIcon },
  { label: "Brown noise", volume: 55, Icon: SolarSoundwaveLinearIcon },
  { label: "Fireplace", volume: 35, Icon: SolarFireLinearIcon },
] as const satisfies readonly MixerLayer[];

const quickSounds = [
  { label: "Rain", Icon: SolarCloudRainLinearIcon },
  { label: "Ocean", Icon: SolarWaterdropsLinearIcon },
  { label: "Fan", Icon: SolarWindLinearIcon },
] as const satisfies readonly QuickSound[];

const layerFillClassByVolume = {
  35: "w-[35%]",
  55: "w-[55%]",
  70: "w-[70%]",
} as const satisfies Record<MixerLayer["volume"], string>;

export function SleepScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-[#0D0F1A]"
      contentContainerClassName="gap-5 px-nidoru-screen pt-12 pb-[104px]"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      testID="sleep-screen"
    >
      <View className="items-start justify-between">
        <Text
          accessibilityRole="header"
          className="font-nidoru-primary-semibold text-xl leading-7 text-[#EEF0FF]"
          selectable
        >
          Sleep
        </Text>
        <Text className="font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]" selectable>
          Settle into tonight.
        </Text>
      </View>

      <View
        className="relative mt-1 min-h-[128px] overflow-hidden rounded-[24px] bg-[#1C2040] px-5 pt-[18px] pb-4 shadow-[inset_0_1px_0_rgba(238,240,255,0.06),0_8px_32px_-8px_rgba(15,18,48,0.6)]"
        testID="sleep-primary-card"
      >
        <CardFade testID="sleep-primary-card-fade" variant="sleep-primary" />
        <View className="relative z-10 mb-5 gap-1">
          <Text
            className="font-nidoru-primary-semibold text-base leading-[22px] text-[#EEF0FF]"
            selectable
          >
            Evening Wind-Down
          </Text>
          <Text
            className="font-nidoru-primary-regular text-sm leading-[18px] text-[#8A8FA8]"
            selectable
          >
            4-7-8 breath · body relax · sleep sounds
          </Text>
        </View>

        <Pressable
          accessibilityHint="Opens the Evening Wind-Down flow."
          accessibilityRole="link"
          className="relative z-10 h-[44px] rounded-[16px] bg-[#7C6FCD] w-full flex-row items-center justify-center shadow-[inset_0_1px_0_rgba(238,240,255,0.2)] active:scale-[0.96] transition-transform duration-200"
          onPress={() => {
            markWindDownPerformanceStart("entry_tap");
            router.push(sleepRoutes.windDown);
          }}
          testID="sleep-primary-cta"
        >
          <View className="translate-x-[2px] flex-row items-center gap-2">
            <SolarPlayLinearIcon color="#EEF0FF" size={18} strokeWidth={1.5} />
            <Text
              className="font-nidoru-primary-semibold text-sm leading-5 text-[#EEF0FF]"
              selectable={false}
            >
              Start wind-down
            </Text>
          </View>
        </Pressable>
      </View>

      <Pressable
        accessibilityHint="Opens the Sound Mixer anchor."
        accessibilityLabel="Sound Mixer"
        accessibilityRole="link"
        className="min-h-[168px] gap-4 rounded-[24px] border border-[#1E2236]/60 bg-[#14172B] p-5 shadow-[inset_0_1px_0_rgba(238,240,255,0.03)] active:scale-[0.98] transition-transform duration-200"
        onPress={() => {
          router.push(sleepRoutes.sounds);
        }}
        testID="sleep-mixer-card"
      >
        <View className="flex-row items-start justify-between gap-2">
          <View className="min-w-0 flex-1 gap-0.5">
            <Text
              className="font-nidoru-primary-semibold text-base leading-[22px] text-[#EEF0FF]"
              selectable
            >
              Sound Mixer
            </Text>
            <Text
              className="font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]"
              selectable
            >
              Layer sounds for sleep.
            </Text>
          </View>
          <View className="flex-row items-center gap-2.5">
            <View
              className="min-h-[26px] flex-row items-center gap-1.5 rounded-[10px] border border-[#1E2236] bg-[#0D0F1A]/80 px-2.5 py-1"
              testID="sleep-timer-pill"
            >
              <SolarClockCircleLinearIcon color="#4A4E6A" size={12} strokeWidth={1.5} />
              <Text
                className="font-nidoru-data-regular text-xs leading-4 text-[#8A8FA8] tabular-nums"
                selectable
              >
                30 min
              </Text>
            </View>
            <SolarAltArrowRightLinearIcon color="#4A4E6A" size={20} strokeWidth={1.5} />
          </View>
        </View>

        <View className="gap-2.5 pt-1">
          {mixerLayers.map((layer) => (
            <MixerLayerRow key={layer.label} layer={layer} />
          ))}
        </View>
      </Pressable>

      <View className="flex-row flex-wrap gap-2.5">
        {quickSounds.map((sound) => {
          const Icon = sound.Icon;

          return (
            <Pressable
              accessibilityHint="Opens the Sound Mixer anchor."
              accessibilityLabel={`${sound.label} quick sound`}
              accessibilityRole="link"
              className="min-h-[44px] flex-row items-center gap-2.5 rounded-[16px] border border-[#1E2236]/60 bg-[#14172B] px-4 py-3 shadow-[inset_0_1px_0_rgba(238,240,255,0.04),0_12px_28px_rgba(0,0,0,0.18)] active:scale-[0.96] transition-transform duration-200"
              key={sound.label}
              onPress={() => {
                router.push(sleepRoutes.sounds);
              }}
              testID={`sleep-quick-sound-${sound.label}`}
            >
              <Icon color="#8A8FA8" size={18} strokeWidth={1.5} />
              <Text
                className="font-nidoru-primary-semibold text-sm leading-[18px] text-[#EEF0FF]"
                selectable={false}
              >
                {sound.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityHint="Opens the Sleep Stories anchor."
        accessibilityLabel="Sleep Stories"
        accessibilityRole="link"
        className="min-h-[136px] gap-3 rounded-[20px] border border-[#1E2236]/60 bg-[#14172B] p-4 shadow-[inset_0_1px_0_rgba(238,240,255,0.03)] active:scale-[0.98] transition-transform duration-200"
        onPress={() => {
          router.push(sleepRoutes.stories);
        }}
        testID="sleep-story-card"
      >
        <View className="flex-row items-start justify-between gap-2">
          <View className="min-w-0 flex-1 gap-0.5">
            <Text
              className="font-nidoru-primary-semibold text-base leading-[22px] text-[#EEF0FF]"
              selectable
            >
              Sleep Stories
            </Text>
            <Text
              className="font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]"
              selectable
            >
              Quiet narration for restless thoughts.
            </Text>
          </View>
          <SolarAltArrowRightLinearIcon color="#4A4E6A" size={20} strokeWidth={1.5} />
        </View>

        <View
          className="min-h-[52px] flex-row items-center gap-3.5 rounded-[16px] border border-[#1E2236]/50 bg-[#0D0F1A]/60 p-2.5"
          testID="sleep-story-preview"
        >
          <View className="h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#1E2236]/80 bg-[#1C2040] shadow-[inset_0_1px_0_rgba(238,240,255,0.05)]">
            <SolarBookBookmarkLinearIcon color="#5EC4D4" opacity={0.8} size={18} />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="font-nidoru-primary-semibold text-sm leading-[19px] text-[#EEF0FF]"
              selectable
            >
              The Quiet Shoreline
            </Text>
            <Text
              className="mt-0.5 font-nidoru-data-regular text-xs leading-4 text-[#4A4E6A] tabular-nums"
              selectable
            >
              45 min
            </Text>
          </View>
        </View>
      </Pressable>
    </ScrollView>
  );
}

function MixerLayerRow({ layer }: { readonly layer: MixerLayer }) {
  const Icon = layer.Icon;

  return (
    <View
      className="min-h-5 flex-row items-center justify-between gap-2"
      testID={`sleep-mixer-layer-${layer.label}`}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <Icon color="#8A8FA8" size={18} strokeWidth={1.5} />
        <Text
          className="shrink font-nidoru-primary-semibold text-sm leading-[19px] text-[#EEF0FF]"
          selectable
        >
          {layer.label}
        </Text>
      </View>
      <View className="flex-row items-center gap-2.5">
        <Text
          className="min-w-[30px] text-right font-nidoru-data-regular text-xs leading-4 text-[#4A4E6A] tabular-nums"
          selectable
        >
          {layer.volume}%
        </Text>
        <View className="h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-[#1E2236]">
          <View
            className={cn("h-full rounded-full bg-[#A89CE0]", layerFillClassByVolume[layer.volume])}
            testID={`sleep-mixer-layer-${layer.label}-fill`}
          />
        </View>
      </View>
    </View>
  );
}
