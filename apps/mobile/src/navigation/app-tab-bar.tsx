import { usePathname } from "expo-router";
import { ChartColumn, House, Moon, UserRound, Wind, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

import {
  GLOBAL_TAB_ACTIVE_INDICATOR_WIDTH,
  GlobalTabBarActiveIndicator,
  GlobalTabBarItem,
  GlobalTabBarSurface,
} from "../design-system";
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
  profile: UserRound,
};

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
  const pathname = usePathname();
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

  if (
    pathname.startsWith("/breathe/") ||
    pathname.startsWith("/rescue-me") ||
    pathname.startsWith("/sleep/wind-down")
  ) {
    return null;
  }

  return (
    <GlobalTabBarSurface
      onLayout={(event) => {
        setSurfaceWidth(event.nativeEvent.layout.width);
      }}
      testID="app-tab-bar"
    >
      <GlobalTabBarActiveIndicator
        style={{
          left: tabWidth > 0 ? tabWidth / 2 - GLOBAL_TAB_ACTIVE_INDICATOR_WIDTH / 2 : 0,
          opacity: tabWidth > 0 ? 1 : 0,
          transform: [{ translateX: indicatorTranslateX }],
        }}
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
          <GlobalTabBarItem
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            icon={Icon}
            isFocused={isFocused}
            key={tab.id}
            label={tab.label}
            onLongPress={onLongPress}
            onPress={onPress}
            tabId={tab.id}
          />
        );
      })}
    </GlobalTabBarSurface>
  );
}
