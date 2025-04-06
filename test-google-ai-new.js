// Simple test script for Google AI integration
import { GoogleGenerativeAI } from '@google/generative-ai';

// Access API key from environment variables
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Exit if no API key is provided
if (!apiKey) {
  console.error('Error: No Google API key found. Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.');
  process.exit(1);
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(apiKey);

// List of models to test
const models = [
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

// Function to test text generation with a model
async function testModel(modelName) {
  console.log(`\n--- Testing model: ${modelName} ---`);
  
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Simple prompt for testing
    const prompt = "Write a short paragraph about artificial intelligence.";
    console.log(`Prompt: "${prompt}"`);
    
    // Generate content
    console.log('Generating response...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // Print the response
    console.log('Response:');
    console.log(response.text());
    
    return true;
  } catch (error) {
    console.error(`Error with model ${modelName}:`, error.message);
    return false;
  }
}

// Function to test chat capabilities
async function testChat(modelName) {
  console.log(`\n--- Testing chat with model: ${modelName} ---`);
  
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Start a chat
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hello, I'm interested in learning about machine learning." }],
        },
        {
          role: "model",
          parts: [{ text: "Hello! I'd be happy to help you learn about machine learning. Machine learning is a branch of artificial intelligence that focuses on developing systems that can learn from data. What specific aspects of machine learning would you like to know more about?" }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
    
    // Send a message
    const message = "Can you explain supervised learning in simple terms?";
    console.log(`Message: "${message}"`);
    
    // Generate response
    console.log('Generating chat response...');
    const result = await chat.sendMessage(message);
    const response = result.response;
    
    // Print the response
    console.log('Chat Response:');
    console.log(response.text());
    
    return true;
  } catch (error) {
    console.error(`Error with chat in model ${modelName}:`, error.message);
    return false;
  }
}

// Main function to run tests
async function runTests() {
  console.log('Starting Google AI API tests...');
  console.log(`API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  
  let successes = 0;
  let failures = 0;
  
  // Test each model
  for (const model of models) {
    if (await testModel(model)) {
      successes++;
    } else {
      failures++;
    }
    
    if (await testChat(model)) {
      successes++;
    } else {
      failures++;
    }
  }
  
  // Print summary
  console.log('\n--- Test Summary ---');
  console.log(`Total Tests: ${successes + failures}`);
  console.log(`Successes: ${successes}`);
  console.log(`Failures: ${failures}`);
  
  if (failures === 0) {
    console.log('\n✅ All tests passed successfully!');
  } else {
    console.log('\n❌ Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Error in test execution:', err);
  process.exit(1);
});