import { AISession } from '../../shared/schema';
// Corrected imports to use exported constants and default export
import googleAI, { 
  PRODUCTION_MODEL,
  EXPERIMENTAL_MODEL, // Assuming EXPERIMENTAL_MODEL might be used elsewhere or later
  VISION_MODEL,       // Assuming VISION_MODEL might be used elsewhere or later
  getModelInstance 
} from '../../genkit.config';

/**
 * Helper to clean and format messages for chat history
 */
function formatChatHistory(messages: Array<{ role: string, content: string }>) {
  return messages.map(message => ({
    role: message.role === 'user' ? 'user' : 'model',
    parts: [{ text: message.content }],
  }));
}

/**
 * Handler for integration with Google AI
 */
export const genkitHandler = {
  /**
   * Process a user message using the chat model
   */
  async processMessage(message: string, session?: AISession): Promise<string> {
    try {
      const history = session?.history || [];
      
      // Get model instance - Using PRODUCTION_MODEL constant
      const model = getModelInstance(PRODUCTION_MODEL);
      
      // Start a chat
      const chat = model.startChat({
        history: formatChatHistory(history),
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });
      
      // Send message and get response
      const result = await chat.sendMessage(message);
      const response = result.response;
      
      return response.text();
    } catch (error) {
      console.error('Error in genkitHandler.processMessage:', error);
      return `Error processing message: ${error.message}`;
    }
  },
  
  /**
   * Generate code based on a user prompt
   */
  async generateCode(prompt: string, language: string = 'typescript'): Promise<string> {
    try {
      // Get appropriate model for code generation - Using PRODUCTION_MODEL constant
      const model = getModelInstance(PRODUCTION_MODEL);
      
      // Generate code with specialized prompt
      const result = await model.generateContent(
        `Generate ${language} code for the following task. ONLY return the code without explanations or comments unless absolutely necessary:\n\n${prompt}`
      );
      
      return result.response.text();
    } catch (error) {
      console.error('Error in genkitHandler.generateCode:', error);
      return `Error generating code: ${error.message}`;
    }
  },
  
  /**
   * Explain existing code
   */
  async explainCode(code: string): Promise<string> {
    try {
      // Get appropriate model for code analysis - Using PRODUCTION_MODEL constant
      const model = getModelInstance(PRODUCTION_MODEL);
      
      // Generate explanation
      const result = await model.generateContent(
        `Explain the following code in detail:\n\n\`\`\`\n${code}\n\`\`\``
      );
      
      return result.response.text();
    } catch (error) {
      console.error('Error in genkitHandler.explainCode:', error);
      return `Error explaining code: ${error.message}`;
    }
  },
  
  /**
   * Generate a summary of conversation history
   */
  async generateSummary(messages: { role: string, content: string }[]): Promise<string> {
    try {
      // Format messages for the summary
      const conversationText = messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');
      
      // Get appropriate model for summarization - Using PRODUCTION_MODEL constant
      const model = getModelInstance(PRODUCTION_MODEL);
      
      // Generate summary
      const result = await model.generateContent(
        `Summarize the key points from this conversation in a concise way:\n\n${conversationText}`
      );
      
      return result.response.text();
    } catch (error) {
      console.error('Error in genkitHandler.generateSummary:', error);
      return `Error generating summary: ${error.message}`;
    }
  },
  
  /**
   * Get available models (for informational purposes)
   */
  async getAvailableModels() {
    return [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', category: 'fast' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', category: 'advanced' },
      { id: 'gemini-1.5-pro-vision', name: 'Gemini 1.5 Pro Vision', category: 'vision' }
    ];
  }
};

// Export for backward compatibility and to avoid breaking other parts of the app
export const genkitAI = googleAI;
export const chatAssistantFlow = {
  invoke: async (params: any) => {
    return await genkitHandler.processMessage(params.message, { history: params.history } as any);
  }
};
export const codeAssistantFlow = {
  invoke: async (params: any) => {
    return await genkitHandler.generateCode(params.prompt, params.language);
  }
};
export const codeExplanationFlow = {
  invoke: async (params: any) => {
    return await genkitHandler.explainCode(params.code);
  }
};
export const summaryGenerationFlow = {
  invoke: async (params: any) => {
    return await genkitHandler.generateSummary(params.messages);
  }
};

