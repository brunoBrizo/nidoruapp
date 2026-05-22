import { breathTechniques, type MvpBreathTechniqueId } from "@nidoru/domain";
import { colors, radii, spacing, typography } from "@nidoru/ui-tokens";
import { Link, type Href } from "expo-router";
import { ChevronRight, Wind } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
  readonly index: number;
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
    rhythmLabel: "5 in · 5 out",
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

export default function BreatheTabScreen() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<BreatheCategoryId>("sleep");
  const visibleTechniques = useMemo(
    () =>
      techniqueIdsByCategory[selectedCategoryId].map((techniqueId) => techniqueById[techniqueId]),
    [selectedCategoryId],
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" selectable style={styles.title}>
          Breathe
        </Text>
        <Text selectable style={styles.subtitle}>
          Find a rhythm for right now.
        </Text>
      </View>

      <View accessibilityRole="tablist" style={styles.segmentedControl}>
        {breatheCategories.map((category) => {
          const isSelected = category.id === selectedCategoryId;

          return (
            <Pressable
              accessibilityLabel={category.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={category.id}
              onPress={() => {
                setSelectedCategoryId(category.id);
              }}
              style={({ pressed }) => [
                styles.segmentButton,
                isSelected ? styles.segmentButtonSelected : styles.segmentButtonIdle,
                pressed ? styles.segmentButtonPressed : null,
              ]}
            >
              <Text style={[styles.segmentText, isSelected ? styles.segmentTextSelected : null]}>
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.explainer}>
        <Text selectable style={styles.explainerText}>
          Choose by how you want to feel.
        </Text>
      </View>

      <View style={styles.cardList}>
        {visibleTechniques.map((technique, index) => (
          <BreatheTechniqueCard
            categoryId={selectedCategoryId}
            index={index}
            key={`${selectedCategoryId}-${technique.id}`}
            technique={technique}
          />
        ))}
      </View>

      <View style={styles.freeBreatheSection}>
        <Pressable
          accessibilityHint="Custom Free Breathe settings are planned after MVP."
          accessibilityLabel="Free Breathe"
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={styles.freeBreatheCard}
        >
          <View style={styles.freeBreatheCopy}>
            <Text style={styles.cardTitle}>Free Breathe</Text>
            <Text style={styles.cardDescription}>Set your own inhale, hold, and exhale.</Text>
            <View style={styles.badge}>
              <Text style={[styles.badgeText, styles.freeBreatheBadgeText]}>Custom rhythm</Text>
            </View>
          </View>
          <View style={styles.freeBreatheActions}>
            <View style={styles.freeBreatheIconSurface}>
              <Wind color={colors.dark.primaryGlow.value} size={18} strokeWidth={1.6} />
            </View>
            <ChevronRight color={colors.dark.textTertiary.value} size={20} strokeWidth={1.8} />
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function BreatheTechniqueCard({ categoryId, index, technique }: BreatheTechniqueCardProps) {
  const label =
    categoryId === "sleep" && technique.referenceLabel ? technique.referenceLabel : technique.label;
  const description =
    technique.categoryCopy[categoryId] ?? breathTechniques[technique.id].description;

  return (
    <Link asChild href={technique.href}>
      <Pressable
        accessibilityHint={`Starts ${technique.label} for ${technique.durationMinutes} minutes.`}
        accessibilityLabel={label}
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.techniqueCard,
          pressed ? styles.techniqueCardPressed : null,
        ]}
      >
        {index === 0 && categoryId === "sleep" ? (
          <View pointerEvents="none" style={styles.sleepGlow} />
        ) : null}
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>{label}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{technique.rhythmLabel}</Text>
          </View>
        </View>
        <ChevronRight color={colors.dark.textTertiary.value} size={20} strokeWidth={1.8} />
      </Pressable>
    </Link>
  );
}

const referenceColors = {
  card: "rgba(20, 23, 43, 0.5)",
  freeBreatheCard: "rgba(20, 23, 43, 0.2)",
  selectedSegment: "rgba(28, 32, 64, 0.6)",
  segmentSurface: "rgba(20, 23, 43, 0.5)",
  sleepGlow: "rgba(124, 111, 205, 0.15)",
} as const;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
  },
  content: {
    gap: spacing.sm,
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
  segmentedControl: {
    backgroundColor: referenceColors.segmentSurface,
    borderRadius: 16,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.05)",
    flexDirection: "row",
    gap: 2,
    minHeight: 56,
    padding: 6,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    transform: [{ scale: 1 }],
  },
  segmentButtonIdle: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 1,
  },
  segmentButtonSelected: {
    backgroundColor: referenceColors.selectedSegment,
    borderColor: "rgba(124, 111, 205, 0.2)",
    borderWidth: 1,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(238, 240, 255, 0.02)",
  },
  segmentButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  segmentText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 18,
  },
  segmentTextSelected: {
    color: "#D4D8F0",
  },
  explainer: {
    paddingBottom: 4,
    paddingHorizontal: 6,
    paddingTop: spacing.sm,
  },
  explainerText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  cardList: {
    gap: spacing.xs,
  },
  techniqueCard: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: referenceColors.card,
    borderColor: "transparent",
    borderRadius: radii.card,
    borderWidth: 1,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.05)",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 100,
    overflow: "hidden",
    padding: spacing.sm,
    position: "relative",
    transform: [{ scale: 1 }],
    width: "100%",
  },
  techniqueCardPressed: {
    backgroundColor: "rgba(28, 32, 64, 0.8)",
    transform: [{ scale: 0.96 }],
  },
  sleepGlow: {
    backgroundColor: referenceColors.sleepGlow,
    borderRadius: 9999,
    height: 96,
    left: -48,
    position: "absolute",
    top: 2,
    width: 96,
  },
  cardCopy: {
    flex: 1,
    gap: 4,
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
    lineHeight: 18,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(13, 15, 26, 0.4)",
    borderColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 11,
    lineHeight: 14,
  },
  freeBreatheSection: {
    paddingBottom: spacing.sm,
    paddingTop: 4,
  },
  freeBreatheCard: {
    alignItems: "center",
    backgroundColor: referenceColors.freeBreatheCard,
    borderColor: "transparent",
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 88,
    padding: spacing.sm,
  },
  freeBreatheCopy: {
    flex: 1,
    gap: 4,
  },
  freeBreatheActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  freeBreatheIconSurface: {
    alignItems: "center",
    backgroundColor: referenceColors.selectedSegment,
    borderRadius: 9999,
    height: 40,
    justifyContent: "center",
    overflow: "hidden",
    width: 40,
  },
  freeBreatheBadgeText: {
    color: colors.dark.primaryGlow.value,
  },
});
