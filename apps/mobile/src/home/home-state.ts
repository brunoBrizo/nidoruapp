import {
  createLocalHomeState,
  type HomeRouteTarget,
  type LocalHomeStateInput,
} from "./home-actions";

export type HomeSummarySlot =
  | {
      readonly kind: "last-night";
      readonly title: "Last night";
      readonly ratingText: string;
      readonly ratingAccessibilityLabel: string;
      readonly summary: string;
      readonly suggestion: string;
      readonly actionLabel: string;
      readonly routeTarget: HomeRouteTarget;
      readonly durationText: string;
    }
  | {
      readonly kind: "check-in";
      readonly title: string;
      readonly summary: string;
      readonly suggestion: string;
      readonly actionLabel: string;
      readonly routeTarget: HomeRouteTarget;
      readonly accessibilityHint: string;
    };

export type HomeRhythmSegment = {
  readonly id: string;
  readonly filled: boolean;
  readonly today: boolean;
  readonly opacity: number;
};

export type HomeRhythmState = {
  readonly title: string;
  readonly meta: string;
  readonly streakText: string;
  readonly accessibilityLabel: string;
  readonly compassionateCopy: string;
  readonly segments: readonly HomeRhythmSegment[];
};

export type HomeOverviewInput = LocalHomeStateInput & {
  readonly hasMorningCheckIn?: boolean;
};

export type HomeOverviewState = ReturnType<typeof createLocalHomeState> & {
  readonly summarySlot: HomeSummarySlot;
  readonly rhythm: HomeRhythmState;
};

const lastNightSummary: HomeSummarySlot = {
  kind: "last-night",
  title: "Last night",
  ratingText: "4/5",
  ratingAccessibilityLabel: "Sleep rating 4 out of 5",
  summary: "Rain helped you settle",
  suggestion: "You fell asleep 14 min faster. Try box breathing tonight.",
  actionLabel: "View insight",
  routeTarget: "/progress",
  durationText: "7h 12m",
};

const missingCheckInSummary: HomeSummarySlot = {
  kind: "check-in",
  title: "How did you sleep?",
  summary: "Take a quiet check-in for last night.",
  suggestion: "One tap to log it. Skip anytime.",
  actionLabel: "Tap to log",
  routeTarget: "/check-in",
  accessibilityHint: "Opens the morning check-in anchor.",
};

const localFallbackRhythm: HomeRhythmState = {
  title: "Your sleep rhythm",
  meta: "This week",
  streakText: "8 nights",
  accessibilityLabel:
    "Sleep rhythm strip for this week: five settled days, one rest day, and today in progress.",
  compassionateCopy: "A steady week, with room to rest.",
  segments: [
    { id: "day-1", opacity: 0.4, filled: true, today: false },
    { id: "day-2", opacity: 0.6, filled: true, today: false },
    { id: "day-3", opacity: 0.8, filled: true, today: false },
    { id: "day-4", opacity: 1, filled: true, today: false },
    { id: "day-5", opacity: 1, filled: false, today: false },
    { id: "today", opacity: 1, filled: true, today: true },
    { id: "day-7", opacity: 1, filled: false, today: false },
  ],
};

export const createHomeOverview = ({
  hasMorningCheckIn = true,
  now,
}: HomeOverviewInput): HomeOverviewState => ({
  ...createLocalHomeState({ now }),
  summarySlot: hasMorningCheckIn ? lastNightSummary : missingCheckInSummary,
  rhythm: localFallbackRhythm,
});
