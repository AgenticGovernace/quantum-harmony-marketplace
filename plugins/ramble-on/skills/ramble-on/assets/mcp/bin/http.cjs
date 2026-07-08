#!/usr/bin/env node
/**
 * mcp/bin/http.cjs
 *
 * HTTP entry point for the Ramble On MCP server. Useful for browser-style
 * clients and for local development testing (`curl http://127.0.0.1:3748/health`).
 * The Streamable HTTP transport is what `electron/main.cjs` currently spins up
 * in-process; this entry point lets the same server run standalone.
 *
 * Run via:
 *   npm run mcp:http
 */

'use strict';

const { startMcpServer, stopMcpServer } = require('../index.cjs');

const main = async () => {
  const server = await startMcpServer();
  if (!server) {
    console.error('[ramble-on MCP http] Server did not start (port in use).');
    process.exit(1);
  }

  const shutdown = async (signal) => {
    console.error(`[ramble-on MCP http] Received ${signal}, shutting down.`);
    await stopMcpServer().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

main().catch((err) => {
  console.error('[ramble-on MCP http] Fatal startup error:', err);
  process.exit(1);
});
