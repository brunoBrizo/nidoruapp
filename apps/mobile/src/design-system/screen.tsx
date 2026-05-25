import type { ReactNode } from "react";

import { ScrollView, View, cn, type ScrollViewProps, type ViewProps } from "../tw";

type ChildrenProp = {
  readonly children?: ReactNode;
};

type MidnightScreenProps = ViewProps & ChildrenProp;

export function MidnightScreen({ children, className, ...props }: MidnightScreenProps) {
  return (
    <View className={cn("flex-1 bg-nidoru-dark-background", className)} {...props}>
      {children}
    </View>
  );
}

type MidnightScrollScreenProps = ScrollViewProps & ChildrenProp;

export function MidnightScrollScreen({
  children,
  className,
  contentContainerClassName,
  contentInsetAdjustmentBehavior = "automatic",
  ...props
}: MidnightScrollScreenProps) {
  return (
    <ScrollView
      className={cn("flex-1 bg-nidoru-dark-background", className)}
      contentContainerClassName={cn(
        "min-h-full gap-4 px-nidoru-screen pt-12 pb-[104px]",
        contentContainerClassName,
      )}
      contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export function AmbientBackdrop({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("absolute inset-0 bg-nidoru-dark-background", className)}
      pointerEvents="none"
      {...props}
    />
  );
}

export function DimOverlay({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("absolute inset-0 bg-black/50", className)}
      pointerEvents="none"
      {...props}
    />
  );
}

export function BottomTabSpacer({ className, ...props }: ViewProps) {
  return <View className={cn("h-[104px]", className)} pointerEvents="none" {...props} />;
}
