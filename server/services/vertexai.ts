import { AISession } from '../../shared/schema';
import { PredictionServiceClient } from '@google-cloud/aiplatform';

// Vertex AI constants
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const PUBLISHER = 'google';
const CLAUDE_MODEL = 'claude-3-opus-20240229';
const API_ENDPOINT = `${LOCATION}-aiplatform.googleapis.com`;

/**
 * Check if required environment variables are set
 * @returns Boolean indicating if Vertex AI can be used
 */
function hasVertexAIConfig(): boolean {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    process.env.GOOGLE_CLOUD_PROJECT
  );
}

// Helper for extracting text from a message
function extractMessageText(message: any): string {
  if (typeof message === 'string') return message;
  
  if (message.text) return message.text;
  
  if (message.content) {
    if (Array.isArray(message.content)) {
      return message.content
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text || '')
        .join('\n');
    }
    return message.content;
  }
  
  return '';
}

export const vertexAIHandler = {
  /**
   * Check if Vertex AI is available
   * @returns Boolean indicating availability
   */
  isAvailable(): boolean {
    return hasVertexAIConfig();
  },

  /**
   * Process a user message and generate a response using Vertex AI Claude
   * @param message User message
   * @param session AI session
   * @returns Promise with AI response
   */
  async processMessage(message: string, session?: AISession): Promise<string> {
    if (!hasVertexAIConfig()) {
      return "Vertex AI is not available. Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_PROJECT.";
    }

    try {
      const predictionClient = new PredictionServiceClient({apiEndpoint: API_ENDPOINT});
      
      // Format history for Claude API
      const messages = session?.history?.length 
        ? session.history.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        : [];
        
      // Add the new message
      messages.push({
        role: 'user',
        content: message
      });

      const prompt = {
        messages,
        system: "You are Claude, an AI assistant created by Anthropic but accessed through Google Cloud Vertex AI. Be helpful, harmless, and honest."
      };

      // Endpoint path
      const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/${PUBLISHER}/models/${CLAUDE_MODEL}`;
      
      // Make the prediction request
      const response = await predictionClient.predict({
        endpoint,
        instances: [{ prompt }],
        parameters: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
          topK: 40
        }
      });
      
      const predictionResponse = response[0];

      // Extract the response text
      const prediction = response.predictions?.[0];
      if (!prediction) {
        throw new Error("No prediction returned from Vertex AI");
      }

      const responseContent = prediction.candidates?.[0]?.content;
      if (!responseContent) {
        throw new Error("No response content returned from Vertex AI Claude");
      }

      // Update session if provided
      if (session) {
        session.history.push({
          role: 'user',
          content: message,
          timestamp: Date.now()
        });
        
        session.history.push({
          role: 'assistant',
          content: responseContent,
          timestamp: Date.now()
        });
        
        session.lastActive = Date.now();
      }

      return responseContent;
    } catch (error) {
      console.error('Error using Vertex AI Claude:', error);
      throw error;
    }
  },

  /**
   * Generate code based on a prompt using Vertex AI Claude
   * @param prompt User prompt
   * @param language Programming language
   * @returns Promise with generated code
   */
  async generateCode(prompt: string, language: string = 'javascript'): Promise<string> {
    if (!hasVertexAIConfig()) {
      return `// Vertex AI is not available. Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_PROJECT.`;
    }

    try {
      const predictionClient = new PredictionServiceClient({apiEndpoint: API_ENDPOINT});
      
      const systemPrompt = `You are an expert ${language} developer. Generate clean, well-documented ${language} code based on the user's request. Only provide the code, no explanations or preamble.`;
      
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      // Endpoint path
      const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/${PUBLISHER}/models/${CLAUDE_MODEL}`;
      
      // Make the prediction request
      const [response] = await predictionClient.predict({
        endpoint,
        instances: [{ 
          prompt: {
            messages,
            system: systemPrompt
          }
        }],
        parameters: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          topP: 0.95,
          topK: 40
        }
      });

      // Extract the response text
      const prediction = response.predictions?.[0];
      if (!prediction) {
        throw new Error("No prediction returned from Vertex AI");
      }

      const generatedCode = prediction.candidates?.[0]?.content;
      if (!generatedCode) {
        throw new Error("No code generated from Vertex AI Claude");
      }

      // Attempt to extract code blocks if present
      const codeBlockRegex = /```(?:[\w]*\n)?([\s\S]*?)```/g;
      const matches = [...generatedCode.matchAll(codeBlockRegex)];
      
      if (matches.length > 0) {
        // Return the first code block
        return matches[0][1].trim();
      }
      
      // Return the whole response if no code blocks found
      return generatedCode;
    } catch (error) {
      console.error('Error generating code with Vertex AI Claude:', error);
      throw error;
    }
  },

  /**
   * Explain code using Vertex AI Claude
   * @param code Code to explain
   * @returns Promise with explanation
   */
  async explainCode(code: string): Promise<string> {
    if (!hasVertexAIConfig()) {
      return "Vertex AI is not available. Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_PROJECT.";
    }

    try {
      const predictionClient = new PredictionServiceClient({apiEndpoint: API_ENDPOINT});
      
      const systemPrompt = "You are an expert programmer. Explain the provided code in detail, describing what it does, how it works, and any important patterns or concepts it demonstrates.";
      
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Please explain this code:\n\n\`\`\`\n${code}\n\`\`\``
        }
      ];

      // Endpoint path
      const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/${PUBLISHER}/models/${CLAUDE_MODEL}`;
      
      // Make the prediction request
      const [response] = await predictionClient.predict({
        endpoint,
        instances: [{ 
          prompt: {
            messages,
            system: systemPrompt
          }
        }],
        parameters: {
          temperature: 0.2,
          maxOutputTokens: 1536,
          topP: 0.95,
          topK: 40
        }
      });

      // Extract the response text
      const prediction = response.predictions?.[0];
      if (!prediction) {
        throw new Error("No prediction returned from Vertex AI");
      }

      const explanation = prediction.candidates?.[0]?.content;
      if (!explanation) {
        throw new Error("No explanation generated from Vertex AI Claude");
      }

      return explanation;
    } catch (error) {
      console.error('Error explaining code with Vertex AI Claude:', error);
      throw error;
    }
  },

  /**
   * Generate a summary of conversation history using Vertex AI Claude
   * @param messages Array of conversation messages
   * @returns Promise with summary
   */
  async generateSummary(messages: { role: string, content: string }[]): Promise<string> {
    if (!hasVertexAIConfig()) {
      return "Vertex AI is not available. Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_PROJECT.";
    }

    if (messages.length < 3) {
      return "Not enough messages to generate a summary.";
    }

    try {
      const predictionClient = new PredictionServiceClient({apiEndpoint: API_ENDPOINT});
      
      const systemPrompt = "You are tasked with summarizing a conversation. Create a concise summary of the key points, questions, and conclusions from the conversation.";
      
      const conversationText = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');
      
      const prompt = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Please summarize this conversation:\n\n${conversationText}`
        }
      ];

      // Endpoint path
      const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/${PUBLISHER}/models/${CLAUDE_MODEL}`;
      
      // Make the prediction request
      const [response] = await predictionClient.predict({
        endpoint,
        instances: [{ 
          prompt: {
            messages: prompt,
            system: systemPrompt
          }
        }],
        parameters: {
          temperature: 0.2,
          maxOutputTokens: 512,
          topP: 0.95,
          topK: 40
        }
      });

      // Extract the response text
      const prediction = response.predictions?.[0];
      if (!prediction) {
        throw new Error("No prediction returned from Vertex AI");
      }

      const summary = prediction.candidates?.[0]?.content;
      if (!summary) {
        throw new Error("No summary generated from Vertex AI Claude");
      }

      return summary;
    } catch (error) {
      console.error('Error generating summary with Vertex AI Claude:', error);
      throw error;
    }
  }
};