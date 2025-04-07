// Use main package export 'genkit' instead of '@genkit-ai/core'
import { genkit } from 'genkit'; 
import { googleAI } from '@genkit-ai/googleai';

// Define model constant
export const PRODUCTION_MODEL = 'gemini-1.5-pro';
// Remove unused model constants
// export const EXPERIMENTAL_MODEL = 'gemini-1.5-flash';
// export const VISION_MODEL = 'gemini-1.5-pro-vision';

// Update function to get model instance using googleAI.getModel
export const getModelInstance = (modelId: string) => googleAI.getModel(modelId);

// Update Genkit configuration for Genkit 1.x
export default genkit({
  plugins: [
    googleAI({
      // Use environment variables directly
      apiKey: process.env.GEMINI_API_KEY, 
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
    }),
  ],
  // Ensure enableTracingAndMetrics is set
  enableTracingAndMetrics: true, 
});