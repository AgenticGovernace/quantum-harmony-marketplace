# ATP Provenance Logging

A Claude Code plugin that enforces line-item action provenance for ATP agents.

- Mints **one parent `prov_id`** per ATP prompt; logs the prompt as the transaction root.
- Records a **child entry per action** (read / write / execute / tool call) in `agent_logs`,
  each linked via `parent_prov_id`.
- **Halts and alerts** if the provenance service is unreachable or any log write fails —
  outputs without provenance are treated as invalid.

Expects a reachable provenance service at `$PROVENANCE_SERVICE_URL` (default
`http://localhost:8787`). Pairs with `artemis-transmission-protocol`. License: Apache-2.0.
