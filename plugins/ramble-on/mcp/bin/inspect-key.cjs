#!/usr/bin/env node
/**
 * mcp/bin/inspect-key.cjs
 *
 * Reads a secret from STDIN (never argv — argv is visible in `ps`) and prints
 * a malformation report to STDOUT: a masked fingerprint (public scheme prefix
 * + length) plus any structural issues. The secret itself is never echoed.
 *
 * Usage:  printf '%s' "$value" | node bin/inspect-key.cjs NOTION_API_KEY
 * Exit:   0 if the key looks well-formed, 1 if malformed/empty.
 *
 * Mirrors the desktop app's init flow (scripts/init.mjs) so the user can see
 * whether a key is malformed without revealing the secret — matching how the
 * app masks key input while still surfacing paste mistakes.
 */

'use strict';

// Suppress env.cjs's own load-time key warnings; this tool IS the report.
process.env.RAMBLE_SUPPRESS_KEY_WARN = '1';

const { inspectApiKey } = require('../env.cjs');

const readStdin = () =>
  new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
  });

const main = async () => {
  const name = process.argv[2];
  if (!name) {
    process.stderr.write('usage: inspect-key.cjs <KEY_NAME>  (value on stdin)\n');
    process.exit(2);
  }

  // Strip a single trailing newline from the piped value (shell `printf` adds
  // none, but `echo`/heredoc do). Leave interior/leading whitespace intact so
  // genuine malformation still shows.
  const raw = (await readStdin()).replace(/\n$/, '');
  const report = inspectApiKey(name, raw);

  if (!report.present) {
    process.stdout.write(`  ${name}: skipped (no value entered)\n`);
    process.exit(1);
  }

  if (report.ok) {
    process.stdout.write(`  ${name}: OK  ${report.fingerprint}\n`);
    process.exit(0);
  }

  process.stdout.write(`  ${name}: MALFORMED  ${report.fingerprint}\n`);
  for (const issue of report.issues) {
    process.stdout.write(`    - ${issue}\n`);
  }
  process.exit(1);
};

main();
