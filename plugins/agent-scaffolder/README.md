# Agent Scaffolder

A Claude Code plugin that turns a rough agent idea into (1) an **Agent Card** system prompt and
(2) a **folder scaffold** (`index.md`, `AGENTS.md`, `.codex/instructions.md`).

Its core principle: memory, reflection, and audit layers are **gated on real runtime
persistence**, so the agent never narrates continuity it can't actually keep.

Bundled `assets/` hold the card and folder templates; `references/` cover persistence tiers,
reflection patterns, the provenance hand-off, and the Notion-knowledgebase memory backend.
Plugs into `artemis-transmission-protocol` (comms) and `atp-provenance-logging` (audit).
License: Apache-2.0.
