import express, { type Request, Response, NextFunction } from "express";
import http from 'http';
// Ensure the correct WebSocket service is imported
import { webSocketRoomManager } from './services/websocket';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service (using the Room Manager)
// The Room Manager initializes itself with the server instance later
// webSocketRoomManager.initialize(server); // Initialization might happen within registerRoutes or elsewhere

// Setup middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Basic routes
app.get('/', (req, res) => res.send('API Server Running'));

// API routes for feature toggles
app.get('/api/ai/features', async (req, res) => { // Make async if storage interaction is async
  try {
    const sessionId = req.query.sessionId as string || 'default';
    // Fetch from actual storage if implemented
    const session = await storage.getOrCreateAISession(sessionId); // Assuming storage is available
    res.json({
      success: true, // Add success flag for consistency
      features: session.features || { // Provide default features if none exist
        webAccess: true,
        thinking: false,
        genkit: true,
        commands: false,
        prompts: true // Add prompts if it's a feature
      }
    });
  } catch (error) {
    log(`Error fetching features: ${(error as Error).message}`, 'error');
    res.status(500).json({ success: false, message: 'Failed to fetch features' });
  }
});

app.post('/api/ai/features', async (req, res) => { // Make async
  try {
    const sessionId = req.query.sessionId as string || 'default';
    const featureUpdates = req.body;
    // Save to actual storage
    const session = await storage.getOrCreateAISession(sessionId);
    session.features = { ...(session.features || {}), ...featureUpdates };
    await storage.saveAISession(session); // Assuming storage has save method

    // Broadcast update (if WebSocket service is available via app context)
    const wsService = req.app.get('webSocketService');
    if (wsService && typeof wsService.broadcastToSession === 'function') {
      wsService.broadcastToSession(sessionId, {
        type: 'featureUpdate',
        features: featureUpdates
      }, /* excludeSenderId */); // Add excludeSenderId if needed
    } else if (webSocketRoomManager) { // Fallback to direct manager if needed
       webSocketRoomManager.broadcastFeatureUpdate(sessionId, featureUpdates);
    }


    log(`Feature update for session ${sessionId}: ${JSON.stringify(featureUpdates)}`);
    res.json({ success: true, features: session.features });
  } catch (error) {
    log(`Error updating features: ${(error as Error).message}`, 'error');
    res.status(500).json({ success: false, message: 'Failed to update features' });
  }
});

// Code generation endpoint (REMOVE MOCK - Handled by Genkit route)
/*
app.post('/api/ai/code', async (req, res) => {
  // ... removed mock implementation ...
});
*/

(async () => {
  // Pass the server instance to registerRoutes if needed for WebSocket setup
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Make WebSocket service available to routes if needed elsewhere
  // app.set('webSocketService', webSocketRoomManager); // Or the specific service instance

  // Start server
  server.listen(port, () => {
    log(`Server running on port ${port}`);
  });
})();

export default server;
