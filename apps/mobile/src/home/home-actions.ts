const FIVE_AM = 5 * 60;
const NOON = 12 * 60;
const FIVE_PM = 17 * 60;
const EIGHT_PM = 20 * 60;
const END_OF_DAY = 24 * 60;

export type HomeRouteTarget =
  | "/"
  | "/sleep"
  | "/breathe"
  | "/progress"
  | "/profile"
  | "/check-in"
  | "/profile/subscription"
  | "/profile/subscription/cancel"
  | "/rescue-me"
  | "/sleep/sounds"
  | "/sleep/wind-down"
  | "/breathe/morning"
  | "/breathe/midday-reset"
  | "/breathe/evening-prep";

export type HomeIconIntent =
  | "home"
  | "moon"
  | "wind"
  | "bar-chart"
  | "user"
  | "heart"
  | "music"
  | "sunrise"
  | "refresh"
  | "sunset";

export type HomeActionDisplay = {
  readonly id: string;
  readonly label: string;
  readonly subtitle: string;
  readonly ctaText: string;
  readonly routeTarget: HomeRouteTarget;
  readonly iconIntent: HomeIconIntent;
  readonly isDistressUrgent: boolean;
  readonly accessibilityHint?: string;
  readonly tapsFromHome?: 1 | 2 | 3;
};

export type CoreFeatureReachability = {
  readonly id: string;
  readonly label: string;
  readonly routeTarget: HomeRouteTarget;
  readonly tapsFromHome: 1 | 2 | 3;
};

export type AppShellTabDefinition = {
  readonly id: string;
  readonly label: string;
  readonly routeTarget: HomeRouteTarget;
  readonly iconIntent: HomeIconIntent;
};

export const appShellTabs = [
  { id: "home", label: "Home", routeTarget: "/", iconIntent: "home" },
  { id: "sleep", label: "Sleep", routeTarget: "/sleep", iconIntent: "moon" },
  { id: "breathe", label: "Breathe", routeTarget: "/breathe", iconIntent: "wind" },
  { id: "progress", label: "Progress", routeTarget: "/progress", iconIntent: "bar-chart" },
  { id: "profile", label: "Profile", routeTarget: "/profile", iconIntent: "user" },
] as const satisfies readonly AppShellTabDefinition[];

export type AppShellTab = (typeof appShellTabs)[number];
export type AppShellTabId = AppShellTab["id"];

export const homeQuickActions = [
  {
    id: "rescue-me",
    label: "Rescue Me",
    subtitle: "Immediate",
    ctaText: "Start Rescue Me",
    routeTarget: "/rescue-me",
    iconIntent: "heart",
    isDistressUrgent: true,
    accessibilityHint: "Starts the Rescue Me anchor immediately.",
    tapsFromHome: 1,
  },
  {
    id: "sounds",
    label: "Sounds",
    subtitle: "Mixer",
    ctaText: "Open Sounds",
    routeTarget: "/sleep/sounds",
    iconIntent: "music",
    isDistressUrgent: false,
    accessibilityHint: "Opens the Sound Mixer anchor.",
    tapsFromHome: 1,
  },
  {
    id: "breathe",
    label: "Breathe",
    subtitle: "Just the orb",
    ctaText: "Start Breathe",
    routeTarget: "/breathe",
    iconIntent: "wind",
    isDistressUrgent: false,
    accessibilityHint: "Opens the Breathe anchor.",
    tapsFromHome: 1,
  },
] as const satisfies readonly HomeActionDisplay[];

export type HomeQuickAction = (typeof homeQuickActions)[number];
export type HomeQuickActionId = HomeQuickAction["id"];

export const homePrimaryActions = {
  "morning-breathwork": {
    id: "morning-breathwork",
    label: "Morning Breathwork",
    subtitle: "3 min energizing breath",
    ctaText: "Start now",
    routeTarget: "/breathe/morning",
    iconIntent: "sunrise",
    isDistressUrgent: false,
  },
  "midday-reset": {
    id: "midday-reset",
    label: "Midday Reset",
    subtitle: "Box breathing for stress",
    ctaText: "Start now",
    routeTarget: "/breathe/midday-reset",
    iconIntent: "refresh",
    isDistressUrgent: false,
  },
  "evening-prep": {
    id: "evening-prep",
    label: "Evening Prep",
    subtitle: "Transition out of the day",
    ctaText: "Start now",
    routeTarget: "/breathe/evening-prep",
    iconIntent: "sunset",
    isDistressUrgent: false,
  },
  "wind-down-flow": {
    id: "wind-down-flow",
    label: "Wind-Down Flow",
    subtitle: "4-7-8 breathing and 20 min sounds",
    ctaText: "Start now",
    routeTarget: "/sleep/wind-down",
    iconIntent: "moon",
    isDistressUrgent: false,
  },
  "rescue-me": {
    id: "rescue-me",
    label: "Rescue Me",
    subtitle: "Immediate 4-7-8 relief",
    ctaText: "Start now",
    routeTarget: "/rescue-me",
    iconIntent: "heart",
    isDistressUrgent: true,
  },
} as const satisfies Record<string, HomeActionDisplay>;

export const coreFeatureReachability = [
  { id: "rescue-me", label: "Rescue Me", routeTarget: "/rescue-me", tapsFromHome: 1 },
  {
    id: "wind-down-flow",
    label: "Wind-Down Flow",
    routeTarget: "/sleep/wind-down",
    tapsFromHome: 2,
  },
  { id: "sound-mixer", label: "Sound Mixer", routeTarget: "/sleep/sounds", tapsFromHome: 1 },
  { id: "breathe", label: "Breathe", routeTarget: "/breathe", tapsFromHome: 1 },
  { id: "progress", label: "Progress", routeTarget: "/progress", tapsFromHome: 1 },
  { id: "profile-settings", label: "Profile settings", routeTarget: "/profile", tapsFromHome: 1 },
  {
    id: "profile-subscription",
    label: "Subscription",
    routeTarget: "/profile/subscription",
    tapsFromHome: 2,
  },
  {
    id: "cancel-subscription",
    label: "Cancel Subscription",
    routeTarget: "/profile/subscription/cancel",
    tapsFromHome: 3,
  },
] as const satisfies readonly CoreFeatureReachability[];

export type HomePrimaryActionId = keyof typeof homePrimaryActions;
export type HomePrimaryAction = (typeof homePrimaryActions)[HomePrimaryActionId];

export type HomePrimaryActionWindow = {
  readonly id: string;
  readonly startsAtMinute: number;
  readonly endsAtMinute: number;
  readonly actionId: HomePrimaryActionId;
};

export const homePrimaryActionWindows = [
  { id: "late-night", startsAtMinute: 0, endsAtMinute: FIVE_AM, actionId: "rescue-me" },
  {
    id: "morning",
    startsAtMinute: FIVE_AM,
    endsAtMinute: NOON,
    actionId: "morning-breathwork",
  },
  { id: "midday", startsAtMinute: NOON, endsAtMinute: FIVE_PM, actionId: "midday-reset" },
  { id: "evening", startsAtMinute: FIVE_PM, endsAtMinute: EIGHT_PM, actionId: "evening-prep" },
  {
    id: "night",
    startsAtMinute: EIGHT_PM,
    endsAtMinute: END_OF_DAY,
    actionId: "wind-down-flow",
  },
] as const satisfies readonly HomePrimaryActionWindow[];

export type LocalHomeStateInput = {
  readonly now: Date;
};

export type LocalHomeState = {
  readonly tabs: typeof appShellTabs;
  readonly primaryAction: HomePrimaryAction;
  readonly quickActions: typeof homeQuickActions;
};

const getLocalMinuteOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

const getPrimaryActionIdForMinute = (minuteOfDay: number): HomePrimaryActionId => {
  if (minuteOfDay < FIVE_AM) {
    return "rescue-me";
  }

  if (minuteOfDay < NOON) {
    return "morning-breathwork";
  }

  if (minuteOfDay < FIVE_PM) {
    return "midday-reset";
  }

  if (minuteOfDay < EIGHT_PM) {
    return "evening-prep";
  }

  return "wind-down-flow";
};

export const selectHomePrimaryAction = ({ now }: LocalHomeStateInput): HomePrimaryAction =>
  homePrimaryActions[getPrimaryActionIdForMinute(getLocalMinuteOfDay(now))];

export const createLocalHomeState = (input: LocalHomeStateInput): LocalHomeState => ({
  tabs: appShellTabs,
  primaryAction: selectHomePrimaryAction(input),
  quickActions: homeQuickActions,
});
