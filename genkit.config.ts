import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI client directly
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '');

// Define model constants for use throughout the app
export const PRODUCTION_MODEL = 'gemini-1.5-flash';  // Using 1.5 versions as they're currently available
export const ADVANCED_MODEL = 'gemini-1.5-pro'; 
export const EXPERIMENTAL_MODEL = 'gemini-1.5-pro';
export const VISION_MODEL = 'gemini-1.5-pro-vision';

// Export helper for managing models
export function getModelInstance(modelName = PRODUCTION_MODEL) {
  return googleAI.getGenerativeModel({ model: modelName });
}

// Export the client for other services
export default googleAI;