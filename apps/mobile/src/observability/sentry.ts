import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import type { ComponentType } from "react";

import { getAppEnvironment } from "./environment";

const appSlug = Constants.expoConfig?.slug ?? "nidoru";
const appVersion = Constants.expoConfig?.version ?? "0.0.0";
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";

export const sentryRelease = process.env.EXPO_PUBLIC_SENTRY_RELEASE ?? `${appSlug}@${appVersion}`;
export const sentryDist =
  process.env.EXPO_PUBLIC_SENTRY_DIST ?? Updates.runtimeVersion ?? undefined;

let sentryInitialized = false;

export function initializeSentry() {
  if (sentryInitialized || !sentryDsn) {
    return sentryInitialized;
  }

  const environment = getAppEnvironment();

  Sentry.init({
    dsn: sentryDsn,
    dist: sentryDist,
    environment,
    release: sentryRelease,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    enableCaptureFailedRequests: false,
    enableUserInteractionTracing: false,
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
    tracesSampleRate: 0,
  });

  const scope = Sentry.getGlobalScope();
  scope.setTag("app.environment", environment);
  scope.setTag("app.slug", appSlug);
  scope.setTag("expo-is-embedded-update", String(Updates.isEmbeddedLaunch));

  if (Updates.updateId) {
    scope.setTag("expo-update-id", Updates.updateId);
  }

  sentryInitialized = true;
  return true;
}

export function isSentryConfigured() {
  return sentryInitialized;
}

export function captureSentryProofError() {
  if (!sentryInitialized) {
    return {
      status: "not_configured" as const,
      release: sentryRelease,
      environment: getAppEnvironment(),
    };
  }

  Sentry.captureException(new Error("Nidoru Sentry observability proof error"), {
    tags: {
      proof: "observability",
      release: sentryRelease,
    },
  });

  return {
    status: "queued" as const,
    release: sentryRelease,
    environment: getAppEnvironment(),
  };
}

export function withSentryRoot<P extends Record<string, unknown>>(RootComponent: ComponentType<P>) {
  return sentryInitialized ? Sentry.wrap(RootComponent) : RootComponent;
}
