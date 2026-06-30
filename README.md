# Quantum Harmony — Claude Code Plugin Marketplace

Agent infrastructure for [Artemis City](https://artemiscity.com), published by Quantum Harmony LLC.

This repository is a Claude Code plugin marketplace. The marketplace manifest lives at
`.claude-plugin/marketplace.json`; each plugin lives under `plugins/<name>/` with its own
`.claude-plugin/plugin.json`.

## Plugins

| Plugin | Version | Description |
| --- | --- | --- |
| `artemis-transmission-protocol` | 1.1.0 | Structured agent-to-agent communication via the Artemis Transmission Protocol (ATP). |
| `atp-provenance-logging` | 1.0.0 | `atp-provenance-logging` is a plugin that extends the [Artemis Transmission Protocol (ATP)](https://github.com/AgenticGovernace/AgenticGovernance-ArtemisCity) with provenance-logging capabilities. |
| `AgentScaffolder` | 1.1.0 | The Agent Scaffolder is a tool that helps you create new agents and agent-based systems. |

## Install

### From GitHub (distribution)

1. Push this repository to a **public** GitHub repo (Claude Code fetches marketplaces from Git).
2. In Claude Code:

#### Add the marketplace
```
/plugin marketplace add AgenticGovernace/quantum-harmony-marketplace
```
---
#### Add plugins from the marketplace

```
/plugin install AgentScaffolder@quantum-harmony
/plugin install atp-provenance-logging@quantum-harmony
/plugin install artemis-transmission-protocol@quantum-harmony
```
---

# Experimental Plugins

These plugins are not yet ready for production use and are subject to change.

| Plugin | Version | Description |
| --- | --- | --- |
| `AgentScaffolder` | 1.1.0 | The Agent Scaffolder is a tool that helps you create new agents and agent-based systems. |
| `atp-provenance-logging` | 1.0.0 | `atp-provenance-logging` is a plugin that extends the [Artemis Transmission Protocol (ATP)](https://github.com/AgenticGovernace/AgenticGovernance-ArtemisCity) with provenance-logging capabilities. |
| `artemis-transmission-protocol` | 1.1.0 | Structured agent-to-agent communication via the Artemis Transmission Protocol (ATP). |



## System Requirements:
* Claude Code running in **Artemis Mode**
* Claude Code running in **Developer Mode**


