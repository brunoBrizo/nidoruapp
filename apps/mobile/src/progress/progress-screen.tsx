import { colors, radii, spacing, typography } from "@nidoru/ui-tokens";
import { Link, type Href } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type ProgressStat = {
  readonly value: string;
  readonly unit?: string;
  readonly label: string;
};

type ProgressCard = {
  readonly title: string;
  readonly description: string;
  readonly href: Href;
  readonly accessory: "week-strip" | "weekly-count" | "mood-tags" | "trend-bars";
};

const progressStats: readonly ProgressStat[] = [
  { value: "8", unit: "days", label: "current rhythm" },
  { value: "12", label: "sessions" },
  { value: "48", unit: "min", label: "breath time" },
] as const;

export const PROGRESS_DASHBOARD_CARDS = [
  {
    title: "Streak calendar",
    description: "Missed days pause. They do not reset.",
    href: "/progress/streak-calendar",
    accessory: "week-strip",
  },
  {
    title: "Weekly summary",
    description: "A gentle look at your last 7 nights.",
    href: "/progress/weekly-summary",
    accessory: "weekly-count",
  },
  {
    title: "Mood history",
    description: "Morning check-ins over time.",
    href: "/progress/mood-history",
    accessory: "mood-tags",
  },
  {
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

export function ProgressScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" selectable style={styles.title}>
          Progress
        </Text>
        <Text selectable style={styles.subtitle}>
          Small patterns, no pressure.
        </Text>
      </View>

      <View style={styles.statRow}>
        {progressStats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text selectable style={styles.statValue}>
              {stat.value}
              {stat.unit ? <Text style={styles.statUnit}> {stat.unit}</Text> : null}
            </Text>
            <Text selectable style={styles.statLabel}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.cardList}>
        {PROGRESS_DASHBOARD_CARDS.map((card) => (
          <ProgressDashboardCard card={card} key={card.title} />
        ))}
      </View>
    </ScrollView>
  );
}

function ProgressDashboardCard({ card }: { readonly card: ProgressCard }) {
  return (
    <Link asChild href={card.href}>
      <Pressable
        accessibilityHint={card.description}
        accessibilityLabel={card.title}
        accessibilityRole="link"
      >
        {({ pressed }) => (
          <View style={[styles.card, pressed ? styles.cardPressed : null]}>
            {card.accessory === "week-strip" || card.accessory === "mood-tags" ? (
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardDescription}>{card.description}</Text>
                  </View>
                  <ChevronRight
                    color={colors.dark.textTertiary.value}
                    size={20}
                    strokeWidth={1.7}
                  />
                </View>
                {card.accessory === "week-strip" ? <WeekStrip /> : <MoodTags />}
              </>
            ) : (
              <View style={styles.inlineCardHeader}>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDescription}>{card.description}</Text>
                </View>
                <InlineAccessory accessory={card.accessory} />
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function InlineAccessory({ accessory }: { readonly accessory: ProgressCard["accessory"] }) {
  return (
    <View style={styles.inlineAccessory}>
      {accessory === "weekly-count" ? (
        <Text selectable style={styles.weeklyCount}>
          5 of 7 nights
        </Text>
      ) : null}
      {accessory === "trend-bars" ? <TrendBars /> : null}
      <ChevronRight color={colors.dark.textTertiary.value} size={20} strokeWidth={1.7} />
    </View>
  );
}

function WeekStrip() {
  return (
    <View accessibilityLabel="Rhythm week strip" style={styles.weekStrip}>
      {weekDots.map((state, index) => (
        <View
          key={`${state}-${index}`}
          style={[
            styles.weekDot,
            state === "complete" ? styles.weekDotComplete : null,
            state === "paused" ? styles.weekDotPaused : null,
            state === "today" ? styles.weekDotToday : null,
            state === "future" ? styles.weekDotFuture : null,
          ]}
        />
      ))}
    </View>
  );
}

function MoodTags() {
  return (
    <View style={styles.moodTagRow}>
      {moodTags.map((tag, index) => (
        <View
          key={`${tag.label}-${index}`}
          style={[
            styles.moodTag,
            tag.state === "active" ? styles.moodTagActive : null,
            tag.state === "faded" ? styles.moodTagFaded : null,
          ]}
        >
          <Text
            style={[styles.moodTagText, tag.state === "active" ? styles.moodTagTextActive : null]}
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
    <View accessibilityLabel="Sleep trend bars" style={styles.trendBars}>
      {trendBars.map((height, index) => (
        <View
          key={`${height}-${index}`}
          style={[styles.trendBar, { height }, index === 3 ? styles.trendBarActive : null]}
        />
      ))}
    </View>
  );
}

const referenceColors = {
  card: "rgba(20, 23, 43, 0.62)",
  cardPressed: "rgba(28, 32, 64, 0.8)",
  statLabel: colors.dark.textTertiary.value,
  lavenderFill: "rgba(168, 156, 224, 0.9)",
  lavenderOutline: "rgba(168, 156, 224, 0.6)",
  mistOutline: "rgba(138, 143, 168, 0.4)",
  hazeOutline: "rgba(74, 78, 106, 0.4)",
  tagBorder: "rgba(74, 78, 106, 0.3)",
  tagAccentBackground: "rgba(168, 156, 224, 0.15)",
  tagAccentBorder: "rgba(168, 156, 224, 0.2)",
} as const;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.bottomNavigationHeight + spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl + spacing.xs,
  },
  header: {
    gap: 4,
  },
  title: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 22,
    letterSpacing: 0,
    lineHeight: 28,
  },
  subtitle: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  statRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: referenceColors.card,
    borderRadius: 16,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.05)",
    flex: 1,
    justifyContent: "center",
    minHeight: 80,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  statValue: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    lineHeight: 24,
    textAlign: "center",
  },
  statUnit: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  statLabel: {
    color: referenceColors.statLabel,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
    textAlign: "center",
  },
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: referenceColors.card,
    borderColor: "transparent",
    borderRadius: radii.card,
    borderWidth: 1,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.05)",
    gap: 12,
    justifyContent: "center",
    minHeight: 88,
    overflow: "hidden",
    padding: spacing.sm,
    transform: [{ scale: 1 }],
  },
  cardPressed: {
    backgroundColor: referenceColors.cardPressed,
    transform: [{ scale: 0.96 }],
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  inlineCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  cardCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: typography.scale.bodyLarge.size,
    letterSpacing: 0,
    lineHeight: 22,
  },
  cardDescription: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  inlineAccessory: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  weeklyCount: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  weekStrip: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 1,
  },
  weekDot: {
    borderRadius: 9999,
    height: 22,
    width: 22,
  },
  weekDotComplete: {
    backgroundColor: referenceColors.lavenderFill,
  },
  weekDotPaused: {
    borderColor: referenceColors.mistOutline,
    borderWidth: 1.5,
  },
  weekDotToday: {
    borderColor: referenceColors.lavenderOutline,
    borderWidth: 1.5,
  },
  weekDotFuture: {
    borderColor: referenceColors.hazeOutline,
    borderWidth: 1,
  },
  moodTagRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    overflow: "hidden",
    paddingTop: 1,
  },
  moodTag: {
    borderColor: referenceColors.tagBorder,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  moodTagActive: {
    backgroundColor: referenceColors.tagAccentBackground,
    borderColor: referenceColors.tagAccentBorder,
  },
  moodTagFaded: {
    opacity: 0.5,
  },
  moodTagText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 11,
    lineHeight: 14,
  },
  moodTagTextActive: {
    color: colors.dark.primaryGlow.value,
  },
  trendBars: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 4,
    height: 22,
    justifyContent: "center",
    opacity: 0.8,
    paddingTop: 2,
  },
  trendBar: {
    backgroundColor: colors.dark.textTertiary.value,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    width: 5,
  },
  trendBarActive: {
    backgroundColor: colors.dark.primary.value,
  },
});
