#!/bin/sh
# mcp/bin/seed-keychain.sh
#
# One-time setup: store Ramble On MCP secrets in the macOS Keychain so they
# never live in .mcp.json, shell profiles, or dotfiles. Values are read
# silently (no terminal echo) and written with `security add-generic-password
# -U` (upsert). Re-run any time to rotate a key.
#
# The sidecar launcher (sidecar.sh) reads these back at spawn time.

set -eu

KEYCHAIN_SERVICE="ramble-on-mcp"

if ! command -v security >/dev/null 2>&1; then
  echo "This script requires the macOS 'security' CLI (Keychain)." >&2
  echo "On Linux/Windows, export keys in your environment or use .env.local instead." >&2
  exit 1
fi

seed() {
  key="$1"; label="$2"
  printf '%s' "$label (leave empty to skip): "
  # -s: no echo. Trailing newline for terminal cleanliness.
  stty -echo 2>/dev/null || true
  read -r value || value=""
  stty echo 2>/dev/null || true
  echo ""
  if [ -n "$value" ]; then
    security add-generic-password -U -s "$KEYCHAIN_SERVICE" -a "$key" -w "$value"
    echo "  stored: $key → keychain service '$KEYCHAIN_SERVICE'"
  else
    echo "  skipped: $key"
  fi
  unset value
}

echo "Seeding Ramble On MCP secrets into the macOS Keychain."
echo "Service name: $KEYCHAIN_SERVICE"
echo ""
seed NOTION_API_KEY    "Notion API key"
seed GEMINI_API_KEY    "Gemini API key"
seed OPENAI_API_KEY    "OpenAI API key (optional)"
seed ANTHROPIC_API_KEY "Anthropic API key (optional)"
echo ""
echo "Done. Verify (prints nothing sensitive):"
echo "  security find-generic-password -s $KEYCHAIN_SERVICE -a NOTION_API_KEY >/dev/null && echo OK"
echo "Rotate a key by re-running this script. Remove all with:"
echo "  security delete-generic-password -s $KEYCHAIN_SERVICE -a KEY_NAME"
