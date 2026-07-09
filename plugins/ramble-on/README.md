# Ramble On

Signal translation layer for fast, non-linear thinkers. Converts raw rambles, voice-note transcripts, and stream-of-consciousness input into polished notes, ATP blocks, or platform-ready posts — calibrated against a Notion-hosted voice model so the output sounds like you, not like a model.

## What's in the box

| Component | Path | Purpose |
|---|---|---|
| Skill | `skills/ramble-on/` | Translation modes, voice calibration, KB routing logic |
| MCP server | `mcp/` | Notion KB access, voice-model retrieval, AI-provider translation tools |
| Server registration | `.mcp.json` | Auto-launches the server over stdio when the plugin enables |

## Tools exposed (when the server is running)

- `ramble.translate` — raw input → polished note with full KB context
- `ramble.to_atp` — raw input → Artemis Transmission Protocol block
- `ramble.to_platform_post` — raw input → Medium / Substack / LinkedIn-formatted post
- `ramble.kb_search` / `ramble.kb_write` — live Notion knowledge base access
- `ramble.get_voice_model` — retrieves the voice-model page for calibration

## Install

From the quantum-harmony marketplace:

```
/plugin marketplace add AgenticGovernace/quantum-harmony
/plugin install ramble-on
```

Then, once:

```bash
cd <plugin-install-path>/mcp && npm install
sh bin/seed-keychain.sh        # macOS: store API keys in Keychain (recommended)
```

The seed script validates each key as you paste it — showing a masked
fingerprint (scheme prefix + length, never the secret) and flagging a bad
paste (e.g. a captured `export …=` line, wrong prefix, stray whitespace)
before it lands in the keychain. Inspect a value at any time without
storing it:

```bash
printf '%s' "$MY_KEY" | node bin/inspect-key.cjs ANTHROPIC_API_KEY
```

## Security model

The server runs as a **sidecar**: spawned by the MCP client via `mcp/bin/sidecar.sh`, stdio-only JSON-RPC, torn down when the client exits. No listening port, no localhost attack surface, no lingering process.

Secrets never live in `.mcp.json`, shell profiles, or the repo. The sidecar resolves each key at spawn time:

1. **Environment** — for CI, containers, and explicit overrides
2. **macOS Keychain** — service `ramble-on-mcp`, seeded once with `mcp/bin/seed-keychain.sh`, rotated by re-running it
3. **`.env.local`** — gitignored fallback next to the server code (Linux/Windows)

Key values are never echoed, logged, or passed as argv. The `http.cjs` transport (loopback `:3748`) remains for the desktop app's in-process use and is **not** registered by this plugin.

## Configuration

| Variable | Required | Purpose |
|---|---|---|
| `NOTION_API_KEY` | Yes (tier 1) | Notion KB + voice model access |
| `GEMINI_API_KEY` | Yes (default provider) | Translation engine |
| `ANTHROPIC_API_KEY` | Recommended | Automatic fallback provider (see below) |
| `OPENAI_API_KEY` | No | Alternate provider |
| `AI_PROVIDER` | No | Override the default provider (not a secret) |
| `RAMBLE_NOTION_ROOT` | No | Override the default Ramble On root page ID (not a secret) |

### Provider fallback

Text generation runs on the selected provider (`AI_PROVIDER`, default Gemini).
If that provider fails — auth error, retired model / 404, or a quota `429` —
the server transparently retries on **Anthropic** when `ANTHROPIC_API_KEY` is
set, instead of failing the request. Keeping an Anthropic key seeded means a
single degraded provider doesn't take translation down. The fallback logs the
switch to stderr and never touches stdout (the JSON-RPC channel).

## Graceful degradation

The skill works at three tiers — the server is an amplifier, not a dependency:

1. **`ramble.*` tools available** → full signal, full KB, full voice model
2. **Notion MCP connected, no server** → good signal, live KB, no local persistence
3. **Neither** → capable instruction-based translation, no personal context

## Requirements

- Node 18+
- Claude Code with plugin support

## Changelog

### 1.3.0
- **Fix:** Anthropic text generation returned `404` — the pinned model
  `claude-3-5-sonnet-latest` retired 2026-02-19. Now uses `claude-opus-4-8`
  (override with `ANTHROPIC_TEXT_MODEL`).
- **Add:** Automatic provider fallback to Anthropic when the primary provider
  fails (auth error, 404, or quota `429`).
- **Add:** Malformation-visible key input. The seed script and a new
  `bin/inspect-key.cjs` report a masked fingerprint plus structural issues so a
  bad paste is caught without exposing the secret; the server also warns on
  stderr at spawn if a stored key is malformed.
- **Chore:** Removed the legacy root `plugins/.mcp.json` (superseded by the
  sidecar launcher in this plugin's `.mcp.json`).

## Attribution

Sole intellectual origin, Quantum Harmony LLC. One theoretical credit: Donald O. Hebb — Hebbian learning as the foundational principle behind the KB-as-context-layer design.
