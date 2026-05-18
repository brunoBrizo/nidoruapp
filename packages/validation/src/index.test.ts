import { breathSessionDraftSchema, localInstallIdSchema, morningCheckInSchema } from "./index";

const localInstallId = localInstallIdSchema.parse("install_0123456789abcdef");
const breathSessionDraft = breathSessionDraftSchema.parse({
  localInstallId,
  techniqueId: "4-7-8-sleep",
  startedAt: "2026-05-18T02:00:00.000Z",
});
const morningCheckIn = morningCheckInSchema.parse({
  localInstallId,
  checkedInAt: "2026-05-18T10:00:00.000Z",
  sleepRating: 4,
  moodTag: "rested",
});

void breathSessionDraft;
void morningCheckIn;
