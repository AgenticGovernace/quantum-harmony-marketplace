.DEFAULT_GOAL := help

# ── MCP Sidecar component Makefile ─────────────────────────────
# Targets scoped to the MCP server only. Root Makefile orchestrates
# this from `make dev` / `make check` / `make security`.

NODE       := node
ROOT_NPM   := cd .. && npm

# ── Setup ─────────────────────────────────────────────────────
.PHONY: install
install:                 ## MCP shares root node_modules; no-op
	@echo "[mcp] shares root node_modules; install via root \`make install\`"

# ── Run ───────────────────────────────────────────────────────
.PHONY: start-stdio start-http
start-stdio:             ## Launch MCP server with stdio transport (the sidecar entry)
	$(NODE) bin/stdio.cjs

start-http:              ## Launch MCP server with Streamable HTTP transport (port 3748)
	$(NODE) bin/http.cjs

# ── Quality ───────────────────────────────────────────────────
.PHONY: test format security clean
test:                    ## Run MCP tests (currently run via root vitest)
	@$(ROOT_NPM) run test

format:                  ## Format MCP files via root Prettier
	@$(ROOT_NPM) run format

security:                ## Security check (delegates to root)
	@$(ROOT_NPM) audit --audit-level=high

# ── Cleanup ───────────────────────────────────────────────────
clean:                   ## MCP has no build artifacts in the Electron track
	@echo "[mcp] no build artifacts to clean"

# ── Help ──────────────────────────────────────────────────────
.PHONY: help
help:                    ## Show this help
	@echo "MCP Sidecar — Make targets"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
