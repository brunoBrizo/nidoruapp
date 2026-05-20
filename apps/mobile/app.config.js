const easProjectId = process.env.EAS_PROJECT_ID ?? process.env.EAS_BUILD_PROJECT_ID;
const sentryUrl = process.env.SENTRY_URL;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;

const sentryPluginOptions = {
  ...(sentryUrl ? { url: sentryUrl } : {}),
  ...(sentryOrg ? { organization: sentryOrg } : {}),
  ...(sentryProject ? { project: sentryProject } : {}),
};

/** @type {import("expo/config").ExpoConfig} */
const config = {
  name: "Nidoru",
  slug: "nidoru",
  version: "0.1.0",
  scheme: "nidoru",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  runtimeVersion: {
    policy: "fingerprint",
  },
  updates: {
    enabled: true,
    checkAutomatically: "ON_LOAD",
    ...(easProjectId ? { url: `https://u.expo.dev/${easProjectId}` } : {}),
  },
  ios: {
    bundleIdentifier: "com.nidoru.app",
    supportsTablet: false,
  },
  android: {
    package: "com.nidoru.app",
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    "expo-updates",
    "expo-audio",
    "expo-sqlite",
    "expo-secure-store",
    "expo-localization",
    "expo-font",
    ["@sentry/react-native/expo", sentryPluginOptions],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: easProjectId ? { projectId: easProjectId } : undefined,
  },
};

module.exports = { expo: config };
