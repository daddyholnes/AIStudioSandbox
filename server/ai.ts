import { AISession } from '../shared/schema';
import { aiService, AIProvider } from './services/ai';

/**
 * Determines the AI provider to use based on the model name or fallback to available providers
 * @param model Model name or provider prefix
 * @returns AIProvider enum value
 */
function getProviderFromModel(model?: string): AIProvider {
  if (!model) {
    // Return first available provider or default to Claude via Vertex AI
    const availableProviders = aiService.getAvailableProviders();
    return availableProviders.length > 0 ? availableProviders[0] : AIProvider.VERTEX;
  }

  // Check for provider prefixes
  if (model.toLowerCase().startsWith('claude')) {
    // Use Vertex AI for Claude models if available
    if (aiService.isProviderAvailable(AIProvider.VERTEX)) {
      return AIProvider.VERTEX;
    }
    // Fallback to direct Anthropic API
    if (aiService.isProviderAvailable(AIProvider.ANTHROPIC)) {
      return AIProvider.ANTHROPIC;
    }
  } else if (model.toLowerCase().startsWith('gpt')) {
    return AIProvider.OPENAI;
  } else if (model.toLowerCase().startsWith('gemini')) {
    return AIProvider.GOOGLE;
  } else if (model.toLowerCase().startsWith('vertex')) {
    return AIProvider.VERTEX;
  }

  // Fallback to any available provider
  const availableProviders = aiService.getAvailableProviders();
  return availableProviders.length > 0 ? availableProviders[0] : AIProvider.VERTEX;
}

export const aiHandler = {
  /**
   * Process a user message and generate a response
   * @param message User message
   * @param session AI session
   * @returns Promise with AI response
   */
  async processMessage(message: string, session?: AISession): Promise<string> {
    const modelName = session?.modelConfig?.model;
    const provider = getProviderFromModel(modelName);
    
    return aiService.processMessage(message, provider, session);
  },

  /**
   * Generate code based on a prompt
   * @param prompt User prompt
   * @param language Programming language
   * @returns Promise with generated code
   */
  async generateCode(prompt: string, language: string = 'javascript'): Promise<string> {
    // Use Anthropic or OpenAI for code generation by default
    let provider: AIProvider;
    
    if (aiService.isProviderAvailable(AIProvider.VERTEX)) {
      provider = AIProvider.VERTEX;
    } else if (aiService.isProviderAvailable(AIProvider.ANTHROPIC)) {
      provider = AIProvider.ANTHROPIC;
    } else if (aiService.isProviderAvailable(AIProvider.OPENAI)) {
      provider = AIProvider.OPENAI;
    } else {
      // Fallback to Google if nothing else is available
      provider = AIProvider.GOOGLE;
    }
    
    return aiService.generateCode(prompt, provider, language);
  },

  /**
   * Explain code
   * @param code Code to explain
   * @returns Promise with explanation
   */
  async explainCode(code: string): Promise<string> {
    // Anthropic/Claude is typically better at code explanation
    let provider: AIProvider;
    
    if (aiService.isProviderAvailable(AIProvider.VERTEX)) {
      provider = AIProvider.VERTEX;
    } else if (aiService.isProviderAvailable(AIProvider.ANTHROPIC)) {
      provider = AIProvider.ANTHROPIC;
    } else {
      // Fallback to any available provider
      const availableProviders = aiService.getAvailableProviders();
      provider = availableProviders.length > 0 ? availableProviders[0] : AIProvider.GOOGLE;
    }
    
    return aiService.explainCode(code, provider);
  },

  /**
   * Generate a summary of conversation history
   * @param session AI session
   * @returns Promise resolving when summary is generated
   */
  async generateSummary(session: AISession): Promise<void> {
    if (!session || !session.history || session.history.length < 3) {
      // Not enough history to generate a summary
      return;
    }
    
    const modelName = session.modelConfig?.model;
    const provider = getProviderFromModel(modelName);
    
    try {
      const summary = await aiService.generateSummary(session.history, provider);
      
      // Add the summary to the session
      if (summary) {
        const now = Date.now();
        session.summaries.push({
          content: summary,
          fromTimestamp: session.history[0].timestamp,
          toTimestamp: now
        });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  },

  /**
   * Get available AI providers
   * @returns Array of available provider names
   */
  getAvailableProviders(): string[] {
    return aiService.getAvailableProviders();
  },

  /**
   * Check if a provider is available
   * @param provider Provider name
   * @returns Boolean indicating availability
   */
  isProviderAvailable(provider: string): boolean {
    try {
      return aiService.isProviderAvailable(provider as AIProvider);
    } catch (error) {
      return false;
    }
  }
};