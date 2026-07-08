---
name: agent-definition
description: >-
  Define an AI agent by building its Agent Card (Role, Mission, Output, Escalation, and persistence-gated Memory/Reflection/Audit) and writing it to agents/NAME/AGENTS.md. Use whenever the user wants to define, design, or write a system prompt, persona, behavior spec, or agent card for an agent; add an agent to a project; decide what an agent should remember, reflect on, or log; or design an audit/monitoring agent. Reads the nearest .agents/instructions.md up the tree as inherited governance it must not supersede. Owns the persistence decision (Ephemeral/Session/File-based/External) and stamps the tier onto the Card's Persistence line so any scaffolder honors it. Pairs with the project-scaffolder skill, which lays down the .agents/ governance frame this agent inherits — run it first if no governance exists. Use artemis-transmission-protocol for agent-to-agent communication, atp-provenance-logging for line-item action provenance, and Notion for persistent memory/reflection (see references/notion-memory.md).
---

# Agent Definition

## What this does

Turn a rough idea of an agent ("a CLI refactor bot," "a directory-watching audit agent")
into **one concrete thing: an Agent Card** — a complete system prompt built from a layered
formula (Role, Mission, Output Standards, Escalation, and the gated Memory / Reflection /
Audit layers) — and write it into the project as `agents/NAME/AGENTS.md`.

It does two jobs that keep the agent honest:

1. **Inherit governance.** Before defining behavior, it reads the nearest
   `.agents/instructions.md` up the directory tree — the scope's authoritative rules, laid
   down by the **project-scaffolder** skill — and treats them as governing context the
   agent must not supersede. The agent brings its own logic; where that logic would differ
   from the inherited rules, that's a maintainer decision, not a self-authorized one.
2. **Decide persistence.** It decides, explicitly, how much the agent can **remember,
   reflect on, and audit**, and gates those layers on what the runtime persists — then
   stamps the chosen tier on the Card's `Persistence:` line so downstream tooling honors it.
   The premise: memory, reflection, and audit only mean anything if there is somewhere to
   keep them.

This is the **producer** in a two-skill stack. **project-scaffolder** sets the frame (the
`.agents/` governance layer for a scope); **agent-definition** fills it with agents. The
seam is the Card's `Persistence:` line — decided once, here; honored, never re-decided, by
whatever lays the card down.

> Governance lives in `.agents/` (hidden, per-scope rules). Agents live in
> `agents/<AgentName>/` (visible homes) — that's where this skill writes `AGENTS.md`. We use
> `.agents/`, not the old `.codex/`, because "codex" now collides with a separately-named
> agent/CLI.

## When to use

- "Define / design an agent for X" / "write me a system prompt / persona / behavior spec for X"
- "Add an agent to this project" / "write me an Agent Card for X"
- "Design an audit or monitoring agent" (its behavior, boundaries, escalation)
- "How should this agent reflect / self-check / summarize its work?"
- "What should this agent remember or log?"
- Deciding the persistence model for an agent (where its state lives)

If no `.agents/` governance exists in the target scope yet, run **project-scaffolder** first
(or in the same turn) so the agent has a frame to inherit. If the user leads with "set up
the project rules / governance," that's project-scaffolder; this skill comes after.

Hand-offs to sibling skills (the stack this skill plugs into):

- **Governance frame the agent inherits** (`.agents/instructions.md`, `index.md`, `logs/`
  for a scope): use the **project-scaffolder** skill.
- **Agent-to-agent communication** (session headers, signal tags, symmetric ack/decline,
  fault-awareness): use the **artemis-transmission-protocol** skill.
- **Line-item action provenance** (one parent `prov_id` per prompt, a child entry per
  read/write/execute/tool-call in `agent_logs`, halt-and-alert if logging fails): use the
  **atp-provenance-logging** skill.
- **Persistent memory & reflection** (the agent writes reflection write-ups to its own
  Notion page and reads them back): see `references/notion-memory.md` — Notion MCP today,
  the ramble server as tier-1 when the app is running.
- **Polishing a reflection write-up** (raw → clean, voice-preserving note before it lands
  in Notion): use the **ramble-on** skill.
- **Building or extending the ramble server** (the local MCP, Go, that backs tier-1 Notion
  routing): use the **mcp-builder** skill — it must expose the `ramble.*` tool surface
  documented in `references/notion-memory.md`.

## Workflow

### 1. Gather just enough

Collect only what's needed to fill the formula. Ask for what's missing; infer sensible
defaults and state them.

- **Role + attitude** — name and voice.
- **Mission** — the task set it owns, plus explicit non-goals / boundaries.
- **Output standards** — default format and verbosity.
- **Escalation** — what to do when ambiguous, out of scope, or above a severity threshold.
- **Persistence model** — *where, if anywhere, does this agent's state live?* (See step 3.)
- **Location** — which directory this agent governs; its home will be
  `agents/<AgentName>/` under that scope.

### 2. Read the inherited governance

Find the nearest `.agents/instructions.md` up the tree from the agent's location and read
it. Those rules are authoritative context for this agent — fold them into the card's Role /
Mission / Boundaries so the agent's own behavior stays inside them. If none exists, note
that the scope is ungoverned and suggest running **project-scaffolder** first. Never write
rules into the card that contradict the inherited governance; surface the conflict to the
maintainer instead.

### 3. Set the persistence model — this gates Memory, Reflection logging, and Audit

Decide where state lives. This is the single most important call, because it determines
which layers are real and which would be theater — **and it is the one decision this skill
owns for the whole stack.** Whatever you pick gets stamped on the Card's `Persistence:`
line, and any scaffolder honors it verbatim; it never re-decides.

| Persistence model | What it means | Memory layer | Reflection | Audit / Provenance |
|---|---|---|---|---|
| **Ephemeral** (default) | one turn/session; nothing survives | omit | inline one-line self-check only | omit |
| **Session** | state held for the live session only | recall within the session | summarize at session end | optional, in-session notes |
| **File-based** | reads/writes files (logs, state) | read prior log/state files | append summaries to a reflection log on a cadence | write action log files; escalate via a high-priority log |
| **External service / DB** | a provenance service or database | backed by the store | logged as entries | use **atp-provenance-logging** (parent + child `prov_id`s) |

**Key principle:** never write a Memory, Reflection-cadence, or Audit instruction the
runtime can't honor. An "every 50 actions, summarize and recall prior state" rule on an
agent with no persistence trains it to *narrate* continuity it doesn't have — the
"hallucinated persistence" failure. Match the layer to the tier, say which tier you chose
and why, and record it on the `Persistence:` line.

**Notion knowledgebase — the recommended persistent backend.** When an agent should
remember and reflect across sessions, give it its own Notion page: it writes reflection
write-ups there and reads them back as memory. This routes through the ramble server's
local MCP when the app is running, falls back to the Notion MCP directly, then to file
logs — the same graceful-degradation stack the ramble-on skill uses. See
`references/notion-memory.md` for the page structure and the exact tool calls.

### 4. Generate the Agent Card

Fill the layers below. Layers marked *gated* are included only when step 3's tier supports
them — otherwise omit them rather than leave empty ceremony. **Always fill the
`Persistence:` line** — that line is the contract any scaffolder reads.

| Layer | Purpose | Persistence-gated? |
|-------|---------|--------------------|
| Persistence *(stamp)* | The tier from step 3 — the seam a scaffolder reads | no (always set) |
| Role | Who the agent is + attitude | no |
| Mission | Tasks it owns + prohibited tasks/boundaries | no |
| Output Standards | Format, verbosity, assumptions | no |
| Escalation Rules | Ambiguity / out-of-scope / severity threshold | no |
| Memory / Context | What to recall, and from where | **yes** — needs session/file/service |
| Reflection | Self-check + cadence summaries | **partly** — inline always; cadence needs persistence |
| Audit / Provenance *(opt)* | Log actions for trace and review | **yes** — needs a log destination |
| Version *(meta)* | Track changes over time (v1.0, v1.1…) | no |

Two card shapes:

- **Lean task agent** → `assets/agent-card.template.md` (the core layers).
- **Audit / monitoring / long-running agent** → `assets/audit-agent-card.template.md`
  (adds Purpose, Boundaries, Escalation Policy, Reflection Routine, Audit & Provenance,
  Version, Behavioral Notes).

### 5. Reflection — make it real

Reflection is a self-check, not decoration. Define it on three axes:

- **Trigger** — *after every major output* (always, even for ephemeral agents: a
  one-sentence self-check). For persistent agents, *also* on a cadence: every N actions
  (e.g., 50) or every T hours (e.g., 12).
- **Content** — what was attempted, whether assumptions were necessary, and whether
  anything drifted from the mission, boundaries, or inherited governance. For audit agents,
  a rollup of events by severity.
- **Destination** — ephemeral → inline in the response; persistent → appended to a
  reflection/summary log (and, with provenance, recorded as a line item). With a Notion
  knowledgebase, the write-up is appended to the agent's Notion page (see
  `references/notion-memory.md`); optionally polish the raw reflection into a clean note
  with the ramble-on skill before writing.

The cadence only earns its place when there's a destination to write to — otherwise drop it
and keep the inline self-check.

### 6. Audit & provenance

Add the Audit layer when the agent takes consequential actions you need to trace, runs
unattended or long, or coordinates with other agents.

- **Observe-and-log archetype:** monitoring agents observe and log but **never modify** —
  encode that as a hard boundary.
- **What to log:** each action (read / write / execute / tool call) with input, output,
  and status; plus an escalation threshold (e.g., escalate only above `Warning`).
- **Rigorous line-item provenance:** when every action must be traceable to the prompt that
  caused it, follow the **atp-provenance-logging** skill and reference it from the card. It
  expects a reachable provenance service and *halts the agent if a log write fails* — wire
  it in only when that strictness is wanted.

For the full playbook (persistence tiers in depth, reflection patterns, the provenance
hand-off, and a worked audit-agent example), read
`references/audit-reflection-persistence.md`.

### 7. Write the agent's home

Create the agent's folder and card:

- **`agents/NAME/AGENTS.md`** — from `assets/AGENTS.md.template`: the governance-
  inheritance note + the filled Agent Card + the persistence model. This is additive; it
  does **not** touch any repo-level `AGENTS.md`/`CLAUDE.md`.
- When the tier is **File-based**, also create `agents/<AgentName>/logs/` seeded from
  `assets/logs/` (action-log.jsonl + reflection-log.md), so the card's memory/audit layers
  point at a real destination.
- When the tier is **External**, wire the provenance / Notion pointer into the card's
  Persistence + Audit sections instead.

## Output

By default, write the agent's `agents/NAME/AGENTS.md` (plus `logs/` if file-based),
state which persistence tier you chose and why, which optional layers you included or
omitted, and which governance scope it inherits. If the user only wants the prompt text,
output the Card alone. Always tell the user what you created and where, and keep it
non-destructive.

## Environment-agnostic note

`AGENTS.md` is the Claude / file-based form of the card. The same Card — same layers, same
`Persistence:` stamp, same inherited governance — can be emitted for another runtime (e.g.
Anaconda Agent Studio's `pixi.toml` + `agent.yaml`) without changing the definition logic;
only the output writer differs. That's what lets a skill move between environments by
dropping in the skill files, no rewrite required.

## Templates & references

- `assets/agent-card.template.md` — lean core-layer card (with the `Persistence:` stamp)
- `assets/audit-agent-card.template.md` — expanded monitoring / audit card (with the stamp)
- `assets/AGENTS.md.template` — the per-agent home wrapper (governance note + card + persistence)
- `assets/logs/action-log.jsonl.template` — seeded action trail (file-based agents)
- `assets/logs/reflection-log.md.template` — seeded reflection log (file-based agents)
- `references/audit-reflection-persistence.md` — persistence tiers, reflection patterns,
  provenance integration, and a worked audit-agent example
- `references/notion-memory.md` — Notion-knowledgebase backend for memory & reflection
  (agent ↔ Notion page, MCP routing, exact tool calls, ramble-server drop-in)
