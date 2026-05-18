# Nidoru Mobile

Expo React Native app for iOS and Android.

## Local Development

Use development builds, not Expo Go:

```sh
pnpm --filter @nidoru/mobile ios
pnpm --filter @nidoru/mobile android
pnpm --filter @nidoru/mobile start
```

`ios` and `android` build and launch a native development client. `start` runs Metro for an already-installed development client.

## EAS

`eas.json` defines development, preview, and production build profiles. Development builds include `expo-dev-client`; preview and production builds are mapped to their matching EAS Update channels.

```sh
pnpm --filter @nidoru/mobile eas:build:development
pnpm --filter @nidoru/mobile eas:build:preview
pnpm --filter @nidoru/mobile eas:build:production
pnpm --filter @nidoru/mobile eas:submit:production
```

Run `pnpm --filter @nidoru/mobile exec eas init` after signing in to Expo, then set `EAS_PROJECT_ID` from the generated project ID when running local config checks or update commands.

## EAS Update Runtime Rule

The app uses `runtimeVersion.policy = "fingerprint"`. EAS Update is for JavaScript and asset updates that match an installed binary runtime. Native dependency changes, Expo config plugin changes, SDK upgrades, or subscription/native contract changes require a new binary build before an OTA update can be considered compatible.

Use update branches that match the build channels:

```sh
pnpm --filter @nidoru/mobile eas:update:development
pnpm --filter @nidoru/mobile eas:update:preview
pnpm --filter @nidoru/mobile eas:update:production
```

## Current Proof Gaps

Simulator and emulator checks are enough only for non-device-specific scaffold proof. Audio, haptics, notifications, and lock-screen behavior still require real iOS and Android device validation when those features are implemented.

This setup was not launched on iOS because the machine is pointed at Command Line Tools instead of full Xcode and `simctl` is unavailable. It was not launched on Android because `adb` is not installed on PATH. EAS cloud profile verification still requires an Expo login or `EXPO_TOKEN`.
