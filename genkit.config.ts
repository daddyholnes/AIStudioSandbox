import { apiKey } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

// Create a Genkit instance with Google AI plugin
const ai = apiKey(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);

// Add plugins as needed
// This function can be used to add the GoogleAI plugin to the Genkit instance
export function configureGoogleAI() {
  return googleAI({
    apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  });
}

export default ai;