import express, { type Request, Response, NextFunction } from "express";
import http from 'http';
import { WebSocketService } from './services/websocket';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
const webSocketService = new WebSocketService(server);

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
app.get('/api/ai/features', (req, res) => {
  const sessionId = req.query.sessionId || 'default';
  // Normally you'd fetch from a database, but for demo:
  res.json({
    features: {
      webAccess: true,
      thinking: false,
      genkit: true,
      commands: false
    }
  });
});

app.post('/api/ai/features', (req, res) => {
  const sessionId = req.query.sessionId || 'default';
  // Normally you'd save to a database
  console.log(`Feature update for session ${sessionId}:`, req.body);
  res.json({ success: true, features: req.body });
});

// Code generation endpoint
app.post('/api/ai/code', async (req, res) => {
  try {
    const { input } = req.body;
    // For demo, just return a mock response
    const result = `function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(c => c+1)}>Increment</button>
    </div>
  );
}`;
    
    res.json({ result });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

(async () => {
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

  // Make WebSocket service available to routes
  app.set('webSocketService', webSocketService);

  // Start server
  server.listen(port, () => {
    log(`Server running on port ${port}`);
  });
})();

export default server;
