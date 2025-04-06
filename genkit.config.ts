import { apiKey } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

// Create a Genkit instance with Google AI plugin
const config = apiKey({
  plugins: [googleAI()],
  projectId: process.env.GCLOUD_PROJECT || 'ai-studio-sandbox'  // Auto-detected from credentials
});

export default config;