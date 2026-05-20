import { colors, spacing, typography } from "@nidoru/ui-tokens";
import { ChartColumn, House, Moon, User, Wind, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { appShellTabs, type AppShellTabId } from "../home/home-actions";
import { useReduceMotionEnabled } from "../motion/use-reduce-motion-enabled";

const routeNameByTabId: Record<AppShellTabId, string> = {
  home: "index",
  sleep: "sleep",
  breathe: "breathe",
  progress: "progress",
  profile: "profile",
};

const iconByTabId: Record<AppShellTabId, LucideIcon> = {
  home: House,
  sleep: Moon,
  breathe: Wind,
  progress: ChartColumn,
  profile: User,
};

const inactiveTabColor = "#A0A5C0";
const activeIndicatorWidth = 22;

export const TAB_ACTIVE_INDICATOR_MOTION = {
  durationMs: 250,
  easing: "ease-in-out",
} as const;

export const getTabIndicatorMotionConfig = (reduceMotionEnabled: boolean) => ({
  durationMs: reduceMotionEnabled ? 0 : TAB_ACTIVE_INDICATOR_MOTION.durationMs,
  easing: TAB_ACTIVE_INDICATOR_MOTION.easing,
});

type AppTabBarRoute = {
  readonly key: string;
  readonly name: string;
};

type AppTabBarDescriptor = {
  readonly options?: {
    readonly tabBarAccessibilityLabel?: string;
  };
};

export type AppTabBarProps = {
  readonly state: {
    readonly index: number;
    readonly routes: readonly AppTabBarRoute[];
  };
  readonly descriptors: Record<string, AppTabBarDescriptor>;
  readonly navigation: {
    readonly emit: (event: {
      readonly type: "tabPress" | "tabLongPress";
      readonly target: string;
      readonly canPreventDefault?: boolean;
    }) => unknown;
    readonly navigate: (routeName: string) => void;
  };
};

const isDefaultPrevented = (event: unknown) =>
  typeof event === "object" &&
  event !== null &&
  "defaultPrevented" in event &&
  event.defaultPrevented === true;

export function AppTabBar({ state, descriptors, navigation }: AppTabBarProps) {
  const activeRoute = state.routes[state.index];
  const activeTabIndex = Math.max(
    0,
    appShellTabs.findIndex((tab) => {
      const routeName = routeNameByTabId[tab.id];
      const route = state.routes.find((candidate) => candidate.name === routeName);

      return activeRoute?.key === route?.key;
    }),
  );
  const reduceMotionEnabled = useReduceMotionEnabled();
  const indicatorPosition = useRef(new Animated.Value(activeTabIndex)).current;
  const [surfaceWidth, setSurfaceWidth] = useState(0);
  const tabWidth = surfaceWidth / appShellTabs.length;
  const motionConfig = getTabIndicatorMotionConfig(reduceMotionEnabled);
  const indicatorTranslateX = indicatorPosition.interpolate({
    inputRange: [0, appShellTabs.length - 1],
    outputRange: [0, tabWidth * (appShellTabs.length - 1)],
    extrapolate: "clamp",
  });

  useEffect(() => {
    Animated.timing(indicatorPosition, {
      duration: motionConfig.durationMs,
      easing: Easing.inOut(Easing.ease),
      toValue: activeTabIndex,
      useNativeDriver: true,
    }).start();
  }, [activeTabIndex, indicatorPosition, motionConfig.durationMs]);

  return (
    <View style={styles.container}>
      <View
        onLayout={(event) => {
          setSurfaceWidth(event.nativeEvent.layout.width);
        }}
        style={styles.surface}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeIndicator,
            {
              left: tabWidth > 0 ? tabWidth / 2 - activeIndicatorWidth / 2 : 0,
              opacity: tabWidth > 0 ? 1 : 0,
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
          testID="tab-active-indicator"
        />
        {appShellTabs.map((tab) => {
          const routeName = routeNameByTabId[tab.id];
          const route = state.routes.find((candidate) => candidate.name === routeName);

          if (!route) {
            return null;
          }

          const isFocused = activeRoute?.key === route.key;
          const Icon = iconByTabId[tab.id];
          const itemColor = isFocused ? colors.dark.primary.value : inactiveTabColor;
          const accessibilityLabel =
            descriptors[route.key]?.options?.tabBarAccessibilityLabel ?? `${tab.label} tab`;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !isDefaultPrevented(event)) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              key={tab.id}
              onLongPress={onLongPress}
              onPress={onPress}
              style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}
            >
              <Icon color={itemColor} size={24} strokeWidth={1.7} />
              <Text style={[styles.tabLabel, isFocused && styles.activeTabLabel]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.homeIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(13, 15, 26, 0.92)",
    borderTopColor: colors.dark.surfaceRaised.value,
    borderTopWidth: 1,
    boxShadow: "0 -12px 32px rgba(13, 15, 26, 0.72)",
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingTop: 10,
  },
  surface: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "relative",
  },
  tabItem: {
    alignItems: "center",
    gap: 4,
    minHeight: 56,
    minWidth: 64,
    paddingBottom: spacing.xs,
    paddingTop: 10,
    transform: [{ scale: 1 }],
  },
  tabItemPressed: {
    transform: [{ scale: 0.96 }],
  },
  activeIndicator: {
    backgroundColor: colors.dark.primary.value,
    borderRadius: 9999,
    height: 3,
    position: "absolute",
    top: 0,
    width: activeIndicatorWidth,
  },
  tabLabel: {
    color: inactiveTabColor,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 12,
    letterSpacing: 0,
    lineHeight: 16,
  },
  activeTabLabel: {
    color: colors.dark.primary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
  },
  homeIndicator: {
    alignSelf: "center",
    backgroundColor: "rgba(238, 240, 255, 0.2)",
    borderRadius: 9999,
    height: 4,
    marginTop: 2,
    width: 120,
  },
});
