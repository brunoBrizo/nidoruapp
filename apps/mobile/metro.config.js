/* eslint-disable @typescript-eslint/no-require-imports */

const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { withNativewind } = require("nativewind/metro");

const config = getSentryExpoConfig(__dirname);

module.exports = withNativewind(config, {
  globalClassNamePolyfill: false,
  inlineVariables: false,
  typescriptEnvPath: "src/nativewind-env.d.ts",
});
