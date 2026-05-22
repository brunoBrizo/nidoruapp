import { colors, radii, spacing, typography } from "@nidoru/ui-tokens";
import { Link, type Href } from "expo-router";
import {
  AudioLines,
  Bell,
  ChevronRight,
  History,
  Leaf,
  LifeBuoy,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CardFade } from "../surfaces/card-fade";

type ProfileRow = {
  readonly title: string;
  readonly description: string;
  readonly href: Href;
  readonly Icon: LucideIcon;
  readonly status?: string;
  readonly accessibilityHint: string;
};

const profileRoutes = {
  settings: "/profile/settings",
  subscription: "/profile/subscription",
  notifications: "/profile/notifications",
  soundPreferences: "/profile/sound-preferences",
  support: "/profile/support",
  privacy: "/profile/privacy",
} as const satisfies Record<string, Href>;

const profileRows = [
  {
    title: "Settings",
    description: "Account and app preferences.",
    href: profileRoutes.settings,
    Icon: Settings,
    accessibilityHint: "Opens account and app preferences.",
  },
  {
    title: "Notifications",
    description: "Evening reminders, milestones, no pressure.",
    href: profileRoutes.notifications,
    Icon: Bell,
    status: "Quiet",
    accessibilityHint: "Opens notification preferences. Current state: Quiet.",
  },
  {
    title: "Sound preferences",
    description: "Voice, haptics, and sleep sounds.",
    href: profileRoutes.soundPreferences,
    Icon: AudioLines,
    accessibilityHint: "Opens voice, haptics, and sleep sound preferences.",
  },
  {
    title: "Support",
    description: "Get help from a real person.",
    href: profileRoutes.support,
    Icon: LifeBuoy,
    accessibilityHint: "Opens support options.",
  },
  {
    title: "Privacy",
    description: "Data, permissions, and local history.",
    href: profileRoutes.privacy,
    Icon: ShieldCheck,
    accessibilityHint: "Opens privacy, permissions, and local history controls.",
  },
] as const satisfies readonly ProfileRow[];

export function ProfileScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Link asChild href={profileRoutes.settings}>
        <Pressable
          accessibilityHint="Opens profile details and app preferences."
          accessibilityLabel="Profile details"
          accessibilityRole="link"
        >
          {({ pressed }) => (
            <View style={[styles.profileCard, pressed ? styles.cardPressed : null]}>
              <CardFade testID="profile-card-fade" variant="profile" />
              <View style={styles.profileTopRow}>
                <View style={styles.avatar}>
                  <Text selectable style={styles.avatarInitial}>
                    B
                  </Text>
                </View>
                <View style={styles.profileCopy}>
                  <Text selectable style={styles.profileName}>
                    Bruno
                  </Text>
                  <Text selectable style={styles.profileMeta}>
                    Nidoru member
                  </Text>
                </View>
                <ChevronRight color={profileColors.chevron} size={20} strokeWidth={1.7} />
              </View>

              <View style={styles.chipRow}>
                <ProfileChip
                  Icon={History}
                  iconColor={colors.dark.accent.value}
                  label="8-day rhythm"
                />
                <ProfileChip
                  Icon={Leaf}
                  iconColor={colors.dark.primaryGlow.value}
                  label="48 min breath time"
                />
              </View>
            </View>
          )}
        </Pressable>
      </Link>

      <Link asChild href={profileRoutes.subscription}>
        <Pressable
          accessibilityHint="Opens subscription plan, renewal, and cancellation options."
          accessibilityLabel="Subscription"
          accessibilityRole="link"
        >
          {({ pressed }) => (
            <View style={[styles.subscriptionCard, pressed ? styles.cardPressed : null]}>
              <View style={styles.subscriptionCopy}>
                <Text selectable style={styles.rowTitle}>
                  Subscription
                </Text>
                <Text selectable style={styles.rowDescription}>
                  Plan, renewal, cancellation.
                </Text>
              </View>
              <View style={styles.rowAccessory}>
                <Text selectable style={styles.accessoryText}>
                  Manage
                </Text>
                <ChevronRight color={profileColors.chevron} size={20} strokeWidth={1.7} />
              </View>
            </View>
          )}
        </Pressable>
      </Link>

      <View style={styles.rowGroup}>
        {profileRows.slice(0, 3).map((row) => (
          <ProfileListRow key={row.title} row={row} />
        ))}
      </View>

      <View style={styles.rowGroup}>
        {profileRows.slice(3).map((row) => (
          <ProfileListRow key={row.title} row={row} />
        ))}
      </View>
    </ScrollView>
  );
}

function ProfileChip({
  Icon,
  iconColor,
  label,
}: {
  readonly Icon: LucideIcon;
  readonly iconColor: string;
  readonly label: string;
}) {
  return (
    <View style={styles.chip}>
      <Icon color={iconColor} size={14} strokeWidth={1.7} />
      <Text selectable style={styles.chipText}>
        {label}
      </Text>
    </View>
  );
}

function ProfileListRow({ row }: { readonly row: ProfileRow }) {
  const Icon = row.Icon;

  return (
    <Link asChild href={row.href}>
      <Pressable
        accessibilityHint={row.accessibilityHint}
        accessibilityLabel={row.title}
        accessibilityRole="link"
      >
        {({ pressed }) => (
          <View style={[styles.listRow, pressed ? styles.cardPressed : null]}>
            <View style={styles.iconSurface}>
              <Icon color={colors.dark.textSecondary.value} size={21} strokeWidth={1.7} />
            </View>
            <View style={styles.rowCopy}>
              <Text selectable style={styles.rowTitle}>
                {row.title}
              </Text>
              <Text selectable style={styles.rowDescription}>
                {row.description}
              </Text>
            </View>
            <View style={styles.rowAccessory}>
              {row.status ? (
                <Text selectable style={styles.accessoryText}>
                  {row.status}
                </Text>
              ) : null}
              <ChevronRight color={profileColors.chevron} size={20} strokeWidth={1.7} />
            </View>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const profileColors = {
  card: colors.dark.surface.value,
  cardPressed: "rgba(28, 32, 64, 0.82)",
  border: "rgba(30, 34, 54, 0.72)",
  subtleBorder: "rgba(30, 34, 54, 0.5)",
  chipBackground: "rgba(13, 15, 26, 0.5)",
  iconSurface: "rgba(13, 15, 26, 0.6)",
  chevron: colors.dark.textTertiary.value,
} as const;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.bottomNavigationHeight + spacing.lg,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
  },
  profileCard: {
    backgroundColor: profileColors.card,
    borderColor: profileColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(168, 156, 224, 0.15)",
    gap: spacing.sm,
    minHeight: 120,
    overflow: "hidden",
    padding: spacing.sm,
    transform: [{ scale: 1 }],
  },
  profileTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.dark.surfaceRaised.value,
    borderColor: profileColors.border,
    borderRadius: 26,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  avatarInitial: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
  profileName: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 18,
    letterSpacing: 0,
    lineHeight: 22,
  },
  profileMeta: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    lineHeight: 17,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    alignItems: "center",
    backgroundColor: profileColors.chipBackground,
    borderColor: profileColors.subtleBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 12,
  },
  chipText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    lineHeight: 16,
  },
  subscriptionCard: {
    alignItems: "center",
    backgroundColor: profileColors.card,
    borderColor: profileColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.02)",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 64,
    padding: spacing.sm,
    transform: [{ scale: 1 }],
  },
  subscriptionCopy: {
    flex: 1,
    gap: 2,
  },
  rowGroup: {
    gap: spacing.xs,
  },
  listRow: {
    alignItems: "center",
    backgroundColor: profileColors.card,
    borderColor: profileColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.02)",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 74,
    padding: spacing.sm,
    transform: [{ scale: 1 }],
  },
  cardPressed: {
    backgroundColor: profileColors.cardPressed,
    transform: [{ scale: 0.96 }],
  },
  iconSurface: {
    alignItems: "center",
    backgroundColor: profileColors.iconSurface,
    borderColor: profileColors.subtleBorder,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
  rowTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 20,
  },
  rowDescription: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  rowAccessory: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  accessoryText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
