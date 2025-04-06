import { GoogleGenerativeAI } from '@google/generative-ai';

// Access API key from environment
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error('ERROR: GOOGLE_API_KEY environment variable is not set');
  console.log('Please set the GOOGLE_API_KEY environment variable and try again.');
  process.exit(1);
}

// Initialize the Google AI client
const googleAI = new GoogleGenerativeAI(apiKey);

// Define model constants
const GEMINI_PRO = 'gemini-1.5-pro';
const GEMINI_PRO_VISION = 'gemini-1.5-pro-vision';

async function listModels() {
  try {
    console.log('Listing available Google AI models...');
    const modelList = await googleAI.listModels();
    console.log('Available models:');
    modelList.models.forEach(model => {
      console.log(`- ${model.name} (${model.displayName})`);
    });
    console.log('\n');
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

async function testGoogleAI() {
  try {
    // First list available models
    await listModels();
    
    console.log('Testing Google AI API with text generation...');
    
    // Initialize the model
    const model = googleAI.getGenerativeModel({
      model: GEMINI_PRO
    });
    
    // Generate content
    const prompt = 'Write a short paragraph about the future of AI';
    console.log(`Sending prompt: "${prompt}"`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('\nGoogle AI Response:');
    console.log('===================');
    console.log(text);
    console.log('===================\n');
    
    // Test chat functionality
    console.log('Testing chat functionality...');
    
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: 'Hello, how are you today?' }] },
        { role: 'model', parts: [{ text: 'I\'m doing well, thank you for asking! How can I help you today?' }] }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    
    const chatPrompt = 'Tell me about the top 3 programming languages for AI development';
    console.log(`Sending chat message: "${chatPrompt}"`);
    
    const chatResult = await chat.sendMessage(chatPrompt);
    const chatResponse = await chatResult.response;
    const chatText = chatResponse.text();
    
    console.log('\nGoogle AI Chat Response:');
    console.log('========================');
    console.log(chatText);
    console.log('========================\n');
    
    console.log('Google AI API test completed successfully!');
  } catch (error) {
    console.error('Error testing Google AI API:', error);
    console.error(error.stack);
  }
}

// Run the test
testGoogleAI();