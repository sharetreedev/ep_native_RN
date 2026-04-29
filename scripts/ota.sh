#!/usr/bin/env bash
# Publish an OTA update via EAS, forcing the correct --environment so that
# EAS-hosted env vars are used instead of the local .env file.
#
# Usage:
#   scripts/ota.sh <environment> [extra eas update args...]
#
# <environment> is one of: production | preview | development
#   production  → channel=production, EXPO_PUBLIC_XANO_DATA_SOURCE=live
#   preview     → channel=preview,    EXPO_PUBLIC_XANO_DATA_SOURCE=staging
#   development → channel=development, EXPO_PUBLIC_XANO_DATA_SOURCE=test
#
# The corresponding values live as EAS environment variables on the project —
# set via `eas env:create --environment <env> ...`. This wrapper never reads
# them from .env, so a misconfigured local machine cannot publish a bad bundle.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <production|preview|development> [extra eas update args...]" >&2
  exit 2
fi

ENV="$1"
shift

case "$ENV" in
  production|preview|development) ;;
  *)
    echo "❌ Invalid environment: $ENV" >&2
    echo "   Must be one of: production, preview, development" >&2
    exit 2
    ;;
esac

# Verify the env var is set on the EAS project for this environment BEFORE
# publishing — fail loud if the project is misconfigured.
echo "🔍 Verifying EAS environment variables for '$ENV'..."
if ! eas env:list --environment "$ENV" 2>/dev/null | grep -q "EXPO_PUBLIC_XANO_DATA_SOURCE"; then
  echo "❌ EXPO_PUBLIC_XANO_DATA_SOURCE is not set on the EAS '$ENV' environment." >&2
  echo "   Fix with:" >&2
  echo "     eas env:create --environment $ENV --name EXPO_PUBLIC_XANO_DATA_SOURCE --value <live|staging|test>" >&2
  exit 1
fi

# Unset any locally-exported value so nothing can leak into the bundle. EAS
# reads from its server-side env when --environment is passed.
unset EXPO_PUBLIC_XANO_DATA_SOURCE

echo "🚀 Publishing OTA to channel '$ENV' with EAS --environment $ENV..."
exec eas update --channel "$ENV" --environment "$ENV" --non-interactive "$@"
