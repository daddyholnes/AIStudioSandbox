/**
 * Genkit Integration Test
 * 
 * === Installation Steps ===
 * 1. Install Node.js 18+ from https://nodejs.org/
 * 2. Install dependencies:
 *    npm install @genkit-ai/core @genkit-ai/googleai
 * 
 * === Running the Test ===
 * 1. Set your Gemini API key (optional but recommended):
 *    - Windows: set GEMINI_API_KEY=your_api_key_here
 *    - Mac/Linux: export GEMINI_API_KEY=your_api_key_here
 * 2. Run the test:
 *    node test-genkit.js
 * 
 * === Expected Output ===
 * The test will verify:
 * - Proper loading of Genkit modules
 * - API key configuration
 * - Plugin initialization
 * - Flow definition capability
 */

console.log('Testing Genkit Integration');

import * as core from '@genkit-ai/core';
import * as googleai from '@genkit-ai/googleai';

// Log available exports to help with debugging
console.log('Core exports:', Object.keys(core));
console.log('GoogleAI exports:', Object.keys(googleai));

// 1. Environment Configuration - use GEMINI_API_KEY as shown in debug output
const ENV_VAR = 'GEMINI_API_KEY';
const apiKeyValue = process.env[ENV_VAR] || 'test-key';
console.log(`Using API key from ${ENV_VAR} environment variable:`, apiKeyValue ? '✓ Key found' : '✗ Using test key');

try {
  // 2. Create API Key with the correct method
  const apiKeyObj = core.apiKey(apiKeyValue);
  console.log('API Key object created successfully:', typeof apiKeyObj === 'function');
  
  // 3. Create the Google AI plugin instance using googleAI from the exports
  const modelPlugin = googleai.googleAI({ apiKey: apiKeyValue });
  console.log('Google AI plugin initialized:', !!modelPlugin);
  
  // 4. Check for specific models available in googleai package
  console.log('Available model functions:');
  ['gemini20Flash', 'gemini15Pro', 'textEmbedding004'].forEach(model => {
    if (typeof googleai[model] === 'function') {
      console.log(`- ${model}: ✓ Available`);
    } else {
      console.log(`- ${model}: ✗ Not available`);
    }
  });
  
  // 5. Test flow definition with the correct method from core
  if (typeof core.defineFlow === 'function') {
    // Based on debug output, defineFlow exists but needs correct parameters
    try {
      const testFlow = core.defineFlow({
        name: 'testFlow',
        description: 'Genkit test flow',
        run: async (input) => {
          return { 
            success: true, 
            message: `Processed input successfully` 
          };
        }
      });
      
      console.log('Flow definition successful:', typeof testFlow === 'function');
      
      // Try executing the flow if it was created successfully
      if (typeof testFlow === 'function') {
        console.log('Attempting to execute test flow...');
        try {
          const result = await testFlow('test input');
          console.log('Flow execution result:', result);
        } catch (execError) {
          console.error('Flow execution error:', execError.message);
        }
      }
    } catch (flowError) {
      console.error('Error defining flow:', flowError.message);
      console.log('The defineFlow function might require different parameters in this version.');
    }
  } else {
    console.log('defineFlow is not available in this version');
  }
  
  // 6. Test Z schema validation if available
  if (core.z) {
    console.log('Z schema validation is available');
    try {
      const schema = core.z.object({
        name: core.z.string(),
        age: core.z.number().optional()
      });
      console.log('Schema creation successful:', !!schema);
    } catch (schemaError) {
      console.error('Schema creation error:', schemaError.message);
    }
  } else {
    console.log('Z schema validation is not available');
  }
  
} catch (error) {
  console.error('Error during Genkit testing:', error.message);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
}

console.log('Genkit integration test completed');