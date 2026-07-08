# Quantum Harmony — Claude Code Plugin Marketplace

Agent infrastructure for [Artemis City](https://artemiscity.com), published by Quantum Harmony LLC.

A Claude Code plugin marketplace. The manifest lives at `.claude-plugin/marketplace.json`; each
plugin lives under `plugins/<name>/` with its own `.claude-plugin/plugin.json`.

## Plugins

| Plugin | Version | Description |
| --- | --- | --- |
| `artemis-transmission-protocol` | 1.1.0 | Structured agent-to-agent communication via ATP. |
| `atp-provenance-logging` | 1.0.0 | Line-item action provenance (parent + child `prov_id` in `agent_logs`; halt-and-alert on log failure). |
| `agent-scaffolder` | 1.0.0 | Scaffold AI agents from an Agent Card; generates system prompts + `index.md` / `AGENTS.md` / `.codex/instructions.md`. |
| `agent-definition` | 1.0.0 | Build an Agent Card and write it to `agents/NAME/AGENTS.md`, inheriting parent `.agents` governance. |
| `project-scaffolder` | 1.0.0 | Scaffold a project's `.agents/` governance frame (`instructions.md`, `index.md`, seeded `logs/`). |
| `ramble-on` | 1.0.0 | Signal-translation: raw brain dumps to structured, voice-preserving output; bundles the ramble MCP server. |

**The stack:** `project-scaffolder` lays the governance frame → `agent-definition` / `agent-scaffolder`
define agents → `artemis-transmission-protocol` carries messages between them → `atp-provenance-logging`
records every action → `ramble-on` polishes reflections into the Notion KB.

## Install

```
/plugin marketplace add <source>          # owner/repo, git URL, marketplace.json URL, or local path
/plugin install artemis-transmission-protocol@quantum-harmony
/plugin install agent-scaffolder@quantum-harmony
# …repeat for any plugin above
```

`<source>` accepts a GitHub `owner/repo` shorthand, a git URL, a remote URL to this
`marketplace.json`, or a **local directory path** (no GitHub or auth needed). For a private/internal
repo, the most reliable route is to clone it and add the local path, then `git pull` to update.

### Local testing (no GitHub)

```
/plugin marketplace add /absolute/path/to/quantum-harmony-marketplace
claude --plugin-dir /absolute/path/to/quantum-harmony-marketplace/plugins/ramble-on   # single plugin
```

## Validate before publishing

```
claude plugin validate ./plugins/<name>
```

## Adding more plugins later

Create `plugins/<new>/.claude-plugin/plugin.json`, drop components alongside it
(`skills/`, `agents/`, `hooks/`, `.mcp.json`), and add an entry to the `plugins` array in
`.claude-plugin/marketplace.json`.
