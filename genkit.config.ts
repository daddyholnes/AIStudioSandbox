import { defineFlow } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { apiKey } from '@genkit-ai/core';

// Create a Genkit context with Google AI plugin
const config = apiKey({
  plugins: [googleAI({
    apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  })]
});

export default config;