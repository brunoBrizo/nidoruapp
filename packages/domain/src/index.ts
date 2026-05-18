type BreathPhase = {
  readonly name: "inhale" | "hold" | "second-inhale" | "exhale";
  readonly durationMs: number;
};

type BreathTechnique = {
  readonly id: string;
  readonly name: string;
  readonly primaryContext: string;
  readonly phases: readonly BreathPhase[];
};

export const breathTechniques = {
  "4-7-8-sleep": {
    id: "4-7-8-sleep",
    name: "4-7-8 Sleep",
    primaryContext: "Before bed, Rescue Me",
    phases: [
      { name: "inhale", durationMs: 4000 },
      { name: "hold", durationMs: 7000 },
      { name: "exhale", durationMs: 8000 },
    ],
  },
  "box-breathing": {
    id: "box-breathing",
    name: "Box Breathing",
    primaryContext: "Anxiety and stress",
    phases: [
      { name: "inhale", durationMs: 4000 },
      { name: "hold", durationMs: 4000 },
      { name: "exhale", durationMs: 4000 },
      { name: "hold", durationMs: 4000 },
    ],
  },
  "coherent-breathing": {
    id: "coherent-breathing",
    name: "Coherent Breathing",
    primaryContext: "Daytime calm and balance",
    phases: [
      { name: "inhale", durationMs: 5000 },
      { name: "exhale", durationMs: 5000 },
    ],
  },
  "physiological-sigh": {
    id: "physiological-sigh",
    name: "Physiological Sigh",
    primaryContext: "Panic or acute stress",
    phases: [
      { name: "inhale", durationMs: 2000 },
      { name: "second-inhale", durationMs: 1000 },
      { name: "exhale", durationMs: 8000 },
    ],
  },
} as const satisfies Record<string, BreathTechnique>;

export const breathTechniqueIds = Object.keys(breathTechniques) as [
  keyof typeof breathTechniques,
  ...(keyof typeof breathTechniques)[],
];

export const launchSoundIds = [
  "light-rain",
  "heavy-rain",
  "rain-on-window",
  "thunderstorm",
  "ocean-waves",
  "forest",
  "river-stream",
  "wind",
  "white-noise",
  "brown-noise",
  "pink-noise",
  "fireplace-crackling",
  "cafe-ambience",
  "fan",
  "432hz-tone",
  "delta-wave-binaural",
] as const;

export const streakRules = {
  completionIncludes: ["breathwork", "wind-down"] as const,
  missedDayPausesStreak: true,
  resetOnMissedDay: false,
  weeklySummaryDay: "monday",
  ghostModeAllowed: true,
  milestoneSessionCounts: [3, 7, 14, 30, 60, 100, 365],
} as const;

export const initialInsightRuleTypes = [
  "bedtime_correlation",
  "streak_effect",
  "sound_preference",
  "breathing_technique_impact",
  "weekend_pattern",
  "session_duration_effect",
] as const;

export type BreathTechniqueId = (typeof breathTechniqueIds)[number];
export type LaunchSoundId = (typeof launchSoundIds)[number];
export type InitialInsightRuleType = (typeof initialInsightRuleTypes)[number];
