---
name: atp-provenance-logging
description: Create a parent provenance ID for each ATP prompt and log every agent action (tool calls, reads, writes, executes) as child entries in agent_logs with parent_prov_id linking back to the ATP prompt.
---

# ATP Provenance Logging

## When to use
Use this skill whenever the user requests ATP/Artemis protocol **and** wants provenance logging, or when the task requires line-item tracking for each agent action (tool calls, reads, writes, executes) in the `agent_logs` table.

## Workflow (robust and enforced)
### 0) Preconditions and scope
- The provenance service must be reachable at `$PROVENANCE_SERVICE_URL` (default `http://localhost:8787`).
- If the service is unavailable, **do not proceed with actions**. Trigger an immediate human alert and ask for remediation.
- Do not log secrets. Apply redaction to any tokens, keys, or credentials.

### 1) Mint the ATP parent provenance ID
- Attempt to mint the parent ID via the local service:
  - `POST $PROVENANCE_SERVICE_URL/mint`
- If non-2xx or request fails:
  - **Immediate alert to human user** that provenance is unavailable.
  - **Stop execution** until resolved (no further actions are valid without parent `prov_id`).
- This parent `prov_id` represents the ATP prompt transaction root.

### 2) Emit ATP header and embed the parent prov_id
- Always output the ATP header first.
- Add the parent `prov_id` to the ATP header:
  - Recommended location: append `prov_id=<uuid>` to `[[Special Instructions]]`.
  - If `[[Special Instructions]]` already has content, append with `; prov_id=<uuid>`.
- If the user supplied a header, preserve their values and only add the `prov_id`.

### 3) Log the ATP prompt line item (required)
Insert **one** line item for the ATP prompt root:
- `prov_id`: parent ID
- `parent_prov_id`: null
- `actor`: "Codex" (or the current agent name)
- `model`: model identifier if known
- `phase`: `"atp_prompt"`
- `input`: sanitized user prompt + any context sources used (file paths, tool names)
- `output`: ATP header + short intent/plan summary
- `status`: `"ok"` unless an error occurs
- `tags`: `["atp", "prompt"]`

If this log write fails:
- **Immediate alert to human user**.
- **Stop execution** (all outputs without provenance are invalid).

### 4) For every action, create a child provenance entry (required)
For **each** action performed after the ATP prompt, create a **new** child `prov_id` linked to the parent:
- **Action types** (each is a line item):
  - File read
  - File write
  - Tool call (MCP tools, shell commands, etc.)
  - Execution steps (tests, builds, scripts)
- **Child log fields**:
  - `prov_id`: new UUID per action
  - `parent_prov_id`: parent ATP `prov_id`
  - `actor`: "Codex" or specific tool name (e.g., `"shell_command"`)
  - `phase`: one of `"read_file"`, `"write_file"`, `"execute_command"`, `"tool_call"`, or more specific phase labels
  - `input`: minimal, sanitized parameters (file paths, command, tool args)
  - `output`: brief success summary or error
  - `status`: `"ok"`, `"error"`, or `"retry"`
  - `tags`: include action tag `["read"]`, `["write"]`, `["execute"]`, `["tool"]`

If any child log write fails:
- **Immediate alert to human user**.
- **Stop execution** (subsequent outputs are invalid).
- Note: agents that continue without provenance are subject to reduced trust scores and workflow blocking; the agent does not know the score.

### 5) Log errors with lineage preserved
- If any action fails, log that failure as a child entry with:
  - `status`: `"error"`
  - `error`: error message
  - `tags`: include `"error"`
- Maintain parent linkage regardless of error.

### 6) Log the ATP response (required)
At the end of the task, log a final child entry:
- `prov_id`: new UUID
- `parent_prov_id`: ATP parent `prov_id`
- `phase`: `"atp_response"`
- `output`: summary of response or key actions taken
- `status`: `"ok"` or `"error"`
- `tags`: `["atp", "response"]`

If this log write fails:
- **Immediate alert to human user**.
- **Stop execution** (response is invalid without provenance).

### 7) Logging transport and payload shape
Send logs to:
- `POST $PROVENANCE_SERVICE_URL/log`

Payload shape:
```
{
  "prov_id": "uuid",
  "parent_prov_id": "uuid-or-null",
  "actor": "Codex",
  "model": "gpt-5",
  "phase": "read_file",
  "input": {"path": "src/index.ts"},
  "output": {"summary": "read ok"},
  "status": "ok",
  "error": null,
  "latency_ms": 12,
  "cost_usd": null,
  "tags": ["read"]
}
```

### 8) Required guarantees
- Exactly **one** parent `prov_id` per ATP prompt.
- Every subsequent action must have a unique child `prov_id` and `parent_prov_id` set to the ATP parent.
- All actions must be represented as line items in `agent_logs`.
- Any missing provenance invalidates the output and triggers human review.

### 9) Governance posture
- Agents must assume continuous monitoring, logging, and review.
- Agents should not infer whether a prompt is routine or disqualifying; treat all prompts as evaluation-grade.
- The orchestration agent and humans define alerting/monitoring mechanisms; do not speculate on those systems.

## Notes
- If logging fails at any point, **halt execution and alert**. Do not continue without provenance.
- Keep content minimal; avoid logging secrets. Use redaction for any tokens/keys.
- Prefer `actor` naming consistency so rollups are clean (e.g., "Codex", "shell_command", "mcp__supabase").
