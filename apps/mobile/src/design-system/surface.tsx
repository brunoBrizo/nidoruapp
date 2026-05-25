import type { ReactNode } from "react";

import { Text, View, cn, type ViewProps } from "../tw";

type ChildrenProp = {
  readonly children?: ReactNode;
};

type SurfaceProps = ViewProps & ChildrenProp;

export function GlassCard({ children, className, ...props }: SurfaceProps) {
  return (
    <View
      className={cn(
        "overflow-hidden rounded-[22px] border border-white/[0.06] bg-nidoru-dark-surface/70 p-4",
        "shadow-[inset_0_1px_0_rgba(238,240,255,0.08)]",
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function QuietCard({ children, className, ...props }: SurfaceProps) {
  return (
    <View className={cn("rounded-nidoru-card bg-nidoru-dark-surface/80 p-4", className)} {...props}>
      {children}
    </View>
  );
}

export function ListRow({ children, className, ...props }: SurfaceProps) {
  return (
    <View
      className={cn(
        "min-h-[56px] flex-row items-center justify-between gap-3 border-b border-white/[0.06] py-3",
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}

type SelectionTileProps = SurfaceProps & {
  readonly selected?: boolean;
};

export function SelectionTile({
  children,
  className,
  selected = false,
  ...props
}: SelectionTileProps) {
  return (
    <View
      className={cn(
        "min-h-[92px] rounded-[18px] border p-3",
        selected
          ? "border-nidoru-dark-primary-glow/40 bg-nidoru-dark-primary/15"
          : "border-white/[0.06] bg-nidoru-dark-surface/70",
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}

type StatCardProps = ViewProps & {
  readonly label: string;
  readonly value: string;
};

export function StatCard({ className, label, value, ...props }: StatCardProps) {
  return (
    <View className={cn("rounded-[18px] bg-nidoru-dark-surface/70 p-4", className)} {...props}>
      <Text className="font-nidoru-data-light text-[28px] text-nidoru-dark-text-primary tabular-nums">
        {value}
      </Text>
      <Text className="font-nidoru-primary-regular text-nidoru-caption text-nidoru-dark-text-secondary">
        {label}
      </Text>
    </View>
  );
}

type ProgressMeterRowProps = ViewProps & {
  readonly label: string;
  readonly value: number;
};

export function ProgressMeterRow({
  className,
  label,
  testID,
  value,
  ...props
}: ProgressMeterRowProps) {
  const normalizedValue = Math.max(0, Math.min(1, value));
  const percent = `${normalizedValue * 100}%` as `${number}%`;

  return (
    <View className={cn("gap-2", className)} testID={testID} {...props}>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-nidoru-primary-semibold text-nidoru-label text-nidoru-dark-text-primary">
          {label}
        </Text>
        <Text className="font-nidoru-data-regular text-nidoru-caption text-nidoru-dark-text-secondary tabular-nums">
          {Math.round(normalizedValue * 100)}%
        </Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-nidoru-dark-surface-raised">
        <View
          className="h-full rounded-full bg-nidoru-dark-primary-glow"
          style={{ width: percent }}
          testID={testID ? `${testID}-fill` : undefined}
        />
      </View>
    </View>
  );
}
