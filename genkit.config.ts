import { genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

// Define model constants
export const PRODUCTION_MODEL = 'gemini-1.5-pro';
export const EXPERIMENTAL_MODEL = 'gemini-1.5-flash';
export const VISION_MODEL = 'gemini-1.5-pro-vision';

// Function to get model instance
export const getModelInstance = (modelId: string) => {
  return googleAI.getModel(modelId);
};

// Genkit configuration
export default genkit({
  plugins: [
    googleAI({
      // Use environment variables with fallbacks (Update fallbacks if needed)
      apiKey: process.env.GEMINI_API_KEY || 'your-fallback-api-key', 
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'your-fallback-project-id',
    }),
  ],
  // Use enableTracingAndMetrics as suggested
  enableTracingAndMetrics: true, 
});