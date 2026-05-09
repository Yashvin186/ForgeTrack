import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Gemini API key missing from .env.local');
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper to get the model
export const getGeminiModel = (modelName = 'gemini-2.5-flash') => {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: modelName });
};
