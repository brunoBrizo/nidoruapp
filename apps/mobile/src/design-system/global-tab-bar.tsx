import type { ElementType, ReactNode } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";

import { Pressable, ReactNativeAnimatedView, Text, View, cn, type PressableProps } from "../tw";

export const GLOBAL_TAB_BAR_COLORS = {
  active: "#A89CE0",
  inactive: "#A0A5C0",
} as const;

export const GLOBAL_TAB_ACTIVE_INDICATOR_WIDTH = 32;

type GlobalTabBarSurfaceProps = {
  readonly children: ReactNode;
  readonly onLayout?: (event: LayoutChangeEvent) => void;
  readonly testID?: string;
};

export function GlobalTabBarSurface({ children, onLayout, testID }: GlobalTabBarSurfaceProps) {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 z-50 h-[84px] border-t border-white/[0.06] bg-[#0D0F1A]/85 px-2 pt-2.5 backdrop-blur-2xl"
      testID={testID}
    >
      <View className="relative flex-row items-start justify-around" onLayout={onLayout}>
        {children}
      </View>
      <View className="absolute bottom-2 left-1/2 h-1 w-[120px] -translate-x-1/2 rounded-full bg-[#EEF0FF]/20" />
    </View>
  );
}

type GlobalTabBarActiveIndicatorProps = {
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

export function GlobalTabBarActiveIndicator({ style, testID }: GlobalTabBarActiveIndicatorProps) {
  return (
    <ReactNativeAnimatedView
      className="absolute -top-2.5 h-0.5 w-8 rounded-full bg-[#A89CE0] shadow-[0_0_8px_rgba(168,156,224,0.8)]"
      pointerEvents="none"
      style={style}
      testID={testID}
    />
  );
}

type TabIconComponent = ElementType<{
  readonly color?: string;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly testID?: string;
}>;

type GlobalTabBarItemProps = Omit<PressableProps, "children"> & {
  readonly icon: TabIconComponent;
  readonly isFocused: boolean;
  readonly label: string;
  readonly tabId: string;
};

export function GlobalTabBarItem({
  className,
  icon: Icon,
  isFocused,
  label,
  tabId,
  ...props
}: GlobalTabBarItemProps) {
  const color = isFocused ? GLOBAL_TAB_BAR_COLORS.active : GLOBAL_TAB_BAR_COLORS.inactive;

  return (
    <Pressable
      className={cn(
        "min-h-[56px] w-16 items-center justify-start gap-1 active:scale-[0.95]",
        className,
      )}
      testID={`tab-item-${tabId}`}
      {...props}
    >
      <View className="h-6 w-6 items-center justify-center" testID={`tab-icon-frame-${tabId}`}>
        <Icon color={color} size={24} strokeWidth={1.5} testID={`tab-icon-${tabId}`} />
      </View>
      <Text
        className={cn(
          isFocused
            ? "font-nidoru-primary-semibold text-[11px] font-semibold text-[#A89CE0]"
            : "font-nidoru-primary-regular text-xs font-normal text-[#A0A5C0]",
        )}
        selectable={false}
        testID={`tab-label-${tabId}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
