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

// Explicit named exports
export const PRODUCTION_MODEL = 'gemini-1.5-pro';
export const EXPERIMENTAL_MODEL = 'gemini-1.5-flash';
export const VISION_MODEL = 'gemini-1.5-pro-vision';

// Model instance factory
export const getModelInstance = (modelId: string) => {
  return googleAIPlugin.getModel(modelId);
};

// Export the configuration with proper error handling
export { core, googleAIPlugin, apiKeyObj };

// Default export for Genkit configuration
export default core.genkit({
  plugins: [
    googleAIPlugin
  ],
  enableTracing: true
});