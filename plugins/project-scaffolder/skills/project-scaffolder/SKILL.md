---
name: project-scaffolder
description: >-
  Scaffold the governance frame for a project or a folder within it: a `.agents/` layer with `instructions.md` (the immutable, non-supersedable rules for that scope), `index.md` (a per-directory README), and a seeded `logs/` dir (action-log.jsonl + reflection-log.md) for provenance and reflection. Use whenever the user wants to set up governance, the `.agents/` layer, project rules, or an agent scope for a repo or subdirectory, or to establish the rules agents must follow before defining them. Stackable and directory-scoped: run it at the repo root for global rules, or in any subfolder (docs/, src/, kb/) for domain-specific governance that inherits and extends the parent. Non-destructive — writes a `.agents/` folder and never clobbers an existing root AGENTS.md/CLAUDE.md. Framework-agnostic (Claude Code, Anaconda, any runtime). Sets up the frame only; to define individual agents that inherit this governance, hand off to the agent-definition skill. Pairs with atp-provenance-logging for line-item provenance.
---

# Project Scaffolder

## What this does

Lay down the **governance frame** for a scope — a repo, or any folder inside it — so that
agents created there have durable, location-aware rules to inherit. It creates a `.agents/`
directory containing:

- **`instructions.md`** — the immutable behavior rules for this scope (the "must"). These
  are authoritative and are not to be superseded by an individual agent; deviations are a
  maintainer decision.
- **`index.md`** — a per-directory README: what this location is, what lives here, how to
  use it.
- **`logs/`** — seeded `action-log.jsonl` and `reflection-log.md`, so provenance and
  reflection have a real destination from the start.

This is the **personality / structural layer** of the stack. It sets the *minimum
requirements for governance* — how an agent must behave and how its work gets reviewed —
without dictating the mechanics of how any particular agent thinks. An agent comes in later
(via **agent-definition**), brings its own logic, and slots into this frame; the frame is
agnostic of where the agent comes from.

**This skill does not define agents.** It never writes an agent card. Per-agent
`AGENTS.md` files are produced by the **agent-definition** skill, which reads the nearest
`.agents/instructions.md` up the tree as its governance context.

> Naming note: governance lives in the hidden `.agents/` directory; individual agent homes
> live in the visible `agents/<name>/` directory (written by agent-definition). The two sit
> side by side on purpose — config vs. agent homes. We use `.agents/` (not the old
> `.codex/`) because "codex" now collides with a real, separately-named agent/CLI; `.agents/`
> is unambiguous and reads as what it is.

## When to use

- "Set up governance / the `.agents/` layer / project rules for this repo"
- "Establish the rules an agent must follow here before I define any agents"
- "Lock this folder (docs/, src/, kb/) to its own domain rules"
- "Give this directory an index.md + a logs/ audit trail"
- Any time you want the *frame* in place — the per-agent cards come later

If the user wants to define an actual agent (its Role/Mission/persona, its `AGENTS.md`),
that's the **agent-definition** skill — hand off after (or before) scaffolding. If they lead
with "define an agent for X," start there; it will look up the tree for the governance this
skill lays down.

## Stackable governance — the scope cascade

Governance is not a one-time root setup. Run this skill in **any** directory and it scaffolds
`.agents/` *there*, scoped to that directory and everything beneath it. Scopes stack:

```
repo/
├── .agents/                 ← global governance (rules for the whole repo)
│   ├── instructions.md
│   ├── index.md
│   └── logs/
├── docs/
│   ├── .agents/             ← docs-domain governance (inherits + extends the root)
│   │   ├── instructions.md
│   │   ├── index.md
│   │   └── logs/
│   └── agents/DocWriter/AGENTS.md      ← agent (from agent-definition)
└── src/
    ├── .agents/             ← code-domain governance
    │   ├── instructions.md
    │   ├── index.md
    │   └── logs/
    └── agents/RefactorBot/AGENTS.md    ← agent (from agent-definition)
```

Broad-to-specific: a nested `.agents/instructions.md` **adds** domain rules on top of its
parents; it does not silently overrule them. This is how you domain-lock agents — a docs
agent and a code agent each governed for their own discipline, both under the umbrella of
the repo-wide rules. An agent reads the **nearest** `.agents/` up the tree as its governance,
inheriting parents above it.

Per-directory `index.md` is the other half: it tells you what's in *that* folder. If you want
an agent to act differently within a sub-folder, scaffold that folder (this skill) and then
define an agent there (agent-definition) — a maintainer decision, made by calling these
skills in sequence.

## Workflow

### 1. Determine the scope

Which directory is this governance for? Default to the current working directory. Confirm
whether it's the **root** scope (no parent `.agents/`) or a **nested** scope that inherits
from a parent — that changes what `instructions.md` says it inherits from.

### 2. Check before you write — stay non-destructive

Inspect the target directory first. **Never clobber an existing `AGENTS.md` or `CLAUDE.md`**
at the root — those are often a repo guide for any agent, a different thing from this
governance layer. This skill writes a `.agents/` folder, which is additive and sits
alongside them. If a `.agents/` already exists here, extend it rather than overwrite;
confirm with the user before changing existing rules.

### 3. Write the `.agents/` frame

Using the templates in `assets/`, create in the target directory:

- **`.agents/instructions.md`** — from `instructions.md.template`. Fill in the scope name,
  what it governs, what it inherits from, and the baseline rules that fit this scope. Keep
  the authority statement: these rules aren't superseded by an individual agent; deviations
  are a maintainer decision.
- **`.agents/index.md`** — from `index.md.template`. A brief README for this directory.
- **`.agents/logs/action-log.jsonl`** and **`.agents/logs/reflection-log.md`** — from the
  templates in `assets/logs/`, seeded so the audit trail and reflection log point at a real
  destination (never empty ceremony).

### 4. Explain propagation and the hand-off

Tell the user what scope this governs, what it inherits, and that agents defined here (via
**agent-definition**) will read this `.agents/instructions.md` as their governance and write
their cards to `per-agent agents/NAME/AGENTS.md files`. If they want another scope locked (a subfolder,
a sibling domain), run this skill again there.

## Output

By default, write the real `.agents/` frame into the target directory and tell the user
exactly what you created and where, which scope it governs, and what it inherits. If the user
only wants the rules text, output `instructions.md` alone. Always keep it non-destructive —
report if you skipped writing over an existing file.

## Environment-agnostic note

The `.agents/` governance frame is pure structure and works in any runtime — Claude Code,
Anaconda Agent Studio, or otherwise. It is the part of the stack that *doesn't* change
between environments. What changes per environment is the agent card the **agent-definition**
skill emits (a file-based `AGENTS.md` for Claude, a `pixi.toml` / `agent.yaml` for Anaconda),
so a skill can be moved between environments by dropping in the skill files, no rewrite of
the governance layer required.

## Templates

- `assets/instructions.md.template` — the scope's immutable governance rules
- `assets/index.md.template` — per-directory README
- `assets/logs/action-log.jsonl.template` — seeded action trail
- `assets/logs/reflection-log.md.template` — seeded reflection log
