import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { AISession } from '../../shared/schema';

// Default model to use
const DEFAULT_MODEL = 'gemini-pro';

// Initialize Gemini API with the API key
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

// Initialize the Google Generative AI instance if API key is available
let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('Google AI API key is not provided. Google AI integration will not be available.');
}

// Safety settings to apply to the model
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// Generation config
const generationConfig = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 2048,
};

export const googleAIHandler = {
  /**
   * Process a user message and generate a response
   * @param message User message
   * @param session AI session
   * @returns Promise with AI response
   */
  async processMessage(message: string, session?: AISession): Promise<string> {
    if (!apiKey || !genAI) {
      return "Google AI API key is not provided. Please set the GOOGLE_API_KEY environment variable.";
    }
    
    try {
      let history: { role: string, parts: { text: string }[] }[] = [];
      
      // Add history from session if available
      if (session && session.history.length > 0) {
        // Convert session history to Google AI chat format
        history = session.history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }));
      }
      
      // Get the model
      const modelName = session?.modelConfig?.model || DEFAULT_MODEL;
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings,
        generationConfig,
      });
      
      // Start a chat session
      const chat = model.startChat({
        history,
        generationConfig,
      });
      
      // Generate a response
      const result = await chat.sendMessage(message);
      const response = result.response;
      const text = response.text();
      
      // Update session if available
      if (session) {
        session.history.push({
          role: 'user',
          content: message,
          timestamp: Date.now()
        });
        
        session.history.push({
          role: 'assistant',
          content: text,
          timestamp: Date.now()
        });
        
        session.lastActive = Date.now();
      }
      
      return text;
    } catch (error) {
      console.error('Error processing message with Google AI:', error);
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
    if (!apiKey || !genAI) {
      return "Google AI API key is not provided. Please set the GOOGLE_API_KEY environment variable.";
    }
    
    try {
      // Craft a prompt specific for code generation
      const fullPrompt = `Generate ${language} code for the following request: ${prompt}. 
      Return ONLY the code without explanation or comments outside the code.
      Make sure to add appropriate imports and include proper error handling.`;
      
      // Get the model (using gemini-pro for code generation)
      const model = genAI.getGenerativeModel({
        model: 'gemini-pro',
        safetySettings,
        generationConfig: {
          ...generationConfig,
          temperature: 0.2, // Lower temperature for more deterministic output
        },
      });
      
      // Generate code
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      let code = response.text();
      
      // Ensure the code is properly formatted with backticks if not already
      if (!code.includes('```')) {
        code = '```' + language + '\n' + code + '\n```';
      }
      
      return code;
    } catch (error) {
      console.error('Error generating code with Google AI:', error);
      return `// Error generating code: ${(error as Error).message}`;
    }
  },
  
  /**
   * Explain code
   * @param code Code to explain
   * @returns Promise with explanation
   */
  async explainCode(code: string): Promise<string> {
    if (!apiKey || !genAI) {
      return "Google AI API key is not provided. Please set the GOOGLE_API_KEY environment variable.";
    }
    
    try {
      // Craft a prompt for code explanation
      const prompt = `Explain the following code in detail, highlighting important concepts and patterns:
      
${code}

Provide your explanation in these sections:
1. Overview: What the code does at a high level
2. Key Components: Breakdown of main parts and their purpose
3. Implementation Details: How the code achieves its purpose
4. Potential Improvements: Suggestions for making the code better`;
      
      // Get the model
      const model = genAI.getGenerativeModel({
        model: 'gemini-pro',
        safetySettings,
        generationConfig,
      });
      
      // Generate explanation
      const result = await model.generateContent(prompt);
      const response = result.response;
      const explanation = response.text();
      
      return explanation;
    } catch (error) {
      console.error('Error explaining code with Google AI:', error);
      return `Error explaining code: ${(error as Error).message}`;
    }
  },
  
  /**
   * Generate a summary of conversation history
   * @param messages Array of conversation messages
   * @returns Promise with summary
   */
  async generateSummary(messages: { role: string, content: string }[]): Promise<string> {
    if (!apiKey || !genAI || messages.length === 0) {
      return "No summary available";
    }
    
    try {
      // Prepare the conversation history for summarization
      const conversationText = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');
      
      // Craft a prompt for summarization
      const prompt = `Summarize the following conversation in 2-3 sentences, focusing on the main topics and key points discussed:
      
${conversationText}`;
      
      // Get the model
      const model = genAI.getGenerativeModel({
        model: 'gemini-pro',
        safetySettings,
        generationConfig: {
          ...generationConfig,
          maxOutputTokens: 150, // Shorter output for summaries
        },
      });
      
      // Generate summary
      const result = await model.generateContent(prompt);
      const response = result.response;
      const summary = response.text();
      
      return summary;
    } catch (error) {
      console.error('Error generating summary with Google AI:', error);
      return "Failed to generate summary";
    }
  }
};