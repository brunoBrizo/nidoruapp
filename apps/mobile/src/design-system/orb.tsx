import type { ReactNode } from "react";

import { View, cn, type ViewProps } from "../tw";

export const breathingOrbVisuals = {
  coreGlow: "0 0 24px rgba(124, 111, 205, 0.5)",
  primaryGradientFrom: "#7C6FCD",
  primaryGradientTo: "#A89CE0",
  pulseGlow: "0 0 40px rgba(168, 156, 224, 0.75)",
  restSize: 112,
  sessionSize: 264,
} as const;

export const breathingOrbClassNames = {
  core: "items-center justify-center overflow-hidden rounded-full bg-nidoru-dark-primary shadow-[0_0_24px_rgba(124,111,205,0.5)]",
  label: "font-nidoru-primary-semibold text-nidoru-h3 text-nidoru-dark-text-primary tabular-nums",
  middleRing:
    "absolute rounded-full border border-[#A89CE0]/20 bg-nidoru-dark-primary/10 shadow-[inset_0_0_12px_rgba(168,156,224,0.1)]",
  outerRing: "absolute rounded-full border border-[#7C6FCD]/40",
  softGlow:
    "absolute rounded-full bg-nidoru-dark-primary-glow/35 shadow-[0_0_24px_rgba(168,156,224,0.4)]",
  stage: "items-center justify-center",
} as const;

type OrbStageProps = ViewProps & {
  readonly children?: ReactNode;
  readonly isDecorative?: boolean;
};

export function OrbStage({ children, className, isDecorative = true, ...props }: OrbStageProps) {
  return (
    <View
      accessibilityElementsHidden={isDecorative}
      className={cn(breathingOrbClassNames.stage, className)}
      importantForAccessibility={isDecorative ? "no-hide-descendants" : "auto"}
      {...props}
    >
      {children}
    </View>
  );
}
