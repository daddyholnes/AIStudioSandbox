import OpenAI from "openai";
import { AISession } from "../../shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

// Initialize the OpenAI instance if API key is available
const apiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;

if (apiKey) {
  openai = new OpenAI({ apiKey });
} else {
  console.warn('OpenAI API key is not provided. OpenAI integration will not be available.');
}

export const openAIHandler = {
  /**
   * Process a user message and generate a response
   * @param message User message
   * @param session AI session
   * @returns Promise with AI response
   */
  async processMessage(message: string, session?: AISession): Promise<string> {
    if (!apiKey || !openai) {
      return "OpenAI API key is not provided. Please set the OPENAI_API_KEY environment variable.";
    }
    
    try {
      // Convert session history to OpenAI chat format
      const messages = [];
      
      // Add system message
      messages.push({
        role: "system",
        content: "You are a helpful AI coding assistant. You provide clear, concise, and accurate information about programming and software development."
      });
      
      // Add history from session if available
      if (session && session.history.length > 0) {
        for (const msg of session.history) {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
      
      // Add the current message
      messages.push({
        role: "user",
        content: message
      });
      
      // Get the model
      const modelName = session?.modelConfig?.model || DEFAULT_MODEL;
      
      // Generate a response
      const response = await openai.chat.completions.create({
        model: modelName,
        messages,
        temperature: session?.modelConfig?.temperature || 0.7,
        max_tokens: 2048
      });
      
      const reply = response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
      
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
      console.error('Error processing message with OpenAI:', error);
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
    if (!apiKey || !openai) {
      return "OpenAI API key is not provided. Please set the OPENAI_API_KEY environment variable.";
    }
    
    try {
      // Craft a prompt specific for code generation
      const messages = [
        {
          role: "system",
          content: `You are an expert ${language} programmer. Generate clean, efficient, and well-commented code. Return ONLY the code without explanation outside the code block.`
        },
        {
          role: "user",
          content: `Generate ${language} code for the following request: ${prompt}`
        }
      ];
      
      // Generate code
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.2, // Lower temperature for more deterministic output
        max_tokens: 2048,
        response_format: { type: "text" }
      });
      
      let code = response.choices[0].message.content || "";
      
      // Ensure the code is properly formatted with backticks if not already
      if (!code.includes('```')) {
        code = '```' + language + '\n' + code + '\n```';
      }
      
      return code;
    } catch (error) {
      console.error('Error generating code with OpenAI:', error);
      return `// Error generating code: ${(error as Error).message}`;
    }
  },

  /**
   * Explain code
   * @param code Code to explain
   * @returns Promise with explanation
   */
  async explainCode(code: string): Promise<string> {
    if (!apiKey || !openai) {
      return "OpenAI API key is not provided. Please set the OPENAI_API_KEY environment variable.";
    }
    
    try {
      // Craft messages for code explanation
      const messages = [
        {
          role: "system",
          content: "You are an expert programming educator. Explain code clearly and concisely, focusing on important concepts and patterns."
        },
        {
          role: "user",
          content: `Explain the following code in detail:\n\n${code}\n\nProvide your explanation in these sections:\n1. Overview\n2. Key Components\n3. Implementation Details\n4. Potential Improvements`
        }
      ];
      
      // Generate explanation
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        max_tokens: 2048
      });
      
      return response.choices[0].message.content || "I couldn't generate an explanation.";
    } catch (error) {
      console.error('Error explaining code with OpenAI:', error);
      return `Error explaining code: ${(error as Error).message}`;
    }
  },

  /**
   * Generate a summary of conversation history
   * @param messages Array of conversation messages
   * @returns Promise with summary
   */
  async generateSummary(messages: { role: string, content: string }[]): Promise<string> {
    if (!apiKey || !openai || messages.length === 0) {
      return "No summary available";
    }
    
    try {
      // Prepare the conversation for summarization
      const conversationText = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');
      
      // Create messages for the summary request
      const summaryMessages = [
        {
          role: "system",
          content: "Summarize the following conversation in 2-3 sentences, focusing on the main topics and key points discussed."
        },
        {
          role: "user",
          content: conversationText
        }
      ];
      
      // Generate summary
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: summaryMessages,
        temperature: 0.5,
        max_tokens: 150
      });
      
      return response.choices[0].message.content || "No summary available";
    } catch (error) {
      console.error('Error generating summary with OpenAI:', error);
      return "Failed to generate summary";
    }
  }
};