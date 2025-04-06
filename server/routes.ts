import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { livekitHandler } from "./livekit";
import { aiHandler } from "./ai";
import { webSocketRoomManager } from "./services/websocket";
import { codeAssistantFlow, chatAssistantFlow, imageGenerationFlow } from './services/genkit';

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // WebSocket server for LiveKit events
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws/livekit' // Use a specific path to avoid conflicts with other WebSockets
  });
  
  // Initialize WebSocket collaboration service with the same HTTP server
  webSocketRoomManager.initialize(httpServer);
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        if (data.type === 'join-room') {
          // Handle room joining
          livekitHandler.joinRoom(data.roomName, data.participantName)
            .then(token => {
              ws.send(JSON.stringify({
                type: 'room-token',
                token,
                roomName: data.roomName
              }));
            })
            .catch(error => {
              ws.send(JSON.stringify({
                type: 'error',
                message: error.message
              }));
            });
        } else if (data.type === 'ai-message') {
          // Handle AI message processing
          aiHandler.processMessage(data.message)
            .then(response => {
              ws.send(JSON.stringify({
                type: 'ai-response',
                message: response
              }));
            })
            .catch(error => {
              ws.send(JSON.stringify({
                type: 'error',
                message: error.message
              }));
            });
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // LiveKit API routes
  
  // Create a LiveKit room
  app.post('/api/livekit/room', async (req, res) => {
    try {
      const { roomName } = req.body;
      
      if (!roomName) {
        return res.status(400).json({ message: 'Room name is required' });
      }
      
      // Create the room using our handler
      const result = await livekitHandler.createRoom(roomName);
      
      return res.status(201).json(result);
    } catch (error) {
      console.error('Error creating room:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create room',
        error: (error as Error).message
      });
    }
  });
  
  // Generate a LiveKit token
  app.post('/api/livekit/token', async (req, res) => {
    try {
      const { roomName, participantName } = req.body;
      
      if (!roomName || !participantName) {
        return res.status(400).json({ message: 'Room name and participant name are required' });
      }
      
      // Join room or create if it doesn't exist
      const token = await livekitHandler.joinRoom(roomName, participantName);
      
      return res.status(200).json({ token });
    } catch (error) {
      console.error('Error generating token:', error);
      return res.status(500).json({ 
        message: 'Failed to generate token',
        error: (error as Error).message
      });
    }
  });
  
  // AI endpoints
  
  // Process a chat message
  app.post('/api/chat/message', async (req, res) => {
    try {
      const { sessionId, content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: 'Message content is required' });
      }
      
      // Get or create session
      const session = await storage.getOrCreateAISession(sessionId || 'default');
      
      // Process the message
      const response = await aiHandler.processMessage(content, session);
      
      return res.status(200).json({
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error processing message:', error);
      return res.status(500).json({ 
        message: 'Failed to process message',
        error: (error as Error).message
      });
    }
  });
  
  // Get chat history
  app.get('/api/chat/history', async (req, res) => {
    try {
      const { sessionId } = req.query;
      
      // Get session history
      const session = await storage.getOrCreateAISession(sessionId as string || 'default');
      
      return res.status(200).json({
        messages: session.history.map((msg, index) => ({
          id: `${index + 1}`,
          sender: msg.role,
          senderName: msg.role === 'user' ? 'You' : 'Gemini Assistant',
          content: msg.content,
          timestamp: msg.timestamp,
          hasCode: msg.content.includes('```')
        }))
      });
    } catch (error) {
      console.error('Error getting chat history:', error);
      return res.status(500).json({ 
        message: 'Failed to get chat history',
        error: (error as Error).message
      });
    }
  });
  
  // Get or create chat session
  app.get('/api/chat/session', async (req, res) => {
    try {
      const { sessionId } = req.query;
      
      // Get or create session
      const session = await storage.getOrCreateAISession(sessionId as string || 'default');
      
      return res.status(200).json({
        id: session.sessionId,
        name: 'Untitled Session',
        createdAt: Date.now() - 3600000, // 1 hour ago
        lastActive: session.lastActive,
        messages: session.history,
        summaries: session.summaries,
        modelConfig: session.modelConfig
      });
    } catch (error) {
      console.error('Error getting session:', error);
      return res.status(500).json({ 
        message: 'Failed to get session',
        error: (error as Error).message
      });
    }
  });
  
  // AI code generation
  app.post('/api/ai/generate-code', async (req, res) => {
    try {
      const { prompt, language } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      // Generate code
      const code = await aiHandler.generateCode(prompt, language || 'javascript');
      
      return res.status(200).json({ code });
    } catch (error) {
      console.error('Error generating code:', error);
      return res.status(500).json({ 
        message: 'Failed to generate code',
        error: (error as Error).message
      });
    }
  });
  
  // Explain code
  app.post('/api/ai/explain-code', async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }
      
      // Explain code
      const explanation = await aiHandler.explainCode(code);
      
      return res.status(200).json({ explanation });
    } catch (error) {
      console.error('Error explaining code:', error);
      return res.status(500).json({ 
        message: 'Failed to explain code',
        error: (error as Error).message
      });
    }
  });
  
  // File management endpoints
  
  // Get file tree
  app.get('/api/files', async (req, res) => {
    try {
      // Get files from storage
      const files = await storage.getProjectFiles();
      
      return res.status(200).json(files);
    } catch (error) {
      console.error('Error getting files:', error);
      return res.status(500).json({ 
        message: 'Failed to get files',
        error: (error as Error).message
      });
    }
  });
  
  // Get file content
  app.get('/api/files/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get file from storage
      const file = await storage.getProjectFile(id);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      return res.status(200).json(file);
    } catch (error) {
      console.error('Error getting file:', error);
      return res.status(500).json({ 
        message: 'Failed to get file',
        error: (error as Error).message
      });
    }
  });
  
  // Save file content
  app.patch('/api/files/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (content === undefined) {
        return res.status(400).json({ message: 'Content is required' });
      }
      
      // Update file in storage
      const updatedFile = await storage.updateProjectFile(id, { content });
      
      if (!updatedFile) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      return res.status(200).json(updatedFile);
    } catch (error) {
      console.error('Error updating file:', error);
      return res.status(500).json({ 
        message: 'Failed to update file',
        error: (error as Error).message
      });
    }
  });
  
  // Create new file
  app.post('/api/files', async (req, res) => {
    try {
      const { name, path, content, language } = req.body;
      
      if (!name || !path) {
        return res.status(400).json({ message: 'Name and path are required' });
      }
      
      // Create file in storage
      const file = await storage.createProjectFile({
        name,
        path,
        content: content || '',
        language: language || 'plaintext'
      });
      
      return res.status(201).json(file);
    } catch (error) {
      console.error('Error creating file:', error);
      return res.status(500).json({ 
        message: 'Failed to create file',
        error: (error as Error).message
      });
    }
  });
  
  // Execute code
  app.post('/api/execute', async (req, res) => {
    try {
      const { code, language } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Code is required' });
      }
      
      // For demo purposes, we'll only provide a simulated response
      // In a real implementation, this would use a secure sandbox for code execution
      let result = '';
      
      if (language === 'javascript') {
        try {
          // SECURITY: This is just a simulation and not actually evaluating the code
          result = `Executed JavaScript code successfully.\nSimulated output: "Hello, World!"`;
        } catch (error) {
          return res.status(400).json({ 
            result: '',
            error: (error as Error).message 
          });
        }
      } else {
        result = `Execution for ${language} is not supported in this demo.`;
      }
      
      return res.status(200).json({ result });
    } catch (error) {
      console.error('Error executing code:', error);
      return res.status(500).json({ 
        message: 'Failed to execute code',
        error: (error as Error).message
      });
    }
  });
  
  // WebSocket Collaboration API routes
  
  // List all collaboration rooms
  app.get('/api/collab/rooms', (req, res) => {
    try {
      const rooms = webSocketRoomManager.getRooms();
      return res.status(200).json({ rooms });
    } catch (error) {
      console.error('Error listing rooms:', error);
      return res.status(500).json({ 
        message: 'Failed to list rooms',
        error: (error as Error).message
      });
    }
  });
  
  // Get room details
  app.get('/api/collab/rooms/:roomId', (req, res) => {
    try {
      const { roomId } = req.params;
      const room = webSocketRoomManager.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      return res.status(200).json(room);
    } catch (error) {
      console.error('Error getting room:', error);
      return res.status(500).json({ 
        message: 'Failed to get room details',
        error: (error as Error).message
      });
    }
  });

  // Genkit API endpoints
  
  // Process a chat message with Genkit
  app.post('/api/genkit/chat', async (req, res) => {
    try {
      const { message, chatHistory, enableReasoning } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }
      
      // Convert history to the format expected by Genkit
      const history = (chatHistory || []).map((msg: any) => ({
        role: msg.role, 
        content: msg.content
      }));
      
      // Process through Genkit flow
      const response = await chatAssistantFlow({
        userMessage: message,
        chatHistory: history,
        enableReasoning: !!enableReasoning
      });
      
      return res.status(200).json({
        response,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error processing Genkit chat:', error);
      return res.status(500).json({ 
        message: 'Failed to process message with Genkit',
        error: (error as Error).message
      });
    }
  });
  
  // Generate code with Genkit
  app.post('/api/genkit/code', async (req, res) => {
    try {
      const { prompt, language, currentCode } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      // Generate code using Genkit flow
      const code = await codeAssistantFlow({
        userPrompt: prompt,
        language: language || 'typescript',
        currentCode: currentCode || ''
      });
      
      return res.status(200).json({
        code,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error generating code with Genkit:', error);
      return res.status(500).json({ 
        message: 'Failed to generate code with Genkit',
        error: (error as Error).message
      });
    }
  });
  
  // Generate images with Genkit
  app.post('/api/genkit/image', async (req, res) => {
    try {
      const { prompt, style, size } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      // Generate image using Genkit flow
      const imageResult = await imageGenerationFlow({
        prompt,
        style: style || 'vivid',
        size: size || '1024x1024'
      });
      
      return res.status(200).json({
        imageUrl: imageResult.imageUrl,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error generating image with Genkit:', error);
      return res.status(500).json({ 
        message: 'Failed to generate image with Genkit',
        error: (error as Error).message
      });
    }
  });
  
  return httpServer;
}
