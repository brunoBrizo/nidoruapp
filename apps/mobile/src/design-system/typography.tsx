import type { ReactNode } from "react";

import { Text, cn, type TextProps } from "../tw";

export type NidoruTextVariant =
  | "display"
  | "title"
  | "subtitle"
  | "eyebrow"
  | "body"
  | "caption"
  | "timer";

const textClassByVariant: Record<NidoruTextVariant, string> = {
  body: "font-nidoru-primary-regular text-nidoru-body text-nidoru-dark-text-secondary",
  caption: "font-nidoru-data-regular text-nidoru-caption text-nidoru-dark-text-tertiary",
  display: "font-nidoru-primary-extrabold text-nidoru-display text-nidoru-dark-text-primary",
  eyebrow:
    "font-nidoru-data-regular text-[11px] uppercase tracking-[0.18em] text-nidoru-dark-primary/80",
  subtitle: "font-nidoru-primary-regular text-nidoru-body text-nidoru-dark-text-secondary",
  timer: "font-nidoru-data-light text-nidoru-timer text-nidoru-dark-text-primary tabular-nums",
  title: "font-nidoru-primary-bold text-nidoru-h1 text-nidoru-dark-text-primary",
};

type NidoruTextProps = Omit<TextProps, "children"> & {
  readonly children: ReactNode;
  readonly variant?: NidoruTextVariant;
};

export function NidoruText({
  children,
  className,
  selectable = true,
  variant = "body",
  ...props
}: NidoruTextProps) {
  return (
    <Text className={cn(textClassByVariant[variant], className)} selectable={selectable} {...props}>
      {children}
    </Text>
  );
}
