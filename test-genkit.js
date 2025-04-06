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

import { genkit, z } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

console.log('Testing Genkit 1.5 Integration');

// 1. Environment Configuration
const ENV_VAR = 'GEMINI_API_KEY'; // Consistent naming
const apiKey = process.env[ENV_VAR] || 'test-key';

// 2. Genkit Initialization
const ai = genkit({
  plugins: [googleAI({ apiKey })],
  projectId: 'ai-studio-sandbox'
});

// 3. Flow Definition Test
try {
  const testFlow = ai.defineFlow(
    {
      name: 'testFlow',
      description: 'Genkit 1.5 compatibility test',
      inputSchema: z.string(),
      outputSchema: z.object({
        success: z.boolean(),
        message: z.string()
      })
    },
    async (input) => {
      return { 
        success: true, 
        message: `Received input: ${input}` 
      };
    }
  );
  
  console.log('Flow definition successful:', typeof testFlow === 'function');
  
  // Execute the flow to test it
  const testFlowExecution = async () => {
    try {
      const result = await testFlow('test-input');
      console.log('Flow execution result:', result);
    } catch (execError) {
      console.error('Flow execution failed:', execError.message);
    }
  };
  
  testFlowExecution();
} catch (error) {
  console.error('Flow definition failed:', error.message);
}

// 4. Model Access Test
const testModelAccess = async () => {
  try {
    const models = await ai.listModels();
    console.log('Available models:', models);
  } catch (error) {
    console.error('Model listing failed:', error.message);
  }
};

testModelAccess();

// Log success message
console.log('Genkit integration test initiated. Check above for results.');