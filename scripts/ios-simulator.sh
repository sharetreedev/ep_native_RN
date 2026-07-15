#!/usr/bin/env bash
#
# Build & install the Pulse dev client on a local iOS Simulator (macOS).
#
# WHY THIS SCRIPT EXISTS
# ----------------------
# `npx expo run:ios` fails on a local machine while compiling Sentry:
#     ❌ Pods/Sentry: Module '_SentryPrivate' not found
# This is a sentry-cocoa + New Architecture + CocoaPods-static-linking issue that
# only bites on local Xcode; EAS's pinned Xcode image is unaffected. Sentry is
# `enabled: !__DEV__` in App.tsx, so it does nothing in a local debug build
# anyway. The fix is to drop Sentry's native module from autolinking.
#
# The lever is package.json -> expo.autolinking.exclude. But package.json is a
# TRACKED file: if that edit were committed it would disable Sentry for real
# users on EAS/production. So this script applies the exclusion ONLY for the
# duration of the native build and ALWAYS restores package.json on exit (even on
# failure / Ctrl-C). It builds with --no-bundler so Metro never starts while the
# patch is live — you start Metro yourself afterwards with a pristine tree.
#
# USAGE
#   ./scripts/ios-simulator.sh                 # build + install to a booted/default sim
#   ./scripts/ios-simulator.sh -d "iPhone 16"  # pick a device (any `expo run:ios` flag works)
# Then, for day-to-day work (package.json is clean again):
#   npx expo start --dev-client
#
# One-time machine prerequisites — see DEVELOPMENT.md "iOS Simulator (macOS)":
#   - Xcode + an installed iOS simulator runtime (`xcodebuild -downloadPlatform iOS`)
#   - CocoaPods (`brew install cocoapods`)
#   - Node 22 LTS
set -euo pipefail

cd "$(dirname "$0")/.."
export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"
export PATH="/opt/homebrew/bin:$PATH"   # ensure brew-installed `pod` is found

# 1. Local data source. client.ts hard-throws without this. `test` = test backend.
if [ ! -f .env.local ]; then
  echo "EXPO_PUBLIC_XANO_DATA_SOURCE=test" > .env.local
  echo "→ created .env.local (EXPO_PUBLIC_XANO_DATA_SOURCE=test)"
fi

# 2. Restore package.json no matter how we exit.
cp package.json .package.json.simbak
restore_pkg() { mv -f .package.json.simbak package.json 2>/dev/null || true; }
trap restore_pkg EXIT INT TERM

# 3. Transiently exclude Sentry from autolinking.
node -e '
  const fs = require("fs");
  const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
  p.expo = p.expo || {};
  p.expo.autolinking = p.expo.autolinking || {};
  const ex = new Set(p.expo.autolinking.exclude || []);
  ex.add("@sentry/react-native");
  p.expo.autolinking.exclude = [...ex];
  fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
'
echo "→ Sentry temporarily excluded from autolinking (package.json restored on exit)"

# 4. Build + install the dev client, WITHOUT starting Metro.
echo "→ building dev client (first run ~10 min: prebuild + pod install + compile)…"
npx expo run:ios --no-bundler "$@"

echo ""
echo "✅ Dev client installed on the simulator."
echo "   Start Metro (tree is clean again):  npx expo start --dev-client"
