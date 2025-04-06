import { AISession } from '../../shared/schema';
import { googleAIHandler } from './google';
import { openAIHandler } from './openai';
import { anthropicHandler } from './anthropic';
import { vertexAIHandler } from './vertexai';

// Supported AI providers
export enum AIProvider {
  GOOGLE = 'google',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  VERTEX = 'vertex'
}

// Provider availability check
const isProviderAvailable = {
  [AIProvider.GOOGLE]: Boolean(process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY),
  [AIProvider.OPENAI]: Boolean(process.env.OPENAI_API_KEY),
  [AIProvider.ANTHROPIC]: Boolean(process.env.ANTHROPIC_API_KEY),
  [AIProvider.VERTEX]: vertexAIHandler.isAvailable()
};

// Get handler for the specified provider
function getHandlerForProvider(provider: AIProvider) {
  switch (provider) {
    case AIProvider.GOOGLE:
      return googleAIHandler;
    case AIProvider.OPENAI:
      return openAIHandler;
    case AIProvider.ANTHROPIC:
      return anthropicHandler;
    case AIProvider.VERTEX:
      return vertexAIHandler;
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export const aiService = {
  /**
   * Check if a provider is available (API key is set)
   * @param provider AI provider to check
   * @returns Boolean indicating if the provider is available
   */
  isProviderAvailable(provider: AIProvider): boolean {
    return isProviderAvailable[provider] || false;
  },

  /**
   * Get all available providers
   * @returns Array of available AI providers
   */
  getAvailableProviders(): AIProvider[] {
    return Object.values(AIProvider).filter(
      provider => this.isProviderAvailable(provider as AIProvider)
    ) as AIProvider[];
  },

  /**
   * Process a user message using the specified provider
   * @param message User message
   * @param provider AI provider to use
   * @param session AI session
   * @returns Promise with AI response
   */
  async processMessage(message: string, provider: AIProvider, session?: AISession): Promise<string> {
    try {
      if (!this.isProviderAvailable(provider)) {
        const availableProviders = this.getAvailableProviders();
        
        // If the requested provider is not available but others are, use an alternative
        if (availableProviders.length > 0) {
          const alternativeProvider = availableProviders[0];
          console.warn(`${provider} is not available. Using ${alternativeProvider} instead.`);
          provider = alternativeProvider;
        } else {
          return `${provider} is not available. Please set the appropriate API key in the environment variables.`;
        }
      }
      
      const handler = getHandlerForProvider(provider);
      return await handler.processMessage(message, session);
    } catch (error) {
      console.error(`Error processing message with ${provider}:`, error);
      return `Failed to process message with ${provider}: ${(error as Error).message}`;
    }
  },

  /**
   * Generate code using the specified provider
   * @param prompt User prompt
   * @param provider AI provider to use
   * @param language Programming language
   * @returns Promise with generated code
   */
  async generateCode(prompt: string, provider: AIProvider, language: string = 'javascript'): Promise<string> {
    try {
      if (!this.isProviderAvailable(provider)) {
        const availableProviders = this.getAvailableProviders();
        
        // If the requested provider is not available but others are, use an alternative
        if (availableProviders.length > 0) {
          const alternativeProvider = availableProviders[0];
          console.warn(`${provider} is not available. Using ${alternativeProvider} instead.`);
          provider = alternativeProvider;
        } else {
          return `// ${provider} is not available. Please set the appropriate API key in the environment variables.`;
        }
      }
      
      const handler = getHandlerForProvider(provider);
      return await handler.generateCode(prompt, language);
    } catch (error) {
      console.error(`Error generating code with ${provider}:`, error);
      return `// Failed to generate code with ${provider}: ${(error as Error).message}`;
    }
  },

  /**
   * Explain code using the specified provider
   * @param code Code to explain
   * @param provider AI provider to use
   * @returns Promise with explanation
   */
  async explainCode(code: string, provider: AIProvider): Promise<string> {
    try {
      if (!this.isProviderAvailable(provider)) {
        const availableProviders = this.getAvailableProviders();
        
        // If the requested provider is not available but others are, use an alternative
        if (availableProviders.length > 0) {
          const alternativeProvider = availableProviders[0];
          console.warn(`${provider} is not available. Using ${alternativeProvider} instead.`);
          provider = alternativeProvider;
        } else {
          return `${provider} is not available. Please set the appropriate API key in the environment variables.`;
        }
      }
      
      const handler = getHandlerForProvider(provider);
      return await handler.explainCode(code);
    } catch (error) {
      console.error(`Error explaining code with ${provider}:`, error);
      return `Failed to explain code with ${provider}: ${(error as Error).message}`;
    }
  },

  /**
   * Generate a summary of conversation history
   * @param messages Array of conversation messages
   * @param provider AI provider to use
   * @returns Promise with summary
   */
  async generateSummary(messages: { role: string, content: string }[], provider: AIProvider): Promise<string> {
    try {
      if (!this.isProviderAvailable(provider)) {
        const availableProviders = this.getAvailableProviders();
        
        // If the requested provider is not available but others are, use an alternative
        if (availableProviders.length > 0) {
          const alternativeProvider = availableProviders[0];
          console.warn(`${provider} is not available. Using ${alternativeProvider} instead.`);
          provider = alternativeProvider;
        } else {
          return "No AI providers available. Please set at least one API key in the environment variables.";
        }
      }
      
      const handler = getHandlerForProvider(provider);
      return await handler.generateSummary(messages);
    } catch (error) {
      console.error(`Error generating summary with ${provider}:`, error);
      return `Failed to generate summary with ${provider}: ${(error as Error).message}`;
    }
  }
};