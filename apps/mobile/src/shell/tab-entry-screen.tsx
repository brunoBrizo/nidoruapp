import { colors, radii, spacing, typography } from "@nidoru/ui-tokens";
import { Link, type Href } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export type TabEntry = {
  readonly label: string;
  readonly description: string;
  readonly href: Href;
};

export type TabEntrySection = {
  readonly title?: string;
  readonly entries: readonly TabEntry[];
};

type TabEntryScreenProps = {
  readonly title: string;
  readonly description: string;
  readonly sections: readonly TabEntrySection[];
};

export function TabEntryScreen({ description, sections, title }: TabEntryScreenProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" selectable style={styles.title}>
          {title}
        </Text>
        <Text selectable style={styles.description}>
          {description}
        </Text>
      </View>

      {sections.map((section, sectionIndex) => (
        <View key={section.title ?? `section-${sectionIndex}`} style={styles.section}>
          {section.title ? (
            <Text accessibilityRole="header" selectable style={styles.sectionTitle}>
              {section.title}
            </Text>
          ) : null}
          <View style={styles.entryList}>
            {section.entries.map((entry) => (
              <Link asChild href={entry.href} key={entry.label}>
                <Pressable
                  accessibilityHint={entry.description}
                  accessibilityRole="link"
                  style={({ pressed }) => [styles.entryRow, pressed && styles.entryRowPressed]}
                >
                  <View style={styles.entryCopy}>
                    <Text style={styles.entryLabel}>{entry.label}</Text>
                    <Text style={styles.entryDescription}>{entry.description}</Text>
                  </View>
                  <ArrowRight color={colors.dark.primary.value} size={16} strokeWidth={1.8} />
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const shellColors = {
  cardGlass: "rgba(20, 23, 43, 0.62)",
  borderSilk: "rgba(238, 240, 255, 0.08)",
  textPrimary: "#E8E6F2",
} as const;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.bottomNavigationHeight + spacing.xl,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: shellColors.textPrimary,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 22,
    letterSpacing: 0,
    lineHeight: 28,
  },
  description: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: typography.scale.body.size,
    lineHeight: 22,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: shellColors.textPrimary,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: typography.scale.bodyLarge.size,
    letterSpacing: 0,
    lineHeight: 22,
  },
  entryList: {
    gap: spacing.xs,
  },
  entryRow: {
    alignItems: "center",
    backgroundColor: shellColors.cardGlass,
    borderColor: shellColors.borderSilk,
    borderRadius: radii.card,
    borderWidth: 1,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.08)",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 58,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    transform: [{ scale: 1 }],
  },
  entryRowPressed: {
    transform: [{ scale: 0.96 }],
  },
  entryCopy: {
    flex: 1,
    gap: 2,
  },
  entryLabel: {
    color: shellColors.textPrimary,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: typography.scale.body.size,
    lineHeight: 20,
  },
  entryDescription: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: typography.scale.caption.size,
    lineHeight: 17,
  },
});
