import type { Href } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { Link, Pressable, ScrollView, Text, View, cn } from "../tw";

type ProgressStat = {
  readonly id: "current-rhythm" | "sessions" | "breath-time";
  readonly value: string;
  readonly unit?: string;
  readonly label: string;
};

type ProgressCard = {
  readonly id: "streak-calendar" | "weekly-summary" | "mood-history" | "sleep-trends";
  readonly title: string;
  readonly description: string;
  readonly href: Href;
  readonly accessory: "week-strip" | "weekly-count" | "mood-tags" | "trend-bars";
};

const progressStats: readonly ProgressStat[] = [
  { id: "current-rhythm", value: "8", unit: "days", label: "current rhythm" },
  { id: "sessions", value: "12", label: "sessions" },
  { id: "breath-time", value: "48", unit: "min", label: "breath time" },
] as const;

export const PROGRESS_DASHBOARD_CARDS = [
  {
    id: "streak-calendar",
    title: "Streak calendar",
    description: "Missed days pause. They do not reset.",
    href: "/progress/streak-calendar",
    accessory: "week-strip",
  },
  {
    id: "weekly-summary",
    title: "Weekly summary",
    description: "A gentle look at your last 7 nights.",
    href: "/progress/weekly-summary",
    accessory: "weekly-count",
  },
  {
    id: "mood-history",
    title: "Mood history",
    description: "Morning check-ins over time.",
    href: "/progress/mood-history",
    accessory: "mood-tags",
  },
  {
    id: "sleep-trends",
    title: "Sleep trends",
    description: "Patterns appear after a few check-ins.",
    href: "/progress/sleep-trends",
    accessory: "trend-bars",
  },
] as const satisfies readonly ProgressCard[];

const weekDots = [
  "complete",
  "complete",
  "paused",
  "complete",
  "today",
  "future",
  "future",
] as const;
const moodTags = [
  { label: "calm", state: "muted" },
  { label: "tired", state: "muted" },
  { label: "clear", state: "active" },
  { label: "calm", state: "faded" },
] as const;
const trendBars = [12, 16, 14, 20, 16] as const;

const progressCardClassName =
  "min-h-[88px] justify-center overflow-hidden rounded-[20px] border border-transparent bg-[#14172B]/50 p-4 shadow-[inset_0_1px_0_rgba(238,240,255,0.05)] transition-transform duration-200 active:scale-[0.96]";

export function ProgressScreen() {
  return (
    <ScrollView
      className="flex-1 bg-[#0D0F1A]"
      contentContainerClassName="px-5 pt-12 pb-[104px]"
      contentInsetAdjustmentBehavior="automatic"
      testID="progress-screen"
    >
      <View className="mb-6 gap-1">
        <Text
          accessibilityRole="header"
          className="font-nidoru-primary-semibold text-[22px] leading-7 text-[#EEF0FF]"
          selectable
        >
          Progress
        </Text>
        <Text className="font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]" selectable>
          Small patterns, no pressure.
        </Text>
      </View>

      <View className="mb-8 flex-row gap-3" testID="progress-stat-row">
        {progressStats.map((stat) => (
          <ProgressStatCard key={stat.id} stat={stat} />
        ))}
      </View>

      <View className="gap-3">
        {PROGRESS_DASHBOARD_CARDS.map((card) => (
          <ProgressDashboardCard card={card} key={card.id} />
        ))}
      </View>
    </ScrollView>
  );
}

function ProgressStatCard({ stat }: { readonly stat: ProgressStat }) {
  return (
    <View
      className="min-h-[72px] min-w-0 flex-1 items-center justify-center rounded-[16px] bg-[#14172B]/50 p-3 text-center shadow-[inset_0_1px_0_rgba(238,240,255,0.05)]"
      testID={`progress-stat-card-${stat.id}`}
    >
      <Text
        className="text-center font-nidoru-data-regular text-[18px] font-semibold leading-6 text-[#EEF0FF] tabular-nums"
        selectable
        testID={`progress-stat-value-${stat.id}`}
      >
        {stat.value}
        {stat.unit ? (
          <Text className="font-nidoru-primary-semibold text-[13px] font-medium leading-[18px] text-[#8A8FA8]">
            {" "}
            {stat.unit}
          </Text>
        ) : null}
      </Text>
      <Text
        className="mt-0.5 text-center font-nidoru-primary-regular text-xs leading-4 text-[#4A4E6A]"
        selectable
      >
        {stat.label}
      </Text>
    </View>
  );
}

function ProgressDashboardCard({ card }: { readonly card: ProgressCard }) {
  const isPreviewStack = card.accessory === "week-strip" || card.accessory === "mood-tags";

  return (
    <Link asChild href={card.href}>
      <Pressable
        accessibilityHint={card.description}
        accessibilityLabel={card.title}
        accessibilityRole="link"
      >
        {({ pressed }) => (
          <View
            className={cn(
              progressCardClassName,
              isPreviewStack ? "gap-3" : null,
              pressed ? "scale-[0.96] bg-[#1C2040]/80" : null,
            )}
            testID={`progress-card-${card.id}`}
          >
            {isPreviewStack ? (
              <>
                <View className="w-full flex-row items-start justify-between gap-3">
                  <ProgressCardCopy card={card} />
                  <ProgressChevron />
                </View>
                {card.accessory === "week-strip" ? <WeekStrip /> : <MoodTags />}
              </>
            ) : (
              <View className="w-full flex-row items-center justify-between gap-4">
                <ProgressCardCopy card={card} />
                <InlineAccessory accessory={card.accessory} />
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function ProgressCardCopy({ card }: { readonly card: ProgressCard }) {
  return (
    <View className="min-w-0 flex-1 gap-0.5">
      <Text className="font-nidoru-primary-semibold text-base leading-[22px] text-[#EEF0FF]">
        {card.title}
      </Text>
      <Text className="font-nidoru-primary-regular text-sm leading-5 text-[#8A8FA8]">
        {card.description}
      </Text>
    </View>
  );
}

function InlineAccessory({ accessory }: { readonly accessory: ProgressCard["accessory"] }) {
  return (
    <View className="shrink-0 flex-row items-center justify-end gap-2">
      {accessory === "weekly-count" ? (
        <Text
          className="font-nidoru-data-regular text-[13px] leading-[18px] text-[#8A8FA8] tabular-nums"
          selectable
          testID="progress-weekly-count"
        >
          5 of 7 nights
        </Text>
      ) : null}
      {accessory === "trend-bars" ? <TrendBars /> : null}
      <ProgressChevron />
    </View>
  );
}

function ProgressChevron() {
  return <ChevronRight color="#4A4E6A" size={20} strokeWidth={1.7} />;
}

function WeekStrip() {
  return (
    <View accessibilityLabel="Rhythm week strip" className="flex-row items-center gap-2 pt-1">
      {weekDots.map((state, index) => (
        <View
          className={cn(
            "h-6 w-6 rounded-full",
            state === "complete" ? "bg-[#A89CE0]/90" : null,
            state === "paused" ? "border-[1.5px] border-[#8A8FA8]/40" : null,
            state === "today" ? "border-[1.5px] border-[#A89CE0]/60" : null,
            state === "future" ? "border border-[#4A4E6A]/40" : null,
          )}
          key={`${state}-${index}`}
          testID={`progress-week-dot-${state}-${index}`}
        />
      ))}
    </View>
  );
}

function MoodTags() {
  return (
    <View className="flex-row flex-nowrap gap-2 overflow-hidden pt-1">
      {moodTags.map((tag, index) => (
        <View
          className={cn(
            "rounded-[6px] border border-[#4A4E6A]/30 px-2 py-0.5",
            tag.state === "active" ? "border-[#A89CE0]/20 bg-[#A89CE0]/15" : null,
            tag.state === "faded" ? "opacity-50" : null,
          )}
          key={`${tag.label}-${index}`}
          testID={`progress-mood-tag-${tag.state}-${index}`}
        >
          <Text
            className={cn(
              "font-nidoru-primary-semibold text-[11px] font-medium leading-[14px] text-[#8A8FA8]",
              tag.state === "active" ? "text-[#A89CE0]" : null,
            )}
          >
            {tag.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TrendBars() {
  return (
    <View
      accessibilityLabel="Sleep trend bars"
      className="h-5 flex-row items-end justify-center gap-1 pt-1 opacity-80"
      testID="progress-trend-bars"
    >
      {trendBars.map((height, index) => (
        <View
          className={cn("w-1.5 rounded-t-[2px]", index === 3 ? "bg-[#7C6FCD]" : "bg-[#4A4E6A]")}
          key={`${height}-${index}`}
          style={{ height }}
          testID={`progress-trend-bar-${index === 3 ? "active" : "muted"}-${index}`}
        />
      ))}
    </View>
  );
}
