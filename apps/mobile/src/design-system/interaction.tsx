import type { ReactNode } from "react";

import { Pressable, Text, View, cn, type PressableProps, type ViewProps } from "../tw";

export type NidoruButtonVariant = "primary" | "secondary" | "ghost";

const buttonClassByVariant: Record<NidoruButtonVariant, string> = {
  ghost: "bg-transparent text-nidoru-dark-primary-glow active:bg-nidoru-dark-surface-raised/35",
  primary:
    "bg-[#A89CE0] text-nidoru-dark-background shadow-[0_8px_20px_-5px_rgba(124,111,205,0.6)]",
  secondary:
    "border border-white/[0.06] bg-nidoru-dark-surface-raised/70 text-nidoru-dark-text-primary",
};

type NidoruButtonProps = Omit<PressableProps, "children"> & {
  readonly children: ReactNode;
  readonly variant?: NidoruButtonVariant;
};

export function NidoruButton({
  accessibilityRole = "button",
  children,
  className,
  disabled,
  variant = "primary",
  ...props
}: NidoruButtonProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={disabled ? { disabled: true } : undefined}
      className={cn(
        "min-h-[48px] flex-row items-center justify-center gap-2 rounded-[16px] px-5 active:scale-[0.96]",
        "transition-transform duration-200 ease-nidoru-out disabled:opacity-50",
        buttonClassByVariant[variant],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          className={cn(
            "font-nidoru-primary-semibold text-sm",
            variant === "primary" ? "text-nidoru-dark-background" : "text-nidoru-dark-text-primary",
          )}
          selectable={false}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

type NidoruIconButtonProps = Omit<PressableProps, "children"> & {
  readonly children: ReactNode;
};

export function NidoruIconButton({
  accessibilityRole = "button",
  children,
  className,
  ...props
}: NidoruIconButtonProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      className={cn(
        "min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-nidoru-dark-surface-raised/70 active:scale-[0.96]",
        className,
      )}
      {...props}
    >
      {children}
    </Pressable>
  );
}

type NidoruChipProps = ViewProps & {
  readonly selected?: boolean;
};

export function NidoruChip({ className, selected = false, ...props }: NidoruChipProps) {
  return (
    <View
      className={cn(
        "min-h-[40px] flex-row items-center justify-center rounded-full px-4",
        selected
          ? "bg-nidoru-dark-primary/20"
          : "border border-white/[0.06] bg-nidoru-dark-surface/70",
        className,
      )}
      {...props}
    />
  );
}

type SegmentedControlOption<Value extends string> = {
  readonly label: string;
  readonly value: Value;
};

type NidoruSegmentedControlProps<Value extends string> = {
  readonly accessibilityLabel: string;
  readonly className?: string;
  readonly onValueChange: (value: Value) => void;
  readonly options: readonly SegmentedControlOption<Value>[];
  readonly testID?: string;
  readonly value: Value;
};

export function NidoruSegmentedControl<Value extends string>({
  accessibilityLabel,
  className,
  onValueChange,
  options,
  testID,
  value,
}: NidoruSegmentedControlProps<Value>) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tablist"
      className={cn("flex-row gap-1 rounded-[18px] bg-nidoru-dark-surface/80 p-1", className)}
      testID={testID}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={cn(
              "min-h-[40px] flex-1 items-center justify-center rounded-[14px] px-3 active:scale-[0.96]",
              selected ? "bg-nidoru-dark-surface-raised" : "bg-transparent",
            )}
            key={option.value}
            onPress={() => {
              onValueChange(option.value);
            }}
          >
            <Text
              className={cn(
                "font-nidoru-primary-semibold text-nidoru-label",
                selected ? "text-nidoru-dark-text-primary" : "text-nidoru-dark-text-secondary",
              )}
              selectable={false}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type CardPressableProps = PressableProps & {
  readonly selected?: boolean;
};

export function CardPressable({ className, selected = false, ...props }: CardPressableProps) {
  return (
    <Pressable
      className={cn(
        "rounded-[22px] border border-white/[0.06] bg-nidoru-dark-surface/70 p-4 active:scale-[0.96]",
        selected ? "border-nidoru-dark-primary-glow/40 bg-nidoru-dark-surface-raised/80" : null,
        className,
      )}
      {...props}
    />
  );
}
