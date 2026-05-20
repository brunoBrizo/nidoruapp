import { colors, spacing, typography } from "@nidoru/ui-tokens";
import { ScrollView, StyleSheet, Text } from "react-native";

type TabPlaceholderScreenProps = {
  readonly title: string;
  readonly description: string;
};

export function TabPlaceholderScreen({ title, description }: TabPlaceholderScreenProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text accessibilityRole="header" selectable style={styles.title}>
        {title}
      </Text>
      <Text selectable style={styles.description}>
        {description}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl,
  },
  title: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.bold,
    fontSize: typography.scale.h1.size,
    letterSpacing: 0,
    lineHeight: 30,
  },
  description: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: typography.scale.body.size,
    lineHeight: 22,
  },
});
