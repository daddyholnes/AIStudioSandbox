import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { AISession } from '../shared/schema';

// Initialize Gemini API with the API key
const apiKey = process.env.GOOGLE_AI_API_KEY;

// Initialize the Google Generative AI instance if API key is available
let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('Google AI API key is not provided. Using simulated AI responses instead.');
}

// Default model to use
const DEFAULT_MODEL = 'gemini-pro';

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

export const aiHandler = {
  /**
   * Process a user message and generate a response
   * @param message User message
   * @param session AI session
   * @returns Promise with AI response
   */
  async processMessage(message: string, session?: AISession): Promise<string> {
    if (!apiKey || !genAI) {
      return this.simulateAIResponse(message);
    }
    
    try {
      let history: { role: string, parts: string }[] = [];
      
      // Add history from session if available
      if (session && session.history.length > 0) {
        // Convert session history to Google AI chat format
        history = session.history.map(msg => ({
          role: msg.role,
          parts: msg.content
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
      return this.simulateCodeGeneration(prompt, language);
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
      return `// Error generating code: ${(error as Error).message}
      
// Fallback example for ${language}:
${this.simulateCodeGeneration(prompt, language)}`;
    }
  },
  
  /**
   * Explain code
   * @param code Code to explain
   * @returns Promise with explanation
   */
  async explainCode(code: string): Promise<string> {
    if (!apiKey || !genAI) {
      return this.simulateCodeExplanation(code);
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
      return `Error explaining code: ${(error as Error).message}
      
Here's a basic explanation instead:
      
${this.simulateCodeExplanation(code)}`;
    }
  },
  
  /**
   * Helper to explain a line of code (simplified demo)
   * @param line Line of code
   * @returns Explanation string
   */
  explainCodeLine(line: string): string {
    // This is a very simplified simulation
    if (line.includes('import')) {
      return 'This line imports required modules or functions from external libraries.';
    } else if (line.includes('function')) {
      return 'This line defines a function that encapsulates reusable code.';
    } else if (line.includes('return')) {
      return 'This line specifies the value to be returned from the function.';
    } else if (line.includes('if')) {
      return 'This line starts a conditional statement to execute code based on a condition.';
    } else if (line.includes('for')) {
      return 'This line starts a loop to iterate over a collection or a range of values.';
    } else if (line.includes('const') || line.includes('let') || line.includes('var')) {
      return 'This line declares a variable to store data.';
    } else {
      return 'This is a code statement that performs an operation or action.';
    }
  },
  
  /**
   * Generate a summary of conversation history
   * @param session AI session
   * @returns Promise resolving when summary is generated
   */
  async generateSummary(session: AISession): Promise<void> {
    if (!session || session.history.length < 5) {
      // Not enough history to summarize
      return;
    }
    
    const lastSummaryTimestamp = session.summaries.length > 0 
      ? session.summaries[session.summaries.length - 1].toTimestamp 
      : 0;
    
    // Get messages since last summary
    const newMessages = session.history.filter(msg => msg.timestamp > lastSummaryTimestamp);
    
    if (newMessages.length < 5) {
      // Not enough new messages to summarize
      return;
    }
    
    if (!apiKey || !genAI) {
      // Create a simple summary without AI
      const topic = this.getSummaryTopic(newMessages.map(msg => msg.content).join(' '));
      
      session.summaries.push({
        content: `Discussion about ${topic}`,
        fromTimestamp: newMessages[0].timestamp,
        toTimestamp: newMessages[newMessages.length - 1].timestamp
      });
      
      return;
    }
    
    try {
      // Prepare the conversation history for summarization
      const conversationText = newMessages.map(msg => 
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
      
      // Add summary to session
      session.summaries.push({
        content: summary,
        fromTimestamp: newMessages[0].timestamp,
        toTimestamp: newMessages[newMessages.length - 1].timestamp
      });
    } catch (error) {
      console.error('Error generating summary with Google AI:', error);
      // Create a simple fallback summary
      const topic = this.getSummaryTopic(newMessages.map(msg => msg.content).join(' '));
      
      session.summaries.push({
        content: `Discussion about ${topic} (summary generation failed)`,
        fromTimestamp: newMessages[0].timestamp,
        toTimestamp: newMessages[newMessages.length - 1].timestamp
      });
    }
  },
  
  /**
   * Get the main topic from text (simplified demo)
   * @param text Text to analyze
   * @returns Topic string
   */
  getSummaryTopic(text: string): string {
    // This is a very simplified implementation for demo purposes
    const words = text.toLowerCase().split(/\s+/);
    const excludedWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'to', 'in', 'on', 'at', 'with', 'by', 'for']);
    
    // Count word frequencies
    const wordFrequency: Record<string, number> = {};
    
    for (const word of words) {
      if (word.length > 3 && !excludedWords.has(word)) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    }
    
    // Find most frequent words
    let topWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
    
    return topWords.join(', ') || 'general topics';
  },
  
  /**
   * Simple simulation of AI responses for demo purposes
   * @param message User message
   * @returns Simulated AI response
   */
  simulateAIResponse(message: string): string {
    const responses = [
      "I understand you're asking about code development. While I'm in demonstration mode without the Google AI API key, I can still help with some basic guidance.",
      "Thanks for your question. I'm currently running in simulation mode without access to the full AI capabilities, but I can offer some general advice.",
      "Without the Google AI API key, I'm providing a simulated response. For full AI capabilities, please add the API key to your environment variables.",
      "I'd be happy to help with your coding questions once I have access to the Google AI API. For now, I can suggest some general approaches.",
      "That's an interesting coding challenge. In simulation mode, I can't provide a detailed response, but I can point you in the right direction.",
    ];
    
    const codeRelatedResponses = [
      "When writing code, remember to focus on readability and maintainability. Use clear variable names and add comments to explain complex logic.",
      "A good approach to this problem would be to break it down into smaller, manageable steps and solve each step individually.",
      "For this kind of task, you might want to consider using a design pattern like Observer, Factory, or Singleton depending on your specific needs.",
      "Testing is crucial for reliable code. Consider writing unit tests for your functions to ensure they behave as expected under various conditions.",
      "When optimizing code, focus on algorithms and data structures first before micro-optimizations. The choice of algorithm often has a bigger impact on performance."
    ];
    
    // Select a random general response
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Select a random code-related tip
    const randomCodeTip = codeRelatedResponses[Math.floor(Math.random() * codeRelatedResponses.length)];
    
    // Combine them
    return `${randomResponse}\n\n${randomCodeTip}\n\n(Note: This is a simulated response. To enable genuine AI-powered responses, please add the GOOGLE_AI_API_KEY to your environment variables.)`;
  },
  
  /**
   * Simulate code generation (for demo when API key is not available)
   * @param prompt User prompt
   * @param language Programming language
   * @returns Simulated generated code
   */
  simulateCodeGeneration(prompt: string, language: string): string {
    // Map of language to simulated code examples
    const codeExamples: Record<string, string> = {
      javascript: `// A simulated JavaScript example
function processData(input) {
  try {
    // Parse the input data
    const data = JSON.parse(input);
    
    // Process each item
    const results = data.map(item => {
      return {
        id: item.id,
        value: item.value * 2,
        processed: true
      };
    });
    
    return results;
  } catch (error) {
    console.error("Error processing data:", error);
    return null;
  }
}

// Example usage
const sampleData = '[{"id": 1, "value": 5}, {"id": 2, "value": 10}]';
const result = processData(sampleData);
console.log(result);`,
      
      python: `# A simulated Python example
import json

def process_data(input_str):
    try:
        # Parse the input data
        data = json.loads(input_str)
        
        # Process each item
        results = []
        for item in data:
            results.append({
                'id': item['id'],
                'value': item['value'] * 2,
                'processed': True
            })
        
        return results
    except Exception as e:
        print(f"Error processing data: {e}")
        return None

# Example usage
sample_data = '[{"id": 1, "value": 5}, {"id": 2, "value": 10}]'
result = process_data(sample_data)
print(result)`,
      
      java: `// A simulated Java example
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

public class DataProcessor {
    public List<JSONObject> processData(String input) {
        try {
            // Parse the input data
            JSONArray data = new JSONArray(input);
            List<JSONObject> results = new ArrayList<>();
            
            // Process each item
            for (int i = 0; i < data.length(); i++) {
                JSONObject item = data.getJSONObject(i);
                JSONObject result = new JSONObject();
                result.put("id", item.getInt("id"));
                result.put("value", item.getInt("value") * 2);
                result.put("processed", true);
                results.add(result);
            }
            
            return results;
        } catch (Exception e) {
            System.err.println("Error processing data: " + e.getMessage());
            return null;
        }
    }
    
    public static void main(String[] args) {
        String sampleData = "[{\"id\": 1, \"value\": 5}, {\"id\": 2, \"value\": 10}]";
        List<JSONObject> result = new DataProcessor().processData(sampleData);
        System.out.println(result);
    }
}`
    };
    
    // Get the code example for the requested language, or default to JavaScript
    const code = codeExamples[language.toLowerCase()] || codeExamples.javascript;
    
    return `\`\`\`${language}\n${code}\n\`\`\`\n\n(Note: This is a simulated code example. To enable genuine AI-powered code generation, please add the GOOGLE_AI_API_KEY to your environment variables.)`;
  },
  
  /**
   * Simulate code explanation (for demo when API key is not available)
   * @param code Code to explain
   * @returns Simulated explanation
   */
  simulateCodeExplanation(code: string): string {
    return `# Code Explanation (Simulated)

## Overview
This code appears to be a data processing function that takes input data, applies transformations, and returns the processed results.

## Key Components
- Input parsing: The code parses JSON input data
- Data processing: It applies transformations to each item in the data
- Error handling: The code includes try/catch blocks to handle potential errors

## Implementation Details
The function first parses the input string into a data structure, then iterates through each item, doubling the 'value' property and adding a 'processed' flag. The results are collected and returned.

## Potential Improvements
- Add input validation to check for required fields
- Implement more robust error handling with specific error types
- Consider adding documentation for better maintainability

(Note: This is a simulated explanation. To enable genuine AI-powered code explanations, please add the GOOGLE_AI_API_KEY to your environment variables.)`;
  }
};