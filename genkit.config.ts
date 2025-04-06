import * as core from '@genkit-ai/core';
import * as googleai from '@genkit-ai/googleai';

// Get API Key from environment
const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY environment variable is not set');
}

// Create API Key object using available method
const apiKeyObj = core.apiKey(apiKey);

// Create the Google AI plugin
const googleAIPlugin = googleai.googleAI({ apiKey });

// Export the configuration with proper error handling
export { core, googleAIPlugin, apiKeyObj };

export default {
  z: core.z,
  defineFlow: core.defineFlow,
  googleAI: googleAIPlugin
};