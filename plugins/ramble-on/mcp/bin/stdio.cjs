#!/usr/bin/env node
/**
 * mcp/bin/stdio.cjs
 *
 * Stdio entry point for the Ramble On MCP server. This is what an MCP-aware
 * client (Claude Desktop, Codex CLI, an internal Electron client spawned by
 * `electron/main.cjs`) launches as a child process. JSON-RPC traffic flows
 * over stdin/stdout; everything else (logs, diagnostics) is forced to stderr
 * so it never corrupts the protocol stream.
 *
 * Run via:
 *   npm run mcp:stdio
 * or registered in `.mcp.json` so any compliant client spawns it.
 */

'use strict';

// stdout is the JSON-RPC channel — never write logs to it. Redirect every
// console method that defaults to stdout (`log`, `info`, `debug`) so any
// existing logging in the server / tools is funnelled to stderr instead.
console.log = (...args) => console.error(...args);
console.info = (...args) => console.error(...args);
console.debug = (...args) => console.error(...args);

const {
  StdioServerTransport,
} = require('@modelcontextprotocol/sdk/server/stdio.js');
const { createMcpServer, SERVER_INFO } = require('../index.cjs');

const main = async () => {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  transport.onerror = (err) => {
    console.error('[ramble-on MCP stdio] Transport error:', err);
  };

  const shutdown = async (signal) => {
    console.error(`[ramble-on MCP stdio] Received ${signal}, shutting down.`);
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await server.connect(transport);
  console.error(
    `[ramble-on MCP stdio] ${SERVER_INFO.name}@${SERVER_INFO.version} ready (stdin/stdout JSON-RPC).`,
  );
};

main().catch((err) => {
  console.error('[ramble-on MCP stdio] Fatal startup error:', err);
  process.exit(1);
});
