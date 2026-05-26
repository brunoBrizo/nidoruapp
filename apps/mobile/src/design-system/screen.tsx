import type { ReactNode } from "react";

import { ScrollView, Text, View, cn, type ScrollViewProps, type ViewProps } from "../tw";

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

type NidoruLoadingScreenProps = Omit<MidnightScreenProps, "children"> & {
  readonly caption?: string;
  readonly label?: string;
};

export function NidoruLoadingScreen({
  caption,
  className,
  label = "Loading",
  testID,
  ...props
}: NidoruLoadingScreenProps) {
  return (
    <MidnightScreen
      className={cn("items-center justify-center px-nidoru-screen", className)}
      testID={testID}
      {...props}
    >
      <View className="items-center gap-4">
        <View
          className="h-12 w-12 rounded-full bg-nidoru-dark-primary-glow/80 shadow-[0_0_32px_rgba(168,156,224,0.45)]"
          testID={testID ? `${testID}-orb` : undefined}
        />
        <View className="items-center gap-1">
          <Text
            accessibilityRole="text"
            className="font-nidoru-primary-semibold text-nidoru-body text-nidoru-dark-text-primary"
            selectable
          >
            {label}
          </Text>
          {caption ? (
            <Text
              className="font-nidoru-primary-regular text-nidoru-caption text-nidoru-dark-text-secondary"
              selectable
            >
              {caption}
            </Text>
          ) : null}
        </View>
      </View>
    </MidnightScreen>
  );
}
