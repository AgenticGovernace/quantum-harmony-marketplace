/**
 * mcp/tools/generate-text.cjs
 *
 * ramble.generate_text — primitive text-completion tool. Unlike the
 * domain-specific tools (`ramble.translate`, `ramble.to_atp`, etc.) which
 * build their own prompts and target external MCP clients, this tool is a
 * thin pass-through to `ai-client.generateText`. The renderer (via
 * Electron's bridge) uses this so it can keep full control of the prompt
 * and structured-output schema, while still routing every call through
 * the sidecar — keys never enter Electron.
 */

'use strict';

const { z } = require('zod');
const { generateText } = require('../clients/ai-client.cjs');

const handler = async ({ provider, prompt, geminiConfig }) => {
  const text = await generateText({ provider, prompt, geminiConfig });
  return { text };
};

module.exports = {
  name: 'ramble.generate_text',
  title: 'Generate text (primitive)',
  description:
    'Low-level text completion. Accepts a raw prompt and an optional Gemini structured-output config. Intended for the in-app renderer; external clients should prefer ramble.translate / to_atp / to_platform_post.',
  inputSchemaZod: {
    provider: z
      .enum(['gemini', 'openai', 'anthropic'])
      .optional()
      .describe('Override the configured default provider.'),
    prompt: z.string().describe('The prompt to send to the provider.'),
    geminiConfig: z
      .object({
        responseMimeType: z.string().optional(),
        responseSchema: z.any().optional(),
      })
      .passthrough()
      .optional()
      .describe('Gemini-only structured-output config (responseMimeType + responseSchema). Ignored by OpenAI/Anthropic.'),
  },
  annotations: {
    title: 'Generate text (primitive)',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  handler,
};
