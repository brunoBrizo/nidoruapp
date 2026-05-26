import { useState } from "react";

import { GlassCard, MidnightScrollScreen, NidoruButton, NidoruText } from "../design-system";
import { getAppEnvironment, isObservabilityProofModeEnabled } from "../observability/environment";
import { capturePostHogProofEvent, posthogProofEventName } from "../observability/posthog";
import { captureSentryProofError, sentryRelease } from "../observability/sentry";
import { View } from "../tw";
import { TailwindRuntimeProof } from "../tw/tailwind-runtime-proof";

export default function ObservabilityProofScreen() {
  const [message, setMessage] = useState("No proof event sent yet.");
  const proofModeEnabled = isObservabilityProofModeEnabled();

  const captureSentry = () => {
    const result = captureSentryProofError();
    setMessage(`Sentry ${result.status}: ${result.environment} / ${result.release}`);
  };

  const capturePostHog = async () => {
    const result = await capturePostHogProofEvent();
    setMessage(`PostHog ${result.status}: ${result.eventName}`);
  };

  return (
    <MidnightScrollScreen
      contentContainerClassName="min-h-full justify-center gap-5 px-nidoru-screen py-nidoru-xl"
      testID="observability-proof-screen"
    >
      <View className="gap-2">
        <NidoruText accessibilityRole="header" className="uppercase" variant="eyebrow">
          Observability Proof
        </NidoruText>
        <NidoruText variant="title">
          {getAppEnvironment()} / {sentryRelease}
        </NidoruText>
        <NidoruText>
          Proof mode: {proofModeEnabled ? "enabled" : "disabled"}. PostHog test event:{" "}
          {posthogProofEventName}.
        </NidoruText>
      </View>
      <View className="gap-3">
        <NidoruButton
          disabled={!proofModeEnabled}
          onPress={captureSentry}
          variant="primary"
        >
          Capture Sentry Test Error
        </NidoruButton>
        <NidoruButton
          disabled={!proofModeEnabled}
          onPress={capturePostHog}
          variant="secondary"
        >
          Send PostHog Test Event
        </NidoruButton>
      </View>
      <GlassCard className="gap-3">
        <NidoruText className="text-nidoru-caption" variant="caption">
          {message}
        </NidoruText>
        <TailwindRuntimeProof />
      </GlassCard>
    </MidnightScrollScreen>
  );
}
