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
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | No | Alternate providers |
| `AI_PROVIDER` | No | Override the default provider (not a secret) |
| `RAMBLE_NOTION_ROOT` | No | Override the default Ramble On root page ID (not a secret) |

## Graceful degradation

The skill works at three tiers — the server is an amplifier, not a dependency:

1. **`ramble.*` tools available** → full signal, full KB, full voice model
2. **Notion MCP connected, no server** → good signal, live KB, no local persistence
3. **Neither** → capable instruction-based translation, no personal context

## Requirements

- Node 18+
- Claude Code with plugin support

## Attribution

Sole intellectual origin, Quantum Harmony LLC. One theoretical credit: Donald O. Hebb — Hebbian learning as the foundational principle behind the KB-as-context-layer design.
