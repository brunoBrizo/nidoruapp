import type { Href } from "expo-router";
import type { ReactNode } from "react";
import {
  AudioLines,
  Bell,
  ChevronRight,
  HandHeart,
  History,
  Leaf,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react-native";

import { CardFade } from "../surfaces/card-fade";
import { Link, Pressable, ScrollView, Text, View, cn } from "../tw";

type ProfileRow = {
  readonly id: string;
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
    id: "settings",
    title: "Settings",
    description: "Account and app preferences.",
    href: profileRoutes.settings,
    Icon: Settings,
    accessibilityHint: "Opens account and app preferences.",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Evening reminders, milestones, no pressure.",
    href: profileRoutes.notifications,
    Icon: Bell,
    status: "Quiet",
    accessibilityHint: "Opens notification preferences. Current state: Quiet.",
  },
  {
    id: "sound-preferences",
    title: "Sound preferences",
    description: "Voice, haptics, and sleep sounds.",
    href: profileRoutes.soundPreferences,
    Icon: AudioLines,
    accessibilityHint: "Opens voice, haptics, and sleep sound preferences.",
  },
  {
    id: "support",
    title: "Support",
    description: "Get help from a real person.",
    href: profileRoutes.support,
    Icon: HandHeart,
    accessibilityHint: "Opens support options.",
  },
  {
    id: "privacy",
    title: "Privacy",
    description: "Data, permissions, and local history.",
    href: profileRoutes.privacy,
    Icon: Shield,
    accessibilityHint: "Opens privacy, permissions, and local history controls.",
  },
] as const satisfies readonly ProfileRow[];

const profileCardClassName =
  "relative w-full rounded-[20px] border border-[#1E2236]/80 bg-[#14172B] p-4 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(168,156,224,0.15)] active:scale-[0.96] active:bg-[#1C2040]/80 transition-transform duration-200 ease-nidoru-out";

const subscriptionRowClassName =
  "min-h-[64px] rounded-[20px] border border-[#1E2236]/60 bg-[#14172B] w-full flex-row items-center justify-between gap-4 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] active:scale-[0.96] active:bg-[#1C2040]/80 transition-transform duration-200 ease-nidoru-out";

const settingsRowClassName =
  "min-h-[74px] rounded-[20px] border border-[#1E2236]/60 bg-[#14172B] w-full flex-row items-center gap-4 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] active:scale-[0.96] active:bg-[#1C2040]/80 transition-transform duration-200 ease-nidoru-out";

const pressedSurfaceClassName = "scale-[0.96] bg-[#1C2040]/80";
const chevronColor = "#4A4E6A";
const iconColor = "#8A8FA8";

export function ProfileScreen() {
  return (
    <ScrollView
      className="flex-1 bg-nidoru-dark-background"
      contentContainerClassName="gap-6 px-5 pt-8 pb-[112px]"
      contentInsetAdjustmentBehavior="automatic"
      testID="profile-screen"
    >
      <ProfileLinkSurface
        accessibilityHint="Opens profile details and app preferences."
        accessibilityLabel="Profile details"
        baseClassName={profileCardClassName}
        href={profileRoutes.settings}
        testID="profile-card"
      >
        <CardFade testID="profile-card-fade" variant="profile" />
        <View className="relative z-10 gap-4">
          <View className="min-h-[52px] flex-row items-center gap-4">
            <View
              className="h-[52px] w-[52px] rounded-full border border-[#1E2236] bg-gradient-to-b from-[#1C2040] to-[#14172B] items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              testID="profile-avatar"
            >
              <Text
                className="font-nidoru-primary-semibold text-[20px] leading-[26px] text-[#EEF0FF]"
                selectable
              >
                B
              </Text>
            </View>

            <View className="min-w-0 flex-1 justify-center gap-1">
              <Text
                className="font-nidoru-primary-semibold text-[18px] leading-[22px] text-[#EEF0FF]"
                selectable
              >
                Bruno
              </Text>
              <Text
                className="font-nidoru-primary-regular text-[13px] leading-[17px] text-[#8A8FA8]"
                selectable
              >
                Nidoru member
              </Text>
            </View>

            <View className="-mr-2 h-10 w-10 items-center justify-center">
              <ChevronRight color={chevronColor} size={20} strokeWidth={1.7} />
            </View>
          </View>

          <View className="flex-row flex-wrap items-center gap-2">
            <ProfileChip
              Icon={History}
              iconColor="#5EC4D4"
              label="8-day rhythm"
              testID="profile-rhythm-chip"
            />
            <ProfileChip
              Icon={Leaf}
              iconColor="#A89CE0"
              label="48 min breath time"
              testID="profile-breath-time-chip"
            />
          </View>
        </View>
      </ProfileLinkSurface>

      <View className="pt-2">
        <ProfileLinkSurface
          accessibilityHint="Opens subscription plan, renewal, and cancellation options."
          accessibilityLabel="Subscription"
          baseClassName={subscriptionRowClassName}
          href={profileRoutes.subscription}
          testID="profile-subscription-row"
        >
          <View className="min-w-0 flex-1 gap-1">
            <ProfileRowTitle>Subscription</ProfileRowTitle>
            <ProfileRowDescription>Plan, renewal, cancellation.</ProfileRowDescription>
          </View>
          <ProfileAccessory label="Manage" />
        </ProfileLinkSurface>
      </View>

      <View className="gap-2">
        {profileRows.slice(0, 3).map((row) => (
          <ProfileListRow key={row.id} row={row} />
        ))}
      </View>

      <View className="gap-2">
        {profileRows.slice(3).map((row) => (
          <ProfileListRow key={row.id} row={row} />
        ))}
      </View>
    </ScrollView>
  );
}

type ProfileLinkSurfaceProps = {
  readonly accessibilityHint: string;
  readonly accessibilityLabel: string;
  readonly baseClassName: string;
  readonly children: ReactNode;
  readonly href: Href;
  readonly testID: string;
};

function ProfileLinkSurface({
  accessibilityHint,
  accessibilityLabel,
  baseClassName,
  children,
  href,
  testID,
}: ProfileLinkSurfaceProps) {
  return (
    <Link asChild href={href}>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="link"
      >
        {({ pressed }) => (
          <View
            className={cn(baseClassName, pressed ? pressedSurfaceClassName : null)}
            testID={testID}
          >
            {children}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function ProfileChip({
  Icon,
  iconColor,
  label,
  testID,
}: {
  readonly Icon: LucideIcon;
  readonly iconColor: string;
  readonly label: string;
  readonly testID: string;
}) {
  return (
    <View
      className="min-h-[32px] flex-row items-center gap-1.5 rounded-[12px] border border-[#1E2236]/50 bg-[#0D0F1A]/50 px-3 py-2"
      testID={testID}
    >
      <Icon color={iconColor} size={14} strokeWidth={1.7} />
      <Text
        className="font-nidoru-data-regular text-xs leading-4 text-[#8A8FA8] tabular-nums"
        selectable
      >
        {label}
      </Text>
    </View>
  );
}

function ProfileListRow({ row }: { readonly row: ProfileRow }) {
  const Icon = row.Icon;

  return (
    <ProfileLinkSurface
      accessibilityHint={row.accessibilityHint}
      accessibilityLabel={row.title}
      baseClassName={settingsRowClassName}
      href={row.href}
      testID={`profile-list-row-${row.id}`}
    >
      <View
        className="h-10 w-10 rounded-[12px] border border-[#1E2236]/50 bg-[#0D0F1A]/60 items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
        testID={`profile-list-row-icon-${row.id}`}
      >
        <Icon color={iconColor} size={22} strokeWidth={1.7} />
      </View>
      <View className="min-w-0 flex-1 justify-center gap-1">
        <ProfileRowTitle>{row.title}</ProfileRowTitle>
        <ProfileRowDescription>{row.description}</ProfileRowDescription>
      </View>
      <ProfileAccessory label={row.status} />
    </ProfileLinkSurface>
  );
}

function ProfileRowTitle({ children }: { readonly children: ReactNode }) {
  return (
    <Text className="font-nidoru-primary-semibold text-[15px] leading-5 text-[#EEF0FF]" selectable>
      {children}
    </Text>
  );
}

function ProfileRowDescription({ children }: { readonly children: ReactNode }) {
  return (
    <Text
      className="font-nidoru-primary-regular text-[13px] leading-[18px] text-[#8A8FA8]"
      selectable
    >
      {children}
    </Text>
  );
}

function ProfileAccessory({ label }: { readonly label?: string | undefined }) {
  return (
    <View className="shrink-0 flex-row items-center gap-2">
      {label ? (
        <Text
          className="font-nidoru-data-regular text-[13px] leading-[18px] text-[#8A8FA8]"
          selectable
        >
          {label}
        </Text>
      ) : null}
      <ChevronRight color={chevronColor} size={20} strokeWidth={1.7} />
    </View>
  );
}
