/**
 * Genkit Integration Test
 * 
 * === Installation Steps ===
 * 1. Install Node.js 18+ from https://nodejs.org/
 * 2. Install dependencies:
 *    npm install @genkit-ai/core @genkit-ai/googleai
 * 
 * === Running the Test ===
 * 1. Set your Google API key (optional but recommended):
 *    - Windows: set GOOGLE_API_KEY=your_api_key_here
 *    - Mac/Linux: export GOOGLE_API_KEY=your_api_key_here
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

console.log('Core exports:', Object.keys(core));
console.log('GoogleAI exports:', Object.keys(googleai));

// Better error handling for API key validation
const getApiKey = () => {
  // Use GEMINI_API_KEY instead of GOOGLE_API_KEY
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn('Warning: GEMINI_API_KEY environment variable is not set, using test key');
    return 'test-key'; 
  }
  return key;
};

try {
  // Test genkit-googleai integration
  const apiKey = core.apiKey(getApiKey());
  console.log('ApiKey type:', typeof apiKey);
  console.log('ApiKey methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(apiKey)));

  // Try to use the googleAI plugin with better error handling
  const googleAIPlugin = googleai.googleAI({ 
    apiKey: getApiKey() 
  });
  console.log('Plugin type:', typeof googleAIPlugin);
  
  // Test if plugin has expected methods
  console.log('Plugin has generateText:', typeof googleAIPlugin.generateText === 'function');
  console.log('Plugin has generateChat:', typeof googleAIPlugin.generateChat === 'function');

  // Test if defineFlow is available
  console.log('defineFlow is function:', typeof core.defineFlow === 'function');
  
  // Test basic flow definition
  if (typeof core.defineFlow === 'function') {
    const testFlow = core.defineFlow({
      name: 'testFlow',
      description: 'A test flow to verify Genkit functionality',
      run: async () => {
        return { success: true, message: 'Flow ran successfully' };
      }
    });
    
    console.log('Flow definition successful:', typeof testFlow === 'function');
  }
} catch (error) {
  console.error('Error during Genkit testing:', error.message);
  process.exit(1);
}

// Add a simple test to verify import compatibility
const testModuleImports = () => {
  const imports = {
    core: Object.keys(core).length > 0,
    googleai: Object.keys(googleai).length > 0
  };
  
  console.log('Import verification:', imports);
  
  if (!imports.core || !imports.googleai) {
    console.error('Failed to import required Genkit modules');
    return false;
  }
  
  return true;
};

testModuleImports();

console.log('Genkit integration test completed');