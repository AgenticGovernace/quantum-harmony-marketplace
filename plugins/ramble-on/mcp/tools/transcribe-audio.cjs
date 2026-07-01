/**
 * mcp/tools/transcribe-audio.cjs
 *
 * ramble.transcribe_audio — base64 audio in, text transcript out. Provider
 * selection falls back from Anthropic (no speech) to OpenAI then Gemini.
 */

'use strict';

const { z } = require('zod');
const { transcribeAudio } = require('../clients/ai-client.cjs');

const handler = async ({ provider, audioBase64, mimeType }) => {
  const text = await transcribeAudio({ provider, audioBase64, mimeType });
  return { text };
};

module.exports = {
  name: 'ramble.transcribe_audio',
  title: 'Transcribe audio',
  description:
    'Transcribe a base64-encoded audio clip into text. Anthropic falls back to OpenAI then Gemini since Anthropic does not offer speech.',
  inputSchemaZod: {
    provider: z
      .enum(['gemini', 'openai', 'anthropic'])
      .optional()
      .describe('Override the configured default provider.'),
    audioBase64: z
      .string()
      .describe('Base64-encoded audio bytes (no data URL prefix).'),
    mimeType: z.string().describe('Audio MIME type, e.g. "audio/webm".'),
  },
  annotations: {
    title: 'Transcribe audio',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  handler,
};
