const easProjectId = process.env.EAS_PROJECT_ID;

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
    "@sentry/react-native",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: easProjectId ? { projectId: easProjectId } : undefined,
  },
};

module.exports = { expo: config };
