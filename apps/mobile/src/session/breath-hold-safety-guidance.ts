import { breathTechniques, type BreathTechniqueId } from "@nidoru/domain";
import { messages } from "@nidoru/i18n";

export const breathHoldSafetyGuidance = messages.en.breath.holdSafetyGuidance;

export function hasBreathHoldPhase(techniqueId: BreathTechniqueId): boolean {
  return breathTechniques[techniqueId].phases.some((phase) => phase.name === "hold");
}
