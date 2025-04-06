import { defineFlow } from '@genkit-ai/core';
import { googleAI, gemini } from '@genkit-ai/googleai';
import { z } from 'zod';
import { AISession } from '../../shared/schema';
import config from '../../genkit.config';

// Use the configuration from genkit.config.ts
export const ai = config;

// Code Assistant Flow for generating and explaining code
export const codeAssistantFlow = defineFlow({
  name: 'codeAssistant',
  inputSchema: z.object({
    userPrompt: z.string(),
    currentCode: z.string().optional(),
    language: z.string().optional(),
  }),
  outputSchema: z.object({
    generatedCode: z.string(),
    explanation: z.string()
  }),
  steps: {
    analyze: async ({ userPrompt, currentCode, language }) => {
      const prompt = `You are an expert programmer. Analyze this coding request carefully:
      
User Request: ${userPrompt}

${currentCode ? `Current Code: ${currentCode}` : ''}

${language ? `Programming Language: ${language}` : ''}

Provide detailed analysis on what needs to be done.`;
      
      return ai.generate({
        model: 'gemini-2.0-pro-exp',
        prompt
      });
    },
    generate: async ({ userPrompt, currentCode, language }, { analyze }) => {
      const prompt = `Based on the analysis and user request, generate high-quality code that meets these requirements:
      
User Request: ${userPrompt}

${currentCode ? `Current Code Context: ${currentCode}` : ''}

${language ? `Programming Language: ${language}` : 'Use TypeScript if language not specified.'}

Analysis: ${analyze}

Generate code that is:
1. Well-structured and following best practices
2. Properly commented
3. Efficient and optimized
4. Error-handled appropriately`;
      
      const codeResult = await ai.generate({
        model: 'gemini-2.0-pro-exp',
        prompt
      });
      
      // Generate explanation
      const explanationPrompt = `Explain the following code in a clear, step-by-step manner:
      
${codeResult}

Provide an explanation that covers:
1. The purpose of each section
2. Any patterns or techniques used
3. Why certain decisions were made
4. How to use or integrate this code`;
      
      const explanation = await ai.generate({
        model: 'gemini-2.0-pro-exp',
        prompt: explanationPrompt
      });
      
      return {
        generatedCode: codeResult,
        explanation
      };
    }
  }
});

// Chat Flow for interactive conversations with access to chat history
export const chatAssistantFlow = defineFlow({
  name: 'chatAssistant',
  inputSchema: z.object({
    userMessage: z.string(),
    chatHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })).optional(),
    enableWebSearch: z.boolean().optional(),
    enableReasoning: z.boolean().optional(),
  }),
  outputSchema: z.object({
    response: z.string(),
    reasoning: z.string().optional()
  }),
  steps: {
    preProcess: async ({ userMessage, chatHistory, enableReasoning }) => {
      // Format chat history into a string
      const historyText = chatHistory ? chatHistory.map(msg => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      ).join('\n\n') : '';
      
      return {
        formattedHistory: historyText,
        needsReasoning: enableReasoning || false
      };
    },
    reason: async ({ userMessage }, { preProcess }) => {
      if (!preProcess.needsReasoning) {
        return "No reasoning requested";
      }
      
      const reasoningPrompt = `Before responding to the user, think step-by-step about how to answer this question:
      
USER QUESTION: ${userMessage}

${preProcess.formattedHistory ? `CONVERSATION HISTORY:\n${preProcess.formattedHistory}` : ''}

Think carefully about:
1. What information is being requested
2. What background knowledge is relevant
3. What assumptions need to be validated
4. What would be the most helpful and accurate response`;
      
      return ai.generate({
        model: 'gemini-2.5-pro-001',
        prompt: reasoningPrompt
      });
    },
    respond: async ({ userMessage }, { preProcess, reason }) => {
      const responsePrompt = `You are a helpful, accurate, and friendly AI assistant.
      
${preProcess.formattedHistory ? `CONVERSATION HISTORY:\n${preProcess.formattedHistory}\n\n` : ''}

${reason !== "No reasoning requested" ? `REASONING (not visible to user):\n${reason}\n\n` : ''}

USER: ${userMessage}

Respond in a helpful, concise, and friendly manner. If you don't know, say so.`;
      
      const response = await ai.generate({
        model: 'gemini-2.5-pro-001',
        prompt: responsePrompt
      });
      
      return {
        response,
        reasoning: reason !== "No reasoning requested" ? reason : undefined
      };
    }
  }
});

// Image Generation Flow
export const imageGenerationFlow = defineFlow({
  name: 'imageGenerator',
  inputSchema: z.object({
    prompt: z.string(),
    style: z.string().optional(),
    size: z.string().optional(),
  }),
  outputSchema: z.object({
    imageUrl: z.string(),
    enhancedPrompt: z.string()
  }),
  steps: {
    enhancePrompt: async ({ prompt, style }) => {
      const enhancementPrompt = `Enhance this image generation prompt to create a more detailed, vivid, and descriptive version:
      
ORIGINAL PROMPT: ${prompt}

${style ? `STYLE REFERENCE: ${style}` : ''}

Your enhancement should:
1. Add descriptive details about lighting, perspective, mood, etc.
2. Include artistic references if relevant
3. Specify important elements clearly
4. Maintain the original intent of the prompt`;
      
      return ai.generate({
        model: 'gemini-2.0-pro-exp',
        prompt: enhancementPrompt
      });
    },
    generateImage: async ({ size }, { enhancePrompt }) => {
      // This is a placeholder for actual image generation API call
      // In a real implementation, you would call a service like Imagen
      
      // For demonstration purposes:
      const mockImageUrl = `https://placeholder-image.com/generated?text=${encodeURIComponent(enhancePrompt.substring(0, 50))}`;
      
      return {
        imageUrl: mockImageUrl,
        enhancedPrompt: enhancePrompt
      };
    }
  }
});

// Genkit handler for AI service integration
export const genkitHandler = {
  /**
   * Process a user message using Genkit chat flow
   */
  async processMessage(message: string, session?: AISession): Promise<string> {
    try {
      // Convert session history to the format expected by the chat flow
      const chatHistory = session?.history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })) || [];
      
      const result = await chatAssistantFlow({
        userMessage: message,
        chatHistory,
        enableReasoning: false
      });
      
      return result.response;
    } catch (error) {
      console.error('Error in Genkit processMessage:', error);
      return "I encountered an error processing your message. Please try again.";
    }
  },
  
  /**
   * Generate code based on a user prompt
   */
  async generateCode(prompt: string, language: string = 'typescript'): Promise<string> {
    try {
      const result = await codeAssistantFlow({
        userPrompt: prompt,
        language
      });
      
      return `${result.generatedCode}\n\n/*\nExplanation:\n${result.explanation}\n*/`;
    } catch (error) {
      console.error('Error in Genkit generateCode:', error);
      return "I encountered an error generating code. Please try again.";
    }
  },
  
  /**
   * Explain existing code using Genkit
   */
  async explainCode(code: string): Promise<string> {
    try {
      const prompt = `Explain the following code in detail:
      
\`\`\`
${code}
\`\`\`

Provide a comprehensive explanation including:
1. What the code does overall
2. A breakdown of each significant part
3. Any design patterns or techniques used
4. Potential issues or optimization opportunities`;
      
      const explanation = await ai.generate({
        model: 'gemini-2.0-pro-exp',
        prompt
      });
      
      return explanation;
    } catch (error) {
      console.error('Error in Genkit explainCode:', error);
      return "I encountered an error explaining the code. Please try again.";
    }
  },
  
  /**
   * Generate a summary of conversation history
   */
  async generateSummary(messages: { role: string, content: string }[]): Promise<string> {
    try {
      const conversationText = messages.map(msg => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      ).join('\n\n');
      
      const prompt = `Summarize the key points of this conversation:
      
${conversationText}

Create a concise summary that:
1. Captures the main topics discussed
2. Highlights any decisions or conclusions reached
3. Notes any outstanding questions or action items
4. Is clear and well-structured`;
      
      const summary = await ai.generate({
        model: 'gemini-2.0-pro-exp',
        prompt
      });
      
      return summary;
    } catch (error) {
      console.error('Error in Genkit generateSummary:', error);
      return "I encountered an error generating a summary. Please try again.";
    }
  }
};