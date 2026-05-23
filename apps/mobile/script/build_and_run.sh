#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-start}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$APP_DIR/../.." && pwd)"

cd "$REPO_ROOT"

show_usage() {
  cat <<'USAGE'
usage: apps/mobile/script/build_and_run.sh [mode]

Modes:
  start, run        Start the Expo dev server with a clean Metro cache
  --ios, ios        Start Expo and open iOS
  --android, android
                   Start Expo and open Android
  --web, web        Start Expo for web
  --dev-client, dev-client
                   Start Expo in development-client mode
  --tunnel, tunnel Start Expo using tunnel transport
  --doctor, doctor Run Expo diagnostics
  --help, help     Show this help
USAGE
}

expo_cmd() {
  if [[ -n "${EXPO_CLI:-}" ]]; then
    # Optional escape hatch for local wrappers.
    # shellcheck disable=SC2206
    local custom_cmd=(${EXPO_CLI})
    "${custom_cmd[@]}" "$@"
  elif command -v pnpm >/dev/null 2>&1; then
    pnpm --filter @nidoru/mobile exec expo "$@"
  else
    npx expo "$@"
  fi
}

case "$MODE" in
  start|run)
    expo_cmd start --clear
    ;;
  --ios|ios)
    expo_cmd start --clear --ios
    ;;
  --android|android)
    expo_cmd start --clear --android
    ;;
  --web|web)
    expo_cmd start --clear --web
    ;;
  --dev-client|dev-client)
    expo_cmd start --clear --dev-client
    ;;
  --tunnel|tunnel)
    expo_cmd start --clear --tunnel
    ;;
  --doctor|doctor)
    if command -v pnpm >/dev/null 2>&1; then
      pnpm --filter @nidoru/mobile exec expo-doctor
    else
      npx expo-doctor
    fi
    ;;
  --help|help)
    show_usage
    ;;
  *)
    show_usage >&2
    exit 2
    ;;
esac
