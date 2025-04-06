import { core, googleAIPlugin } from '../../genkit.config';

export const codeAssistantFlow = core.defineFlow(
  {
    name: 'codeAssistant',
    description: 'Assists with code generation',
    inputSchema: core.z.string(),
    outputSchema: core.z.string()
  },
  async (prompt) => {
    try {
      // Using the available methods from the debug output
      const result = await googleAIPlugin.gemini20Flash().generateText({
        prompt
      });
      
      return result.text || 'No result generated';
    } catch (error) {
      console.error('Error in codeAssistant flow:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
);
