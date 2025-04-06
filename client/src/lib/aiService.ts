import { apiRequest } from './queryClient';

// Interface for message data
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Interface for chat session
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

// Get or create a chat session
export const getOrCreateSession = async (): Promise<ChatSession> => {
  try {
    const response = await apiRequest('GET', '/api/chat/session');
    return await response.json();
  } catch (error) {
    console.error('Error getting chat session:', error);
    throw error;
  }
};

// Send a message and get a response
export const sendMessage = async (sessionId: string, content: string): Promise<ChatMessage> => {
  try {
    const response = await apiRequest('POST', `/api/chat/message`, {
      sessionId,
      content
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get chat history
export const getChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const response = await apiRequest('GET', `/api/chat/history?sessionId=${sessionId}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
};

// Update model configuration
export const updateModelConfig = async (sessionId: string, config: { model: string; temperature: number }): Promise<ChatSession> => {
  try {
    const response = await apiRequest('PATCH', `/api/chat/session`, {
      sessionId,
      modelConfig: config
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error updating model config:', error);
    throw error;
  }
};

// Generate code from prompt
export const generateCode = async (prompt: string, language: string): Promise<string> => {
  try {
    const response = await apiRequest('POST', `/api/ai/generate-code`, {
      prompt,
      language
    });
    
    const data = await response.json();
    return data.code;
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
};

// Explain selected code
export const explainCode = async (code: string): Promise<string> => {
  try {
    const response = await apiRequest('POST', `/api/ai/explain-code`, {
      code
    });
    
    const data = await response.json();
    return data.explanation;
  } catch (error) {
    console.error('Error explaining code:', error);
    throw error;
  }
};

// Transcribe audio to text
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    
    const response = await fetch('/api/ai/transcribe', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};
