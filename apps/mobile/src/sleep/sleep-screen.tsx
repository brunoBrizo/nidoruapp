import { colors, spacing, typography } from "@nidoru/ui-tokens";
import { Link, type Href } from "expo-router";
import {
  AudioLines,
  BookOpen,
  ChevronRight,
  CloudRain,
  Flame,
  Play,
  Timer,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CardFade } from "../surfaces/card-fade";

type MixerLayer = {
  readonly label: string;
  readonly volume: 70 | 55 | 35;
  readonly Icon: LucideIcon;
};

type QuickSound = {
  readonly label: string;
  readonly Icon: LucideIcon;
};

const sleepRoutes = {
  sounds: "/sleep/sounds",
  stories: "/sleep/stories",
  windDown: "/sleep/wind-down",
} as const satisfies Record<string, Href>;

const mixerLayers = [
  { label: "Rain", volume: 70, Icon: CloudRain },
  { label: "Brown noise", volume: 55, Icon: AudioLines },
  { label: "Fireplace", volume: 35, Icon: Flame },
] as const satisfies readonly MixerLayer[];

const quickSounds = [
  { label: "Rain", Icon: CloudRain },
  { label: "Ocean", Icon: Waves },
  { label: "Fan", Icon: Wind },
] as const satisfies readonly QuickSound[];

export function SleepScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" selectable style={styles.title}>
          Sleep
        </Text>
        <Text selectable style={styles.subtitle}>
          Settle into tonight.
        </Text>
      </View>

      <View style={styles.primaryCard}>
        <CardFade testID="sleep-primary-card-fade" variant="sleep-primary" />
        <View style={styles.primaryCopy}>
          <Text selectable style={styles.primaryTitle}>
            Evening Wind-Down
          </Text>
          <Text selectable style={styles.primarySubtitle}>
            4-7-8 breath · body relax · sleep sounds
          </Text>
        </View>

        <Link asChild href={sleepRoutes.windDown}>
          <Pressable accessibilityHint="Opens the Evening Wind-Down flow." accessibilityRole="link">
            {({ pressed }) => (
              <View style={[styles.primaryButton, pressed ? styles.pressed : null]}>
                <View style={styles.primaryButtonContent}>
                  <Play color={colors.dark.textPrimary.value} size={17} strokeWidth={1.7} />
                  <Text style={styles.primaryButtonText}>Start wind-down</Text>
                </View>
              </View>
            )}
          </Pressable>
        </Link>
      </View>

      <Link asChild href={sleepRoutes.sounds}>
        <Pressable
          accessibilityHint="Opens the Sound Mixer anchor."
          accessibilityLabel="Sound Mixer"
          accessibilityRole="link"
        >
          {({ pressed }) => (
            <View style={[styles.mixerCard, pressed ? styles.cardPressed : null]}>
              <View style={styles.cardHeadingRow}>
                <View style={styles.cardTitleGroup}>
                  <Text selectable style={styles.cardTitle}>
                    Sound Mixer
                  </Text>
                  <Text selectable style={styles.cardDescription}>
                    Layer sounds for sleep.
                  </Text>
                </View>
                <View style={styles.cardMetaGroup}>
                  <View style={styles.timerPill}>
                    <Timer color={colors.dark.textTertiary.value} size={12} strokeWidth={1.7} />
                    <Text selectable style={styles.timerText}>
                      30 min
                    </Text>
                  </View>
                  <ChevronRight
                    color={colors.dark.textTertiary.value}
                    size={20}
                    strokeWidth={1.6}
                  />
                </View>
              </View>

              <View style={styles.layerList}>
                {mixerLayers.map((layer) => (
                  <MixerLayerRow key={layer.label} layer={layer} />
                ))}
              </View>
            </View>
          )}
        </Pressable>
      </Link>

      <View style={styles.quickSoundRow}>
        {quickSounds.map((sound) => {
          const Icon = sound.Icon;

          return (
            <Link asChild href={sleepRoutes.sounds} key={sound.label}>
              <Pressable
                accessibilityHint="Opens the Sound Mixer anchor."
                accessibilityLabel={`${sound.label} quick sound`}
                accessibilityRole="link"
              >
                {({ pressed }) => (
                  <View style={[styles.quickSound, pressed ? styles.pressed : null]}>
                    <Icon color={colors.dark.textSecondary.value} size={17} strokeWidth={1.7} />
                    <Text style={styles.quickSoundText}>{sound.label}</Text>
                  </View>
                )}
              </Pressable>
            </Link>
          );
        })}
      </View>

      <Link asChild href={sleepRoutes.stories}>
        <Pressable
          accessibilityHint="Opens the Sleep Stories anchor."
          accessibilityLabel="Sleep Stories"
          accessibilityRole="link"
        >
          {({ pressed }) => (
            <View style={[styles.storyCard, pressed ? styles.cardPressed : null]}>
              <View style={styles.cardHeadingRow}>
                <View style={styles.cardTitleGroup}>
                  <Text selectable style={styles.cardTitle}>
                    Sleep Stories
                  </Text>
                  <Text selectable style={styles.cardDescription}>
                    Quiet narration for restless thoughts.
                  </Text>
                </View>
                <ChevronRight color={colors.dark.textTertiary.value} size={20} strokeWidth={1.6} />
              </View>

              <View style={styles.storyPreview}>
                <View style={styles.storyIconSurface}>
                  <BookOpen color={colors.dark.accent.value} size={18} strokeWidth={1.7} />
                </View>
                <View style={styles.storyCopy}>
                  <Text selectable style={styles.storyTitle}>
                    The Quiet Shoreline
                  </Text>
                  <Text selectable style={styles.storyMeta}>
                    45 min
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </Link>
    </ScrollView>
  );
}

function MixerLayerRow({ layer }: { readonly layer: MixerLayer }) {
  const Icon = layer.Icon;

  return (
    <View style={styles.layerRow}>
      <View style={styles.layerNameGroup}>
        <Icon color={colors.dark.textSecondary.value} size={17} strokeWidth={1.6} />
        <Text selectable style={styles.layerLabel}>
          {layer.label}
        </Text>
      </View>
      <View style={styles.layerMeterGroup}>
        <Text selectable style={styles.layerPercent}>
          {layer.volume}%
        </Text>
        <View style={styles.layerTrack}>
          <View style={[styles.layerFill, { width: `${layer.volume}%` }]} />
        </View>
      </View>
    </View>
  );
}

const sleepColors = {
  cardBorder: "rgba(30, 34, 54, 0.72)",
  cardInset: "inset 0 1px 0 rgba(238, 240, 255, 0.05)",
  cardShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.04), 0 12px 28px rgba(0, 0, 0, 0.18)",
  elevatedCardShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.06), 0 8px 32px rgba(15, 18, 48, 0.6)",
} as const;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
  },
  content: {
    gap: 18,
    paddingBottom: spacing.bottomNavigationHeight + spacing.md,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl + spacing.xs,
  },
  header: {
    gap: 4,
    paddingTop: 2,
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
  primaryCard: {
    backgroundColor: colors.dark.surfaceRaised.value,
    borderRadius: 24,
    boxShadow: sleepColors.elevatedCardShadow,
    gap: 18,
    minHeight: 128,
    overflow: "hidden",
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: 18,
    position: "relative",
  },
  primaryCopy: {
    gap: 4,
  },
  primaryTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: typography.scale.bodyLarge.size,
    letterSpacing: 0,
    lineHeight: 22,
  },
  primarySubtitle: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.dark.primary.value,
    borderRadius: 16,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.2)",
    justifyContent: "center",
    minHeight: 44,
    transform: [{ scale: 1 }],
  },
  primaryButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  mixerCard: {
    backgroundColor: colors.dark.surface.value,
    borderColor: sleepColors.cardBorder,
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: sleepColors.cardInset,
    gap: 17,
    minHeight: 168,
    padding: spacing.sm,
    transform: [{ scale: 1 }],
  },
  storyCard: {
    backgroundColor: colors.dark.surface.value,
    borderColor: sleepColors.cardBorder,
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: sleepColors.cardInset,
    gap: 14,
    minHeight: 136,
    padding: spacing.sm,
    transform: [{ scale: 1 }],
  },
  cardPressed: {
    backgroundColor: "rgba(20, 23, 43, 0.82)",
    transform: [{ scale: 0.98 }],
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  cardHeadingRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between",
  },
  cardTitleGroup: {
    flex: 1,
    gap: 3,
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
  cardMetaGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  timerPill: {
    alignItems: "center",
    backgroundColor: "rgba(13, 15, 26, 0.8)",
    borderColor: colors.dark.divider.value,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 26,
    paddingHorizontal: 10,
  },
  timerText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    lineHeight: 16,
  },
  layerList: {
    gap: 11,
    paddingTop: 2,
  },
  layerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between",
    minHeight: 20,
  },
  layerNameGroup: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minWidth: 0,
  },
  layerLabel: {
    color: colors.dark.textPrimary.value,
    flexShrink: 1,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  layerMeterGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  layerPercent: {
    color: colors.dark.textTertiary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    lineHeight: 16,
    minWidth: 30,
    textAlign: "right",
  },
  layerTrack: {
    backgroundColor: colors.dark.divider.value,
    borderRadius: 9999,
    height: 5,
    overflow: "hidden",
    width: 36,
  },
  layerFill: {
    backgroundColor: colors.dark.primaryGlow.value,
    borderRadius: 9999,
    height: 5,
  },
  quickSoundRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickSound: {
    alignItems: "center",
    backgroundColor: colors.dark.surface.value,
    borderColor: sleepColors.cardBorder,
    borderRadius: 16,
    borderWidth: 1,
    boxShadow: sleepColors.cardShadow,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 66,
    paddingHorizontal: 16,
    transform: [{ scale: 1 }],
  },
  quickSoundText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  storyPreview: {
    alignItems: "center",
    backgroundColor: "rgba(13, 15, 26, 0.6)",
    borderColor: "rgba(30, 34, 54, 0.5)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 52,
    padding: 10,
  },
  storyIconSurface: {
    alignItems: "center",
    backgroundColor: colors.dark.surfaceRaised.value,
    borderColor: "rgba(30, 34, 54, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.05)",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  storyCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  storyTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  storyMeta: {
    color: colors.dark.textTertiary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    lineHeight: 16,
  },
});
