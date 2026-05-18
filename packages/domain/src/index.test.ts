import { breathTechniques, initialInsightRuleTypes, launchSoundIds, streakRules } from "./index";

const rescueTechnique = breathTechniques["4-7-8-sleep"];
const rescueInhaleMs: 4000 = rescueTechnique.phases[0].durationMs;
const firstLaunchSound: "light-rain" = launchSoundIds[0];
const missedDayPauses: true = streakRules.missedDayPausesStreak;
const firstInsightRule: "bedtime_correlation" = initialInsightRuleTypes[0];

void rescueInhaleMs;
void firstLaunchSound;
void missedDayPauses;
void firstInsightRule;
