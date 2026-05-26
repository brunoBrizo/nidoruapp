import { breathTechniques, type MvpBreathTechniqueId } from "@nidoru/domain";
import { StatusBar } from "expo-status-bar";
import { type Href, usePathname, useRouter } from "expo-router";
import { ChevronRight, Wind } from "lucide-react-native";
import { useMemo, useState } from "react";

import { CardFade } from "../../surfaces/card-fade";
import { Pressable, ScrollView, Text, View, cn } from "../../tw";

type BreatheCategoryId = "sleep" | "calm" | "energy" | "focus";

type BreatheTechniqueLibraryItem = {
  readonly id: MvpBreathTechniqueId;
  readonly label: string;
  readonly referenceLabel?: string;
  readonly href: Href;
  readonly durationMinutes: number;
  readonly rhythmLabel: string;
  readonly categoryCopy: Partial<Record<BreatheCategoryId, string>>;
};

type BreatheTechniqueCardProps = {
  readonly categoryId: BreatheCategoryId;
  readonly technique: BreatheTechniqueLibraryItem;
};

export const BREATHE_FREE_BREATHE_STATUS = "post_mvp_disabled" as const;

const breatheCategories = [
  { id: "sleep", label: "Sleep" },
  { id: "calm", label: "Calm" },
  { id: "energy", label: "Energy" },
  { id: "focus", label: "Focus" },
] as const satisfies readonly { id: BreatheCategoryId; label: string }[];

export const BREATHE_TECHNIQUE_LIBRARY = [
  {
    id: "4-7-8-sleep",
    label: breathTechniques["4-7-8-sleep"].name,
    href: "/breathe/4-7-8-sleep?durationSeconds=300",
    durationMinutes: 5,
    rhythmLabel: "4 in · 7 hold · 8 out",
    categoryCopy: {
      sleep: "Settle into the night.",
    },
  },
  {
    id: "coherent-breathing",
    label: `${breathTechniques["coherent-breathing"].name} / Daily Calm`,
    referenceLabel: breathTechniques["coherent-breathing"].name,
    href: "/breathe/coherent-breathing?durationSeconds=600",
    durationMinutes: 10,
    rhythmLabel: "5.5 in · 5.5 out",
    categoryCopy: {
      calm: "Daily Calm / HRV Training.",
      energy: "Steady energy without strain.",
      focus: "Even rhythm for concentration.",
      sleep: "Smooth, steady rhythm.",
    },
  },
  {
    id: "box-breathing",
    label: breathTechniques["box-breathing"].name,
    href: "/breathe/box-breathing?durationSeconds=300",
    durationMinutes: 5,
    rhythmLabel: "4 in · 4 hold · 4 out · 4 hold",
    categoryCopy: {
      calm: "A square rhythm for stress.",
      energy: "Clear the fog before you move.",
      focus: "Counted breath for attention.",
    },
  },
  {
    id: "diaphragmatic-breathing",
    label: breathTechniques["diaphragmatic-breathing"].name,
    href: "/breathe/diaphragmatic-breathing?durationSeconds=300",
    durationMinutes: 5,
    rhythmLabel: "4 in · 6 out",
    categoryCopy: {
      calm: "Belly breathing for stress.",
    },
  },
] as const satisfies readonly BreatheTechniqueLibraryItem[];

const techniqueIdsByCategory = {
  calm: ["box-breathing", "coherent-breathing", "diaphragmatic-breathing"],
  energy: ["coherent-breathing", "box-breathing"],
  focus: ["box-breathing", "coherent-breathing"],
  sleep: ["4-7-8-sleep", "coherent-breathing"],
} as const satisfies Record<BreatheCategoryId, readonly MvpBreathTechniqueId[]>;

const techniqueById = BREATHE_TECHNIQUE_LIBRARY.reduce(
  (catalog, technique) => ({
    ...catalog,
    [technique.id]: technique,
  }),
  {} as Record<MvpBreathTechniqueId, BreatheTechniqueLibraryItem>,
);

const cardBaseClassName =
  "relative min-h-[100px] w-full flex-row items-center justify-between gap-4 overflow-hidden rounded-[20px] border border-transparent bg-[#14172B]/50 p-4 shadow-[inset_0_1px_0_rgba(238,240,255,0.05)] active:scale-[0.96] active:bg-[#1C2040]/80";

export default function BreatheTabScreen() {
  const pathname = usePathname();
  const [selectedCategoryId, setSelectedCategoryId] = useState<BreatheCategoryId>("sleep");
  const visibleTechniques = useMemo(
    () =>
      techniqueIdsByCategory[selectedCategoryId].map((techniqueId) => techniqueById[techniqueId]),
    [selectedCategoryId],
  );

  return (
    <>
      <StatusBar hidden={pathname === "/breathe"} />
      <ScrollView
        className="flex-1 bg-[#0D0F1A]"
        contentContainerClassName="gap-4 px-[30px] pb-[100px] pt-12"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        testID="breathe-screen"
      >
        <View className="gap-1">
          <Text
            accessibilityRole="header"
            className="font-nidoru-primary-semibold text-[22px] leading-7 text-[#EEF0FF]"
            selectable
          >
            Breathe
          </Text>
          <Text className="font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]" selectable>
            Find a rhythm for right now.
          </Text>
        </View>

        <View
          accessibilityRole="tablist"
          className="min-h-[52px] flex-row gap-0.5 rounded-2xl bg-[#14172B]/50 p-1.5 shadow-[inset_0_1px_0_rgba(238,240,255,0.05)]"
          testID="breathe-tabs"
        >
          {breatheCategories.map((category) => {
            const isSelected = category.id === selectedCategoryId;

            return (
              <Pressable
                accessibilityLabel={category.label}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className={cn(
                  "min-h-10 flex-1 items-center justify-center rounded-[14px] border px-1 active:scale-[0.96]",
                  isSelected
                    ? "border-[#7C6FCD]/20 bg-[#1C2040]/60 shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(238,240,255,0.02)]"
                    : "border-transparent bg-transparent",
                )}
                key={category.id}
                onPress={() => {
                  setSelectedCategoryId(category.id);
                }}
              >
                <Text
                  className={cn(
                    "font-nidoru-primary-semibold text-sm leading-[18px]",
                    isSelected ? "text-[#D4D8F0]" : "text-[#8A8FA8]",
                  )}
                  selectable={false}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="px-1.5 pb-1 pt-4">
          <Text
            className="font-nidoru-primary-regular text-[13px] leading-[18px] text-[#8A8FA8]"
            selectable
          >
            Choose by how you want to feel.
          </Text>
        </View>

        <View className="gap-2">
          {visibleTechniques.map((technique) => (
            <BreatheTechniqueCard
              categoryId={selectedCategoryId}
              key={`${selectedCategoryId}-${technique.id}`}
              technique={technique}
            />
          ))}
        </View>

        <View className="pb-4 pt-1">
          <Pressable
            accessibilityHint="Custom Free Breathe settings are planned after MVP."
            accessibilityLabel="Free Breathe"
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            className="min-h-[88px] flex-row items-center justify-between gap-4 rounded-[20px] border border-transparent bg-[#14172B]/20 p-4"
            disabled
          >
            <View className="flex-1 gap-1">
              <Text
                className="font-nidoru-primary-semibold text-base leading-[22px] text-[#EEF0FF]"
                selectable
              >
                Free Breathe
              </Text>
              <Text
                className="font-nidoru-primary-regular text-sm leading-[18px] text-[#8A8FA8]"
                selectable
              >
                Set your own inhale, hold, and exhale.
              </Text>
              <View className="mt-1.5 self-start rounded-md border border-[#A89CE0]/10 bg-[#A89CE0]/5 px-2 py-0.5">
                <Text className="font-nidoru-data-regular text-[11px] leading-[14px] text-[#A89CE0] tabular-nums">
                  Custom rhythm
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1C2040]/60">
                <Wind color="#A89CE0" size={18} strokeWidth={1.6} />
              </View>
              <ChevronRight color="#4A4E6A" size={20} strokeWidth={1.8} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

function BreatheTechniqueCard({ categoryId, technique }: BreatheTechniqueCardProps) {
  const router = useRouter();
  const label =
    categoryId === "sleep" && technique.referenceLabel ? technique.referenceLabel : technique.label;
  const description =
    technique.categoryCopy[categoryId] ?? breathTechniques[technique.id].description;

  return (
    <Pressable
      accessibilityHint={`Starts ${technique.label} for ${technique.durationMinutes} minutes.`}
      accessibilityLabel={label}
      accessibilityRole="link"
      className={cardBaseClassName}
      onPress={() => {
        router.push(technique.href);
      }}
      testID={`breathe-${technique.id}-card`}
    >
      <CardFade testID={`breathe-${technique.id}-card-fade`} variant="breathe-sleep-card" />
      <View className="z-10 flex-1 gap-1">
        <Text
          className="font-nidoru-primary-semibold text-base leading-[22px] text-[#EEF0FF]"
          selectable
        >
          {label}
        </Text>
        <Text
          className="font-nidoru-primary-regular text-sm leading-[18px] text-[#8A8FA8]"
          selectable
        >
          {description}
        </Text>
        <View className="mt-1.5 self-start rounded-md border border-white/[0.03] bg-[#0D0F1A]/40 px-2 py-0.5">
          <Text className="font-nidoru-data-regular text-[11px] leading-[14px] text-[#8A8FA8] tabular-nums">
            {technique.rhythmLabel}
          </Text>
        </View>
      </View>
      <ChevronRight color="#4A4E6A" size={20} strokeWidth={1.8} />
    </Pressable>
  );
}
