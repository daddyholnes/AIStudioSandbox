import Anthropic from '@anthropic-ai/sdk';
import { AISession } from '../../shared/schema';

// Define ContentBlock type locally to avoid importing from lib/types
type ContentBlock = {
  type: string;
  text?: string;
  [key: string]: any;
};

// Helper function to safely extract text from content blocks
function extractTextFromContentBlock(block: ContentBlock): string {
  if (block.type === 'text') {
    return block.text || '';
  } else if (block.type === 'image') {
    return '[Image]';
  } else {
    return JSON.stringify(block);
  }
}

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const DEFAULT_MODEL = "claude-3-7-sonnet-20250219";

// Initialize the Anthropic instance if API key is available
const apiKey = process.env.ANTHROPIC_API_KEY;
let anthropic: Anthropic | null = null;

if (apiKey) {
  anthropic = new Anthropic({
    apiKey,
  });
} else {
  console.warn('Anthropic API key is not provided. Anthropic integration will not be available.');
}

export const anthropicHandler = {
  /**
   * Process a user message and generate a response
   * @param message User message
   * @param session AI session
   * @returns Promise with AI response
   */
  async processMessage(message: string, session?: AISession): Promise<string> {
    if (!apiKey || !anthropic) {
      return "Anthropic API key is not provided. Please set the ANTHROPIC_API_KEY environment variable.";
    }
    
    try {
      // Construct the messages array for Claude
      const messages = [];
      
      // Add history from session if available
      if (session && session.history.length > 0) {
        for (const msg of session.history) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            });
          }
        }
      }
      
      // Add the current message
      messages.push({
        role: 'user' as const,
        content: message
      });
      
      // Get the model
      const modelName = session?.modelConfig?.model || DEFAULT_MODEL;
      
      // Generate a response
      const response = await anthropic.messages.create({
        model: modelName,
        system: "You are a helpful AI coding assistant. You provide clear, concise, and accurate information about programming and software development.",
        messages,
        temperature: session?.modelConfig?.temperature || 0.7,
        max_tokens: 2048,
      });
      
      // Extract the text content from the response
      const reply = extractTextFromContentBlock(response.content[0]);
      
      // Update session if available
      if (session) {
        session.history.push({
          role: 'user',
          content: message,
          timestamp: Date.now()
        });
        
        session.history.push({
          role: 'assistant',
          content: reply,
          timestamp: Date.now()
        });
        
        session.lastActive = Date.now();
      }
      
      return reply;
    } catch (error) {
      console.error('Error processing message with Anthropic:', error);
      return `I'm sorry, I encountered an error processing your request. Please try again later. (Error: ${(error as Error).message})`;
    }
  },

  /**
   * Generate code based on a prompt
   * @param prompt User prompt
   * @param language Programming language
   * @returns Promise with generated code
   */
  async generateCode(prompt: string, language: string = 'javascript'): Promise<string> {
    if (!apiKey || !anthropic) {
      return "Anthropic API key is not provided. Please set the ANTHROPIC_API_KEY environment variable.";
    }
    
    try {
      // Generate a response for code generation
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        system: `You are an expert ${language} programmer. Generate clean, efficient, and well-commented code. Return ONLY the code without explanation outside the code block.`,
        messages: [
          {
            role: 'user' as const,
            content: `Generate ${language} code for the following request: ${prompt}`
          }
        ],
        temperature: 0.2, // Lower temperature for more deterministic output
        max_tokens: 2048,
      });
      
      // Extract code from the response
      let code = extractTextFromContentBlock(response.content[0]);
      
      // Ensure the code is properly formatted with backticks if not already
      if (!code.includes('```')) {
        code = '```' + language + '\n' + code + '\n```';
      }
      
      return code;
    } catch (error) {
      console.error('Error generating code with Anthropic:', error);
      return `// Error generating code: ${(error as Error).message}`;
    }
  },

  /**
   * Explain code
   * @param code Code to explain
   * @returns Promise with explanation
   */
  async explainCode(code: string): Promise<string> {
    if (!apiKey || !anthropic) {
      return "Anthropic API key is not provided. Please set the ANTHROPIC_API_KEY environment variable.";
    }
    
    try {
      // Generate a response for code explanation
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        system: "You are an expert programming educator. Explain code clearly and concisely, focusing on important concepts and patterns.",
        messages: [
          {
            role: 'user' as const,
            content: `Explain the following code in detail:\n\n${code}\n\nProvide your explanation in these sections:\n1. Overview\n2. Key Components\n3. Implementation Details\n4. Potential Improvements`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });
      
      return extractTextFromContentBlock(response.content[0]);
    } catch (error) {
      console.error('Error explaining code with Anthropic:', error);
      return `Error explaining code: ${(error as Error).message}`;
    }
  },

  /**
   * Generate a summary of conversation history
   * @param messages Array of conversation messages
   * @returns Promise with summary
   */
  async generateSummary(messages: { role: string, content: string }[]): Promise<string> {
    if (!apiKey || !anthropic || messages.length === 0) {
      return "No summary available";
    }
    
    try {
      // Prepare the conversation for summarization
      const conversationText = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');
      
      // Generate a summary
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        system: "Summarize the following conversation in 2-3 sentences, focusing on the main topics and key points discussed.",
        messages: [
          {
            role: 'user' as const,
            content: conversationText
          }
        ],
        temperature: 0.5,
        max_tokens: 150,
      });
      
      return extractTextFromContentBlock(response.content[0]);
    } catch (error) {
      console.error('Error generating summary with Anthropic:', error);
      return "Failed to generate summary";
    }
  }
};