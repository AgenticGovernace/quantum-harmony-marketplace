#!/bin/sh
# mcp/bin/sidecar.sh
#
# Sidecar launcher for the Ramble On MCP server.
#
# The MCP client (Claude Code, via the plugin's .mcp.json) spawns this script
# as a child process. It resolves API secrets at spawn time — never storing
# them in config files — then execs the stdio server so the server inherits
# this process's PID, signals, and lifecycle. When the client exits, the
# sidecar dies with it. Nothing lingers, nothing listens on a port.
#
# Secret resolution order (per key):
#   1. Already present in the environment        (CI, containers, power users)
#   2. macOS Keychain: security find-generic-password -s ramble-on-mcp -a KEY
#   3. .env.local next to the server code        (handled by env.cjs itself)
#
# Seed the keychain once with: mcp/bin/seed-keychain.sh
# Secret VALUES are never echoed, logged, or passed as argv (argv is visible
# in `ps`; environment of a child process is not, on modern macOS/Linux).

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
KEYCHAIN_SERVICE="ramble-on-mcp"

# Keys the server may need. AI_PROVIDER / RAMBLE_NOTION_ROOT are not secrets;
# set them in your shell or .env.local if you need to override defaults.
SECRET_KEYS="NOTION_API_KEY GEMINI_API_KEY OPENAI_API_KEY ANTHROPIC_API_KEY"

resolve_from_keychain() {
  # $1 = key name. Prints the value or nothing. macOS only; silent elsewhere.
  command -v security >/dev/null 2>&1 || return 0
  security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$1" -w 2>/dev/null || true
}

for key in $SECRET_KEYS; do
  # POSIX indirect read: skip if already set in the environment.
  eval "current=\${$key:-}"
  if [ -z "$current" ]; then
    value=$(resolve_from_keychain "$key")
    if [ -n "$value" ]; then
      export "$key=$value"
      echo "[ramble-on sidecar] $key resolved from keychain." >&2
    fi
  else
    echo "[ramble-on sidecar] $key present in environment." >&2
  fi
  unset current value
done

# Warn (to stderr only — stdout is the JSON-RPC channel) if the primary key
# is still missing. The server itself degrades gracefully; this is a hint,
# not a gate.
[ -n "${NOTION_API_KEY:-}" ] || \
  echo "[ramble-on sidecar] WARNING: NOTION_API_KEY unresolved — KB tools will run degraded. Seed with bin/seed-keychain.sh" >&2

# exec: replace this shell with the server. The client's SIGTERM/SIGINT hits
# stdio.cjs's shutdown handler directly — true sidecar lifecycle.
cd "$SCRIPT_DIR/.."
exec node "$SCRIPT_DIR/stdio.cjs"
