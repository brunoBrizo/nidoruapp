import { colors, radii, spacing, typography } from "@nidoru/ui-tokens";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const midnightIndigoPalette = [
  {
    role: "Background",
    hex: colors.dark.background.value,
    description: colors.dark.background.description,
  },
  {
    role: "Surface",
    hex: colors.dark.surface.value,
    description: colors.dark.surface.description,
  },
  {
    role: "Surface raised",
    hex: colors.dark.surfaceRaised.value,
    description: colors.dark.surfaceRaised.description,
  },
  {
    role: "Primary",
    hex: colors.dark.primary.value,
    description: colors.dark.primary.description,
  },
  {
    role: "Primary glow",
    hex: colors.dark.primaryGlow.value,
    description: colors.dark.primaryGlow.description,
  },
  { role: "Accent", hex: colors.dark.accent.value, description: colors.dark.accent.description },
  {
    role: "Accent warm",
    hex: colors.dark.accentWarm.value,
    description: colors.dark.accentWarm.description,
  },
  {
    role: "Text primary",
    hex: colors.dark.textPrimary.value,
    description: colors.dark.textPrimary.description,
  },
  {
    role: "Text secondary",
    hex: colors.dark.textSecondary.value,
    description: colors.dark.textSecondary.description,
  },
  {
    role: "Text tertiary",
    hex: colors.dark.textTertiary.value,
    description: colors.dark.textTertiary.description,
  },
  { role: "Danger", hex: colors.dark.danger.value, description: colors.dark.danger.description },
  {
    role: "Divider",
    hex: colors.dark.divider.value,
    description: colors.dark.divider.description,
  },
] as const;

const tokenName = (description: string) => description.split(":")[0] ?? description;

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text style={styles.kicker} selectable>
          Technical proof screen
        </Text>
        <Text style={styles.title} selectable>
          Mobile design foundation
        </Text>
        <Text style={styles.body} selectable>
          Fonts, spacing, radius, and color values are rendered from @nidoru/ui-tokens.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} selectable>
          Font assets
        </Text>
        <View style={styles.surface}>
          <View style={styles.typeRow}>
            <Text style={styles.typeLabel} selectable>
              Nunito 800
            </Text>
            <Text style={styles.nunitoSample} selectable>
              Rounded sleep typography
            </Text>
          </View>
          <View style={styles.typeRow}>
            <Text style={styles.typeLabel} selectable>
              Inter 300
            </Text>
            <Text style={styles.interSample} selectable>
              08:00
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} selectable>
          Midnight Indigo palette
        </Text>
        <View style={styles.paletteGrid}>
          {midnightIndigoPalette.map((item) => (
            <View key={item.role} style={styles.swatchCard}>
              <View style={[styles.swatch, { backgroundColor: item.hex }]} />
              <View style={styles.swatchCopy}>
                <Text style={styles.swatchRole} selectable>
                  {item.role}
                </Text>
                <Text style={styles.swatchName} selectable>
                  {tokenName(item.description)}
                </Text>
                <Text style={styles.swatchValue} selectable>
                  {item.hex}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark.background.value,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  surface: {
    backgroundColor: colors.dark.surface.value,
    borderColor: colors.dark.divider.value,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.sm,
  },
  paletteGrid: {
    gap: spacing.sm,
  },
  swatchCard: {
    alignItems: "center",
    backgroundColor: colors.dark.surface.value,
    borderColor: colors.dark.divider.value,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  swatch: {
    borderColor: colors.dark.divider.value,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    width: 48,
  },
  swatchCopy: {
    flex: 1,
    gap: 2,
  },
  typeRow: {
    gap: spacing.xs,
  },
  kicker: {
    color: colors.dark.accent.value,
    fontFamily: typography.mobileFontFamily.primary.bold,
    fontSize: typography.scale.label.size,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.extraBold,
    fontSize: typography.scale.display.size,
    letterSpacing: 0,
    lineHeight: 38,
  },
  body: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: typography.scale.bodyLarge.size,
    lineHeight: 24,
  },
  sectionTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: typography.scale.h2.size,
    letterSpacing: 0,
    lineHeight: 26,
  },
  typeLabel: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: typography.scale.label.size,
    letterSpacing: 0,
  },
  nunitoSample: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.extraBold,
    fontSize: typography.scale.h1.size,
    letterSpacing: 0,
    lineHeight: 30,
  },
  interSample: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.data.light,
    fontSize: typography.scale.timer.size,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0,
    lineHeight: 58,
  },
  swatchRole: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: typography.scale.bodyLarge.size,
    letterSpacing: 0,
  },
  swatchName: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: typography.scale.body.size,
    lineHeight: 20,
  },
  swatchValue: {
    color: colors.dark.textTertiary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: typography.scale.caption.size,
    lineHeight: 18,
  },
});
