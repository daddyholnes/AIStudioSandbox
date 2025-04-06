import { apiRequest } from './queryClient';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  name: string;
  createdAt: number;
  lastActive: number;
  messages: ChatMessage[];
  summaries: string[];
  modelConfig: {
    model: string;
    temperature: number;
  };
}

/**
 * Get or create a chat session
 */
export const getOrCreateSession = async (): Promise<ChatSession> => {
  try {
    const response = await apiRequest<ChatSession>('/api/ai/session', {
      method: 'POST',
    });
    return response;
  } catch (error) {
    console.error('Error getting or creating session:', error);
    
    // For now, return a mock session if the API fails
    return {
      id: `session-${Date.now()}`,
      name: 'New Session',
      createdAt: Date.now(),
      lastActive: Date.now(),
      messages: [],
      summaries: [],
      modelConfig: {
        model: 'gemini-pro',
        temperature: 0.7
      }
    };
  }
};

/**
 * Send a message to the AI assistant
 */
export const sendMessage = async (sessionId: string, content: string): Promise<ChatMessage> => {
  try {
    const response = await apiRequest<ChatMessage>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        message: content
      }),
    });
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    
    // For now, return a simulated response if the API fails
    return {
      role: 'assistant',
      content: simulateAIResponse(content),
      timestamp: Date.now()
    };
  }
};

/**
 * Get chat history for a session
 */
export const getChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const response = await apiRequest<ChatMessage[]>(`/api/ai/history/${sessionId}`, {
      method: 'GET',
    });
    return response;
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
};

/**
 * Update model configuration
 */
export const updateModelConfig = async (sessionId: string, config: { model: string; temperature: number }): Promise<ChatSession> => {
  try {
    const response = await apiRequest<ChatSession>(`/api/ai/config/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    return response;
  } catch (error) {
    console.error('Error updating model config:', error);
    throw error;
  }
};

/**
 * Generate code based on a prompt
 */
export const generateCode = async (prompt: string, language: string): Promise<string> => {
  try {
    const response = await apiRequest<{ code: string }>('/api/ai/generate-code', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        language
      }),
    });
    return response.code;
  } catch (error) {
    console.error('Error generating code:', error);
    
    // For demo purposes, return placeholder code if the API fails
    return simulateCodeGeneration(prompt, language);
  }
};

/**
 * Explain code
 */
export const explainCode = async (code: string): Promise<string> => {
  try {
    const response = await apiRequest<{ explanation: string }>('/api/ai/explain-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return response.explanation;
  } catch (error) {
    console.error('Error explaining code:', error);
    
    // For demo purposes, return placeholder explanation if the API fails
    return simulateCodeExplanation(code);
  }
};

/**
 * Transcribe audio to text
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    
    const response = await apiRequest<{ text: string }>('/api/ai/transcribe', {
      method: 'POST',
      body: formData,
      headers: {}, // Let the browser set the correct Content-Type with boundary
    });
    
    return response.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

// Demo helper functions for simulated responses
function simulateAIResponse(message: string): string {
  // Simple simulation of AI responses for demo purposes
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    return "Hello! I'm your AI coding assistant. How can I help you today?";
  }
  
  if (message.toLowerCase().includes('help')) {
    return "I can help you with coding tasks, explain concepts, or generate code examples. What would you like assistance with?";
  }
  
  if (message.toLowerCase().includes('javascript') || message.toLowerCase().includes('js')) {
    return "JavaScript is a versatile programming language primarily used for web development. It allows you to add interactive elements to websites. Would you like me to explain a specific concept or generate some JavaScript code?";
  }
  
  if (message.toLowerCase().includes('python')) {
    return "Python is a high-level, interpreted programming language known for its readability and simplicity. It's great for beginners and is widely used in data science, machine learning, web development, and automation.";
  }
  
  if (message.toLowerCase().includes('code')) {
    return "Sure, I can help you write code. What language are you working with, and what would you like the code to do?";
  }
  
  // Default response
  return "I understand your message. To better assist you, could you provide more details about what you're working on or what specific help you need?";
}

function simulateCodeGeneration(prompt: string, language: string): string {
  // Generate simple code based on language for demo purposes
  switch (language) {
    case 'javascript':
    case 'typescript':
      return `// Function based on your request
function processData(data) {
  // Validate input
  if (!data || !Array.isArray(data)) {
    throw new Error('Input must be an array');
  }
  
  // Process the data
  const results = data.map(item => {
    return {
      id: item.id,
      value: item.value * 2,
      processed: true
    };
  });
  
  return results;
}

// Example usage
const myData = [
  { id: 1, value: 10 },
  { id: 2, value: 20 },
  { id: 3, value: 30 }
];

const processedData = processData(myData);
console.log(processedData);`;

    case 'python':
      return `# Function based on your request
def process_data(data):
    """
    Process the input data and return transformed results.
    
    Args:
        data (list): A list of dictionaries with id and value.
        
    Returns:
        list: Processed data with values doubled.
    """
    # Validate input
    if not isinstance(data, list):
        raise TypeError("Input must be a list")
    
    # Process the data
    results = [
        {
            'id': item['id'],
            'value': item['value'] * 2,
            'processed': True
        }
        for item in data
    ]
    
    return results

# Example usage
my_data = [
    {'id': 1, 'value': 10},
    {'id': 2, 'value': 20},
    {'id': 3, 'value': 30}
]

processed_data = process_data(my_data)
print(processed_data)`;

    case 'java':
      return `import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class DataProcessor {
    /**
     * Process the input data and return transformed results.
     * 
     * @param data List of Maps representing the data items
     * @return List of processed data items
     */
    public List<Map<String, Object>> processData(List<Map<String, Object>> data) {
        // Validate input
        if (data == null) {
            throw new IllegalArgumentException("Input data cannot be null");
        }
        
        // Process the data
        List<Map<String, Object>> results = new ArrayList<>();
        for (Map<String, Object> item : data) {
            Map<String, Object> processedItem = new HashMap<>();
            processedItem.put("id", item.get("id"));
            processedItem.put("value", ((Integer) item.get("value")) * 2);
            processedItem.put("processed", true);
            results.add(processedItem);
        }
        
        return results;
    }
    
    // Example usage
    public static void main(String[] args) {
        List<Map<String, Object>> myData = new ArrayList<>();
        
        Map<String, Object> item1 = new HashMap<>();
        item1.put("id", 1);
        item1.put("value", 10);
        myData.add(item1);
        
        Map<String, Object> item2 = new HashMap<>();
        item2.put("id", 2);
        item2.put("value", 20);
        myData.add(item2);
        
        DataProcessor processor = new DataProcessor();
        List<Map<String, Object>> processedData = processor.processData(myData);
        System.out.println(processedData);
    }
}`;

    default:
      return `// Simple ${language} code example
// This is a placeholder since you requested code in ${language}
// Replace with actual implementation for your use case

function main() {
  console.log("Hello, world!");
  
  // Add your implementation here
  const data = processInput();
  const result = calculate(data);
  displayOutput(result);
}

function processInput() {
  // Input processing logic
  return [1, 2, 3, 4, 5];
}

function calculate(data) {
  // Main calculation or algorithm
  return data.map(x => x * 2);
}

function displayOutput(result) {
  console.log("Result:", result);
}

main();`;
  }
}

function simulateCodeExplanation(code: string): string {
  // Simple code explanation for demo purposes
  return `This code appears to define a function that processes data. Let me break it down:

## Overview
The code defines a data processing function that takes an input, performs validation, and applies a transformation to each item in the input.

## Key Components

1. **Input Validation**: The function checks if the input is in the expected format (an array or list) and throws an error if not.

2. **Data Transformation**: It iterates through each item in the input data and:
   - Preserves the 'id' field
   - Doubles the 'value' field
   - Adds a 'processed' flag set to true

3. **Example Usage**: The code includes an example that demonstrates how to use the function with sample data.

## Potential Improvements

1. You might want to add more robust error handling, especially for edge cases.
2. Consider adding type checking for individual data fields.
3. Documentation could be expanded to describe the purpose of the function in more detail.

This code follows good practices by validating input, providing clear variable names, and including example usage.`;
}