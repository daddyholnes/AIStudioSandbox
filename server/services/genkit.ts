import { AISession } from '../../shared/schema';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI client directly
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Export the client for other services
export const genkitAI = googleAI;

// Models
const GEMINI_PRO = 'gemini-1.5-pro';
const GEMINI_PRO_VISION = 'gemini-1.5-pro-vision';
const GEMINI_FLASH = 'gemini-1.5-flash';

/**
 * Helper to clean and format messages for chat history
 */
function formatChatHistory(messages: Array<{ role: string, content: string }>) {
  return messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
}

/**
 * Direct Google AI integration 
 */
export const genkitHandler = {
  /**
   * Process a user message using Google Generative AI
   */
  async processMessage(message: string, session?: AISession): Promise<string> {
    try {
      const model = googleAI.getGenerativeModel({ model: GEMINI_PRO });
      
      let chatHistory: any[] = [];
      if (session?.history && session.history.length > 0) {
        chatHistory = formatChatHistory(session.history);
      }
      
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });
      
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      
      return text;
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
      const model = googleAI.getGenerativeModel({ model: GEMINI_PRO });
      
      const codePrompt = `Generate code for: ${prompt}
Language: ${language}

Write high-quality, well-commented code that follows best practices.`;

      const result = await model.generateContent(codePrompt);
      const response = await result.response;
      const text = response.text();
      
      return text;
    } catch (error) {
      console.error('Error in Genkit generateCode:', error);
      return "I encountered an error generating code. Please try again.";
    }
  },
  
  /**
   * Explain existing code
   */
  async explainCode(code: string): Promise<string> {
    try {
      const model = googleAI.getGenerativeModel({ model: GEMINI_PRO });
      
      const explainPrompt = `Explain this code in detail:
\`\`\`
${code}
\`\`\`

Include:
1. Overall purpose
2. Function breakdowns
3. Design patterns used
4. Potential improvements`;

      const result = await model.generateContent(explainPrompt);
      const response = await result.response;
      const text = response.text();
      
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
      const model = googleAI.getGenerativeModel({ model: GEMINI_PRO });
      
      const conversationText = messages.map(msg => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      ).join('\n\n');
      
      const summaryPrompt = `Summarize this conversation concisely:
${conversationText}

Include main topics, decisions, and any open questions.`;

      const result = await model.generateContent(summaryPrompt);
      const response = await result.response;
      const text = response.text();
      
      return text;
    } catch (error) {
      console.error('Error in Genkit generateSummary:', error);
      return "I encountered an error generating a summary. Please try again.";
    }
  }
};

