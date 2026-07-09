/**
 * mcp/env.cjs
 *
 * Environment + provider configuration used by the MCP server and its
 * external clients. Owns env-file loading, provider normalization, API key
 * lookup, and default model identifiers.
 */

'use strict';

const fs = require('fs');

const loadLocalEnvFiles = () => {
  for (const fileName of ['.env.local', 'env.local']) {
    try {
      const content = fs.readFileSync(fileName, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !(key in process.env)) {
          process.env[key] = val;
        }
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
};

loadLocalEnvFiles();

/**
 * Normalizes a provider identifier into one of the supported text backends.
 *
 * @param {string | undefined} provider The provider string to normalize.
 * @returns {'gemini' | 'openai' | 'anthropic'} The normalized provider name.
 */
const normalizeProvider = (provider) => {
  if (provider === 'openai' || provider === 'anthropic') {
    return provider;
  }
  return 'gemini';
};

const CONFIG = {
  port: Number(process.env.RAMBLE_MCP_PORT) || 3748,
  defaultProvider: normalizeProvider(process.env.AI_PROVIDER),
  models: {
    gemini: process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-pro',
    openai: process.env.OPENAI_TEXT_MODEL || 'gpt-4.1-mini',
    // claude-3-5-sonnet-latest was retired 2026-02-19 (returns 404). Anthropic
    // is the cross-provider fallback in ai-client.cjs, so this must resolve.
    anthropic:
      process.env.ANTHROPIC_TEXT_MODEL || 'claude-opus-4-8',
  },
  notion: {
    apiBase: 'https://api.notion.com/v1',
    version: '2022-06-28',
    rootPage:
      process.env.RAMBLE_NOTION_ROOT || '2fe5c4d6-320e-8044-8797-d11505ac452d',
  },
};

// Structural expectations per secret. Mirrors the app's init.mjs key list so
// the MCP seed flow and the desktop app agree on what a valid key looks like.
// These describe the PUBLIC scheme of each token, never the secret material.
const KEY_SPECS = {
  NOTION_API_KEY: { label: 'Notion integration token', prefixes: ['ntn_', 'secret_'], minLen: 40 },
  GEMINI_API_KEY: { label: 'Google Gemini', prefixes: ['AIza'], minLen: 30 },
  OPENAI_API_KEY: { label: 'OpenAI', prefixes: ['sk-'], minLen: 40 },
  ANTHROPIC_API_KEY: { label: 'Anthropic', prefixes: ['sk-ant-'], minLen: 40 },
};

// Non-reversible fingerprint: public scheme prefix + length only. The
// high-entropy tail is never shown. Reveals malformation (a captured
// `export …` line, a `NAME=value` paste) without exposing the secret.
const maskedFingerprint = (value) => {
  const n = value.length;
  if (n === 0) return '(empty)';
  if (n <= 8) return `${'•'.repeat(n)} (len ${n})`;
  return `${value.slice(0, 8)}… (len ${n})`;
};

/**
 * Inspects an API key's structure so the user can see whether it is malformed
 * without printing the secret. Used by the seed script (bin/inspect-key.cjs)
 * and at load time below.
 *
 * @param {string} name Env var name, e.g. "NOTION_API_KEY".
 * @param {string} rawValue The value to inspect.
 * @returns {{name: string, label: string, present: boolean, ok: boolean, fingerprint: string, issues: string[]}}
 */
const inspectApiKey = (name, rawValue) => {
  const value = String(rawValue ?? '');
  const spec = KEY_SPECS[name] || { label: name, prefixes: [], minLen: 1 };

  if (value.length === 0) {
    return { name, label: spec.label, present: false, ok: false, fingerprint: '(empty)', issues: ['missing'] };
  }

  const issues = [];
  if (value !== value.trim()) issues.push('has leading/trailing whitespace');
  if (/^export\s/i.test(value)) issues.push("starts with 'export ' — paste only the token, not the whole shell line");
  if (/^[A-Za-z0-9_]+=/.test(value)) issues.push("looks like 'NAME=value' — paste only the value after '='");
  if (/^["'].*["']$/.test(value)) issues.push('is wrapped in quotes — remove them');
  if (/\s/.test(value.trim())) issues.push('contains an internal space or newline');
  if (spec.prefixes.length && !spec.prefixes.some((p) => value.startsWith(p))) {
    issues.push(`expected to start with ${spec.prefixes.map((p) => `"${p}"`).join(' or ')}`);
  }
  if (value.length < spec.minLen) issues.push(`shorter than expected (len ${value.length} < ${spec.minLen})`);

  return { name, label: spec.label, present: true, ok: issues.length === 0, fingerprint: maskedFingerprint(value), issues };
};

// At load, surface any malformed key on stderr (stdout is the JSON-RPC channel).
// This is the guard that would have caught a Notion token stored with an
// `export ` prefix immediately, instead of a runtime "API token is invalid".
const warnOnMalformedKeys = () => {
  for (const name of Object.keys(KEY_SPECS)) {
    const value = process.env[name];
    if (!value) continue;
    const report = inspectApiKey(name, value);
    if (!report.ok) {
      process.stderr.write(
        `[ramble-on] WARNING: ${name} looks malformed (${report.fingerprint}): ${report.issues.join('; ')}. ` +
          `Re-seed with bin/seed-keychain.sh.\n`,
      );
    }
  }
};

// The inspect-key tool sets this so its own reports aren't duplicated by the
// module load-time warning.
if (!process.env.RAMBLE_SUPPRESS_KEY_WARN) warnOnMalformedKeys();

/**
 * Returns the configured API key for the requested provider.
 *
 * @param {'gemini' | 'openai' | 'anthropic'} provider The provider to look up.
 * @returns {string} The configured API key or an empty string when missing.
 */
const getApiKey = (provider) => {
  if (provider === 'openai') {
    return process.env.OPENAI_API_KEY || '';
  }
  if (provider === 'anthropic') {
    return process.env.ANTHROPIC_API_KEY || '';
  }
  return process.env.GEMINI_API_KEY || process.env.API_KEY || '';
};

/**
 * Ensures an API key exists for the requested provider before use.
 *
 * @param {'gemini' | 'openai' | 'anthropic'} provider The provider being used.
 * @returns {string} The validated API key.
 */
const requireApiKey = (provider) => {
  const apiKey = getApiKey(provider);
  if (!apiKey) {
    throw new Error(`Missing API key for provider "${provider}".`);
  }
  return apiKey;
};

/**
 * Returns the Notion API token or throws if unset.
 *
 * @returns {string} The Notion API token.
 */
const requireNotionToken = () => {
  const token = process.env.NOTION_API_KEY;
  if (!token) {
    throw new Error('NOTION_API_KEY not set. Add it to .env.local');
  }
  return token;
};

module.exports = {
  CONFIG,
  normalizeProvider,
  getApiKey,
  requireApiKey,
  requireNotionToken,
  inspectApiKey,
  KEY_SPECS,
};
