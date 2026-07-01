/**
 * mcp/tools/generate-video.cjs
 *
 * ramble.generate_video — Gemini Veo video generation. The polling and
 * file download both happen on the sidecar so the API key never crosses
 * the bridge boundary in a URL. The video bytes are returned base64-encoded
 * so they fit inside the MCP JSON envelope.
 */

'use strict';

const { z } = require('zod');
const { generateVideo } = require('../clients/ai-client.cjs');

const handler = async ({ prompt }) => {
  const { buffer, contentType } = await generateVideo({ prompt });
  const base64 = Buffer.from(buffer).toString('base64');
  return { contentType, bufferBase64: base64 };
};

module.exports = {
  name: 'ramble.generate_video',
  title: 'Generate video (Gemini Veo)',
  description:
    'Generate a short video for a prompt using Gemini Veo. Returns the downloaded bytes as base64 so the API key never traverses the wire in a URL.',
  inputSchemaZod: {
    prompt: z.string().describe('The video-generation prompt.'),
  },
  annotations: {
    title: 'Generate video (Gemini Veo)',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  handler,
};
