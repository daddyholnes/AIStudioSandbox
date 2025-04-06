console.log('Testing Genkit Integration');

import * as core from '@genkit-ai/core';
import * as googleai from '@genkit-ai/googleai';

console.log('Core exports:', Object.keys(core));
console.log('GoogleAI exports:', Object.keys(googleai));

// Test genkit-googleai integration
const apiKey = core.apiKey(process.env.GOOGLE_API_KEY || 'test-key');
console.log('ApiKey type:', typeof apiKey);
console.log('ApiKey methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(apiKey)));

// Try to use the googleAI plugin
const googleAIPlugin = googleai.googleAI({ 
  apiKey: process.env.GOOGLE_API_KEY || 'test-key' 
});
console.log('Plugin type:', typeof googleAIPlugin);

// Test if defineFlow is available
console.log('defineFlow is function:', typeof core.defineFlow === 'function');