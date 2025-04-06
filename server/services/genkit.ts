import { z } from 'zod';
import { AISession } from '../../shared/schema';
import ai from '../../genkit.config';

// Use the configuration from genkit.config.ts
export const genkitAI = ai;

// Define input/output schemas
const CodeRequestSchema = z.object({
  prompt: z.string(),
  context: z.string().optional(),
  language: z.string().optional()
});

const ChatRequestSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  enableReasoning: z.boolean().optional()
});

const ImageRequestSchema = z.object({
  prompt: z.string(),
  style: z.string().optional(),
  size: z.enum(['512x512', '1024x1024', '1024x1792', '1792x1024']).optional()
});

// Code Assistant Flow for generating and explaining code
export const codeAssistantFlow = ai.defineFlow({
  name: 'codeAssistFlow',
  inputSchema: CodeRequestSchema,
  outputSchema: z.string()
}, async ({ prompt, context, language }) => {
  const codePrompt = `Generate code for: ${prompt}
${context ? `\nContext: ${context}` : ''}
${language ? `\nLanguage: ${language}` : '\nLanguage: TypeScript'}

Write high-quality, well-commented code that follows best practices.`;

  const { text } = await ai.generate({
    model: 'gemini-2.0-flash',
    prompt: codePrompt
  });
  
  return text;
});

// Chat Flow for interactive conversations with access to chat history
export const chatAssistantFlow = ai.defineFlow({
  name: 'chatAssistFlow',
  inputSchema: ChatRequestSchema,
  outputSchema: z.string()
}, async ({ message, history, enableReasoning }) => {
  // Format chat history
  const historyText = history 
    ? history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n') 
    : '';
  
  // Create reasoning if requested
  let reasoning = '';
  if (enableReasoning) {
    const reasoningPrompt = `Before responding, think step-by-step:
${historyText ? `\nCONVERSATION HISTORY:\n${historyText}\n` : ''}
\nUSER QUESTION: ${message}
\nAnalyze what's being asked and how to best respond.`;
    
    const { text: reasoningText } = await ai.generate({
      model: 'gemini-2.0-pro',
      prompt: reasoningPrompt
    });
    
    reasoning = `\nREASONING (not visible to user):\n${reasoningText}`;
  }
  
  // Generate response
  const responsePrompt = `You are a helpful, accurate AI assistant.
${historyText ? `\nCONVERSATION HISTORY:\n${historyText}` : ''}
${reasoning}
\nUSER: ${message}
\nRespond helpfully and concisely.`;
  
  const { text } = await ai.generate({
    model: 'gemini-2.0-pro',
    prompt: responsePrompt
  });
  
  return text;
});

// Image Generation Flow
export const imageGenerationFlow = ai.defineFlow({
  name: 'imageGenerateFlow',
  inputSchema: ImageRequestSchema,
  outputSchema: z.object({
    imageUrl: z.string(),
    enhancedPrompt: z.string()
  })
}, async ({ prompt, style, size = '1024x1024' }) => {
  // Enhance the prompt
  const enhancementPrompt = `Enhance this image generation prompt with vivid details:
PROMPT: ${prompt}
${style ? `\nSTYLE: ${style}` : ''}
\nAdd details about lighting, composition, and mood while keeping the original intent.`;
  
  const { text: enhancedPrompt } = await ai.generate({
    model: 'gemini-2.0-pro',
    prompt: enhancementPrompt
  });
  
  // In a real implementation, this would call an image generation API
  // For demonstration, we're returning a placeholder
  const imageUrl = `https://placeholder-image.com/generated?text=${encodeURIComponent(prompt.substring(0, 50))}&size=${size}`;
  
  return {
    imageUrl,
    enhancedPrompt
  };
});

// Genkit handler for AI service integration
export const genkitHandler = {
  /**
   * Process a user message using Genkit chat flow
   */
  async processMessage(message: string, session?: AISession): Promise<string> {
    try {
      // Convert session history to the format expected by the chat flow
      const history = session?.history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })) || [];
      
      const result = await chatAssistantFlow({
        message,
        history,
        enableReasoning: true
      });
      
      return result;
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
        prompt,
        language,
        context: ''
      });
      
      return result;
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
      const { text } = await ai.generate({
        model: 'gemini-2.0-pro',
        prompt: `Explain this code in detail:
\`\`\`
${code}
\`\`\`

Include:
1. Overall purpose
2. Function breakdowns
3. Design patterns used
4. Potential improvements`
      });
      
      return text;
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
      
      const { text } = await ai.generate({
        model: 'gemini-2.0-pro',
        prompt: `Summarize this conversation concisely:
${conversationText}

Include main topics, decisions, and any open questions.`
      });
      
      return text;
    } catch (error) {
      console.error('Error in Genkit generateSummary:', error);
      return "I encountered an error generating a summary. Please try again.";
    }
  }
};