import express from 'express';
import './websocket.js';

const app = express();
app.use(express.json());

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
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API server listening on port ${PORT}`));
